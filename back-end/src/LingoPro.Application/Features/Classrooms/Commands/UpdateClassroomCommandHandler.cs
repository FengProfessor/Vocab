using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Updates a teacher classroom's name and description after verifying ownership.
/// </summary>
public class UpdateClassroomCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<UpdateClassroomCommand, ApiResponse<ClassroomDto>>
{
    public async Task<ApiResponse<ClassroomDto>> Handle(UpdateClassroomCommand request, CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classroom = await classroomRepository.GetClassroomByIdAsync(request.ClassroomId, ct)
            ?? throw new NotFoundException("Classroom", request.ClassroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != teacherId && !currentUser.IsAdmin))
        {
            throw new ForbiddenAccessException("You are not authorized to update this classroom.");
        }

        classroom.Name = request.Name.Trim();
        classroom.Description = request.Description;

        await classroomRepository.SaveChangesAsync(ct);

        var dto = new ClassroomDto(
            classroom.Id,
            classroom.Name,
            classroom.Description,
            classroom.InviteCode,
            classroom.TeacherId,
            classroom.Enrollments.Count,
            classroom.CreatedAt ?? DateTime.UtcNow);

        return ApiResponse<ClassroomDto>.Ok(dto, "Classroom updated successfully.");
    }
}
