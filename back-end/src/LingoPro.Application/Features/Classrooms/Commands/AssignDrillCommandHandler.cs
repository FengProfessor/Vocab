using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Reschedules targeted vocabulary cards to today's review queue for an enrolled student, enforcing classroom ownership and IDOR protection.
/// </summary>
public class AssignDrillCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<AssignDrillCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(AssignDrillCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classroom = await classroomRepository.GetClassroomByIdAsync(request.ClassroomId, ct);
        if (classroom == null)
        {
            throw new NotFoundException("Classroom", request.ClassroomId);
        }

        if (classroom.IsPersonal || classroom.TeacherId != userId)
        {
            throw new ForbiddenAccessException("You do not own this classroom.");
        }

        var isEnrolled = await classroomRepository.IsStudentEnrolledAsync(request.ClassroomId, request.StudentId, ct);
        if (!isEnrolled)
        {
            throw new ForbiddenAccessException("The target student is not enrolled in this classroom.");
        }

        var progresses = await classroomRepository.GetStudentSrsProgressesForDrillAsync(
            request.StudentId,
            request.WordIds,
            request.ClassroomId,
            ct);

        var today = DateTime.UtcNow.Date;
        foreach (var p in progresses)
        {
            p.NextReviewDate = today;
        }

        await classroomRepository.SaveChangesAsync(ct);

        var terms = progresses
            .Select(p => p.Word?.Term)
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .ToList();

        string message = terms.Count > 0
            ? $"Assigned {progresses.Count} words to today's review queue: {string.Join(", ", terms)}"
            : $"Assigned {progresses.Count} words to today's review queue.";

        return ApiResponse<int>.Ok(progresses.Count, message);
    }
}
