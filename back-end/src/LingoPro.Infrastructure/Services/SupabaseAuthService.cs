using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Exceptions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LingoPro.Infrastructure.Services;

/// <summary>
/// Server-to-Server BFF Gateway for Supabase Auth (GoTrue).
/// Frontend never communicates directly with Supabase Auth; all requests pass through this service.
/// </summary>
public class SupabaseAuthService(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<SupabaseAuthService> logger) : ISupabaseAuthService
{
    private const string DefaultSupabaseUrl = "https://jyhdxhqkftirncbstfpe.supabase.co";
    private const string DefaultAnonKey = "sb_publishable_cNsBhEJMkhMDa_2k5MHJCw_I68kPEEf";

    /// <summary>
    /// Local development convenience only (Auth:AllowOfflineDevSession). When false, a Supabase rejection
    /// or outage is never converted into a synthetic session.
    /// </summary>
    private bool AllowOfflineDevSession => configuration.GetValue<bool>("Auth:AllowOfflineDevSession");

    private string SupabaseUrl
    {
        get
        {
            var raw = configuration["Supabase:Url"]?.Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(raw) ||
                raw.Contains("your-project", StringComparison.OrdinalIgnoreCase))
            {
                return DefaultSupabaseUrl;
            }
            return raw;
        }
    }

    private string AnonKey
    {
        get
        {
            var raw = configuration["Supabase:AnonKey"]?.Trim();
            if (string.IsNullOrWhiteSpace(raw) ||
                raw.Contains("your-supabase-anon-key", StringComparison.OrdinalIgnoreCase))
            {
                return DefaultAnonKey;
            }
            return raw;
        }
    }

    private string ServiceRoleKey => configuration["Supabase:ServiceRoleKey"] ?? string.Empty;

    public async Task<SupabaseAuthResult> SignInWithPasswordAsync(string email, string password, CancellationToken ct = default)
    {
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/token?grant_type=password");
            req.Headers.Add("apikey", AnonKey);
            req.Content = JsonContent.Create(new { email, password });

            var response = await httpClient.SendAsync(req, ct);
            if (response.IsSuccessStatusCode)
            {
                return await ParseAuthResponseAsync(response, ct);
            }
        }
        catch
        {
            // Fall through to local development verification if network is offline
        }

        if (AllowOfflineDevSession && !string.IsNullOrWhiteSpace(email) && email.Contains('@') && !string.IsNullOrWhiteSpace(password) && password.Length >= 6)
        {
            return CreateDeterministicDevSession(email, null);
        }

        throw new UnauthorizedAccessException("Invalid email or password credentials.");
    }

    public async Task<SupabaseAuthResult> SignUpWithPasswordAsync(string email, string password, string fullName, CancellationToken ct = default)
    {
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/signup");
            req.Headers.Add("apikey", AnonKey);
            req.Content = JsonContent.Create(new
            {
                email,
                password,
                data = new { full_name = fullName }
            });

            var response = await httpClient.SendAsync(req, ct);
            if (response.IsSuccessStatusCode)
            {
                return await ParseAuthResponseAsync(response, ct);
            }
        }
        catch
        {
            // Fall through to deterministic dev session if offline
        }

        if (AllowOfflineDevSession && !string.IsNullOrWhiteSpace(email) && email.Contains('@') && !string.IsNullOrWhiteSpace(password) && password.Length >= 6)
        {
            return CreateDeterministicDevSession(email, fullName);
        }

        throw new DomainException("Unable to register account with the provided email.", "REGISTRATION_FAILED");
    }

    public async Task<SupabaseAuthResult> RefreshSessionAsync(string refreshToken, CancellationToken ct = default)
    {
        try
        {
            var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/token?grant_type=refresh_token");
            req.Headers.Add("apikey", AnonKey);
            req.Content = JsonContent.Create(new { refresh_token = refreshToken });

            var response = await httpClient.SendAsync(req, ct);
            if (response.IsSuccessStatusCode)
            {
                return await ParseAuthResponseAsync(response, ct);
            }
        }
        catch
        {
            // Fall through to local token check
        }

        if (AllowOfflineDevSession && !string.IsNullOrWhiteSpace(refreshToken))
        {
            return CreateDeterministicDevSession("hocvien@lingopro.vn", "Nguyễn Minh Anh");
        }

        throw new UnauthorizedAccessException("Refresh token is expired or invalid.");
    }

    private static SupabaseAuthResult CreateDeterministicDevSession(string email, string? fullName)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes($"lingopro-user:{normalizedEmail}"));
        var deterministicGuid = new Guid(hashBytes.AsSpan(0, 16));
        var resolvedName = !string.IsNullOrWhiteSpace(fullName)
            ? fullName.Trim()
            : normalizedEmail.Split('@')[0];

        return new SupabaseAuthResult(
            deterministicGuid,
            normalizedEmail,
            resolvedName,
            null,
            $"sb_access_{Convert.ToHexString(hashBytes, 0, 8)}",
            $"sb_refresh_{Convert.ToHexString(hashBytes, 8, 8)}",
            3600);
    }

    public async Task SignOutAsync(string accessToken, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/logout");
        req.Headers.Add("apikey", AnonKey);
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
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/token?grant_type=pkce");
        req.Headers.Add("apikey", AnonKey);
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
        var req = new HttpRequestMessage(HttpMethod.Get, $"{SupabaseUrl}/auth/v1/user/identities/authorize?provider=google&redirect_to={encodedRedirect}");
        req.Headers.Add("apikey", AnonKey);
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
        var req = new HttpRequestMessage(HttpMethod.Delete, $"{SupabaseUrl}/auth/v1/user/identities/{identityId}");
        req.Headers.Add("apikey", AnonKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userAccessToken);

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Unable to unlink Google account identity. Ensure another sign-in method exists.", "IDENTITY_UNLINK_FAILED");
        }
    }

    public async Task RequestPasswordRecoveryAsync(string email, string redirectUri, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/recover?redirect_to={Uri.EscapeDataString(redirectUri)}");
        req.Headers.Add("apikey", AnonKey);
        req.Content = JsonContent.Create(new { email });

        await httpClient.SendAsync(req, ct);
    }

    public async Task ResetPasswordAsync(string recoveryAccessToken, string newPassword, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Put, $"{SupabaseUrl}/auth/v1/user");
        req.Headers.Add("apikey", AnonKey);
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
        bool requireConfirmedEmail = false)
    {
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var root = doc.RootElement;

        string accessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() ?? string.Empty : string.Empty;
        string refreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() ?? string.Empty : string.Empty;
        int expiresIn = root.TryGetProperty("expires_in", out var ei) ? ei.GetInt32() : 3600;

        var userElement = root.TryGetProperty("user", out var u) ? u : root;

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
