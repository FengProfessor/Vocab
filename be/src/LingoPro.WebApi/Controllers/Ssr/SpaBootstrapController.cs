using System.Text.Json;
using LingoPro.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Bootstraps the React Single-Page Application (<c>/app/*</c>) after server-side login completes.
/// Injects the authenticated user's profile and session metadata into <c>window.__LINGOPRO_INITIAL_AUTH__</c>
/// so the React SPA hydrates immediately with 0ms authentication latency.
/// </summary>
[AllowAnonymous]
[Route("app")]
public sealed class SpaBootstrapController : Controller
{
    private readonly ISender _mediator;

    public SpaBootstrapController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{**slug}")]
    public async Task<IActionResult> BootstrapSpa(string? slug, CancellationToken ct)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            var returnUrl = $"/app/{slug ?? "journey"}";
            return Redirect($"/auth/login?returnUrl={Uri.EscapeDataString(returnUrl)}");
        }

        var response = await _mediator.Send(new GetCurrentProfileQuery(), ct);
        var serializedAuthBootstrap = JsonSerializer.Serialize(new
        {
            isAuthenticated = true,
            accessTokenTtlMinutes = 15,
            refreshTokenTtlDays = 30,
            user = response.Data
        });

        var html = $$"""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>LingoPro App — Bảng Điều Khiển Học Tập</title>
                <script>
                    window.__LINGOPRO_INITIAL_AUTH__ = {{serializedAuthBootstrap}};
                </script>
            </head>
            <body>
                <div id="root"></div>
                <script type="module" src="/assets/main.js"></script>
            </body>
            </html>
            """;

        return Content(html, "text/html; charset=utf-8");
    }
}
