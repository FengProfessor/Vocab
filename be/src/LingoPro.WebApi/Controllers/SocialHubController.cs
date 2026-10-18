using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Social;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for the referral hub and collaborative study groups.
/// </summary>
[Route("api/v1/social")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class SocialHubController : ApiControllerBase
{
    [HttpGet("referrals/hub")]
    public async Task<ActionResult<ApiResponse<ReferralHubDto>>> GetReferralHub(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetReferralHubQuery(), ct);
        return OkResponse(result, "Referral hub statistics retrieved successfully.");
    }

    [HttpPost("referrals/claim")]
    public async Task<ActionResult<ApiResponse<ClaimReferralResultDto>>> ClaimReferral(
        [FromBody] ClaimReferralCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Referral claim processed successfully.");
    }

    [HttpPost("groups/join")]
    public async Task<ActionResult<ApiResponse<StudyGroupDto>>> JoinStudyGroup(
        [FromBody] JoinStudyGroupCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Joined study group successfully.");
    }
}
