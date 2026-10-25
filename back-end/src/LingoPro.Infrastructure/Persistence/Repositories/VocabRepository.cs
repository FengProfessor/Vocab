using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing vocabulary FSRS review persistence and due review queue queries.
/// </summary>
public sealed class VocabRepository(IApplicationDbContext dbContext) : IVocabRepository
{
    public Task<SrsProgress?> GetSrsProgressAsync(Guid userId, Guid wordId, CancellationToken ct = default)
        => dbContext.SrsProgresses.FirstOrDefaultAsync(
            s => s.UserId == userId && s.WordId == wordId && (s.Word == null || s.Word.IsDeleted != true),
            ct);

    public Task<bool> WordExistsAsync(Guid wordId, CancellationToken ct = default)
        => dbContext.Words.AsNoTracking().AnyAsync(w => w.Id == wordId && w.IsDeleted != true, ct);

    public void AddSrsProgress(SrsProgress srs)
        => dbContext.SrsProgresses.Add(srs);

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

    public Task<List<SrsProgress>> GetDueSrsProgressesWithWordAsync(
        Guid userId,
        DateTime dueUntilUtc,
        int limit,
        CancellationToken ct = default)
        => dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == userId &&
                        s.NextReviewDate != null &&
                        s.NextReviewDate < dueUntilUtc &&
                        (s.Word == null || s.Word.IsDeleted != true))
            .OrderBy(s => s.NextReviewDate)
            .Take(limit)
            .ToListAsync(ct);

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
