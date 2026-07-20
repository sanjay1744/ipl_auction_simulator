using System;
using System.Collections.Generic;

namespace IplAuction.Api.Models
{
    public class Team
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Guid OwnerId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string? Logo { get; set; }
        public decimal RemainingBudget { get; set; }
        public int IndianPlayers { get; set; } = 0;
        public int OverseasPlayers { get; set; } = 0;
        public int TotalPlayers { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Room Room { get; set; } = null!;
        public User Owner { get; set; } = null!;
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
    }
}
