namespace OurCheckSplitter.Api.Entities
{
    public class ItemAssignment
    {
        //Sub Item
        public int Id { get; set; }
        public string Unitlabel { get; set; } = null!;

        public decimal Price { get; set; }

        public int Quantity { get; set; }

        //Main Item
        public int ItemId { get; set; }
        public Item Item { get; set; } = null!;

        // Associated Friends
        public List<FriendAssignment> FriendAssignments { get; set; } = new();


        //The Receipt Itself
        public int ReceiptId { get; set; }
        public Receipt Receipt { get; set; } = null!;

    }
}
