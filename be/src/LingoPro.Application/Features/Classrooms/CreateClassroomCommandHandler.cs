using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Handles creation of a new teacher classroom after verifying Teacher or Admin role permissions.
/// </summary>
public class CreateClassroomCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<CreateClassroomCommand, ApiResponse<ClassroomDto>>
{
    public async Task<ApiResponse<ClassroomDto>> Handle(CreateClassroomCommand request, CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        if (!currentUser.IsTeacher)
        {
            throw new ForbiddenAccessException("Only users with Teacher or Admin role can create classrooms.");
        }

        string inviteCode = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();

        var classroom = new ClassroomEntity
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            InviteCode = inviteCode,
            TeacherId = teacherId
        };

        dbContext.Classrooms.Add(classroom);
        await dbContext.SaveChangesAsync(ct);

        var dto = new ClassroomDto(
            classroom.Id,
            classroom.Name,
            classroom.Description,
            classroom.InviteCode,
            classroom.TeacherId,
            0,
            classroom.CreatedAt);

        return ApiResponse<ClassroomDto>.Created(dto, "Classroom created successfully.");
    }
}
