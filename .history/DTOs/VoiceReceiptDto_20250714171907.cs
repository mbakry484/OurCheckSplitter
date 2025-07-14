namespace OurCheckSplitter.Api.DTOs
{
    public class VoiceReceiptDto
    {
        public string? VoiceText { get; set; }  // Pre-converted text from client
        public byte[]? VoiceData { get; set; }  // Raw voice data if conversion needed server-side
        public OCRData? OCRData { get; set; }   // Optional OCR data from receipt image
    }

    public class OCRData
    {
        public List<OCRItem> Items { get; set; } = new();
        public decimal Total { get; set; }
        public decimal Tax { get; set; }
        public decimal Tips { get; set; }
        public string? RestaurantName { get; set; }
        public DateTime? ReceiptDate { get; set; }
        public double ConfidenceScore { get; set; }
    }

    public class OCRItem
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; } = 1;
        public double Confidence { get; set; }
    }
}