using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Reading;

/// <summary>
/// Query to retrieve published reading library articles filtered by <see cref="CertLevel"/>.
/// Implements <see cref="ICacheableQuery"/> because published reading articles are shared catalog data.
/// </summary>
public record GetReadingArticlesQuery(CertLevel? CertLevel = null)
    : IRequest<ApiResponse<IReadOnlyList<ReadingArticleDto>>>, ICacheableQuery
{
    public string CacheKey => $"reading:articles:{CertLevel?.ToString() ?? "all"}";
    public TimeSpan? LocalExpiration => TimeSpan.FromMinutes(10);
    public TimeSpan? DistributedExpiration => TimeSpan.FromHours(6);
}
