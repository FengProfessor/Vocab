using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Handles <see cref="GetTeacherStatsQuery"/> by loading owned classrooms and student progress metrics.
/// </summary>
public sealed class GetTeacherStatsQueryHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<GetTeacherStatsQuery, ApiResponse<TeacherStatsDto>>
{
    public async Task<ApiResponse<TeacherStatsDto>> Handle(GetTeacherStatsQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await classroomRepository.GetTeacherStatsAsync(userId, request.ClassroomId, currentUser.IsAdmin, ct);
        return ApiResponse<TeacherStatsDto>.Ok(result, "Teacher classroom statistics retrieved successfully.");
    }
}
