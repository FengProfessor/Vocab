using LingoPro.Application.Features.Seo;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Server-side rendered (SSR) controller for the public home and SEO landing page.
/// Delivers complete HTML, OpenGraph metadata, and JSON-LD structured data on initial response for search engines.
/// </summary>
[AllowAnonymous]
public sealed class HomeSeoController : Controller
{
    private readonly ISender _mediator;

    public HomeSeoController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("/")]
    [HttpGet("/landing")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var response = await _mediator.Send(new GetLandingPageSeoDataQuery(), ct);
        return View("~/Views/Home/Index.cshtml", response.Data);
    }

    [HttpGet("/for-teacher")]
    [HttpGet("/for-teachers")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public IActionResult ForTeachers()
    {
        return View("~/Views/Home/ForTeachers.cshtml");
    }

    /// <summary>
    /// Server-rendered IPA pronunciation masterclass (44 phonemes) — port of src/app/ipa/page.tsx.
    /// </summary>
    [HttpGet("/ipa")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public IActionResult Ipa()
    {
        return View("~/Views/Home/Ipa.cshtml");
    }

    /// <summary>
    /// Server-rendered TOEIC Listening lead-magnet landing page — port of src/app/sat-thu-toeic-listening/page.tsx.
    /// </summary>
    [HttpGet("/sat-thu-toeic-listening")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public IActionResult SatThuToeicListening()
    {
        return View("~/Views/Home/SatThuToeicListening.cshtml");
    }

    [HttpPost("/api/pilot/leads")]
    public IActionResult SubmitPilotLead([FromBody] PilotLeadSubmissionRequest? request)
    {
        if (!string.IsNullOrWhiteSpace(request?.Website))
        {
            return Ok(new { success = true });
        }

        var contact = !string.IsNullOrWhiteSpace(request?.ContactName) ? request.ContactName : request?.Name;
        if (string.IsNullOrWhiteSpace(contact) || string.IsNullOrWhiteSpace(request?.Phone))
        {
            return BadRequest(new { success = false, error = "Thông tin chưa hợp lệ." });
        }

        return StatusCode(201, new { success = true, id = Guid.NewGuid() });
    }
}

public sealed record PilotLeadSubmissionRequest(
    string? ContactName,
    string? Name,
    string? Email,
    string? Phone,
    string? Organization,
    int? TeacherCount,
    int? StudentCount,
    string? Message,
    string? Source,
    string? Website);


