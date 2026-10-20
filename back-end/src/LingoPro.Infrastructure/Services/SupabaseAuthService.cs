using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LingoPro.Infrastructure.Services;

/// <summary>
/// Server-to-Server BFF Gateway for Supabase Auth (GoTrue).
/// Frontend never communicates directly with Supabase Auth; all requests pass through this service
/// using the centralized <see cref="SupabaseOptions"/> configuration validated at startup.
/// </summary>
public class SupabaseAuthService(
    HttpClient httpClient,
    IOptions<SupabaseOptions> supabaseOptions,
    ILogger<SupabaseAuthService> logger) : ISupabaseAuthService
{
    private readonly SupabaseOptions _options = supabaseOptions.Value;

    private string SupabaseUrl => _options.NormalizedUrl;

    private HttpRequestMessage CreateAuthRequest(HttpMethod method, string relativePath)
    {
        var url = $"{SupabaseUrl}/{relativePath.TrimStart('/')}";
        var req = new HttpRequestMessage(method, url);
        req.Headers.Remove("apikey");
        req.Headers.Add("apikey", _options.AnonKey.Trim());

        return req;
    }

    public async Task<SupabaseAuthResult> SignInWithPasswordAsync(string email, string password, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Post, "/auth/v1/token?grant_type=password");
        req.Content = JsonContent.Create(new { email, password });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            await ThrowSupabaseFailureAsync(response, "Password sign-in", ct);
        }

        return await ParseAuthResponseAsync(response, ct);
    }

    public async Task<SupabaseAuthResult> SignUpWithPasswordAsync(string email, string password, string fullName, CancellationToken ct = default)
    {
        // The confirmation email must land back in the React app, not on Supabase's dashboard 'Site URL'.
        // This URL has to be listed in Supabase > Authentication > URL Configuration > Redirect URLs.
        var confirmRedirect = Uri.EscapeDataString($"{_options.NormalizedFrontendBaseUrl}/auth/login?confirmed=1");
        var req = CreateAuthRequest(HttpMethod.Post, $"/auth/v1/signup?redirect_to={confirmRedirect}");
        req.Content = JsonContent.Create(new
        {
            email,
            password,
            data = new { full_name = fullName }
        });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            var reason = await LogSupabaseFailureAsync(response, "Sign-up", ct);
            if (reason is "user_already_exists" or "email_exists")
            {
                throw new ConflictException("An account with this email address already exists.");
            }
            throw new DomainException($"Unable to register account with the provided email ({reason}).", "REGISTRATION_FAILED");
        }

        return await ParseAuthResponseAsync(response, ct, isSignUp: true);
    }

    public async Task<SupabaseAuthResult> RefreshSessionAsync(string refreshToken, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Post, "/auth/v1/token?grant_type=refresh_token");
        req.Content = JsonContent.Create(new { refresh_token = refreshToken });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            await ThrowSupabaseFailureAsync(response, "Token refresh", ct);
        }

        return await ParseAuthResponseAsync(response, ct);
    }

    /// <summary>
    /// Logs Supabase's machine-readable rejection reason (never credentials or tokens) and returns it.
    /// </summary>
    private async Task<string> LogSupabaseFailureAsync(HttpResponseMessage response, string operation, CancellationToken ct)
    {
        var body = await response.Content.ReadAsStringAsync(ct);
        var reason = ExtractErrorReason(body);
        logger.LogWarning("{Operation} rejected by Supabase with HTTP {StatusCode}: {Reason}", operation, (int)response.StatusCode, reason);
        return reason;
    }

    /// <summary>
    /// Maps a failed Supabase call: 4xx means the credentials/token are not acceptable (401 for the client);
    /// 5xx is an upstream outage and surfaces as an HTTP error instead of being disguised as bad credentials.
    /// </summary>
    private async Task ThrowSupabaseFailureAsync(HttpResponseMessage response, string operation, CancellationToken ct)
    {
        var reason = await LogSupabaseFailureAsync(response, operation, ct);
        if ((int)response.StatusCode >= 500)
        {
            throw new HttpRequestException($"Supabase Auth is unavailable ({(int)response.StatusCode}).");
        }

        var message = reason switch
        {
            "email_not_confirmed" => "Email address is not confirmed. Please check your inbox to confirm your email before signing in.",
            "invalid_credentials" => "Invalid email or password credentials.",
            _ => $"Authentication was rejected by Supabase ({reason})."
        };
        throw new UnauthorizedAccessException(message);
    }

    public async Task SignOutAsync(string accessToken, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Post, "/auth/v1/logout");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        await httpClient.SendAsync(req, ct);
    }

    public Task<string> GetGoogleOAuthUrlAsync(string redirectUri, string codeChallenge, CancellationToken ct = default)
    {
        // PKCE (S256): Supabase will return ?code=... on the callback instead of tokens in the URL hash.
        var url = $"{SupabaseUrl}/auth/v1/authorize?provider=google" +
                  $"&redirect_to={Uri.EscapeDataString(redirectUri)}" +
                  $"&code_challenge={Uri.EscapeDataString(codeChallenge)}" +
                  "&code_challenge_method=s256" +
                  "&prompt=select_account";
        return Task.FromResult(url);
    }

    public async Task<SupabaseAuthResult> ExchangeOAuthCodeAsync(string authCode, string codeVerifier, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Post, "/auth/v1/token?grant_type=pkce");
        req.Content = JsonContent.Create(new
        {
            auth_code = authCode,
            code_verifier = codeVerifier
        });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            // Log only Supabase's machine-readable reason (e.g. flow_state_not_found, bad_code_verifier), never tokens.
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogWarning(
                "Supabase PKCE code exchange failed with HTTP {StatusCode}: {Reason}",
                (int)response.StatusCode,
                ExtractErrorReason(body));
            throw new UnauthorizedAccessException("Failed to exchange Google OAuth authorization code.");
        }

        return await ParseAuthResponseAsync(response, ct, requireConfirmedEmail: true);
    }

    private static string ExtractErrorReason(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            foreach (var name in new[] { "error_code", "error", "msg", "message" })
            {
                if (root.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String)
                {
                    return prop.GetString() ?? "unknown";
                }
            }
        }
        catch
        {
            // Non-JSON error body
        }

        return "unknown";
    }

    public async Task<string> GetGoogleLinkIdentityUrlAsync(string userAccessToken, string redirectUri, CancellationToken ct = default)
    {
        string encodedRedirect = Uri.EscapeDataString(redirectUri);
        var req = CreateAuthRequest(HttpMethod.Get, $"/auth/v1/user/identities/authorize?provider=google&redirect_to={encodedRedirect}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userAccessToken);

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Failed to initiate Google account identity linking.", "IDENTITY_LINK_FAILED");
        }

        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        string url = doc.RootElement.TryGetProperty("url", out var urlProp)
            ? urlProp.GetString() ?? string.Empty
            : $"{SupabaseUrl}/auth/v1/user/identities/authorize?provider=google&redirect_to={encodedRedirect}";

        return url;
    }

    public async Task UnlinkGoogleIdentityAsync(string userAccessToken, string identityId, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Delete, $"/auth/v1/user/identities/{identityId}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userAccessToken);

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Unable to unlink Google account identity. Ensure another sign-in method exists.", "IDENTITY_UNLINK_FAILED");
        }
    }

    public async Task RequestPasswordRecoveryAsync(string email, string redirectUri, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Post, $"/auth/v1/recover?redirect_to={Uri.EscapeDataString(redirectUri)}");
        req.Content = JsonContent.Create(new { email });

        await httpClient.SendAsync(req, ct);
    }

    public async Task ResetPasswordAsync(string recoveryAccessToken, string newPassword, CancellationToken ct = default)
    {
        var req = CreateAuthRequest(HttpMethod.Put, "/auth/v1/user");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", recoveryAccessToken);
        req.Content = JsonContent.Create(new { password = newPassword });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Password reset failed. Recovery session may have expired.", "PASSWORD_RESET_FAILED");
        }
    }

    private static async Task<SupabaseAuthResult> ParseAuthResponseAsync(
        HttpResponseMessage response,
        CancellationToken ct,
        bool requireConfirmedEmail = false,
        bool isSignUp = false)
    {
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var root = doc.RootElement;

        string accessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() ?? string.Empty : string.Empty;
        string refreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() ?? string.Empty : string.Empty;
        int expiresIn = root.TryGetProperty("expires_in", out var ei) ? ei.GetInt32() : 3600;

        var userElement = root.TryGetProperty("user", out var u) ? u : root;

        // When email confirmation is enabled, Supabase returns a fake 200 OK with an empty identities array
        // if the email is already registered (to prevent email enumeration). Surface this as 409 Conflict.
        if (isSignUp &&
            userElement.TryGetProperty("identities", out var identities) &&
            identities.ValueKind == JsonValueKind.Array &&
            identities.GetArrayLength() == 0)
        {
            throw new ConflictException("An account with this email address already exists.");
        }

        // Mirrors the original /auth/callback rule: an unconfirmed email can never mint an application session.
        if (requireConfirmedEmail &&
            (!userElement.TryGetProperty("email_confirmed_at", out var confirmedAt) ||
             confirmedAt.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined ||
             string.IsNullOrWhiteSpace(confirmedAt.ToString())))
        {
            throw new UnauthorizedAccessException("Email address is not confirmed.");
        }

        Guid userId = userElement.TryGetProperty("id", out var idProp) && Guid.TryParse(idProp.GetString(), out var parsedId)
            ? parsedId
            : Guid.NewGuid();

        string email = userElement.TryGetProperty("email", out var emProp) ? emProp.GetString() ?? string.Empty : string.Empty;
        string? fullName = null;
        string? avatarUrl = null;

        if (userElement.TryGetProperty("user_metadata", out var meta))
        {
            if (meta.TryGetProperty("full_name", out var fn)) fullName = fn.GetString();
            else if (meta.TryGetProperty("name", out var nm)) fullName = nm.GetString();

            if (meta.TryGetProperty("avatar_url", out var av)) avatarUrl = av.GetString();
            else if (meta.TryGetProperty("picture", out var pic)) avatarUrl = pic.GetString();
        }

        return new SupabaseAuthResult(userId, email, fullName, avatarUrl, accessToken, refreshToken, expiresIn);
    }
}
