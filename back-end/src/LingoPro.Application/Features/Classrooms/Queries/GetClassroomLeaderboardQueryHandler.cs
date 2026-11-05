using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Handles <see cref="GetClassroomLeaderboardQuery"/> after verifying that the caller is the teacher, an enrolled student, or an admin.
/// </summary>
public sealed class GetClassroomLeaderboardQueryHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository)
    : IRequestHandler<GetClassroomLeaderboardQuery, ApiResponse<ClassroomLeaderboardDto>>
{
    public async Task<ApiResponse<ClassroomLeaderboardDto>> Handle(
        GetClassroomLeaderboardQuery request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await classroomRepository.GetClassroomLeaderboardAsync(
            userId,
            request.ClassroomId,
            request.Period,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<ClassroomLeaderboardDto>.Ok(result, "Classroom leaderboard retrieved successfully.");
    }
}
