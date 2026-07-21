using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IplAuction.Api.Data;
using IplAuction.Api.Models;
using IplAuction.Api.Services;

namespace IplAuction.Api.Hubs
{
    [Authorize]
    public class AuctionHub : Hub
    {
        private readonly DataContext _context;
        private readonly AuctionManager _auctionManager;

        public AuctionHub(DataContext context, AuctionManager auctionManager)
        {
            _context = context;
            _auctionManager = auctionManager;
        }

        private Guid GetUserId()
        {
            var idClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? Context.User?.FindFirst("sub")?.Value;
            return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        }

        private string GetRoomCode()
        {
            var httpContext = Context.GetHttpContext();
            return httpContext?.Request.Query["roomCode"].ToString() ?? string.Empty;
        }

        public override async Task OnConnectedAsync()
        {
            var roomCode = GetRoomCode();
            var userId = GetUserId();

            if (!string.IsNullOrEmpty(roomCode))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomCode.ToUpper());

                var room = await _context.Rooms
                    .Include(r => r.Participants)
                    .FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());

                if (room != null && userId != Guid.Empty)
                {
                    var participant = room.Participants.FirstOrDefault(p => p.UserId == userId);
                    if (participant != null)
                    {
                        participant.IsConnected = true;
                        participant.ConnectionId = Context.ConnectionId;
                        await _context.SaveChangesAsync();
                    }

                    await BroadcastParticipantsUpdate(roomCode);
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var roomCode = GetRoomCode();
            var userId = GetUserId();

            if (!string.IsNullOrEmpty(roomCode))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode.ToUpper());

                var room = await _context.Rooms
                    .Include(r => r.Participants)
                    .FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());

                if (room != null && userId != Guid.Empty)
                {
                    var participant = room.Participants.FirstOrDefault(p => p.UserId == userId);
                    if (participant != null)
                    {
                        participant.IsConnected = false;
                        participant.ConnectionId = null;
                        await _context.SaveChangesAsync();
                    }

                    await BroadcastParticipantsUpdate(roomCode);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task StartAuction()
        {
            var roomCode = GetRoomCode();
            var userId = GetUserId();
            if (string.IsNullOrEmpty(roomCode) || userId == Guid.Empty) return;

            var success = await _auctionManager.StartAuctionAsync(roomCode, userId);
            if (!success)
            {
                await Clients.Caller.SendAsync("Error", "Only the room host can start the auction.");
            }
        }

        public async Task PlaceBid(decimal amount)
        {
            var roomCode = GetRoomCode();
            var userId = GetUserId();
            if (string.IsNullOrEmpty(roomCode) || userId == Guid.Empty) return;

            var (success, message) = await _auctionManager.PlaceBidAsync(roomCode, userId, amount);
            if (!success)
            {
                await Clients.Caller.SendAsync("Error", message);
            }
        }

        public async Task SendChatMessage(string message)
        {
            var roomCode = GetRoomCode();
            var userId = GetUserId();
            if (string.IsNullOrEmpty(roomCode) || userId == Guid.Empty || string.IsNullOrWhiteSpace(message)) return;

            var room = await _context.Rooms.FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());
            var user = await _context.Users.FindAsync(userId);
            if (room == null || user == null) return;

            var chat = new Chat
            {
                Id = Guid.NewGuid(),
                RoomId = room.Id,
                UserId = userId,
                Message = message.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Chats.Add(chat);
            await _context.SaveChangesAsync();

            await Clients.Group(roomCode.ToUpper()).SendAsync("ChatReceived", new
            {
                Id = chat.Id,
                UserId = user.Id,
                UserName = user.Name,
                UserAvatar = user.Avatar,
                Message = chat.Message,
                CreatedAt = chat.CreatedAt
            });
        }

        public async Task ToggleReady()
        {
            var roomCode = GetRoomCode();
            var userId = GetUserId();
            if (string.IsNullOrEmpty(roomCode) || userId == Guid.Empty) return;

            var room = await _context.Rooms
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());

            if (room != null)
            {
                var participant = room.Participants.FirstOrDefault(p => p.UserId == userId);
                if (participant != null)
                {
                    participant.IsReady = !participant.IsReady;
                    await _context.SaveChangesAsync();
                    await BroadcastParticipantsUpdate(roomCode);
                }
            }
        }

        private async Task BroadcastParticipantsUpdate(string roomCode)
        {
            var room = await _context.Rooms
                .Include(r => r.Participants).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());

            if (room != null)
            {
                var participants = room.Participants.Select(p => new
                {
                    p.Id,
                    p.UserId,
                    UserName = p.User.Name,
                    UserAvatar = p.User.Avatar,
                    p.Role,
                    p.IsReady,
                    p.IsConnected
                });

                await Clients.Group(roomCode.ToUpper()).SendAsync("ParticipantsUpdated", participants);
            }
        }
    }
}
