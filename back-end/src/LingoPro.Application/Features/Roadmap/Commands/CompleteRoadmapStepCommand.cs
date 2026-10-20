using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Roadmap.Queries;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Roadmap.Commands;

/// <summary>
/// Command to mark a roadmap station step as completed and unlock the next station.
/// </summary>
[Authorize]
public record CompleteRoadmapStepCommand(
    RoadmapTrackType Track,
    string StepId,
    bool IsCheckpointOrExam,
    double? Score) : IRequest<ApiResponse<CompleteStepResultDto>>;
