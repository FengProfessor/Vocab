namespace LingoPro.Infrastructure.Security;

/// <summary>
/// Configuration options for JWT Access Token (15 minutes) and Refresh Token (30 days) issuance.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>
    /// Symmetric HMAC-SHA256 signing key (at least 32 characters).
    /// </summary>
    public string SigningKey { get; set; } = "replace-with-at-least-32-byte-signing-secret-key";

    /// <summary>
    /// Token issuer identifier.
    /// </summary>
    public string Issuer { get; set; } = "https://lingopro.online";

    /// <summary>
    /// Token audience identifier.
    /// </summary>
    public string Audience { get; set; } = "lingopro-web-spa";

    /// <summary>
    /// Access token lifetime in minutes. Strictly configured to 15 minutes.
    /// </summary>
    public int AccessTokenExpirationMinutes { get; set; } = 15;

    /// <summary>
    /// Refresh token lifetime in days. Strictly configured to 30 days.
    /// </summary>
    public int RefreshTokenExpirationDays { get; set; } = 30;
}
