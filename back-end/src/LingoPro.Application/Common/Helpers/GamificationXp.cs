using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Auth;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Common.Helpers;

/// <summary>
/// Awards XP / streak to a learner through public.user_gamification (the SQL schema keeps these counters
/// on a separate 1-to-1 table rather than on profiles).
/// </summary>
public static class GamificationXp
{
    public static async Task AwardAsync(
        IApplicationDbContext dbContext,
        Guid userId,
        int xp,
        DateOnly todayLocal,
        CancellationToken ct)
    {
        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }

        gamification.AwardXpAndUpdateStreak(xp, todayLocal);
    }
}
