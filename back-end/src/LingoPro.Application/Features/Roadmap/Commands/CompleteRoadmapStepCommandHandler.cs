using LingoPro.Application.Features.Roadmap.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Roadmap.Commands;

/// <summary>
/// Completes a roadmap station step with Pro entitlement gating and anti-infinite-XP replay protection.
/// </summary>
public class CompleteRoadmapStepCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<CompleteRoadmapStepCommand, ApiResponse<CompleteStepResultDto>>
{
    private static readonly HashSet<string> ProRequiredPrefixes =
        ["A2", "B1", "B2", "C1", "C2", "toeic-600", "toeic-800", "lop-11", "lop-12"];

    public async Task<ApiResponse<CompleteStepResultDto>> Handle(CompleteRoadmapStepCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        int xpAwarded = request.IsCheckpointOrExam ? 45 : 15;
        var nowUtc = DateTime.UtcNow;

        bool requiresProByStep = ProRequiredPrefixes.Any(prefix =>
            request.StepId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
        if (!currentUser.IsPro && requiresProByStep)
        {
            throw new ForbiddenAccessException(
                "A Pro or Premium subscription is required to access advanced roadmap levels.",
                "PRO_REQUIRED");
        }

        var roadmap = await dbContext.UserRoadmaps
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Track == request.Track, ct)
            ?? throw new NotFoundException("UserRoadmap", request.Track);

        bool requiresProByLevel = roadmap.LevelId is
            RoadmapLevelId.A2 or
            RoadmapLevelId.B1 or
            RoadmapLevelId.B2 or
            RoadmapLevelId.C1 or
            RoadmapLevelId.C2 or
            RoadmapLevelId.Lop11 or
            RoadmapLevelId.Lop12 or
            RoadmapLevelId.Toeic650 or
            RoadmapLevelId.Toeic800;

        if (!currentUser.IsPro && requiresProByLevel)
        {
            throw new ForbiddenAccessException(
                "A Pro or Premium subscription is required to access advanced roadmap levels.",
                "PRO_REQUIRED");
        }

        // user_roadmap_steps is keyed by (user_id, step_id) with no track/roadmap FK.
        var existingStep = await dbContext.UserRoadmapSteps.FirstOrDefaultAsync(s => s.UserId == userId && s.StepId == request.StepId, ct);
        int? requestScore = request.Score.HasValue ? (int)Math.Round(request.Score.Value) : null;
        if (existingStep is { Status: RoadmapStepStatus.Completed })
        {
            if (requestScore.HasValue && (!existingStep.Score.HasValue || requestScore > existingStep.Score))
            {
                existingStep.Score = requestScore;
                await dbContext.SaveChangesAsync(ct);
            }

            return ApiResponse<CompleteStepResultDto>.Ok(
                new CompleteStepResultDto(request.StepId, RoadmapStepStatus.Completed, 0),
                "Step was already completed previously. Score updated without duplicate XP."
            );
        }

        if (existingStep == null)
        {
            existingStep = new UserRoadmapStep
            {
                UserId = userId,
                StepId = request.StepId,
                Status = RoadmapStepStatus.Completed,
                Score = requestScore,
                CompletedAt = nowUtc
            };
            dbContext.UserRoadmapSteps.Add(existingStep);
        }
        else
        {
            existingStep.Status = RoadmapStepStatus.Completed;
            existingStep.Score = requestScore;
            existingStep.CompletedAt = nowUtc;
        }

        roadmap.CurrentUnitId = request.StepId;
        roadmap.UpdatedAt = nowUtc;

        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }
        gamification.AwardXpAndUpdateStreak(xpAwarded, DateOnly.FromDateTime(nowUtc));

        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<CompleteStepResultDto>.Ok(
            new CompleteStepResultDto(request.StepId, RoadmapStepStatus.Completed, xpAwarded),
            "Roadmap step completed and next station unlocked successfully."
        );
    }
}
