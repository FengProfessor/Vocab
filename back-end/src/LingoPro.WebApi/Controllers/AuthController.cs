using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Auth.Commands;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for authentication, token refresh, Google OAuth, and user profile management.
/// </summary>
[Route("api/v1/auth")]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class AuthController : ApiControllerBase
{
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
        var refreshToken = !string.IsNullOrWhiteSpace(command?.RefreshToken)
            ? command.RefreshToken
            : Request.Cookies[AuthenticationExtensions.RefreshTokenCookieName] ?? string.Empty;

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
        Response.Cookies.Delete(AuthenticationExtensions.AccessTokenCookieName, new CookieOptions { Path = "/" });
        Response.Cookies.Delete(AuthenticationExtensions.RefreshTokenCookieName, new CookieOptions { Path = "/" });
        return OkResponse(result, "Logged out successfully.");
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

    private string ExtractBearerToken()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHeader["Bearer ".Length..].Trim();
        }
        return Request.Cookies[AuthenticationExtensions.AccessTokenCookieName] ?? string.Empty;
    }

    private void AppendAuthCookies(AuthTokensDto authTokens)
    {
        // Supabase issues no session until the email is confirmed (registration), so there is nothing to store.
        if (string.IsNullOrWhiteSpace(authTokens.AccessToken) || string.IsNullOrWhiteSpace(authTokens.RefreshToken))
        {
            return;
        }

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
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = authTokens.RefreshTokenExpiresAtUtc,
                Path = "/"
            });
    }
}
