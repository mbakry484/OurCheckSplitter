namespace OurCheckSplitter.Api.DTOs
{
    public class ItemAssignmentDto
    {
        public int itemAssignmentIndex { get; set; }
        public List<int> AssignedFriendsId { get; set; } = new();
    }
}