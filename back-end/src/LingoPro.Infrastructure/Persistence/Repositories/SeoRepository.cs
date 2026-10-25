using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository querying public learner and curriculum catalog counts for SEO landing pages.
/// </summary>
public sealed class SeoRepository(IApplicationDbContext dbContext) : ISeoRepository
{
    public async Task<(int TotalLearners, int WordsCount, int GrammarCount, int ReadingCount)> GetCatalogCountsAsync(
        CancellationToken ct = default)
    {
        var totalLearners = await dbContext.Profiles.AsNoTracking().CountAsync(x => x.IsDeleted != true, ct);
        var wordsCount = await dbContext.Words.AsNoTracking().CountAsync(x => x.IsDeleted != true, ct);
        var grammarCount = await dbContext.GrammarTopics.AsNoTracking().CountAsync(ct);
        var readingCount = await dbContext.ReadingArticles.AsNoTracking().CountAsync(x => x.IsDeleted != true && x.Status == "published", ct);

        return (totalLearners, wordsCount, grammarCount, readingCount);
    }
}
