using System;
using System.Collections.Generic;

namespace IplAuction.Api.Models
{
    public class Room
    {
        public Guid Id { get; set; }
        public string RoomCode { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public Guid HostId { get; set; }
        public string AuctionType { get; set; } = "Standard";
        public decimal Budget { get; set; } = 1000000000.00m; // 100 Crores
        public int Timer { get; set; } = 30; // 30 seconds
        public string Status { get; set; } = "Lobby";
        public Guid? CurrentPlayerId { get; set; }
        public DateTime? TimerEndsAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User Host { get; set; } = null!;
        public Player? CurrentPlayer { get; set; }
        public ICollection<RoomParticipant> Participants { get; set; } = new List<RoomParticipant>();
        public ICollection<Team> Teams { get; set; } = new List<Team>();
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
        public ICollection<Chat> Chats { get; set; } = new List<Chat>();
    }
}
