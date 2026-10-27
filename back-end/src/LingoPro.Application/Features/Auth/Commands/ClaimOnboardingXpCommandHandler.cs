using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Auth;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Awards 50 XP idempotently upon completing the onboarding tour using the public.xp_award_events ledger.
/// </summary>
public class ClaimOnboardingXpCommandHandler(
    ICurrentUserService currentUser,
    IAuthRepository authRepository) : IRequestHandler<ClaimOnboardingXpCommand, ApiResponse<bool>>
{
    public const string OnboardingEventKey = "onboarding_complete";
    public const int OnboardingXpAmount = 50;

    public async Task<ApiResponse<bool>> Handle(ClaimOnboardingXpCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (await authRepository.HasXpAwardEventAsync(userId, OnboardingEventKey, ct))
        {
            return ApiResponse<bool>.Ok(false, "Onboarding XP has already been claimed.");
        }

        authRepository.AddXpAwardEvent(new XpAwardEvent
        {
            UserId = userId,
            EventKey = OnboardingEventKey,
            XpAwarded = OnboardingXpAmount,
            ClaimedAt = DateTime.UtcNow
        });

        var gamification = await authRepository.GetUserGamificationAsync(userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            authRepository.AddUserGamification(gamification);
        }

        gamification.AwardXpAndUpdateStreak(OnboardingXpAmount, DateOnly.FromDateTime(DateTime.UtcNow));
        await authRepository.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "Onboarding XP awarded successfully.");
    }
}
