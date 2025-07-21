using System;
using System.ComponentModel.DataAnnotations;

namespace OurCheckSplitter.Api.DTOs;

public class AssignItemsToReceiptDto
{
    [Required]
    public int ReceiptId { get; set; }

