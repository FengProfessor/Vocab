using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Domain.Enums;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for canonical grammar topics catalog and learner grammar mastery progression.
/// </summary>
[Route("api/v1/grammar")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class GrammarController : ApiControllerBase
{
    [HttpGet("topics")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GrammarTopicDto>>>> GetTopics(
        [FromQuery] CertLevel? cefrLevel = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetCanonicalGrammarTopicsQuery(cefrLevel), ct);
        return OkResponse(result, "Canonical grammar topics retrieved successfully.");
    }

    [HttpPost("progress")]
    public async Task<ActionResult<ApiResponse<GrammarProgressDto>>> SubmitGrammarProgress(
        [FromBody] SubmitGrammarProgressCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Grammar topic mastery updated successfully.");
    }
}
