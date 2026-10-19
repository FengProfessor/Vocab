using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Identity snapshot extracted from a validated LingoPro refresh token.
/// </summary>
public record RefreshTokenClaims(
    Guid UserId,
    string Email,
    UserRole Role,
    SubscriptionPlanType Plan);
