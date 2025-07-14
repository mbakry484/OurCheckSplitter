using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.DTOs;

public class AssignItemsToReceiptDto
{
    [Required]
    public int ReceiptId { get; set; }

    [Required]
    public List<ItemToAssignDto> Items { get; set; } = new();
}

public class ItemToAssignDto
{
    [Required]
    public string Name { get; set; } = null!;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
    public decimal Price { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; } = null!;
}
