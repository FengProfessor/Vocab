using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Classroom;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Handles creation of a new teacher classroom.
/// </summary>
public class CreateClassroomCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<CreateClassroomCommand, ApiResponse<ClassroomDto>>
{
    public async Task<ApiResponse<ClassroomDto>> Handle(CreateClassroomCommand request, CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
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
            1,
            classroom.CreatedAt);

        return ApiResponse<ClassroomDto>.Created(dto, "Classroom created successfully.");
    }
}
