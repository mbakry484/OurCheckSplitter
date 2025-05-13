namespace OurCheckSplitter.Api.Entities
{
    public class FriendAssignment
    {
        public int Id { get; set; }

        public int FriendId { get; set; }
        public Friend Friend { get; set; } = null!;

        public int ItemAssignmentId { get; set; }
        public ItemAssignment ItemAssignment { get; set; } = null!;

    }
}
