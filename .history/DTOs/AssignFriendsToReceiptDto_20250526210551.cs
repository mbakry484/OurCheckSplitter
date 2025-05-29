using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.DTOs
{
    public class AssignFriendsToReceiptDto
    {
        [Required]
        public int ReceiptId { get; set; }

        [Required]
        public List<string> FriendNames { get; set; } = new();
    }
}