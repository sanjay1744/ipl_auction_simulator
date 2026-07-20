using System;

namespace IplAuction.Api.Models
{
    public class Chat
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Guid UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Room Room { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
