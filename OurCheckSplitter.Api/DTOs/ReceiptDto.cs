using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.DTOs
{
    public class ReceiptDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public double Tax { get; set; }
        public string? TaxType { get; set; } = "amount"; // "amount" or "percentage"
        public double Tips { get; set; }
        public double Total { get; set; }
        public bool TipsIncludedInTotal { get; set; } = true;
        public DateTime? CreatedDate { get; set; }
    }
}
