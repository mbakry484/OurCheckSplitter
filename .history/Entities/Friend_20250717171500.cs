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

        public Guid UserId { get; set; }
        public AppUser User { get; set; } = null!;

        [JsonIgnore]
        public Receipt? Receipt { get; set; }
    }

}
