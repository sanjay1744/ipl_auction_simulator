using System;
using System.Collections.Generic;

namespace IplAuction.Api.Models
{
    public class Player
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Country { get; set; } = "India";
        public string Role { get; set; } = string.Empty; // Batsman, Bowler, AllRounder, WicketKeeper
        public string? BattingStyle { get; set; }
        public string? BowlingStyle { get; set; }
        public int Age { get; set; }
        public decimal Rating { get; set; } = 0.0m;
        public decimal BasePrice { get; set; } = 2000000.00m; // 20 Lakhs
        public string Category { get; set; } = string.Empty; // Capped, Uncapped
        public int IplRuns { get; set; } = 0;
        public int IplWickets { get; set; } = 0;
        public decimal StrikeRate { get; set; } = 0.00m;
        public decimal Economy { get; set; } = 0.00m;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
    }
}
