namespace OurCheckSplitter.Api.Entities
{
    public class Receipt
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Tax { get; set; }
        public double Tips { get; set; }
        public double Total { get; set; }



        public virt List<Friend>? Friends { get; set; } = new();
        public List<Item> Items { get; set; } = new();
    }
}
