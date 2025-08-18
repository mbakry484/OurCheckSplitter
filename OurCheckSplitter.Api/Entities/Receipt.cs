namespace OurCheckSplitter.Api.Entities
{
    public class Receipt
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Tax { get; set; }
        public string? TaxType { get; set; } = "amount"; // "amount" or "percentage"
        public double Tips { get; set; }
        public double Total { get; set; }
        public bool TipsIncludedInTotal { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid UserId { get; set; } // Foreign key to AppUser
        public AppUser User { get; set; } = null!;

        public virtual List<Friend>? Friends { get; set; } = new();
        public virtual List<Item> Items { get; set; } = new();
    }
}
