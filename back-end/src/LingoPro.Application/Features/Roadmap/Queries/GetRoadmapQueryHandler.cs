using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Roadmap.Queries;

/// <summary>
/// Retrieves the user's enrolled roadmap and completed steps via the roadmap repository.
/// </summary>
public class GetRoadmapQueryHandler(
    ICurrentUserService currentUser,
    IRoadmapRepository roadmapRepository) : IRequestHandler<GetRoadmapQuery, ApiResponse<RoadmapProgressDto>>
{
    public async Task<ApiResponse<RoadmapProgressDto>> Handle(GetRoadmapQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var roadmap = await roadmapRepository.GetUserRoadmapAsNoTrackingAsync(userId, request.Track, ct);

        if (roadmap == null)
        {
            return ApiResponse<RoadmapProgressDto>.Ok(
                new RoadmapProgressDto(request.Track, false, true, null, null, []),
                "User is not yet enrolled in this roadmap track. Placement is required."
            );
        }

        // user_roadmap_steps is keyed by (user_id, step_id) with no track column, so steps are per user.
        var steps = (await roadmapRepository.GetUserRoadmapStepsAsNoTrackingAsync(userId, ct))
            .Select(s => new RoadmapStepDto(s.StepId, s.Status, (double?)s.Score, s.CompletedAt))
            .ToList();

        return ApiResponse<RoadmapProgressDto>.Ok(
            new RoadmapProgressDto(request.Track, true, roadmap.Placement == null, roadmap.LevelId, roadmap.CurrentUnitId, steps),
            "User roadmap retrieved successfully."
        );
    }
}
