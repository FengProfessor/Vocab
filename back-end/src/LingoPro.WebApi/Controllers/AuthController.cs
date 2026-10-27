using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Auth.Commands;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for authentication, token refresh, Google OAuth, password recovery, and user profile management.
/// </summary>
[Route("api/v1/auth")]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class AuthController : ApiControllerBase
{
    private const string RefreshCookiePath = "/api/v1/auth";

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokensDto>>> Login(
        [FromBody] LoginCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        if (result.Success && result.Data is not null)
        {
            AppendAuthCookies(result.Data);
        }

        return OkResponse(result, "Authentication successful.");
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokensDto>>> Register(
        [FromBody] RegisterCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        if (result.Success && result.Data is not null)
        {
            AppendAuthCookies(result.Data);
        }

        return CreatedResponse(result, "Account registered successfully.");
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokensDto>>> Refresh(
        [FromBody] RefreshTokenCommand? command = null,
        CancellationToken ct = default)
    {
        var cookieRefreshToken = Request.Cookies[AuthenticationExtensions.RefreshTokenCookieName];
        var refreshToken = !string.IsNullOrWhiteSpace(cookieRefreshToken)
            ? cookieRefreshToken
            : command?.RefreshToken ?? string.Empty;

        var result = await Mediator.Send(new RefreshTokenCommand(refreshToken), ct);
        if (result.Success && result.Data is not null)
        {
            AppendAuthCookies(result.Data);
        }

        return OkResponse(result, "Session token refreshed successfully.");
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> Logout(CancellationToken ct)
    {
        var result = await Mediator.Send(new LogoutCommand(ExtractBearerToken()), ct);
        ClearAuthCookies();
        return OkResponse(result, "Logged out successfully.");
    }

    [HttpPost("password/forgot")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingExtensions.ExamAntiScrapePolicy)]
    public async Task<ActionResult<ApiResponse<bool>>> ForgotPassword(
        [FromBody] ForgotPasswordCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "If an account exists for that email address, password recovery instructions have been sent.");
    }

    [HttpPost("password/reset")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingExtensions.ExamAntiScrapePolicy)]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword(
        [FromBody] ResetPasswordCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        ClearAuthCookies();
        return OkResponse(result, "Password has been reset successfully. Please sign in with your new password.");
    }

    [HttpGet("google-url")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OAuthUrlDto>>> GetGoogleOAuthUrl(
        [FromQuery] string redirectUri,
        [FromQuery] string codeChallenge,
        CancellationToken ct)
    {
        var result = await Mediator.Send(new GetGoogleOAuthUrlQuery(redirectUri, codeChallenge), ct);
        return OkResponse(result, "Google OAuth authorization URL generated.");
    }

    [HttpPost("callback/google")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokensDto>>> ExchangeGoogleCode(
        [FromBody] ExchangeGoogleOAuthCodeCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        if (result.Success && result.Data is not null)
        {
            AppendAuthCookies(result.Data);
        }

        return OkResponse(result, "Google OAuth login completed successfully.");
    }

    [HttpPost("identities/link/google")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OAuthUrlDto>>> LinkGoogleAccount(
        [FromBody] LinkGoogleRequest request,
        CancellationToken ct)
    {
        var bearerToken = ExtractBearerToken();
        var result = await Mediator.Send(new LinkGoogleAccountCommand(bearerToken, request.RedirectUri), ct);
        return OkResponse(result, "Google account identity link URL generated.");
    }

    [HttpDelete("identities/google/{identityId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object?>>> UnlinkGoogleAccount(
        [FromRoute] string identityId,
        CancellationToken ct)
    {
        var bearerToken = ExtractBearerToken();
        var result = await Mediator.Send(new UnlinkGoogleAccountCommand(bearerToken, identityId), ct);
        return OkResponse(result, "Google account identity unlinked successfully.");
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ProfileDto>>> GetProfile(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCurrentProfileQuery(), ct);
        return OkResponse(result, "User profile retrieved successfully.");
    }

    [HttpPut("onboarding")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ProfileDto>>> UpdateOnboarding(
        [FromBody] UpdateOnboardingCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Onboarding preferences updated successfully.");
    }

    [HttpPost("role/teacher")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ProfileDto>>> ClaimTeacherRole(CancellationToken ct)
    {
        var result = await Mediator.Send(new ClaimTeacherRoleCommand(), ct);
        return OkResponse(result, "Teacher role claimed successfully.");
    }

    [HttpPost("/api/v1/users/me/onboarding/claim-xp")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> ClaimOnboardingXp(CancellationToken ct)
    {
        var result = await Mediator.Send(new ClaimOnboardingXpCommand(), ct);
        return OkResponse(result);
    }

    [HttpPost("/api/v1/users/me/fcm-token")]
    [HttpPost("/api/v1/notifications/fcm-token")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> RegisterFcmToken(
        [FromBody] RegisterFcmTokenCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result);
    }

    private string ExtractBearerToken()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHeader["Bearer ".Length..].Trim();
        }
        return Request.Cookies[AuthenticationExtensions.AccessTokenCookieName] ?? string.Empty;
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(AuthenticationExtensions.AccessTokenCookieName, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(AuthenticationExtensions.RefreshTokenCookieName, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(AuthenticationExtensions.RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = RefreshCookiePath
        });
    }

    private void AppendAuthCookies(AuthTokensDto authTokens)
    {
        // Supabase issues no session until the email is confirmed (registration), so there is nothing to store.
        if (string.IsNullOrWhiteSpace(authTokens.AccessToken) || string.IsNullOrWhiteSpace(authTokens.RefreshToken))
        {
            return;
        }

        // Remove legacy root-scoped refresh cookie to avoid duplicate cookie headers.
        Response.Cookies.Delete(AuthenticationExtensions.RefreshTokenCookieName, new CookieOptions { Path = "/" });

        Response.Cookies.Append(
            AuthenticationExtensions.AccessTokenCookieName,
            authTokens.AccessToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = authTokens.AccessTokenExpiresAtUtc,
                Path = "/"
            });

        Response.Cookies.Append(
            AuthenticationExtensions.RefreshTokenCookieName,
            authTokens.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = authTokens.RefreshTokenExpiresAtUtc,
                Path = RefreshCookiePath
            });
    }
}
