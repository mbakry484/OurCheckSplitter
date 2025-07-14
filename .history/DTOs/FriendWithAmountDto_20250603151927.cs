namespace OurCheckSplitter.Api.DTOs
{
    public class FriendWithAmountDto
    {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public decimal? AmountToPay { get; set; }
     

    }
     public class FriendWithItemsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public decimal .AmountToPay { get; set; }
        public List<ItemPerFriendDto> Items { get; set; } = new();
    }
}
