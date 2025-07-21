using System;

namespace OurCheckSplitter.Api.DTOs;

public class AssignItemsToReceiptDto
{
    [Required]
    public int ReceiptId { get; set; }

    [Required]
    public List<string> ItemNames { get; set; } = new();
}
