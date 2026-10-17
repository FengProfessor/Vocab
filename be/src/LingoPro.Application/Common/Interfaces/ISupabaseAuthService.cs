namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Server-to-server BFF gateway interface for Supabase Auth operations.
/// </summary>
public interface ISupabaseAuthService
{
    Task<SupabaseAuthResult> SignInWithPasswordAsync(string email, string password, CancellationToken ct = default);
    Task<SupabaseAuthResult> SignUpWithPasswordAsync(string email, string password, string fullName, CancellationToken ct = default);
    Task<SupabaseAuthResult> RefreshSessionAsync(string refreshToken, CancellationToken ct = default);
    Task SignOutAsync(string accessToken, CancellationToken ct = default);
    Task<string> GetGoogleOAuthUrlAsync(string redirectUri, CancellationToken ct = default);
    Task<SupabaseAuthResult> ExchangeOAuthCodeAsync(string authCode, CancellationToken ct = default);
    Task<string> GetGoogleLinkIdentityUrlAsync(string userAccessToken, string redirectUri, CancellationToken ct = default);
    Task UnlinkGoogleIdentityAsync(string userAccessToken, string identityId, CancellationToken ct = default);
    Task RequestPasswordRecoveryAsync(string email, string redirectUri, CancellationToken ct = default);
    Task ResetPasswordAsync(string recoveryAccessToken, string newPassword, CancellationToken ct = default);
}
