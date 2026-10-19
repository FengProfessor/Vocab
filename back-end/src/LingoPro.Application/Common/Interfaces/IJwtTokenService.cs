using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Issues and validates LingoPro JWT tokens (15-minute Access Token and 30-day Refresh Token).
/// </summary>
public interface IJwtTokenService
{
    JwtTokenPairDto GenerateTokenPair(Profile profile);

    /// <summary>
    /// Validates a signed refresh token (signature, issuer, audience, lifetime and token use).
    /// Returns null when the token is missing, tampered with, expired, or is not a refresh token.
    /// </summary>
    RefreshTokenClaims? ValidateRefreshToken(string? refreshToken);
}
