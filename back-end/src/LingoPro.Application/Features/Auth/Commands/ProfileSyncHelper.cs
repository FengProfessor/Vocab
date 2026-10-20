using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Synchronizes an authenticated Supabase user with the local public.profiles table and personal workspace.
/// </summary>
internal static class ProfileSyncHelper
{
    public static async Task<Profile> EnsureUserProfileAsync(
        IApplicationDbContext dbContext,
        SupabaseAuthResult authResult,
        CancellationToken ct,
        UserRole initialRole = UserRole.Student)
    {
        var effectiveRole = initialRole == UserRole.Teacher ? UserRole.Teacher : UserRole.Student;

        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == authResult.UserId, ct);
        if (profile == null)
        {
            profile = new Profile
            {
                Id = authResult.UserId,
                Email = authResult.Email,
                FullName = !string.IsNullOrWhiteSpace(authResult.FullName)
                    ? authResult.FullName
                    : authResult.Email.Split('@')[0],
                AvatarUrl = authResult.AvatarUrl,
                Role = effectiveRole,
                Plan = SubscriptionPlanType.Free,
                TotalXp = 0,
                CurrentStreak = 0,
                LongestStreak = 0,
                DailyTargetMins = 15,
                OnboardingCompleted = false
            };

            dbContext.Profiles.Add(profile);

            // Provision the personal vocabulary workspace classroom automatically
            var personalClassroom = new ClassroomEntity
            {
                Id = Guid.NewGuid(),
                Name = "__personal__",
                Description = "Personal vocabulary workspace",
                InviteCode = $"PERS-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                TeacherId = profile.Id
            };
            dbContext.Classrooms.Add(personalClassroom);
            await dbContext.SaveChangesAsync(ct);
        }
        else if (string.IsNullOrEmpty(profile.AvatarUrl) && !string.IsNullOrEmpty(authResult.AvatarUrl))
        {
            profile.AvatarUrl = authResult.AvatarUrl;
            await dbContext.SaveChangesAsync(ct);
        }

        return profile;
    }

    /// <summary>
    /// Lifetime of the refresh token cookie. Supabase does not return a refresh token expiry,
    /// so the cookie lifetime is bounded here; Supabase itself remains the authority on validity.
    /// </summary>
    private static readonly TimeSpan RefreshTokenCookieLifetime = TimeSpan.FromDays(30);

    /// <summary>
    /// Maps the profile plus the tokens issued by Supabase Auth. Tokens are passed through untouched.
    /// </summary>
    public static AuthTokensDto MapToAuthTokensDto(Profile profile, SupabaseAuthResult authResult)
    {
        var now = DateTime.UtcNow;
        return new AuthTokensDto(
            profile.Id,
            profile.Email,
            profile.FullName,
            profile.AvatarUrl,
            profile.Role,
            profile.Plan,
            profile.PlanExpiresAt,
            authResult.AccessToken,
            now.AddSeconds(authResult.ExpiresIn),
            authResult.RefreshToken,
            now.Add(RefreshTokenCookieLifetime),
            authResult.ExpiresIn);
    }
}
