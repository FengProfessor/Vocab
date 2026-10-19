using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Updates the authenticated user's onboarding profile and awards initial streak XP.
/// </summary>
public class UpdateOnboardingCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<UpdateOnboardingCommand, ApiResponse<ProfileDto>>
{
    public async Task<ApiResponse<ProfileDto>> Handle(UpdateOnboardingCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId, ct)
            ?? throw new NotFoundException("Profile", userId);

        bool firstTimeOnboarding = !profile.OnboardingCompleted;
        profile.FullName = request.FullName;
        profile.LearningGoal = request.LearningGoal;
        profile.DailyTargetMins = request.DailyTargetMins;
        profile.OnboardingCompleted = true;

        if (firstTimeOnboarding)
        {
            profile.AwardXpAndUpdateStreak(25, DateOnly.FromDateTime(DateTime.UtcNow));
        }

        await dbContext.SaveChangesAsync(ct);

        var dto = new ProfileDto(
            profile.Id,
            profile.Email,
            profile.FullName,
            profile.AvatarUrl,
            profile.Role,
            profile.Plan,
            profile.PlanExpiresAt,
            profile.TotalXp,
            profile.CurrentStreak,
            profile.LongestStreak,
            profile.LearningGoal,
            profile.DailyTargetMins,
            profile.OnboardingCompleted
        );

        return ApiResponse<ProfileDto>.Ok(dto, "Onboarding preferences updated successfully.");
    }
}
