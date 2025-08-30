namespace OurCheckSplitter.Api.DTOs
{
    public class FriendDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public List<ReceiptSummaryDto> Receipts { get; set; } = new();
        public decimal TotalPaidAmount { get; set; }
    }

    public class ReceiptSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public double Total { get; set; }
    }
}
