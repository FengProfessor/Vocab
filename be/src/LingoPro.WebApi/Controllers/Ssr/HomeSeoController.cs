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
}
