using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.DTOs
{
    public class AssignFriendsToReceiptDto
    {
        public List<string> FriendNames { get; set; } = new();
    }
}