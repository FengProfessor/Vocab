using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Handles <see cref="GetTeacherStudentErrorsQuery"/> by returning the student's top struggling classroom words.
/// </summary>
public sealed class GetTeacherStudentErrorsQueryHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository)
    : IRequestHandler<GetTeacherStudentErrorsQuery, ApiResponse<IReadOnlyList<TeacherStudentErrorWordDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<TeacherStudentErrorWordDto>>> Handle(
        GetTeacherStudentErrorsQuery request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await classroomRepository.GetTeacherStudentErrorsAsync(
            userId,
            request.StudentId,
            request.ClassroomId,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<IReadOnlyList<TeacherStudentErrorWordDto>>.Ok(result, "Student struggling words retrieved successfully.");
    }
}
