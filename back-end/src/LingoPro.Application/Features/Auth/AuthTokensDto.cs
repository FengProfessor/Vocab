using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Represents authenticated user profile data and issued JWT tokens (15m Access Token, 30d Refresh Token).
/// </summary>
public record AuthTokensDto(
    Guid UserId,
    string Email,
    string FullName,
    string? AvatarUrl,
    UserRole Role,
    SubscriptionPlanType Plan,
    DateTime? PlanExpiresAt,
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    int ExpiresIn
);
