using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Retrieves the user's enrolled roadmap and completed steps directly from the database.
/// </summary>
public class GetRoadmapQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetRoadmapQuery, ApiResponse<RoadmapProgressDto>>
{
    public async Task<ApiResponse<RoadmapProgressDto>> Handle(GetRoadmapQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var roadmap = await dbContext.UserRoadmaps
            .AsNoTracking()
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Track == request.Track, ct);

        if (roadmap == null)
        {
            return ApiResponse<RoadmapProgressDto>.Ok(
                new RoadmapProgressDto(request.Track, false, true, null, null, []),
                "Roadmap enrollment status retrieved successfully."
            );
        }

        var steps = roadmap.Steps
            .Select(s => new RoadmapStepDto(s.StepId, s.Status, s.Score, s.CompletedAt))
            .ToList();

        return ApiResponse<RoadmapProgressDto>.Ok(
            new RoadmapProgressDto(request.Track, true, false, roadmap.LevelId, roadmap.CurrentUnitId, steps),
            "User roadmap retrieved successfully."
        );
    }
}
