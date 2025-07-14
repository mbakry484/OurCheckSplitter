namespace OurCheckSplitter.Api.DTOs
{
    public class TaxSplitDto
    {
        public int ReceiptId { get; set; }
        public string ReceiptName { get; set; } = string.Empty;
        public double TotalTax { get; set; }
        public string TaxType { get; set; } = "amount";
        public double TaxPercentage { get; set; }
        public double Subtotal { get; set; }
        public List<FriendTaxSplitDto> FriendSplits { get; set; } = new();
        public string SplitMethod { get; set; } = "equal"; // "equal", "proportional", "custom"
    }

    public class FriendTaxSplitDto
    {
        public int FriendId { get; set; }
        public string FriendName { get; set; } = string.Empty;
        public double ItemSubtotal { get; set; } // Sum of items assigned to this friend
        public double TaxAmount { get; set; } // Tax amount for this friend
        public double TaxPercentage { get; set; } // Tax percentage for this friend
        public double TotalAmount { get; set; } // Total amount including tax
    }

    public class TaxCalculationRequestDto
    {
        public int ReceiptId { get; set; }
        public string SplitMethod { get; set; } = "equal"; // "equal", "proportional"
        public bool IncludeTaxInSplit { get; set; } = true;
    }
}