using OurCheckSplitter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;

namespace OurCheckSplitter.Api.Data
{
    public class OurCheckSplitterContext : DbContext
    {
        public OurCheckSplitterContext(DbContextOptions<OurCheckSplitterContext> options) : base(options) { }


        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<Friend> Friends { get; set; }
        public DbSet<ItemAssignment> ItemAssignments { get; set; }
        public DbSet<FriendAssignment> FriendAssignments { get; set; }
        public DbSet<FriendReceipt> FriendReceipts { get; set; }
        public DbSet<AppUser> AppUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Friend>()
                .HasOne(f => f.User)
                .WithMany(u => u.Friends)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Receipt>()
                .HasOne(r => r.User)
                .WithMany(u => u.Receipts)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure many-to-many relationship between Friend and Receipt
            modelBuilder.Entity<FriendReceipt>()
                .HasKey(fr => fr.Id);

            modelBuilder.Entity<FriendReceipt>()
                .HasOne(fr => fr.Friend)
                .WithMany(f => f.FriendReceipts)
                .HasForeignKey(fr => fr.FriendId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FriendReceipt>()
                .HasOne(fr => fr.Receipt)
                .WithMany(r => r.FriendReceipts)
                .HasForeignKey(fr => fr.ReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ensure unique combination of FriendId and ReceiptId
            modelBuilder.Entity<FriendReceipt>()
                .HasIndex(fr => new { fr.FriendId, fr.ReceiptId })
                .IsUnique();
        }
    }


}
