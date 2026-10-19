using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Represents a single station step and its completion status on a user roadmap.
/// </summary>
public record RoadmapStepDto(
    string StepId,
    RoadmapStepStatus Status,
    double? Score,
    DateTime? CompletedAt
);
