using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Exams;
using LingoPro.Application.Features.Toeic;
using LingoPro.Domain.Algorithms;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for TOEIC, VSTEP, and IELTS writing exam submissions and scoring.
/// </summary>
[Route("api/v1/exams")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.ExamAntiScrapePolicy)]
public sealed class ExamsController : ApiControllerBase
{
    [HttpPost("toeic/submit")]
    public async Task<ActionResult<ApiResponse<ToeicSubmissionResponseDto>>> SubmitToeicExam(
        [FromBody] SubmitToeicExamCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "TOEIC exam scored and saved successfully.");
    }

    [HttpPost("vstep/submit")]
    public async Task<ActionResult<ApiResponse<VstepScoreResult>>> SubmitVstepExam(
        [FromBody] SubmitVstepExamCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "VSTEP exam scored and saved successfully.");
    }

    [HttpPost("writing/evaluate")]
    [EnableRateLimiting(RateLimitingExtensions.ExpensiveAiPolicy)]
    public async Task<ActionResult<ApiResponse<AiWritingEvaluationDto>>> EvaluateWritingEssay(
        [FromBody] EvaluateWritingEssayCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Writing essay evaluated successfully.");
    }
}
