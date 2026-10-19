using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Gamification;

/// <summary>
/// Represents a user's registration and progress in a challenge (public.challenge_participants).
/// </summary>
public class ChallengeParticipant : BaseAuditableEntity
{
    public Guid ChallengeId { get; set; }
    public Guid UserId { get; set; }
    public Guid? OrderId { get; set; }
    public ChallengeParticipantStatus Status { get; set; } = ChallengeParticipantStatus.Active;
    public int CompletedDaysCount { get; set; }
    public int TotalPoints { get; set; }

    public virtual Challenge Challenge { get; set; } = null!;
    public virtual Profile User { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual ICollection<ChallengeDailyLog> DailyLogs { get; set; } = new List<ChallengeDailyLog>();
}
