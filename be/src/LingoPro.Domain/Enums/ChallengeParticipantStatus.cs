namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines enrollment statuses for challenge participants ('pending', 'active', 'failed', 'completed', 'refunded').
/// </summary>
public enum ChallengeParticipantStatus
{
    Pending = 0,
    Active = 1,
    Failed = 2,
    Completed = 3,
    Refunded = 4
}
