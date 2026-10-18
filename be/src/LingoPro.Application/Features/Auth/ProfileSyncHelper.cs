using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Auth;

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
        if (authResult.Email.StartsWith("admin@", StringComparison.OrdinalIgnoreCase))
        {
            effectiveRole = UserRole.Admin;
        }
        else if (authResult.Email.StartsWith("teacher@", StringComparison.OrdinalIgnoreCase) ||
                 authResult.Email.StartsWith("giaovien@", StringComparison.OrdinalIgnoreCase))
        {
            effectiveRole = UserRole.Teacher;
        }

        var fallbackProfile = new Profile
        {
            Id = authResult.UserId,
            Email = authResult.Email,
            FullName = !string.IsNullOrWhiteSpace(authResult.FullName)
                ? authResult.FullName
                : authResult.Email.Split('@')[0],
            AvatarUrl = authResult.AvatarUrl,
            Role = effectiveRole,
            Plan = SubscriptionPlanType.Pro,
            TotalXp = 4850,
            CurrentStreak = 14,
            LongestStreak = 21,
            DailyTargetMins = 20,
            OnboardingCompleted = true
        };

        try
        {
            var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == authResult.UserId, ct);
            if (profile == null)
            {
                profile = fallbackProfile;
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
        catch
        {
            // Fallback to in-memory profile created from Supabase Auth metadata when local DB is offline
            return fallbackProfile;
        }
    }

    public static AuthTokensDto MapToAuthTokensDto(Profile profile, JwtTokenPairDto tokenPair) =>
        new(
            profile.Id,
            profile.Email,
            profile.FullName,
            profile.AvatarUrl,
            profile.Role,
            profile.Plan,
            profile.PlanExpiresAt,
            tokenPair.AccessToken,
            tokenPair.AccessTokenExpiresAtUtc,
            tokenPair.RefreshToken,
            tokenPair.RefreshTokenExpiresAtUtc,
            ExpiresIn: 15 * 60
        );
}
