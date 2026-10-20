using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Dictionary.Commands;
using LingoPro.Application.Features.Dictionary.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for smart contextual dictionary lookup (cached via L1+L2 pipeline) and OCR word extraction.
/// </summary>
[Route("api/v1/dictionary")]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class DictionaryController : ApiControllerBase
{
    [HttpGet("lookup")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DictionaryEntryDto>>> SmartLookup(
        [FromQuery] string term,
        [FromQuery] string? context = null,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new SmartLookupQuery(term, context), ct);
        return OkResponse(result, "Dictionary lookup completed successfully.");
    }

    [HttpPost("ocr/extract")]
    [Authorize]
    [EnableRateLimiting(RateLimitingExtensions.ExpensiveAiPolicy)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<string>>>> ExtractOcrWords(
        [FromBody] ExtractOcrWordsCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Vocabulary terms extracted from image successfully.");
    }
}
