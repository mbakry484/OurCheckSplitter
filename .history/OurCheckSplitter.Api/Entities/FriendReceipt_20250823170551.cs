namespace OurCheckSplitter.Api.Entities
{
    public class FriendReceipt
    {
        public int Id { get; set; }
        
        public int FriendId { get; set; }
        public Friend Friend { get; set; } = null!;
        
        public int ReceiptId { get; set; }
        public Receipt Receipt { get; set; } = null!;
    }
}
