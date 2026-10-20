using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to update user onboarding preferences and award first-time onboarding XP.
/// </summary>
[Authorize]
public record UpdateOnboardingCommand(
    string FullName,
    string LearningGoal,
    int DailyTargetMins) : IRequest<ApiResponse<ProfileDto>>;
