using Microsoft.EntityFrameworkCore;
using IplAuction.Api.Models;

namespace IplAuction.Api.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomParticipant> RoomParticipants { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Player> Players { get; set; }
        public DbSet<Bid> Bids { get; set; }
        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Room configuration
            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.RoomCode).IsUnique();
                
                entity.HasOne(e => e.Host)
                    .WithMany(u => u.HostedRooms)
                    .HasForeignKey(e => e.HostId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // RoomParticipant configuration
            modelBuilder.Entity<RoomParticipant>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.RoomId, e.UserId }).IsUnique();

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.Participants)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.RoomParticipants)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Team configuration
            modelBuilder.Entity<Team>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.RoomId, e.OwnerId }).IsUnique();
                entity.HasIndex(e => new { e.RoomId, e.TeamName }).IsUnique();

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.Teams)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Owner)
                    .WithMany(u => u.Teams)
                    .HasForeignKey(e => e.OwnerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Player configuration
            modelBuilder.Entity<Player>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasData(
                    new Player { Id = Guid.Parse("a1111111-1111-1111-1111-111111111111"), Name = "Virat Kohli", ImageUrl = "players/virat-kohli.jpg", Country = "India", Role = "Batsman", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm medium", Age = 35, Rating = 9.5m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 8004, IplWickets = 4, StrikeRate = 131.97m, Economy = 8.80m, Description = "Legendary Indian top-order batsman, former RCB captain, and all-time leading run-scorer in IPL history." },
                    new Player { Id = Guid.Parse("a2222222-2222-2222-2222-222222222222"), Name = "MS Dhoni", ImageUrl = "players/ms-dhoni.jpg", Country = "India", Role = "WicketKeeper", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm medium", Age = 42, Rating = 9.2m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 5243, IplWickets = 0, StrikeRate = 137.54m, Economy = 0.00m, Description = "Iconic wicketkeeper-batsman, former captain of Chennai Super Kings, and one of the greatest finishers in cricket history." },
                    new Player { Id = Guid.Parse("a3333333-3333-3333-3333-333333333333"), Name = "Jasprit Bumrah", ImageUrl = "players/jasprit-bumrah.jpg", Country = "India", Role = "Bowler", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm fast", Age = 30, Rating = 9.8m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 75, IplWickets = 165, StrikeRate = 110.00m, Economy = 7.30m, Description = "World-class premier fast bowler for Mumbai Indians, known for his lethal yorkers and exceptional economy rate." },
                    new Player { Id = Guid.Parse("a4444444-4444-4444-4444-444444444444"), Name = "Rohit Sharma", ImageUrl = "players/rohit-sharma.jpg", Country = "India", Role = "Batsman", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm offbreak", Age = 36, Rating = 9.4m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 6628, IplWickets = 15, StrikeRate = 131.14m, Economy = 8.01m, Description = "Dynamic opener, 5-time IPL winning captain with Mumbai Indians, and one of the most destructive batsmen in white-ball cricket." },
                    new Player { Id = Guid.Parse("a5555555-5555-5555-5555-555555555555"), Name = "Glenn Maxwell", ImageUrl = "players/glenn-maxwell.jpg", Country = "Australia", Role = "AllRounder", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm offbreak", Age = 35, Rating = 8.8m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 2800, IplWickets = 37, StrikeRate = 155.20m, Economy = 8.30m, Description = "Explosive Australian all-rounder, known as \"Mad Max\" or \"The Big Show\" for his unconventional and aggressive batting." },
                    new Player { Id = Guid.Parse("a6666666-6666-6666-6666-666666666666"), Name = "Rashid Khan", ImageUrl = "players/rashid-khan.jpg", Country = "Afghanistan", Role = "Bowler", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm legbreak", Age = 25, Rating = 9.6m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 450, IplWickets = 149, StrikeRate = 140.00m, Economy = 6.73m, Description = "Sensational Afghan leg-spinner, considered one of the best T20 bowlers in the world with an incredibly low economy rate." },
                    new Player { Id = Guid.Parse("a7777777-7777-7777-7777-777777777777"), Name = "Suryakumar Yadav", ImageUrl = "players/suryakumar-yadav.jpg", Country = "India", Role = "Batsman", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm medium", Age = 33, Rating = 9.3m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 3594, IplWickets = 0, StrikeRate = 145.32m, Economy = 0.00m, Description = "Highly skilled 360-degree batsman for Mumbai Indians, known for his innovative strokeplay and T20 dominance." },
                    new Player { Id = Guid.Parse("a8888888-8888-8888-8888-888888888888"), Name = "Heinrich Klaasen", ImageUrl = "players/heinrich-klaasen.jpg", Country = "South Africa", Role = "WicketKeeper", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm offbreak", Age = 32, Rating = 9.1m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 998, IplWickets = 0, StrikeRate = 168.30m, Economy = 0.00m, Description = "Destructive South African wicketkeeper-batsman, exceptionally strong against spin and a massive clean hitter." },
                    new Player { Id = Guid.Parse("a9999999-9999-9999-9999-999999999999"), Name = "Pat Cummins", ImageUrl = "players/pat-cummins.jpg", Country = "Australia", Role = "Bowler", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm fast", Age = 31, Rating = 9.0m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 390, IplWickets = 60, StrikeRate = 140.50m, Economy = 8.45m, Description = "Australian World Cup-winning captain, premium fast bowler, and capable lower-order batsman." },
                    new Player { Id = Guid.Parse("ab111111-1111-1111-1111-111111111111"), Name = "Rinku Singh", ImageUrl = "players/rinku-singh.jpg", Country = "India", Role = "Batsman", BattingStyle = "Left-hand bat", BowlingStyle = "Right-arm offbreak", Age = 26, Rating = 8.5m, BasePrice = 5000000.00m, Category = "Capped", IplRuns = 893, IplWickets = 0, StrikeRate = 143.00m, Economy = 0.00m, Description = "Exciting Indian left-handed finisher, famous for hitting five consecutive sixes in a match for KKR." },
                    new Player { Id = Guid.Parse("ab222222-2222-2222-2222-222222222222"), Name = "Yashasvi Jaiswal", ImageUrl = "players/yashasvi-jaiswal.jpg", Country = "India", Role = "Batsman", BattingStyle = "Left-hand bat", BowlingStyle = "Right-arm legbreak", Age = 22, Rating = 8.7m, BasePrice = 5000000.00m, Category = "Capped", IplRuns = 1600, IplWickets = 0, StrikeRate = 150.70m, Economy = 0.00m, Description = "Talented young Indian left-handed opening batsman, known for his aggressive start and rapid run-scoring." },
                    new Player { Id = Guid.Parse("ab333333-3333-3333-3333-333333333333"), Name = "Andre Russell", ImageUrl = "players/andre-russell.jpg", Country = "West Indies", Role = "AllRounder", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm fast", Age = 36, Rating = 9.2m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 2484, IplWickets = 115, StrikeRate = 174.00m, Economy = 9.20m, Description = "Powerhouse West Indian all-rounder for Kolkata Knight Riders, famous for his monstrous sixes and death bowling." },
                    new Player { Id = Guid.Parse("ab444444-4444-4444-4444-444444444444"), Name = "Sunil Narine", ImageUrl = "players/sunil-narine.jpg", Country = "West Indies", Role = "AllRounder", BattingStyle = "Left-hand bat", BowlingStyle = "Right-arm offbreak", Age = 36, Rating = 9.4m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 1540, IplWickets = 180, StrikeRate = 162.30m, Economy = 6.82m, Description = "Mystery spinner and explosive pinch-hitting opener for Kolkata Knight Riders, a highly valuable T20 asset." },
                    new Player { Id = Guid.Parse("ab555555-5555-5555-5555-555555555555"), Name = "Mitchell Starc", ImageUrl = "players/mitchell-starc.jpg", Country = "Australia", Role = "Bowler", BattingStyle = "Left-hand bat", BowlingStyle = "Left-arm fast", Age = 34, Rating = 9.0m, BasePrice = 20000000.00m, Category = "Capped", IplRuns = 96, IplWickets = 65, StrikeRate = 105.00m, Economy = 8.20m, Description = "Lethal Australian left-arm fast bowler, renowned for his lightning pace and swinging new ball delivery." },
                    new Player { Id = Guid.Parse("ab666666-6666-6666-6666-666666666666"), Name = "Shashank Singh", ImageUrl = "players/shashank-singh.jpg", Country = "India", Role = "Batsman", BattingStyle = "Right-hand bat", BowlingStyle = "Right-arm offbreak", Age = 32, Rating = 8.0m, BasePrice = 2000000.00m, Category = "Uncapped", IplRuns = 354, IplWickets = 0, StrikeRate = 165.40m, Economy = 0.00m, Description = "Sensational uncapped Indian batsman who played match-winning knocks as a finisher in the 2024 season." }
                );
            });

            // Bid configuration
            modelBuilder.Entity<Bid>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.Bids)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Player)
                    .WithMany(p => p.Bids)
                    .HasForeignKey(e => e.PlayerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Team)
                    .WithMany(t => t.Bids)
                    .HasForeignKey(e => e.TeamId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Purchase configuration
            modelBuilder.Entity<Purchase>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.RoomId, e.PlayerId }).IsUnique();

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.Purchases)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Player)
                    .WithMany(p => p.Purchases)
                    .HasForeignKey(e => e.PlayerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Team)
                    .WithMany(t => t.Purchases)
                    .HasForeignKey(e => e.TeamId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Chat configuration
            modelBuilder.Entity<Chat>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.Chats)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Chats)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Notification configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
