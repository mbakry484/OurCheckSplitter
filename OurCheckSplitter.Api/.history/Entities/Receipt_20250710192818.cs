namespace OurCheckSplitter.Api.Entities
{
    public enum TaxType
    {
        Percentage,
        Fixed
    }

    public class Receipt
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Tax { get; set; }
        public double Tips { get; set; }
        public double Total { get; set; }
        public TaxType TaxType { get; set; }

        public virtual List<Friend>? Friends { get; set; } = new();
        public virtual List<Item> Items { get; set; } = new();
    }
}
