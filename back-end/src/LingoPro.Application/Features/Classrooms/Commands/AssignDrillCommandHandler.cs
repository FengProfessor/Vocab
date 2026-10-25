using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Assigns a vocabulary drill to an enrolled student after verifying classroom ownership.
/// </summary>
public class AssignDrillCommandHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<AssignDrillCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(AssignDrillCommand request, CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classroom = await classroomRepository.GetClassroomByIdAsNoTrackingAsync(request.ClassroomId, ct)
            ?? throw new NotFoundException("Classroom", request.ClassroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != teacherId && !currentUser.IsAdmin))
        {
            throw new ForbiddenAccessException("You are not authorized to manage this classroom.");
        }

        bool isEnrolled = await classroomRepository.IsStudentEnrolledAsync(request.ClassroomId, request.StudentId, ct);

        if (!isEnrolled)
        {
            throw new ForbiddenAccessException("Target student is not enrolled in this classroom.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var itemsToDrill = await classroomRepository.GetStudentSrsProgressesForDrillAsync(request.StudentId, request.WordIds, ct);
        foreach (var item in itemsToDrill)
        {
            item.NextReviewDate = today.ToDateTime(TimeOnly.MinValue);
        }

        await classroomRepository.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(itemsToDrill.Count, "Vocabulary drill assigned to student successfully.");
    }
}
