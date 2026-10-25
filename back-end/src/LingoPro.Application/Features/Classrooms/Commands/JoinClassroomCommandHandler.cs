using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Enrolls the authenticated student into a classroom matching the provided invite code.
/// </summary>
public class JoinClassroomCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<JoinClassroomCommand, ApiResponse<ClassroomDto>>
{
    public async Task<ApiResponse<ClassroomDto>> Handle(JoinClassroomCommand request, CancellationToken ct)
    {
        var studentId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        string normalizedCode = request.InviteCode.Trim().ToUpperInvariant();

        var classroom = await classroomRepository.GetPublicClassroomWithEnrollmentsByInviteCodeAsync(normalizedCode, ct)
            ?? throw new NotFoundException("Classroom", normalizedCode);

        bool alreadyEnrolled = classroom.Enrollments.Any(e => e.StudentId == studentId);
        if (!alreadyEnrolled)
        {
            classroomRepository.AddEnrollment(new Enrollment
            {
                ClassroomId = classroom.Id,
                StudentId = studentId,
                JoinedAt = DateTime.UtcNow
            });
            await classroomRepository.SaveChangesAsync(ct);
        }

        return ApiResponse<ClassroomDto>.Ok(
            new ClassroomDto(
                classroom.Id,
                classroom.Name,
                classroom.Description,
                classroom.InviteCode,
                classroom.TeacherId,
                classroom.Enrollments.Count + (alreadyEnrolled ? 0 : 1),
                classroom.CreatedAt ?? DateTime.UtcNow),
            "Joined classroom successfully.");
    }
}
