namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for querying public platform catalog metrics for SEO landing pages.
/// </summary>
public interface ISeoRepository
{
    Task<(int TotalLearners, int WordsCount, int GrammarCount, int ReadingCount)> GetCatalogCountsAsync(
        CancellationToken ct = default);
}
