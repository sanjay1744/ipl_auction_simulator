using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using IplAuction.Api.Data;
using IplAuction.Api.Hubs;
using IplAuction.Api.Models;

namespace IplAuction.Api.Services
{
    public class AuctionManager
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<AuctionHub> _hubContext;
        private readonly System.Threading.Timer _timer;
        private bool _isProcessing = false;

        public AuctionManager(IServiceScopeFactory scopeFactory, IHubContext<AuctionHub> hubContext)
        {
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;

            // Run timer tick loop every 1 second
            _timer = new System.Threading.Timer(OnTimerTick, null, 1000, 1000);
        }

        private async void OnTimerTick(object? state)
        {
            if (_isProcessing) return;
            _isProcessing = true;

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<DataContext>();

                var activeRooms = await db.Rooms
                    .Include(r => r.CurrentPlayer)
                    .Where(r => r.Status == "Active" && r.CurrentPlayerId != null && r.TimerEndsAt != null)
                    .ToListAsync();

                foreach (var room in activeRooms)
                {
                    var remainingSeconds = (int)Math.Ceiling((room.TimerEndsAt!.Value - DateTime.UtcNow).TotalSeconds);

                    if (remainingSeconds > 0)
                    {
                        // Send timer tick to clients
                        await _hubContext.Clients.Group(room.RoomCode).SendAsync("TimerTick", remainingSeconds);
                    }
                    else
                    {
                        // Timer expired! Resolve current player bid
                        await ResolveCurrentPlayerAsync(db, room);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuctionManager] Timer error: {ex.Message}");
            }
            finally
            {
                _isProcessing = false;
            }
        }

        public async Task<bool> StartAuctionAsync(string roomCode, Guid hostUserId)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DataContext>();

            var room = await db.Rooms
                .Include(r => r.CurrentPlayer)
                .FirstOrDefaultAsync(r => r.RoomCode == roomCode);

            if (room == null || room.HostId != hostUserId) return false;

            room.Status = "Active";

            // Get first available player
            var firstPlayer = await db.Players.OrderBy(p => p.Name).FirstOrDefaultAsync();
            if (firstPlayer != null)
            {
                room.CurrentPlayerId = firstPlayer.Id;
                room.CurrentPlayer = firstPlayer;
                room.TimerEndsAt = DateTime.UtcNow.AddSeconds(room.Timer);
            }

            await db.SaveChangesAsync();

            await _hubContext.Clients.Group(roomCode).SendAsync("AuctionStarted", new
            {
                RoomCode = roomCode,
                Status = room.Status
            });

            if (firstPlayer != null)
            {
                await BroadcastPlayerOnBlockAsync(roomCode, firstPlayer, room.Timer);
            }

            return true;
        }

        public async Task<(bool success, string message)> PlaceBidAsync(string roomCode, Guid userId, decimal amount)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DataContext>();

            var room = await db.Rooms
                .Include(r => r.CurrentPlayer)
                .Include(r => r.Teams)
                .FirstOrDefaultAsync(r => r.RoomCode == roomCode);

            if (room == null || room.Status != "Active" || room.CurrentPlayerId == null)
            {
                return (false, "Auction is not active in this room.");
            }

            var team = room.Teams.FirstOrDefault(t => t.OwnerId == userId);
            if (team == null)
            {
                return (false, "You must create a team to place bids.");
            }

            if (team.RemainingBudget < amount)
            {
                return (false, $"Insufficient budget. Your remaining budget is ₹{team.RemainingBudget}.");
            }

            // Get current highest bid for this player in this room
            var highestBid = await db.Bids
                .Where(b => b.RoomId == room.Id && b.PlayerId == room.CurrentPlayerId.Value)
                .OrderByDescending(b => b.BidAmount)
                .FirstOrDefaultAsync();

            var minBidRequired = highestBid != null ? highestBid.BidAmount : room.CurrentPlayer!.BasePrice;

            if (highestBid != null && amount <= highestBid.BidAmount)
            {
                return (false, $"Bid must be greater than current bid of ₹{highestBid.BidAmount}.");
            }

            if (highestBid == null && amount < room.CurrentPlayer!.BasePrice)
            {
                return (false, $"Bid must be at least the base price of ₹{room.CurrentPlayer!.BasePrice}.");
            }

            if (highestBid != null && highestBid.TeamId == team.Id)
            {
                return (false, "Your team already holds the highest bid!");
            }

            // Create bid
            var newBid = new Bid
            {
                Id = Guid.NewGuid(),
                RoomId = room.Id,
                PlayerId = room.CurrentPlayerId.Value,
                TeamId = team.Id,
                BidAmount = amount,
                BidTime = DateTime.UtcNow
            };
            db.Bids.Add(newBid);

            // Extend timer to at least 15 seconds if less than 15s remaining
            var remainingSeconds = (room.TimerEndsAt!.Value - DateTime.UtcNow).TotalSeconds;
            if (remainingSeconds < 15)
            {
                room.TimerEndsAt = DateTime.UtcNow.AddSeconds(15);
            }

            await db.SaveChangesAsync();

            var user = await db.Users.FindAsync(userId);

            // Broadcast bid update
            await _hubContext.Clients.Group(roomCode).SendAsync("BidUpdated", new
            {
                BidId = newBid.Id,
                PlayerId = room.CurrentPlayerId.Value,
                PlayerName = room.CurrentPlayer!.Name,
                TeamId = team.Id,
                TeamName = team.TeamName,
                BidderName = user?.Name ?? "Anonymous",
                BidAmount = amount,
                TimerEndsAt = room.TimerEndsAt
            });

            return (true, "Bid placed successfully.");
        }

        private async Task ResolveCurrentPlayerAsync(DataContext db, Room room)
        {
            if (room.CurrentPlayerId == null) return;

            var playerId = room.CurrentPlayerId.Value;
            var highestBid = await db.Bids
                .Include(b => b.Team)
                .ThenInclude(t => t.Owner)
                .Where(b => b.RoomId == room.Id && b.PlayerId == playerId)
                .OrderByDescending(b => b.BidAmount)
                .FirstOrDefaultAsync();

            var player = await db.Players.FindAsync(playerId);

            if (highestBid != null && player != null)
            {
                // Sold!
                var team = highestBid.Team;
                var purchase = new Purchase
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    PlayerId = playerId,
                    TeamId = team.Id,
                    SoldPrice = highestBid.BidAmount,
                    PurchasedAt = DateTime.UtcNow
                };
                db.Purchases.Add(purchase);

                // Update team stats
                team.RemainingBudget -= highestBid.BidAmount;
                team.TotalPlayers += 1;
                if (player.Country.Equals("India", StringComparison.OrdinalIgnoreCase))
                {
                    team.IndianPlayers += 1;
                }
                else
                {
                    team.OverseasPlayers += 1;
                }

                await db.SaveChangesAsync();

                await _hubContext.Clients.Group(room.RoomCode).SendAsync("PlayerSold", new
                {
                    PlayerId = player.Id,
                    PlayerName = player.Name,
                    TeamId = team.Id,
                    TeamName = team.TeamName,
                    OwnerName = team.Owner.Name,
                    SoldPrice = highestBid.BidAmount,
                    RemainingBudget = team.RemainingBudget
                });
            }
            else if (player != null)
            {
                // Unsold!
                await _hubContext.Clients.Group(room.RoomCode).SendAsync("PlayerUnsold", new
                {
                    PlayerId = player.Id,
                    PlayerName = player.Name
                });
            }

            // Move to next player
            var purchasedPlayerIds = await db.Purchases
                .Where(p => p.RoomId == room.Id)
                .Select(p => p.PlayerId)
                .ToListAsync();

            // Also exclude players that were already processed in this room
            var nextPlayer = await db.Players
                .Where(p => p.Id != playerId && !purchasedPlayerIds.Contains(p.Id))
                .OrderBy(p => p.Name)
                .FirstOrDefaultAsync();

            if (nextPlayer != null)
            {
                room.CurrentPlayerId = nextPlayer.Id;
                room.CurrentPlayer = nextPlayer;
                room.TimerEndsAt = DateTime.UtcNow.AddSeconds(room.Timer);
                await db.SaveChangesAsync();

                await BroadcastPlayerOnBlockAsync(room.RoomCode, nextPlayer, room.Timer);
            }
            else
            {
                // No more players! Auction completed.
                room.Status = "Completed";
                room.CurrentPlayerId = null;
                room.TimerEndsAt = null;
                await db.SaveChangesAsync();

                await _hubContext.Clients.Group(room.RoomCode).SendAsync("AuctionCompleted", new
                {
                    RoomCode = room.RoomCode,
                    Status = room.Status
                });
            }
        }

        private async Task BroadcastPlayerOnBlockAsync(string roomCode, Player player, int timerSeconds)
        {
            await _hubContext.Clients.Group(roomCode).SendAsync("PlayerOnBlock", new
            {
                Player = new
                {
                    player.Id,
                    player.Name,
                    player.ImageUrl,
                    player.Country,
                    player.Role,
                    player.BattingStyle,
                    player.BowlingStyle,
                    player.Age,
                    player.Rating,
                    player.BasePrice,
                    player.Category,
                    player.MatchesPlayed,
                    player.IplRuns,
                    player.IplWickets,
                    player.StrikeRate,
                    player.Average,
                    player.Fifties,
                    player.Hundreds,
                    player.Economy,
                    player.Description
                },
                TimerSeconds = timerSeconds
            });
        }
    }
}
