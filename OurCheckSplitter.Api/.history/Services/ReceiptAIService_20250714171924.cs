using OurCheckSplitter.Api.DTOs;

namespace OurCheckSplitter.Api.Services
{
    public class ReceiptData
    {
        public string? RestaurantName { get; set; }
        public List<ReceiptItemData> Items { get; set; } = new();
        public decimal Total { get; set; }
        public decimal Tax { get; set; }
        public decimal Tips { get; set; }
        public List<string> People { get; set; } = new();
        public string? SplittingMethod { get; set; } // "equal", "proportional", "custom"
        public double ConfidenceScore { get; set; }
        public string? RawText { get; set; }
    }

    public class ReceiptItemData
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; } = 1;
        public List<string> AssignedPeople { get; set; } = new();
    }

    public class ReceiptAIService
    {
        private readonly ILogger<ReceiptAIService> _logger;
        private readonly HttpClient _httpClient;

        public ReceiptAIService(ILogger<ReceiptAIService> logger, HttpClient httpClient)
        {
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<ReceiptData> ParseVoiceDescription(string voiceText)
        {
            try
            {
                // This would integrate with OpenAI GPT-4 or Azure OpenAI
                // For now, we'll implement a basic parser
                return await ParseWithAI(voiceText);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to parse voice description with AI");
                throw;
            }
        }

        private async Task<ReceiptData> ParseWithAI(string voiceText)
        {
            // Example prompt for AI:
            // "Parse this receipt description and extract structured data: {voiceText}"
            // "Return JSON with: restaurant, items (name, price, quantity, assigned people), total, tax, tips, people list"

            // For now, implement basic parsing logic
            var result = new ReceiptData
            {
                RawText = voiceText,
                ConfidenceScore = 0.8
            };

            // Basic keyword extraction (this would be replaced with AI)
            var words = voiceText.ToLower().Split(' ');

            // Extract restaurant names (common patterns)
            var restaurantKeywords = new[] { "at", "restaurant", "cafe", "diner", "pizza", "mcdonalds", "burger" };
            for (int i = 0; i < words.Length - 1; i++)
            {
                if (words[i] == "at" && i + 1 < words.Length)
                {
                    result.RestaurantName = words[i + 1];
                    break;
                }
            }

            // Extract people names (capitalized words that aren't common words)
            var commonWords = new[] { "i", "had", "for", "and", "the", "a", "an", "was", "were", "total", "tax", "tip" };
            foreach (var word in words)
            {
                if (word.Length > 2 && !commonWords.Contains(word) && char.IsUpper(word[0]))
                {
                    if (!result.People.Contains(word))
                        result.People.Add(word);
                }
            }

            // Extract prices (numbers with $ or decimal)
            var pricePattern = @"\$?(\d+\.?\d*)";
            var matches = System.Text.RegularExpressions.Regex.Matches(voiceText, pricePattern);
            var prices = matches.Select(m => decimal.Parse(m.Groups[1].Value)).ToList();

            if (prices.Any())
            {
                result.Total = prices.Max(); // Assume highest price is total
                result.Tax = prices.Count > 1 ? prices[prices.Count - 2] : 0; // Second to last
                result.Tips = prices.Count > 2 ? prices[prices.Count - 3] : 0; // Third to last
            }

            return result;
        }
    }
}