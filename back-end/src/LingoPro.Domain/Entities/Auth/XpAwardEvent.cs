namespace LingoPro.Domain.Entities.Auth;

/// <summary>
/// Immutable ledger entry recording a one-time idempotent XP award for a user (public.xp_award_events).
/// </summary>
public class XpAwardEvent
{
    public Guid UserId { get; set; }
    public string EventKey { get; set; } = string.Empty;
    public int XpAwarded { get; set; }
    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
}
