using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Retrieves the current user's profile directly from the database without caching to ensure fresh role/plan state.
/// </summary>
public class GetCurrentProfileQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetCurrentProfileQuery, ApiResponse<ProfileDto>>
{
    public async Task<ApiResponse<ProfileDto>> Handle(GetCurrentProfileQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var profile = await dbContext.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == userId, ct)
            ?? throw new NotFoundException("Profile", userId);

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

        return ApiResponse<ProfileDto>.Ok(dto, "User profile retrieved successfully.");
    }
}
