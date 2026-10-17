using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Represents the result of completing a roadmap station step.
/// </summary>
public record CompleteStepResultDto(
    string StepId,
    RoadmapStepStatus Status,
    int XpAwarded
);
