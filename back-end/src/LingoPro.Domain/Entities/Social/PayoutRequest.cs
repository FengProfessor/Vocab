using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents a cash commission withdrawal request from an ambassador (public.payout_requests).
/// Status values: 'pending', 'approved', 'rejected', 'completed'.
/// </summary>
public class PayoutRequest : BaseEntity
{
    public Guid UserId { get; set; }
    public int Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountHolder { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string? AdminNote { get; set; }
    public Guid? ProcessedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual Profile? ProcessedByUser { get; set; }
}