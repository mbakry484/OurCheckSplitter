namespace OurCheckSplitter.Api.Entities
{
    public class Item
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int Quantity { get; set; }


        public decimal Price { get; set; }


        public int ReceiptId { get; set; }

        public List<ItemAssignment> Assignments { get; set; } = new();
    }
}
