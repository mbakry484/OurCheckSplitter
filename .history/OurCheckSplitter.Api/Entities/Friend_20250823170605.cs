using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OurCheckSplitter.Api.Entities
{
    public class Friend
    {
        public int Id { get; set; }

        [Required]
        public string? Name { get; set; }

        public virtual List<FriendReceipt> FriendReceipts { get; set; } = new();

        public Guid UserId { get; set; } // Foreign key to AppUser
        public AppUser User { get; set; } = null!;
    }

}
