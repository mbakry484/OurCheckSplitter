using OurCheckSplitter.Api.Entities;

namespace OurCheckSplitter.Api.DTOs
{
    public class ReceiptDto
    {
        int Id { get; set; }

        public string? Name { get; set; }
        public double Tax { get; set; }
        public double Tips { get; set; }
        public double Total { get; set; }





    }
}
