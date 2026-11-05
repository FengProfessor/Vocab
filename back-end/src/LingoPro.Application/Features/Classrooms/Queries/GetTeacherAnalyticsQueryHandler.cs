using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Handles <see cref="GetTeacherAnalyticsQuery"/> after verifying classroom ownership.
/// </summary>
public sealed class GetTeacherAnalyticsQueryHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<GetTeacherAnalyticsQuery, ApiResponse<TeacherAnalyticsDto>>
{
    public async Task<ApiResponse<TeacherAnalyticsDto>> Handle(GetTeacherAnalyticsQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await classroomRepository.GetTeacherAnalyticsAsync(userId, request.ClassroomId, currentUser.IsAdmin, ct);
        return ApiResponse<TeacherAnalyticsDto>.Ok(result, "Classroom analytics retrieved successfully.");
    }
}
