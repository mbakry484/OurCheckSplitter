using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.Entities
{
    public class Friend
    {
        public int Id { get; set; }

        [Required]
        public string? Name { get; set; }

        public int? ReceiptId { get; set; }
        public Receipt? Receipt { get; set; }  
    }

}
