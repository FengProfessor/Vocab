using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Handles <see cref="GetTeacherStudentDetailQuery"/> after verifying that the student is enrolled in a classroom owned by the caller.
/// </summary>
public sealed class GetTeacherStudentDetailQueryHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<GetTeacherStudentDetailQuery, ApiResponse<TeacherStudentDetailDto>>
{
    public async Task<ApiResponse<TeacherStudentDetailDto>> Handle(GetTeacherStudentDetailQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await classroomRepository.GetTeacherStudentDetailAsync(
            userId,
            request.StudentId,
            request.ClassroomId,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<TeacherStudentDetailDto>.Ok(result, "Student detail retrieved successfully.");
    }
}
