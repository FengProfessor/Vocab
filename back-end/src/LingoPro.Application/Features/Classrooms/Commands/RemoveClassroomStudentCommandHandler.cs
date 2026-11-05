using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Removes a student enrollment from a teacher classroom after verifying classroom ownership.
/// </summary>
public sealed class RemoveClassroomStudentCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository)
    : IRequestHandler<RemoveClassroomStudentCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        RemoveClassroomStudentCommand request,
        CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        await classroomRepository.RemoveStudentFromClassroomAsync(
            teacherId,
            request.ClassroomId,
            request.StudentId,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<bool>.Ok(true, "Student removed from classroom successfully.");
    }
}
