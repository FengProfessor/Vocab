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
/// classroom word CRUD/moderation, curated vocabulary pack imports, and L1-L6 learning analytics aggregations.
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

    [HttpPost("words")]
    public async Task<ActionResult<ApiResponse<SaveClassroomWordResultDto>>> SaveWord(
        [FromBody] SaveClassroomWordCommand command,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result);
    }

    [HttpPut("words/{wordId:guid}")]
    public async Task<ActionResult<ApiResponse<VocabWordItemDto>>> UpdateWord(
        [FromRoute] Guid wordId,
        [FromBody] UpdateVocabWordCommand command,
        CancellationToken ct = default)
    {
        var effectiveCommand = command with { WordId = wordId };
        var result = await Mediator.Send(effectiveCommand, ct);
        return OkResponse(result);
    }

    [HttpDelete("words/{wordId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteWord(
        [FromRoute] Guid wordId,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new DeleteVocabWordCommand(wordId), ct);
        return OkResponse(result);
    }

    [HttpPatch("words/{wordId:guid}/status")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateWordStatus(
        [FromRoute] Guid wordId,
        [FromBody] UpdateVocabWordStatusCommand command,
        CancellationToken ct = default)
    {
        var effectiveCommand = command with { WordId = wordId };
        var result = await Mediator.Send(effectiveCommand, ct);
        return OkResponse(result);
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
        [FromQuery] string? filter = null,
        [FromQuery] string? q = null,
        [FromQuery] string? sort = null,
        [FromQuery] string? ids = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(
            new GetVocabAnalyticsQuery(classroomId, limit, offset, filter, q, sort, ids),
            ct);
        return OkResponse(result, "Vocabulary FSRS L1-L6 breakdown and learning analytics retrieved successfully.");
    }

    [HttpGet("packs")]
    [HttpGet("packs/progress")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserVocabPackDto>>>> GetUserPacks(
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetUserVocabPacksQuery(), ct);
        return OkResponse(result, "User vocabulary packs retrieved successfully.");
    }

    [HttpPost("packs/import")]
    public async Task<ActionResult<ApiResponse<ImportVocabPackResultDto>>> ImportPack(
        [FromBody] ImportVocabPackCommand command,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Vocabulary pack imported into personal classroom successfully.");
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
