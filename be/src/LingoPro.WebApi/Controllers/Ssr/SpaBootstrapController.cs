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
public sealed class SpaBootstrapController : Controller
{
    private readonly ISender _mediator;

    public SpaBootstrapController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("/app")]
    [HttpGet("/app/{**slug}")]
    [HttpGet("/teacher")]
    [HttpGet("/teacher/{**slug}")]
    [HttpGet("/student")]
    [HttpGet("/student/{**slug}")]
    public async Task<IActionResult> BootstrapSpa(string? slug, CancellationToken ct)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            var returnUrl = Request.Path.Value ?? $"/app/{slug ?? "journey"}";
            return Redirect($"/auth/login?returnUrl={Uri.EscapeDataString(returnUrl)}");
        }

        // When running locally on port 5000 alongside the Vite React 19 dev server (port 5173),
        // redirect the authenticated browser session directly to the React SPA.
        if (Request.Host.Port == 5000 &&
            string.Equals(Request.Host.Host, "localhost", StringComparison.OrdinalIgnoreCase))
        {
            var targetPath = Request.Path.Value ?? "/app";
            if (string.Equals(targetPath, "/app/journey", StringComparison.OrdinalIgnoreCase))
            {
                targetPath = "/app";
            }
            return Redirect($"http://localhost:5173{targetPath}{Request.QueryString}");
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
                    window.__INITIAL_AUTH_STATE__ = {{serializedAuthBootstrap}};
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
