using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using IplAuction.Api.Data;
using IplAuction.Api.Models;

namespace IplAuction.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoomsController : ControllerBase
    {
        private readonly DataContext _context;

        public RoomsController(DataContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
            return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        }

        public class CreateRoomDto
        {
            public string RoomName { get; set; } = string.Empty;
            public string AuctionType { get; set; } = "Standard";
            public decimal Budget { get; set; } = 1000000000.00m; // 100 Crores
            public int Timer { get; set; } = 30; // 30 seconds
        }

        public class JoinRoomDto
        {
            public string TeamName { get; set; } = string.Empty;
            public string? Logo { get; set; }
        }

        [HttpPost]
        public async Task<ActionResult> CreateRoom([FromBody] CreateRoomDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.RoomName))
            {
                return BadRequest(new { message = "Room name is required." });
            }

            var roomCode = GenerateRoomCode();
            var room = new Room
            {
                Id = Guid.NewGuid(),
                RoomCode = roomCode,
                RoomName = dto.RoomName.Trim(),
                HostId = userId,
                AuctionType = string.IsNullOrWhiteSpace(dto.AuctionType) ? "Standard" : dto.AuctionType,
                Budget = dto.Budget > 0 ? dto.Budget : 1000000000.00m,
                Timer = dto.Timer > 0 ? dto.Timer : 30,
                Status = "Lobby",
                CreatedAt = DateTime.UtcNow
            };

            _context.Rooms.Add(room);

            // Add host as a participant
            var participant = new RoomParticipant
            {
                Id = Guid.NewGuid(),
                RoomId = room.Id,
                UserId = userId,
                Role = "Host",
                IsReady = true,
                IsConnected = false,
                JoinedAt = DateTime.UtcNow
            };
            _context.RoomParticipants.Add(participant);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                room.Id,
                room.RoomCode,
                room.RoomName,
                room.AuctionType,
                room.Budget,
                room.Timer,
                room.Status
            });
        }

        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<ActionResult> GetPublicRooms()
        {
            var rooms = await _context.Rooms
                .Include(r => r.Host)
                .Include(r => r.Participants)
                .Include(r => r.Teams)
                .Where(r => r.Status == "Lobby" || r.Status == "Active")
                .OrderByDescending(r => r.CreatedAt)
                .Take(20)
                .Select(r => new
                {
                    r.Id,
                    r.RoomCode,
                    r.RoomName,
                    HostName = r.Host.Name,
                    r.AuctionType,
                    r.Budget,
                    r.Timer,
                    r.Status,
                    ParticipantsCount = r.Participants.Count,
                    TeamsCount = r.Teams.Count,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(rooms);
        }

        [HttpGet("{roomCode}")]
        public async Task<ActionResult> GetRoomDetails(string roomCode)
        {
            var room = await _context.Rooms
                .Include(r => r.Host)
                .Include(r => r.Participants).ThenInclude(p => p.User)
                .Include(r => r.Teams).ThenInclude(t => t.Owner)
                .Include(r => r.CurrentPlayer)
                .FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());

            if (room == null)
            {
                return NotFound(new { message = $"Room with code '{roomCode}' not found." });
            }

            var userId = GetUserId();
            var userTeam = room.Teams.FirstOrDefault(t => t.OwnerId == userId);
            var isHost = room.HostId == userId;

            return Ok(new
            {
                room.Id,
                room.RoomCode,
                room.RoomName,
                room.HostId,
                HostName = room.Host.Name,
                room.AuctionType,
                room.Budget,
                room.Timer,
                room.Status,
                room.CurrentPlayerId,
                CurrentPlayer = room.CurrentPlayer != null ? new
                {
                    room.CurrentPlayer.Id,
                    room.CurrentPlayer.Name,
                    room.CurrentPlayer.ImageUrl,
                    room.CurrentPlayer.Country,
                    room.CurrentPlayer.Role,
                    room.CurrentPlayer.BasePrice,
                    room.CurrentPlayer.Rating,
                    room.CurrentPlayer.IplRuns,
                    room.CurrentPlayer.IplWickets,
                    room.CurrentPlayer.StrikeRate,
                    room.CurrentPlayer.Economy
                } : null,
                room.TimerEndsAt,
                IsHost = isHost,
                UserTeam = userTeam != null ? new
                {
                    userTeam.Id,
                    userTeam.TeamName,
                    userTeam.Logo,
                    userTeam.RemainingBudget,
                    userTeam.IndianPlayers,
                    userTeam.OverseasPlayers,
                    userTeam.TotalPlayers
                } : null,
                Participants = room.Participants.Select(p => new
                {
                    p.Id,
                    p.UserId,
                    UserName = p.User.Name,
                    UserAvatar = p.User.Avatar,
                    p.Role,
                    p.IsReady,
                    p.IsConnected
                }),
                Teams = room.Teams.Select(t => new
                {
                    t.Id,
                    t.OwnerId,
                    OwnerName = t.Owner.Name,
                    t.TeamName,
                    t.Logo,
                    t.RemainingBudget,
                    t.IndianPlayers,
                    t.OverseasPlayers,
                    t.TotalPlayers
                })
            });
        }

        [HttpPost("{roomCode}/join")]
        public async Task<ActionResult> JoinRoom(string roomCode, [FromBody] JoinRoomDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var room = await _context.Rooms
                .Include(r => r.Participants)
                .Include(r => r.Teams)
                .FirstOrDefaultAsync(r => r.RoomCode.ToUpper() == roomCode.Trim().ToUpper());

            if (room == null)
            {
                return NotFound(new { message = $"Room with code '{roomCode}' not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.TeamName))
            {
                return BadRequest(new { message = "Team name is required to join an auction room." });
            }

            // Check if user is already a participant
            var participant = room.Participants.FirstOrDefault(p => p.UserId == userId);
            if (participant == null)
            {
                participant = new RoomParticipant
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    UserId = userId,
                    Role = room.HostId == userId ? "Host" : "Player",
                    IsReady = false,
                    IsConnected = true,
                    JoinedAt = DateTime.UtcNow
                };
                _context.RoomParticipants.Add(participant);
            }

            // Check if user already has a team in this room
            var team = room.Teams.FirstOrDefault(t => t.OwnerId == userId);
            if (team == null)
            {
                // Verify team name is unique in this room
                if (room.Teams.Any(t => t.TeamName.Equals(dto.TeamName.Trim(), StringComparison.OrdinalIgnoreCase)))
                {
                    return BadRequest(new { message = $"Team name '{dto.TeamName}' is already taken in this room." });
                }

                team = new Team
                {
                    Id = Guid.NewGuid(),
                    RoomId = room.Id,
                    OwnerId = userId,
                    TeamName = dto.TeamName.Trim(),
                    Logo = dto.Logo,
                    RemainingBudget = room.Budget,
                    IndianPlayers = 0,
                    OverseasPlayers = 0,
                    TotalPlayers = 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Teams.Add(team);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Successfully joined room.",
                roomCode = room.RoomCode,
                teamId = team.Id,
                teamName = team.TeamName
            });
        }

        private static string GenerateRoomCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 6).Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
