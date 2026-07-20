using System;

namespace IplAuction.Api.Models
{
    public class Bid
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Guid PlayerId { get; set; }
        public Guid TeamId { get; set; }
        public decimal BidAmount { get; set; }
        public DateTime BidTime { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Room Room { get; set; } = null!;
        public Player Player { get; set; } = null!;
        public Team Team { get; set; } = null!;
    }
}
