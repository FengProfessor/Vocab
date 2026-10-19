using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Roadmap;
using LingoPro.Domain.Enums;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for personalized learning roadmaps, placement diagnostics, and daily step completion.
/// </summary>
[Route("api/v1/roadmap")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class RoadmapController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<RoadmapProgressDto>>> GetRoadmap(
        [FromQuery] RoadmapTrackType track = RoadmapTrackType.Toeic,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetRoadmapQuery(track), ct);
        return OkResponse(result, "Learning roadmap retrieved successfully.");
    }

    [HttpPost("placement")]
    public async Task<ActionResult<ApiResponse<RoadmapProgressDto>>> SubmitPlacement(
        [FromBody] SubmitPlacementCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Placement result recorded and 60-day roadmap generated.");
    }

    [HttpPost("steps/complete")]
    public async Task<ActionResult<ApiResponse<CompleteStepResultDto>>> CompleteStep(
        [FromBody] CompleteRoadmapStepCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Roadmap step completed successfully.");
    }
}
