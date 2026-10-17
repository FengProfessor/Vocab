using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.AiCoaching;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for AI speaking dialogue feedback, syntactic sentence analysis, and audio recording uploads.
/// </summary>
[Route("api/v1/ai-coaching")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.ExpensiveAiPolicy)]
public sealed class AiCoachingController : ApiControllerBase
{
    [HttpPost("speaking/dialogue")]
    public async Task<ActionResult<ApiResponse<AiSpeakingFeedbackDto>>> EvaluateSpeakingDialogue(
        [FromBody] EvaluateSpeakingDialogueCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Speaking dialogue evaluated successfully.");
    }

    [HttpPost("sentence/analyze")]
    public async Task<ActionResult<ApiResponse<AiSentenceAnalysisDto>>> AnalyzeSentence(
        [FromBody] AnalyzeSentenceCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Sentence syntactic structure analyzed successfully.");
    }

    [HttpPost("speaking/upload-audio")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<AudioUploadResultDto>>> UploadSpeakingAudio(
        IFormFile file,
        [FromForm] double durationSeconds = 0,
        CancellationToken ct = default)
    {
        await using var stream = file.OpenReadStream();
        var command = new UploadSpeakingAudioCommand(
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            durationSeconds
        );
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result, "Speaking audio recording uploaded successfully.");
    }
}
