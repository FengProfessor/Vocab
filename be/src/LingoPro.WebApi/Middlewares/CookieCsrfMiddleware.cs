using LingoPro.Application.Common.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace LingoPro.WebApi.Middlewares;

/// <summary>
/// CSRF defence for cookie-authenticated browser calls — port of the original <c>assertAppRequest</c>.
/// Every state-changing <c>/api/*</c> request without an Authorization header must carry the
/// <c>X-LingoPro-Request: 1</c> header, a trusted <c>Origin</c> (when sent) and a non-cross-site <c>Sec-Fetch-Site</c>.
/// </summary>
public sealed class CookieCsrfMiddleware
{
    public const string RequestHeaderName = "X-LingoPro-Request";

    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Get, HttpMethods.Head, HttpMethods.Options, HttpMethods.Trace
    };

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

    private static bool RequiresProtection(HttpRequest request) =>
        request.Path.StartsWithSegments("/api") &&
        !SafeMethods.Contains(request.Method) &&
        !request.Headers.ContainsKey("Authorization");

    private bool IsTrusted(HttpRequest request)
    {
        if (request.Headers[RequestHeaderName] != "1")
        {
            return false;
        }

        var site = request.Headers["Sec-Fetch-Site"].ToString();
        if (!string.IsNullOrEmpty(site) && site is not ("same-origin" or "same-site" or "none"))
        {
            return false;
        }

        var origin = request.Headers.Origin.ToString();
        if (string.IsNullOrEmpty(origin))
        {
            return true;
        }

        var selfOrigin = $"{request.Scheme}://{request.Host}";
        return string.Equals(origin.TrimEnd('/'), selfOrigin, StringComparison.OrdinalIgnoreCase) ||
               _trustedOrigins.Contains(origin.TrimEnd('/'));
    }
}
