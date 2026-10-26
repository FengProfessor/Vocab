using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for FSRS-5 spaced repetition vocabulary review, due cards retrieval,
/// and L1-L6 learning analytics aggregations.
/// </summary>
[Route("api/v1/vocab")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class VocabController : ApiControllerBase
{
    [HttpGet("words/{wordId:guid}")]
    public async Task<ActionResult<ApiResponse<VocabWordDetailDto>>> GetWordById(
        [FromRoute] Guid wordId,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetVocabWordByIdQuery(wordId), ct);
        return OkResponse(result, "Vocabulary word retrieved successfully.");
    }

    [HttpGet("due")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WordWithSrsDto>>>> GetDueWords(
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetDueWordsQuery(limit), ct);
        return OkResponse(result, "Due vocabulary cards retrieved successfully.");
    }

    [HttpGet("analytics")]
    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<VocabAnalyticsDto>>> GetVocabAnalytics(
        [FromQuery] string? classroomId = null,
        [FromQuery] int limit = 500,
        [FromQuery] int offset = 0,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetVocabAnalyticsQuery(classroomId, limit, offset), ct);
        return OkResponse(result, "Vocabulary FSRS L1-L6 breakdown and learning analytics retrieved successfully.");
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
