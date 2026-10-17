using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Gamification;

/// <summary>
/// Tracks daily word review completion for a challenge participant (public.challenge_daily_logs).
/// </summary>
public class ChallengeDailyLog : BaseAuditableEntity
{
    public Guid ChallengeId { get; set; }
    public Guid UserId { get; set; }
    public Guid? ParticipantId { get; set; }
    public DateOnly LogDate { get; set; }
    public int WordsReviewed { get; set; }
    public int XpEarned { get; set; }
    public bool IsTargetMet { get; set; }

    public virtual Challenge Challenge { get; set; } = null!;
    public virtual Profile User { get; set; } = null!;
    public virtual ChallengeParticipant? Participant { get; set; }
}
