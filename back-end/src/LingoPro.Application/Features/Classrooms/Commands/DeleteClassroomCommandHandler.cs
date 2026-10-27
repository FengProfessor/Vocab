using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Deletes a teacher classroom after verifying ownership and preventing deletion of the personal workspace.
/// </summary>
public class DeleteClassroomCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<DeleteClassroomCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteClassroomCommand request, CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classroom = await classroomRepository.GetClassroomByIdAsync(request.ClassroomId, ct)
            ?? throw new NotFoundException("Classroom", request.ClassroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != teacherId && !currentUser.IsAdmin))
        {
            throw new ForbiddenAccessException("You are not authorized to delete this classroom.");
        }

        classroom.MarkAsDeleted(teacherId);
        classroomRepository.RemoveClassroom(classroom);
        await classroomRepository.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "Classroom deleted successfully.");
    }
}
