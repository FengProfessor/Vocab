using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Enrolls a student into a teacher classroom by email address after verifying classroom ownership.
/// </summary>
public sealed class AddClassroomStudentCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository)
    : IRequestHandler<AddClassroomStudentCommand, ApiResponse<TeacherAddedStudentDto>>
{
    public async Task<ApiResponse<TeacherAddedStudentDto>> Handle(
        AddClassroomStudentCommand request,
        CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var addedStudent = await classroomRepository.AddStudentByEmailAsync(
            teacherId,
            request.ClassroomId,
            request.Email,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<TeacherAddedStudentDto>.Created(addedStudent, "Student added to classroom successfully.");
    }
}
