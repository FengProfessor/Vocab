using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// The sign-in and sign-up UI lives in the React SPA. These routes only exist so that links from the
/// server-rendered marketing pages (<c>/auth?mode=signup&amp;role=teacher</c>) and legacy bookmarks keep
/// working: every request is redirected to the matching SPA page with its query string preserved.
/// Credentials are never handled here; the SPA calls the JSON API (<c>/api/v1/auth/*</c>) instead.
/// </summary>
[AllowAnonymous]
[Route("auth")]
public sealed class AuthRedirectController : Controller
{
    private readonly IConfiguration _configuration;

    public AuthRedirectController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private string FrontendBaseUrl =>
        (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');

    [HttpGet("")]
    [HttpGet("login")]
    public IActionResult Login() => Redirect($"{FrontendBaseUrl}/auth/login{Request.QueryString}");

    [HttpGet("register")]
    public IActionResult Register() => Redirect($"{FrontendBaseUrl}/auth/register{Request.QueryString}");

    /// <summary>
    /// OAuth providers may still return to the server origin if it is the registered redirect URL;
    /// forward the authorization code to the SPA, which holds the PKCE verifier.
    /// </summary>
    [HttpGet("callback")]
    public IActionResult Callback() => Redirect($"{FrontendBaseUrl}/auth/callback{Request.QueryString}");
}
