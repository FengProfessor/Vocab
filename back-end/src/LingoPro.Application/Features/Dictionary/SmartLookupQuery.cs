using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Dictionary;

/// <summary>
/// Query to look up a global dictionary entry.
/// Implements <see cref="ICacheableQuery"/> because global_dictionary entries are shared, immutable catalog data.
/// When Context is provided, contextual AI sense disambiguation bypasses static caching.
/// </summary>
public record SmartLookupQuery(string Term, string? Context = null)
    : IRequest<ApiResponse<DictionaryEntryDto>>, ICacheableQuery
{
    public string CacheKey => $"dict:term:{Term.Trim().ToLowerInvariant()}";
    public TimeSpan? LocalExpiration => TimeSpan.FromMinutes(15);
    public TimeSpan? DistributedExpiration => TimeSpan.FromHours(24);
    public bool BypassCache => !string.IsNullOrWhiteSpace(Context);
}
