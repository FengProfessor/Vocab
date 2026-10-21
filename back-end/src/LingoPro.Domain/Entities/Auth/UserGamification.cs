using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Auth;

/// <summary>
/// Tracks user streak, daily XP goal, and gamification counters linked 1-to-1 with <see cref="Profile"/> (public.user_gamification, PK user_id).
/// </summary>
public class UserGamification
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

    /// <summary>
    /// Awards experience points and updates the user's daily streak based on local date progression.
    /// </summary>
    public void AwardXpAndUpdateStreak(int xp, DateOnly todayLocal)
    {
        if (xp > 0)
        {
            TotalXp += xp;
            if (TodayDate != todayLocal)
            {
                TodayXp = 0;
                TodayDate = todayLocal;
            }

            TodayXp += xp;
        }

        if (LastActiveDate == null)
        {
            CurrentStreak = 1;
        }
        else if (LastActiveDate.Value == todayLocal.AddDays(-1))
        {
            CurrentStreak += 1;
        }
        else if (LastActiveDate.Value < todayLocal.AddDays(-1))
        {
            CurrentStreak = 1;
        }

        if (CurrentStreak > LongestStreak)
        {
            LongestStreak = CurrentStreak;
        }

        LastActiveDate = todayLocal;
    }
}
