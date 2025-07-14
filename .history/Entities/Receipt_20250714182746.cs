namespace OurCheckSplitter.Api.Entities
{
    public class Receipt
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Tax { get; set; }
        public string TaxType { get; set; } = "amount"; // "amount" or "percentage"
        public double Tips { get; set; }
        public double Total { get; set; }
        public double Subtotal { get; set; } // Calculated subtotal before tax and tips

        public virtual List<Friend>? Friends { get; set; } = new();
        public virtual List<Item> Items { get; set; } = new();
    }
}
