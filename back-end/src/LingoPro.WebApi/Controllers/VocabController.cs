using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for FSRS-5 spaced repetition vocabulary review and due cards retrieval.
/// </summary>
[Route("api/v1/vocab")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class VocabController : ApiControllerBase
{
    [HttpGet("due")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WordWithSrsDto>>>> GetDueWords(
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetDueWordsQuery(limit), ct);
        return OkResponse(result, "Due vocabulary cards retrieved successfully.");
    }

    [HttpPost("review")]
    public async Task<ActionResult<ApiResponse<SrsReviewResponseDto>>> SubmitReview(
        [FromBody] SubmitWordReviewCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Vocabulary review recorded and FSRS-5 state updated.");
    }
}
