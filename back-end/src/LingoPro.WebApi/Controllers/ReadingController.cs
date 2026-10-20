using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Reading.Commands;
using LingoPro.Application.Features.Reading.Queries;
using LingoPro.Domain.Enums;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for daily reading comprehension and published reading articles catalog.
/// </summary>
[Route("api/v1/reading")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class ReadingController : ApiControllerBase
{
    [HttpGet("articles")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ReadingArticleDto>>>> GetArticles(
        [FromQuery] CertLevel? cefrLevel = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetReadingArticlesQuery(cefrLevel), ct);
        return OkResponse(result, "Reading articles retrieved successfully.");
    }

    [HttpGet("daily")]
    public async Task<ActionResult<ApiResponse<DailyReadingDto>>> GetDailyReading(
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new GetDailyReadingQuery(), ct);
        return OkResponse(result, "Daily reading article retrieved successfully.");
    }

    [HttpPost("daily/submit")]
    public async Task<ActionResult<ApiResponse<int>>> SubmitDailyReading(
        [FromBody] SubmitDailyReadingCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Daily reading progress recorded successfully.");
    }
}
