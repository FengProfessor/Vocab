using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Evaluates placement test responses and enrolls the user in the appropriate starting <see cref="RoadmapLevelId"/>.
/// </summary>
public class SubmitPlacementCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<SubmitPlacementCommand, ApiResponse<RoadmapProgressDto>>
{
    public async Task<ApiResponse<RoadmapProgressDto>> Handle(SubmitPlacementCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        RoadmapLevelId assignedLevel = request.SelfSelectLevelId
            ?? CalculatePlacementLevel(request.Answers ?? new Dictionary<string, string>());

        var roadmap = await dbContext.UserRoadmaps
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Track == request.Track, ct);

        if (roadmap == null)
        {
            roadmap = new UserRoadmap
            {
                UserId = userId,
                Track = request.Track,
                LevelId = assignedLevel,
                PlacementCompleted = true
            };
            dbContext.UserRoadmaps.Add(roadmap);
        }
        else
        {
            roadmap.LevelId = assignedLevel;
            roadmap.PlacementCompleted = true;
        }

        await dbContext.SaveChangesAsync(ct);

        var dto = new RoadmapProgressDto(
            request.Track,
            true,
            false,
            roadmap.LevelId,
            roadmap.CurrentUnitId,
            roadmap.Steps.Select(s => new RoadmapStepDto(s.StepId, s.Status, s.Score, s.CompletedAt)).ToList()
        );

        return ApiResponse<RoadmapProgressDto>.Ok(dto, "Roadmap placement completed and level enrolled successfully.");
    }

    private static RoadmapLevelId CalculatePlacementLevel(Dictionary<string, string> answers)
    {
        int count = answers.Count;
        return count switch
        {
            >= 16 => RoadmapLevelId.B2,
            >= 12 => RoadmapLevelId.B1,
            >= 8 => RoadmapLevelId.A2,
            >= 4 => RoadmapLevelId.A1,
            _ => RoadmapLevelId.A0
        };
    }
}
