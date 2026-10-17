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
        CancellationToken ct)
    {
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
                Role = UserRole.Student,
                Plan = SubscriptionPlanType.Free,
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
