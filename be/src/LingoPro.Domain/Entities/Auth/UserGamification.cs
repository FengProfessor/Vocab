using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Auth;

/// <summary>
/// Tracks user streak, daily XP goal, and gamification counters linked 1-to-1 with <see cref="Profile"/> (public.user_gamification).
/// </summary>
public class UserGamification : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public int TotalXp { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateOnly? LastActiveDate { get; set; }
    public int DailyGoal { get; set; } = 30;
    public int TodayXp { get; set; }
    public DateOnly? TodayDate { get; set; }

    public virtual Profile User { get; set; } = null!;
}
