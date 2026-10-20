using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Auth.Queries;

/// <summary>
/// Represents a user's profile and gamification summary.
/// </summary>
public record ProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string? AvatarUrl,
    UserRole Role,
    SubscriptionPlanType Plan,
    DateTime? PlanExpiresAt,
    int TotalXp,
    int CurrentStreak,
    int LongestStreak,
    string? LearningGoal,
    int DailyTargetMins,
    bool OnboardingCompleted
);
