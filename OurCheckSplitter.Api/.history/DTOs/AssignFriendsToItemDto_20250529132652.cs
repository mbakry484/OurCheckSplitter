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
    }
}