using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OurCheckSplitter.Api.Entities;

public class FriendConfiguration : IEntityTypeConfiguration<Friend>
{
    public void Configure(EntityTypeBuilder<Friend> builder)
    {
        builder.HasOne<Receipt>()
               .WithMany(r => r.Friends)
               .HasForeignKey(f => f.ReceiptId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
