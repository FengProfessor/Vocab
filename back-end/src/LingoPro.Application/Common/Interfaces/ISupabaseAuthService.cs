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

    /// <summary>
    /// Builds the Supabase Google authorization URL for the PKCE flow using the caller-supplied S256 code challenge.
    /// </summary>
    Task<string> GetGoogleOAuthUrlAsync(string redirectUri, string codeChallenge, CancellationToken ct = default);

    /// <summary>
    /// Exchanges the PKCE authorization code for a Supabase session using the caller-held code verifier.
    /// Rejects sessions whose email is not confirmed.
    /// </summary>
    Task<SupabaseAuthResult> ExchangeOAuthCodeAsync(string authCode, string codeVerifier, CancellationToken ct = default);
    Task<string> GetGoogleLinkIdentityUrlAsync(string userAccessToken, string redirectUri, CancellationToken ct = default);
    Task UnlinkGoogleIdentityAsync(string userAccessToken, string identityId, CancellationToken ct = default);
    Task RequestPasswordRecoveryAsync(string email, string redirectUri, CancellationToken ct = default);
    Task ResetPasswordAsync(string recoveryAccessToken, string newPassword, CancellationToken ct = default);
}
