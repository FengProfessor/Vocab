using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Elevates the authenticated user's profile role from Student to Teacher.
/// Idempotent when the user is already a Teacher; rejects elevation from Admin or other roles.
/// </summary>
public class ClaimTeacherRoleCommandHandler(
    ICurrentUserService currentUser,
    IAuthRepository authRepository) : IRequestHandler<ClaimTeacherRoleCommand, ApiResponse<ProfileDto>>
{
    public async Task<ApiResponse<ProfileDto>> Handle(ClaimTeacherRoleCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var profile = await authRepository.GetProfileByIdAsync(userId, ct)
            ?? throw new NotFoundException("Profile", userId);

        if (profile.Role == UserRole.Student)
        {
            profile.Role = UserRole.Teacher;
            await authRepository.SaveChangesAsync(ct);
        }
        else if (profile.Role != UserRole.Teacher)
        {
            throw new ForbiddenAccessException($"Cannot claim teacher role from role {profile.Role}.");
        }

        var gamification = await authRepository.GetUserGamificationAsNoTrackingAsync(userId, ct);
        var dto = ProfileDtoMapper.ToDto(profile, gamification);

        return ApiResponse<ProfileDto>.Ok(dto, "Teacher role claimed successfully.");
    }
}
