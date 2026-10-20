using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Roadmap.Queries;

/// <summary>
/// Represents a user's enrollment and progress state on a learning roadmap track.
/// </summary>
public record RoadmapProgressDto(
    RoadmapTrackType Track,
    bool Enrolled,
    bool NeedsPlacement,
    RoadmapLevelId? LevelId,
    string? CurrentUnitId,
    IReadOnlyList<RoadmapStepDto> CompletedSteps
);
