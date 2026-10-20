using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Query to retrieve the canonical 62 CEFR grammar topics.
/// Implements <see cref="ICacheableQuery"/> because the canonical topic catalog is shared and read-heavy.
/// </summary>
public record GetCanonicalGrammarTopicsQuery(CertLevel? CertLevel = null)
    : IRequest<ApiResponse<IReadOnlyList<GrammarTopicDto>>>, ICacheableQuery
{
    public string CacheKey => $"grammar:topics:{CertLevel?.ToString() ?? "all"}";
    public TimeSpan? LocalExpiration => TimeSpan.FromMinutes(30);
    public TimeSpan? DistributedExpiration => TimeSpan.FromHours(24);
}
