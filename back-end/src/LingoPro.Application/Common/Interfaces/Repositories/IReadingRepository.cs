using LingoPro.Application.Features.Reading.Queries;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for daily personalized reading exercises, completions, and CEFR reading library articles.
/// </summary>
public interface IReadingRepository
{
    Task<bool> DailyReadingExerciseExistsAsync(Guid exerciseId, CancellationToken ct = default);

    Task<DailyReadingCompletion?> GetDailyReadingCompletionAsync(Guid userId, Guid exerciseId, CancellationToken ct = default);

    void AddDailyReadingCompletion(DailyReadingCompletion completion);

    Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default);

    Task<DailyReadingExercise?> GetDailyReadingExerciseForDateAsync(Guid userId, DateOnly date, CancellationToken ct = default);

    Task<bool> IsDailyReadingCompletedAsync(Guid userId, Guid exerciseId, CancellationToken ct = default);

    Task<IReadOnlyList<ReadingArticleDto>> GetPublishedArticlesAsync(CertLevel? certLevel, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
