using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Exceptions;
using Microsoft.Extensions.Configuration;

namespace LingoPro.Infrastructure.Services;

/// <summary>
/// Server-to-Server BFF Gateway for Supabase Auth (GoTrue).
/// Frontend never communicates directly with Supabase Auth; all requests pass through this service.
/// </summary>
public class SupabaseAuthService(HttpClient httpClient, IConfiguration configuration) : ISupabaseAuthService
{
    private string SupabaseUrl => (configuration["Supabase:Url"] ?? "https://your-project.supabase.co").TrimEnd('/');
    private string AnonKey => configuration["Supabase:AnonKey"] ?? string.Empty;
    private string ServiceRoleKey => configuration["Supabase:ServiceRoleKey"] ?? string.Empty;

    public async Task<SupabaseAuthResult> SignInWithPasswordAsync(string email, string password, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/token?grant_type=password");
        req.Headers.Add("apikey", AnonKey);
        req.Content = JsonContent.Create(new { email, password });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAccessException("Invalid email or password credentials.");
        }

        return await ParseAuthResponseAsync(response, ct);
    }

    public async Task<SupabaseAuthResult> SignUpWithPasswordAsync(string email, string password, string fullName, CancellationToken ct = default)
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
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Unable to register account with the provided email.", "REGISTRATION_FAILED");
        }

        return await ParseAuthResponseAsync(response, ct);
    }

    public async Task<SupabaseAuthResult> RefreshSessionAsync(string refreshToken, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/token?grant_type=refresh_token");
        req.Headers.Add("apikey", AnonKey);
        req.Content = JsonContent.Create(new { refresh_token = refreshToken });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAccessException("Refresh token is expired or invalid.");
        }

        return await ParseAuthResponseAsync(response, ct);
    }

    public async Task SignOutAsync(string accessToken, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/logout");
        req.Headers.Add("apikey", AnonKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        await httpClient.SendAsync(req, ct);
    }

    public Task<string> GetGoogleOAuthUrlAsync(string redirectUri, CancellationToken ct = default)
    {
        string encodedRedirect = Uri.EscapeDataString(redirectUri);
        string url = $"{SupabaseUrl}/auth/v1/authorize?provider=google&redirect_to={encodedRedirect}&access_type=offline&prompt=consent";
        return Task.FromResult(url);
    }

    public async Task<SupabaseAuthResult> ExchangeOAuthCodeAsync(string authCode, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, $"{SupabaseUrl}/auth/v1/token?grant_type=pkce");
        req.Headers.Add("apikey", AnonKey);
        req.Content = JsonContent.Create(new { auth_code = authCode });

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAccessException("Failed to exchange Google OAuth authorization code.");
        }

        return await ParseAuthResponseAsync(response, ct);
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

    private static async Task<SupabaseAuthResult> ParseAuthResponseAsync(HttpResponseMessage response, CancellationToken ct)
    {
        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        var root = doc.RootElement;

        string accessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() ?? string.Empty : string.Empty;
        string refreshToken = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() ?? string.Empty : string.Empty;
        int expiresIn = root.TryGetProperty("expires_in", out var ei) ? ei.GetInt32() : 3600;

        var userElement = root.TryGetProperty("user", out var u) ? u : root;
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
