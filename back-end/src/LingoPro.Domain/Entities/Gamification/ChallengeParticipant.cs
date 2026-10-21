using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Gamification;

/// <summary>
/// Represents a user's registration and progress in a challenge (public.challenge_participants).
/// </summary>
public class ChallengeParticipant : BaseEntity
{
    public Guid ChallengeId { get; set; }
    public Guid UserId { get; set; }
    public Guid? OrderId { get; set; }
    public ChallengeParticipantStatus? Status { get; set; } = ChallengeParticipantStatus.Pending;
    public DateTime? JoinedAt { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? FailedReason { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public int? RefundAmount { get; set; }
    public DateTime? BonusExpiresAt { get; set; }
    public int? CurrentStreak { get; set; } = 0;
    public int? LongestStreak { get; set; } = 0;
    public int? TotalActiveDays { get; set; } = 0;
    public int StreakFreezesUsed { get; set; }

    /// <summary>
    /// Chosen reward upon completion: 'cash' or 'pro' (null until chosen).
    /// </summary>
    public string? RewardChoice { get; set; }

    public virtual Challenge Challenge { get; set; } = null!;
    public virtual Profile User { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual ICollection<ChallengeDailyLog> DailyLogs { get; set; } = new List<ChallengeDailyLog>();
}