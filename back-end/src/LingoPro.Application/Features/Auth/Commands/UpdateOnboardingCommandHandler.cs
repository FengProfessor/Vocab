using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Updates the authenticated user's onboarding profile and awards initial streak XP.
/// </summary>
public class UpdateOnboardingCommandHandler(
    ICurrentUserService currentUser,
    IAuthRepository authRepository) : IRequestHandler<UpdateOnboardingCommand, ApiResponse<ProfileDto>>
{
    public async Task<ApiResponse<ProfileDto>> Handle(UpdateOnboardingCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var profile = await authRepository.GetProfileByIdAsync(userId, ct)
            ?? throw new NotFoundException("Profile", userId);

        // The SQL schema has no onboarding_completed / learning_goal / daily_target_mins columns:
        // "first time" is derived from the absence of a user_gamification row, and the daily target is
        // persisted as user_gamification.daily_goal. LearningGoal is accepted but not persisted.
        profile.FullName = request.FullName;

        var gamification = await authRepository.GetUserGamificationAsync(userId, ct);
        bool firstTimeOnboarding = gamification == null;
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            authRepository.AddUserGamification(gamification);
        }
        gamification.DailyGoal = request.DailyTargetMins;

        if (firstTimeOnboarding)
        {
            gamification.AwardXpAndUpdateStreak(25, DateOnly.FromDateTime(DateTime.UtcNow));
        }

        await authRepository.SaveChangesAsync(ct);

        var dto = ProfileDtoMapper.ToDto(profile, gamification);
        return ApiResponse<ProfileDto>.Ok(dto, "Onboarding preferences updated successfully.");
    }
}
