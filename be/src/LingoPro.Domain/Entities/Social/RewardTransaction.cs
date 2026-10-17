using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Social;

/// <summary>
/// Represents an ambassador commission or Pro-day reward transaction (public.reward_transactions).
/// </summary>
public class RewardTransaction : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? SourceRefereeId { get; set; }
    public RewardTransactionType RewardType { get; set; } = RewardTransactionType.ProDays;
    public decimal Amount { get; set; }
    public RewardTransactionStatus Status { get; set; } = RewardTransactionStatus.Available;
    public DateTime? AvailableAt { get; set; }
}
