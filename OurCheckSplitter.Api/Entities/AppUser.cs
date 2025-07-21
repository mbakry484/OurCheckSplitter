namespace OurCheckSplitter.Api.Entities
{
    public class AppUser
    {
        public Guid Id { get; set; } // Primary key

        // Identity
        public string Email { get; set; } = null!;
        public string? GoogleId { get; set; } // Optional: for Google login
        public string? FirebaseUid { get; set; } // Optional: for Firebase Auth
        public string DisplayName { get; set; } = null!; // Show in UI

        // Profile
        public string? ProfilePictureUrl { get; set; }
        public string PreferredCurrency { get; set; } = "USD"; // Default to USD

        // Subscription & Access Control
        public bool IsPremium { get; set; }
        public DateTime? PremiumExpiresAt { get; set; }

        // Usage Limits (for free users)
        public int VoiceNoteCount { get; set; }
        public int ChatbotMessageCount { get; set; }
        public int OCRScanCount { get; set; }

        // Other tracking (optional)
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }

        // Navigation properties
        public ICollection<Friend> Friends { get; set; } = new List<Friend>();
        public ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
    }
}