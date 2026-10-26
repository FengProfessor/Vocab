using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Auth.Queries;

/// <summary>
/// Maps a <see cref="Profile"/> (plus its optional user_gamification row) to <see cref="ProfileDto"/>.
/// XP/streak come from public.user_gamification. The SQL schema has no columns for LearningGoal or
/// OnboardingCompleted, so the DTO keeps those fields with derived defaults: LearningGoal is null,
/// OnboardingCompleted is always true (no server-side onboarding gate), and DailyTargetMins falls back
/// to the gamification/profile daily goal.
/// </summary>
internal static class ProfileDtoMapper
{
    public static ProfileDto ToDto(Profile profile, UserGamification? gamification) => new(
        profile.Id,
        profile.Email,
        profile.FullName ?? string.Empty,
        profile.AvatarUrl,
        profile.Role,
        profile.Plan ?? SubscriptionPlanType.Free,
        profile.PlanExpiresAt,
        gamification?.TotalXp ?? 0,
        gamification?.CurrentStreak ?? 0,
        gamification?.LongestStreak ?? 0,
        null,
        gamification?.DailyGoal ?? profile.DailyGoal ?? 15,
        true,
        gamification?.TodayXp ?? 0,
        gamification?.TodayDate,
        gamification?.LastActiveDate,
        profile.NotificationHour,
        profile.Province,
        profile.City,
        profile.CreatedAt);
}
