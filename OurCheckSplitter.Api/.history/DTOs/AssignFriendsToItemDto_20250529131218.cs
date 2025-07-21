using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.DTOs
{
    public class AssignFriendsToItemDto
    {
        [Required]
        public int ReceiptId { get; set; }

        [Required]
        public List<ItemFriendAssignmentDto> ItemAssignments { get; set; } = new();
    }

    public class ItemFriendAssignmentDto
    {
        [Required]
        public string ItemName { get; set; } = null!;

        [Required]
        public List<string> FriendNames { get; set; } = new();

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; } = 1;
    }
}