using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to update user onboarding preferences and award first-time onboarding XP.
/// </summary>
public record UpdateOnboardingCommand(
    string FullName,
    string LearningGoal,
    int DailyTargetMins) : IRequest<ApiResponse<ProfileDto>>;
