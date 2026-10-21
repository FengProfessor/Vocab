using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Gamification;

/// <summary>
/// Represents a commitment-based learning challenge campaign (public.challenges).
/// </summary>
public class Challenge : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationDays { get; set; }
    public int DepositAmount { get; set; }
    public int RefundPct { get; set; } = 100;
    public int BonusProDays { get; set; }

    /// <summary>
    /// Daily criteria JSON (min_srs_reviews, min_quizzes, min_reading_sessions, min_listening_sessions) stored as jsonb.
    /// </summary>
    public string DailyCriteria { get; set; } = "{\"min_srs_reviews\": 10, \"min_quizzes\": 1, \"min_reading_sessions\": 0, \"min_listening_sessions\": 0}";

    public DateTime RegistrationOpensAt { get; set; }
    public DateTime RegistrationClosesAt { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public int? MaxParticipants { get; set; }
    public ChallengeStatus? Status { get; set; } = ChallengeStatus.Draft;
    public int RefundCashAmount { get; set; } = 200000;
    public int StreakFreezePrice { get; set; } = 50000;
    public int MaxStreakFreezes { get; set; } = 3;

    public virtual Profile? Creator { get; set; }
    public virtual ICollection<ChallengeParticipant> Participants { get; set; } = new List<ChallengeParticipant>();
    public virtual ICollection<ChallengeDailyLog> DailyLogs { get; set; } = new List<ChallengeDailyLog>();
}