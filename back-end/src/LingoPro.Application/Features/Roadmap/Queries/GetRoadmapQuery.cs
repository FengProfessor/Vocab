using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Roadmap.Queries;

/// <summary>
/// Query to retrieve the authenticated user's roadmap enrollment and step progress for a specific track.
/// Note: Intentionally does NOT implement ICacheableQuery because roadmap progress is per-user mutable state.
/// </summary>
[Authorize]
public record GetRoadmapQuery(RoadmapTrackType Track = RoadmapTrackType.Cefr)
    : IRequest<ApiResponse<RoadmapProgressDto>>;
