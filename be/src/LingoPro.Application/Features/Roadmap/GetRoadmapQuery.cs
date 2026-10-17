using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Query to retrieve the authenticated user's roadmap enrollment and step progress for a specific track.
/// Note: Intentionally does NOT implement ICacheableQuery because roadmap progress is per-user mutable state.
/// </summary>
public record GetRoadmapQuery(RoadmapTrackType Track = RoadmapTrackType.Cefr)
    : IRequest<ApiResponse<RoadmapProgressDto>>;
