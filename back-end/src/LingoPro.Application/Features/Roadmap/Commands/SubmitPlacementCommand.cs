using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Roadmap.Queries;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Roadmap.Commands;

/// <summary>
/// Command to enroll in a roadmap track via self-selected <see cref="RoadmapLevelId"/> or placement test answers.
/// </summary>
[Authorize]
public record SubmitPlacementCommand(
    RoadmapTrackType Track,
    RoadmapLevelId? SelfSelectLevelId,
    Dictionary<string, string>? Answers) : IRequest<ApiResponse<RoadmapProgressDto>>;
