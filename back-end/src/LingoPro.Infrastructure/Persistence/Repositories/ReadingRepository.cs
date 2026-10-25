using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.Reading.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing daily reading exercise, completion, and reading library article queries and mutations.
/// </summary>
public sealed class ReadingRepository(IApplicationDbContext dbContext) : IReadingRepository
{
    public Task<bool> DailyReadingExerciseExistsAsync(Guid exerciseId, CancellationToken ct = default)
        => dbContext.DailyReadingExercises.AsNoTracking().AnyAsync(e => e.Id == exerciseId, ct);

    public Task<DailyReadingCompletion?> GetDailyReadingCompletionAsync(Guid userId, Guid exerciseId, CancellationToken ct = default)
        => dbContext.DailyReadingCompletions.FirstOrDefaultAsync(
            c => c.UserId == userId && c.ExerciseId == exerciseId,
            ct);

    public void AddDailyReadingCompletion(DailyReadingCompletion completion)
        => dbContext.DailyReadingCompletions.Add(completion);

    public async Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default)
    {
        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }

        gamification.AwardXpAndUpdateStreak(xp, todayLocal);
    }

    public Task<DailyReadingExercise?> GetDailyReadingExerciseForDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
        => dbContext.DailyReadingExercises
            .AsNoTracking()
            .FirstOrDefaultAsync(e => (e.TargetUserId == userId || e.TargetUserId == null) && e.ExerciseDate == date, ct);

    public Task<bool> IsDailyReadingCompletedAsync(Guid userId, Guid exerciseId, CancellationToken ct = default)
        => dbContext.DailyReadingCompletions
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId && c.ExerciseId == exerciseId, ct);

    public async Task<IReadOnlyList<ReadingArticleDto>> GetPublishedArticlesAsync(CertLevel? certLevel, CancellationToken ct = default)
    {
        var query = dbContext.ReadingArticles
            .AsNoTracking()
            .Where(a => a.IsDeleted != true && a.Status == "published");

        if (certLevel.HasValue)
        {
            string cert = certLevel.Value.ToString();
            query = query.Where(a => a.CefrLevel == cert);
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ReadingArticleDto(
                a.Id,
                a.Slug,
                a.Title,
                a.ThemeId,
                a.CefrLevel,
                a.SourceType,
                a.WordCount,
                a.Passage,
                a.Questions))
            .ToListAsync(ct);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
