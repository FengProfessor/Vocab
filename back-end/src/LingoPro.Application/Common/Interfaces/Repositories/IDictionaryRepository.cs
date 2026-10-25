using LingoPro.Domain.Entities.Vocab;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for querying the global dictionary catalog.
/// </summary>
public interface IDictionaryRepository
{
    Task<GlobalDictionary?> GetByWordAsNoTrackingAsync(string normalizedWord, CancellationToken ct = default);
}
