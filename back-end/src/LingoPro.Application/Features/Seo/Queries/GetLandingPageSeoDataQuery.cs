using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Seo.Queries;

/// <summary>
/// Query to retrieve SEO metadata and live curriculum statistics for the server-side rendered home page.
/// Implements <see cref="ICacheableQuery"/> for multi-level caching (L1 Local + L2 Redis in Phase 2).
/// </summary>
public sealed record GetLandingPageSeoDataQuery : IRequest<ApiResponse<LandingPageSeoDto>>, ICacheableQuery
{
    public string CacheKey => "seo:landing-page-data:v1";

    public TimeSpan? LocalExpiration => TimeSpan.FromMinutes(15);

    public TimeSpan? DistributedExpiration => TimeSpan.FromHours(2);
}
