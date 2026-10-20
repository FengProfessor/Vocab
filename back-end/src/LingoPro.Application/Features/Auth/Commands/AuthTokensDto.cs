using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Represents authenticated user profile data and the tokens issued by Supabase Auth.
/// Tokens are empty when Supabase requires email confirmation before a session exists.
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
