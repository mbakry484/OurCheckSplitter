using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.DTOs
{
    public class ItemDto
    {

        public string Name { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Price { get; set; }

        public List<ItemAssignmentDto>? Assignments { get; set; }
    }
    public class ItemPerFriendDto
    {
        public string Name { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        }
}
