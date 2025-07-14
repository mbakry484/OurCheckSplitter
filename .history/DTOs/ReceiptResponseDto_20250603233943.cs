
namespace OurCheckSplitter.Api.DTOs


{
    public class ReceiptResponseDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Tax { get; set; }
        public TaxType TaxType { get; set; }
        public double Tips { get; set; }
        public double Total { get; set; }
        public List<FriendResponseDto> Friends { get; set; } = new();
        public List<ItemResponseDto> Items { get; set; } = new();
    }

    public class FriendResponseDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
    }

    public class ItemResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public List<ItemAssignmentResponseDto> Assignments { get; set; } = new();
    }

    public class ItemAssignmentResponseDto
    {
        public int Id { get; set; }
        public string Unitlabel { get; set; } = null!;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public List<FriendResponseDto> AssignedFriends { get; set; } = new();
    }
}