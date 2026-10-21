using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents an ambassador commission or Pro-day reward transaction (public.reward_transactions).
/// RewardType values: 'pro_days', 'cash_commission', 'affiliate_cash', 'milestone_bonus', 'payout_debit', 'clawback_debt'.
/// Status values: 'pending_clearance', 'available', 'deducted', 'withdrawn', 'cancelled', 'clawback'.
/// </summary>
public class RewardTransaction : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? ReferralLogId { get; set; }
    public Guid? OrderId { get; set; }
    public string RewardType { get; set; } = string.Empty;
    public int ProDays { get; set; }
    public int Amount { get; set; }
    public string Status { get; set; } = "available";
    public DateTime AvailableAt { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual ReferralLog? ReferralLog { get; set; }
    public virtual Order? Order { get; set; }
}