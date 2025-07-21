namespace OurCheckSplitter.Api.DTOs
{

    public class FriendCreateDto
    {
        public string Name { get; set; } = null!;
    }

    public class FriendDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public List<ReceiptSummaryDto> Receipts { get; set; } = new();
    }

    public class ReceiptSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public double Total { get; set; }
    }

    public class FriendWithItemsDto
    {
        public int Id { get; set; }
    }
}
