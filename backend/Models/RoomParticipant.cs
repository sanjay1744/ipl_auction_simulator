using System;

namespace IplAuction.Api.Models
{
    public class RoomParticipant
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Guid UserId { get; set; }
        public string Role { get; set; } = "Player"; // Host, Player, Spectator
        public bool IsReady { get; set; } = false;
        public bool IsConnected { get; set; } = false;
        public string? ConnectionId { get; set; } // SignalR Connection ID
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Room Room { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
