using OurCheckSplitter.Api.Entities;

public class AppUser
{
    public Guid Id { get; set; } // Primary key

    // Identity
    public string Email { get; set; } =!null
    public string GoogleId { get; set; } // Optional: for Google login
    public string DisplayName { get; set; } // Show in UI

    // Profile
    public string ProfilePictureUrl { get; set; }
    public string PreferredCurrency { get; set; } // e.g. "USD", "EGP", "EUR"

    // Subscription & Access Control
    public bool IsPremium { get; set; } // True if user paid
    public DateTime? PremiumExpiresAt { get; set; } // Optional expiration

    // Usage Limits (for free users)
    public int VoiceNoteCount { get; set; }
    public int ChatbotMessageCount { get; set; }
    public int OCRScanCount { get; set; }

    // Other tracking (optional)
    public DateTime CreatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }

    // Navigation properties
    public ICollection<Friend> Friends { get; set; }
    public ICollection<Receipt> Receipts { get; set; }
}
