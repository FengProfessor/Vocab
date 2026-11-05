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
/// REST API controller for canonical grammar topics catalog, classroom grammar exercises, AI lesson generation, and learner grammar mastery progression.
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

    [HttpGet("exercises")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GrammarExerciseDto>>>> GetClassroomExercises(
        [FromQuery] Guid classroomId,
        [FromQuery] string? topic = null,
        [FromQuery] string? level = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetClassroomGrammarExercisesQuery(classroomId, topic, level), ct);
        return OkResponse(result);
    }

    [HttpPost("exercises/generate")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GrammarExerciseDto>>>> GenerateExercises(
        [FromBody] GenerateGrammarExercisesCommand command,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result);
    }

    [HttpPost("lessons/generate")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<GeneratedGrammarLessonDto>>> GenerateLesson(
        [FromBody] GenerateGrammarLessonCommand command,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result);
    }

    [HttpPost("progress")]
    public async Task<ActionResult<ApiResponse<GrammarProgressDto>>> SubmitGrammarProgress(
        [FromBody] SubmitGrammarProgressCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Grammar topic mastery updated successfully.");
    }

    [HttpDelete("exercises/{exerciseId:guid}")]
    [Authorize(Policy = "RequireTeacher")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteGrammarExercise(
        [FromRoute] Guid exerciseId,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteGrammarExerciseCommand(exerciseId), ct);
        return OkResponse(result, "Grammar exercise deleted successfully.");
    }
}
