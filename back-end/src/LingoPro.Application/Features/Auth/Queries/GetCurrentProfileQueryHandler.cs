using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Auth.Queries;

/// <summary>
/// Retrieves the current user's profile directly from the database without caching to ensure fresh role/plan state.
/// </summary>
public class GetCurrentProfileQueryHandler(
    ICurrentUserService currentUser,
    IAuthRepository authRepository) : IRequestHandler<GetCurrentProfileQuery, ApiResponse<ProfileDto>>
{
    public async Task<ApiResponse<ProfileDto>> Handle(GetCurrentProfileQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var normalizedEmail = currentUser.Email?.Trim().ToLowerInvariant();

        var profile = await authRepository.GetProfileByIdOrEmailAsNoTrackingAsync(userId, normalizedEmail, ct)
            ?? throw new NotFoundException("Profile", userId);

        var gamification = await authRepository.GetUserGamificationAsNoTrackingAsync(profile.Id, ct);
        var dto = ProfileDtoMapper.ToDto(profile, gamification);

        return ApiResponse<ProfileDto>.Ok(dto, "User profile retrieved successfully.");
    }
}
