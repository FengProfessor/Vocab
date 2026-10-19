using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;

namespace LingoPro.WebApi.Security;

/// <summary>
/// Holds the PKCE verifier and return target between "start Google sign-in" and the callback.
/// The state is encrypted with ASP.NET Data Protection, expires after 10 minutes, is HttpOnly and
/// is deleted on first use — the .NET equivalent of the original server-side auth-flow vault.
/// </summary>
public sealed class OAuthFlowCookieService
{
    public const string CookieName = "lp_oauth_flow";
    private static readonly TimeSpan FlowLifetime = TimeSpan.FromMinutes(10);

    private readonly ITimeLimitedDataProtector _protector;

    public OAuthFlowCookieService(IDataProtectionProvider dataProtectionProvider)
    {
        _protector = dataProtectionProvider
            .CreateProtector("LingoPro.OAuthFlow.v1")
            .ToTimeLimitedDataProtector();
    }

    /// <summary>
    /// Starts a flow: stores a fresh random verifier in the cookie and returns the S256 challenge for Supabase.
    /// </summary>
    public string Begin(HttpResponse response, bool isHttps, string returnUrl, string role)
    {
        var verifier = PkceGenerator.CreateVerifier();
        var payload = JsonSerializer.Serialize(new OAuthFlowState(verifier, returnUrl, role));

        response.Cookies.Append(CookieName, _protector.Protect(payload, FlowLifetime), new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            MaxAge = FlowLifetime,
            Path = "/"
        });

        return PkceGenerator.ComputeChallenge(verifier);
    }

    /// <summary>
    /// Reads and deletes the flow cookie. Returns null if absent, expired, or tampered with.
    /// </summary>
    public OAuthFlowState? Consume(HttpRequest request, HttpResponse response)
    {
        response.Cookies.Delete(CookieName, new CookieOptions { Path = "/" });

        if (!request.Cookies.TryGetValue(CookieName, out var protectedValue) ||
            string.IsNullOrWhiteSpace(protectedValue))
        {
            return null;
        }

        try
        {
            var json = _protector.Unprotect(protectedValue);
            var state = JsonSerializer.Deserialize<OAuthFlowState>(json);
            return state is not null && !string.IsNullOrWhiteSpace(state.Verifier) ? state : null;
        }
        catch (Exception ex) when (ex is CryptographicException or JsonException)
        {
            return null;
        }
    }
}
