using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Roadmap.Queries;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Roadmap.Commands;

/// <summary>
/// Evaluates placement test responses and enrolls the user in the appropriate starting <see cref="RoadmapLevelId"/>.
/// </summary>
public class SubmitPlacementCommandHandler(
    ICurrentUserService currentUser,
    IRoadmapRepository roadmapRepository) : IRequestHandler<SubmitPlacementCommand, ApiResponse<RoadmapProgressDto>>
{
    public async Task<ApiResponse<RoadmapProgressDto>> Handle(SubmitPlacementCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        RoadmapLevelId assignedLevel = request.SelfSelectLevelId
            ?? CalculatePlacementLevel(request.Answers ?? new Dictionary<string, string>());

        var placementJson = System.Text.Json.JsonSerializer.Serialize(new { level = assignedLevel.ToString(), self_selected = request.SelfSelectLevelId.HasValue });

        var roadmap = await roadmapRepository.GetUserRoadmapAsync(userId, request.Track, ct);

        if (roadmap == null)
        {
            roadmap = new UserRoadmap
            {
                UserId = userId,
                Track = request.Track,
                LevelId = assignedLevel,
                // SQL has no placement_completed column: placement is marked by a non-null placement JSON.
                Placement = placementJson
            };
            roadmapRepository.AddUserRoadmap(roadmap);
        }
        else
        {
            roadmap.LevelId = assignedLevel;
            roadmap.Placement = placementJson;
            roadmap.UpdatedAt = DateTime.UtcNow;
        }

        await roadmapRepository.SaveChangesAsync(ct);

        var steps = await roadmapRepository.GetUserRoadmapStepsAsNoTrackingAsync(userId, ct);

        var dto = new RoadmapProgressDto(
            request.Track,
            true,
            false,
            roadmap.LevelId,
            roadmap.CurrentUnitId,
            // user_roadmap_steps is keyed by (user_id, step_id) with no track column, so steps are per user.
            steps.Select(s => new RoadmapStepDto(s.StepId, s.Status, s.Score, s.CompletedAt)).ToList()
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
