using System;
using System.Collections.Generic;

namespace IplAuction.Api.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Room> HostedRooms { get; set; } = new List<Room>();
        public ICollection<RoomParticipant> RoomParticipants { get; set; } = new List<RoomParticipant>();
        public ICollection<Team> Teams { get; set; } = new List<Team>();
        public ICollection<Chat> Chats { get; set; } = new List<Chat>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
