using LingoPro.Application.Common.Models;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace LingoPro.WebApi.Middlewares;

/// <summary>
/// CSRF defence for cookie-authenticated browser calls — port of the original <c>assertAppRequest</c>.
/// State-changing <c>/api/*</c> requests that rely on session cookies (without an <c>Authorization</c> header)
/// must carry the <c>X-LingoPro-Request: 1</c> header and come from a trusted origin.
/// Public credential endpoints (<c>login</c>, <c>register</c>, <c>callback/google</c>) and requests without
/// auth cookies are exempt because they do not authenticate via ambient browser cookies.
/// </summary>
public sealed class CookieCsrfMiddleware
{
    public const string RequestHeaderName = "X-LingoPro-Request";

    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Get, HttpMethods.Head, HttpMethods.Options, HttpMethods.Trace
    };

    private static readonly PathString[] PublicCredentialPaths =
    [
        new PathString("/api/v1/auth/login"),
        new PathString("/api/v1/auth/register"),
        new PathString("/api/v1/auth/callback/google")
    ];

    private readonly RequestDelegate _next;
    private readonly HashSet<string> _trustedOrigins;

    public CookieCsrfMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;

        var configured = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        _trustedOrigins = new HashSet<string>(configured.Select(o => o.TrimEnd('/')), StringComparer.OrdinalIgnoreCase);

        foreach (var key in new[] { "Frontend:BaseUrl", "Auth:PublicOrigin" })
        {
            var value = configuration[key];
            if (!string.IsNullOrWhiteSpace(value))
            {
                _trustedOrigins.Add(value.TrimEnd('/'));
            }
        }
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (RequiresProtection(context.Request) && !IsTrusted(context.Request))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(
                statusCode: StatusCodes.Status403Forbidden,
                message: "The request failed the cross-site request forgery check.",
                errorCode: "CSRF_REJECTED"));
            return;
        }

        await _next(context);
    }

    private static bool RequiresProtection(HttpRequest request)
    {
        if (!request.Path.StartsWithSegments("/api") || SafeMethods.Contains(request.Method))
        {
            return false;
        }

        // Requests carrying an explicit Bearer token are immune to cookie-based CSRF.
        if (request.Headers.ContainsKey("Authorization"))
        {
            return false;
        }

        // Public credential endpoints authenticate via request body, never via ambient cookies.
        foreach (var publicPath in PublicCredentialPaths)
        {
            if (request.Path.StartsWithSegments(publicPath))
            {
                return false;
            }
        }

        // CSRF is only possible when the browser sends an authentication cookie that the server might trust.
        return HasAuthCookie(request);
    }

    private static bool HasAuthCookie(HttpRequest request) =>
        request.Cookies.ContainsKey(AuthenticationExtensions.AccessTokenCookieName) ||
        request.Cookies.ContainsKey(AuthenticationExtensions.RefreshTokenCookieName);

    private bool IsTrusted(HttpRequest request)
    {
        if (request.Headers[RequestHeaderName] != "1")
        {
            return false;
        }

        var origin = request.Headers.Origin.ToString().TrimEnd('/');
        var selfOrigin = $"{request.Scheme}://{request.Host}";
        if (!string.IsNullOrEmpty(origin) &&
            (string.Equals(origin, selfOrigin, StringComparison.OrdinalIgnoreCase) || _trustedOrigins.Contains(origin)))
        {
            return true;
        }

        var site = request.Headers["Sec-Fetch-Site"].ToString();
        if (!string.IsNullOrEmpty(site) && site is not ("same-origin" or "same-site" or "none"))
        {
            return false;
        }

        return string.IsNullOrEmpty(origin);
    }
}
