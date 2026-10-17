using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Gamification;

/// <summary>
/// Represents a commitment-based vocabulary challenge campaign (public.challenges).
/// </summary>
public class Challenge : BaseAuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CreatorId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int DailyTargetWords { get; set; } = 20;
    public int MaxParticipants { get; set; } = 100;
    public decimal DepositAmount { get; set; }
    public ChallengeStatus Status { get; set; } = ChallengeStatus.Active;

    public virtual Profile Creator { get; set; } = null!;
    public virtual ICollection<ChallengeParticipant> Participants { get; set; } = new List<ChallengeParticipant>();
    public virtual ICollection<ChallengeDailyLog> DailyLogs { get; set; } = new List<ChallengeDailyLog>();
}
