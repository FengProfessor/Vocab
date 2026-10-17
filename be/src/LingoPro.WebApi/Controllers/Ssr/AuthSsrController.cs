using LingoPro.Application.Features.Auth;
using LingoPro.WebApi.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LingoPro.WebApi.Controllers.Ssr;

/// <summary>
/// Server-side rendered (SSR) authentication controller.
/// Renders the login page directly from the server, processes credentials server-side,
/// issues a 15-minute Access Token and 30-day Refresh Token in HttpOnly cookies,
/// and redirects authenticated users to the React SPA (<c>/app/journey</c>).
/// </summary>
[AllowAnonymous]
[Route("auth")]
public sealed class AuthSsrController : Controller
{
    private readonly ISender _mediator;

    public AuthSsrController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("login")]
    public IActionResult Login([FromQuery] string? returnUrl = "/app/journey")
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            return Redirect(SanitizeReturnUrl(returnUrl));
        }

        ViewData["ReturnUrl"] = SanitizeReturnUrl(returnUrl);
        return View("~/Views/Auth/Login.cshtml");
    }

    [HttpPost("login")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> LoginSubmit(
        [FromForm] ServerLoginFormRequest form,
        CancellationToken ct)
    {
        var safeReturnUrl = SanitizeReturnUrl(form.ReturnUrl);
        ViewData["ReturnUrl"] = safeReturnUrl;

        try
        {
            var response = await _mediator.Send(new LoginCommand(form.Email, form.Password), ct);
            var authTokens = response.Data
                ?? throw new UnauthorizedAccessException(response.Message);

            // Set 15-minute Access Token HttpOnly Cookie
            Response.Cookies.Append(
                AuthenticationExtensions.AccessTokenCookieName,
                authTokens.AccessToken,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = authTokens.AccessTokenExpiresAtUtc,
                    Path = "/"
                });

            // Set 30-day Refresh Token HttpOnly Cookie
            Response.Cookies.Append(
                AuthenticationExtensions.RefreshTokenCookieName,
                authTokens.RefreshToken,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = authTokens.RefreshTokenExpiresAtUtc,
                    Path = "/"
                });

            return Redirect(safeReturnUrl);
        }
        catch (Exception ex)
        {
            ViewData["ErrorMessage"] = ex.Message;
            ViewData["Email"] = form.Email;
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            return View("~/Views/Auth/Login.cshtml");
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(AuthenticationExtensions.AccessTokenCookieName, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(AuthenticationExtensions.RefreshTokenCookieName, new CookieOptions { Path = "/" });
        return Redirect("/auth/login");
    }

    private static string SanitizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) || !returnUrl.StartsWith('/') || returnUrl.StartsWith("//"))
        {
            return "/app/journey";
        }
        return returnUrl;
    }
}
