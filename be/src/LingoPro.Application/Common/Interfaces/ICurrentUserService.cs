using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Provides access to the authenticated user's identity, role, and subscription plan claims.
/// </summary>
public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    UserRole Role { get; }
    SubscriptionPlanType Plan { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    bool IsTeacher { get; }
    bool IsPro { get; }
}
