using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Gamification.Commands;
using LingoPro.Application.Features.Gamification.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for commitment challenges and participant enrollments.
/// </summary>
[Route("api/v1/challenges")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class ChallengesController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChallengeDto>>>> GetChallenges(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetChallengesQuery(), ct);
        return OkResponse(result, "Commitment challenges retrieved successfully.");
    }

    [HttpPost]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<ChallengeDto>>> CreateChallenge(
        [FromBody] CreateChallengeCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result, "Commitment challenge created successfully.");
    }

    [HttpPost("{challengeId:guid}/join")]
    public async Task<ActionResult<ApiResponse<JoinChallengeResponseDto>>> JoinChallenge(
        [FromRoute] Guid challengeId,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new JoinChallengeCommand(challengeId), ct);
        return OkResponse(result, "Joined commitment challenge successfully.");
    }
}
