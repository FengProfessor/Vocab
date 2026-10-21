using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Gamification;

/// <summary>
/// Tracks one participant's raw learning metrics and criteria verdict for a calendar day (public.challenge_daily_log).
/// </summary>
public class ChallengeDailyLog : BaseEntity
{
    public Guid ParticipantId { get; set; }
    public Guid UserId { get; set; }
    public Guid ChallengeId { get; set; }
    public DateOnly LogDate { get; set; }
    public int? SrsReviews { get; set; } = 0;
    public int? QuizzesDone { get; set; } = 0;
    public int? ReadingSessions { get; set; } = 0;
    public int? ListeningSessions { get; set; } = 0;
    public int? XpEarned { get; set; } = 0;
    public bool? CriteriaMet { get; set; } = false;
    public DateTime? CheckedAt { get; set; }

    public virtual Challenge Challenge { get; set; } = null!;
    public virtual Profile User { get; set; } = null!;
    public virtual ChallengeParticipant Participant { get; set; } = null!;
}