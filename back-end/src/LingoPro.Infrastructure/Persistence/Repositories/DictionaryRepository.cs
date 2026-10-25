using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing read queries against the global dictionary catalog.
/// </summary>
public sealed class DictionaryRepository(IApplicationDbContext dbContext) : IDictionaryRepository
{
    public Task<GlobalDictionary?> GetByWordAsNoTrackingAsync(string normalizedWord, CancellationToken ct = default)
        => dbContext.GlobalDictionaries
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Word == normalizedWord, ct);
}
