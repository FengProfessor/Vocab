namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Represents an issued JWT Access Token (15 minutes) and Refresh Token (30 days) pair.
/// </summary>
public record JwtTokenPairDto(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc
);
