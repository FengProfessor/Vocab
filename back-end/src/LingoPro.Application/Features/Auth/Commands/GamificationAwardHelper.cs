using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Auth;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Awards XP / streak progress on the user's public.user_gamification row (created on first use).
/// XP and streak no longer live on the profile row.
/// </summary>
internal static class GamificationAwardHelper
{
    public static async Task AwardXpAsync(IApplicationDbContext dbContext, Guid userId, int xp, CancellationToken ct)
    {
        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }

        gamification.AwardXpAndUpdateStreak(xp, DateOnly.FromDateTime(DateTime.UtcNow));
    }
}
