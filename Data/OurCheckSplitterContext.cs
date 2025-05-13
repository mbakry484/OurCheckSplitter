using OurCheckSplitter.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace OurCheckSplitter.Api.Data
{
    public class OurCheckSplitterContext :DbContext
    {
        public OurCheckSplitterContext(DbContextOptions<OurCheckSplitterContext> options) : base(options) { }


        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<Friend> Friends { get; set; }
        public DbSet<ItemAssignment> ItemAssignments { get; set; }
        public DbSet<FriendAssignment> FriendAssignments { get; set; }

    }
}
