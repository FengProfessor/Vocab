using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Command to enroll in a roadmap track via self-selected <see cref="RoadmapLevelId"/> or placement test answers.
/// </summary>
public record SubmitPlacementCommand(
    RoadmapTrackType Track,
    RoadmapLevelId? SelfSelectLevelId,
    Dictionary<string, string>? Answers) : IRequest<ApiResponse<RoadmapProgressDto>>;
