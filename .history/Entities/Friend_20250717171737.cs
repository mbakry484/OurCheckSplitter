using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OurCheckSplitter.Api.Entities
{
    public class Friend
    {
        public int Id { get; set; }

        [Required]
        public string? Name { get; set; }

        public int? ReceiptId { get; set; }

        [JsonIgnore]
        public Receipt? Receipt { get; set; }

        public Guid UserId { get; set; } // Foreign key to AppUser
        public AppUser User { get; set; } = null!;
    }

}
