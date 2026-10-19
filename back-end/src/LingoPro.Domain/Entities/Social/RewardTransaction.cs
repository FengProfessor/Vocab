using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents an ambassador commission or Pro-day reward transaction (public.reward_transactions).
/// </summary>
public class RewardTransaction : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? SourceRefereeId { get; set; }
    public Guid? ReferralLogId { get; set; }
    public Guid? OrderId { get; set; }
    public RewardTransactionType RewardType { get; set; } = RewardTransactionType.ProDays;
    public decimal Amount { get; set; }
    public RewardTransactionStatus Status { get; set; } = RewardTransactionStatus.Available;
    public DateTime? AvailableAt { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual Profile? SourceReferee { get; set; }
    public virtual ReferralLog? ReferralLog { get; set; }
    public virtual Order? Order { get; set; }
}
