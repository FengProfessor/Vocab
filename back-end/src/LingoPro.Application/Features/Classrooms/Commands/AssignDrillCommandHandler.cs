using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Assigns a vocabulary drill to an enrolled student after verifying classroom ownership.
/// </summary>
public class AssignDrillCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<AssignDrillCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(AssignDrillCommand request, CancellationToken ct)
    {
        var teacherId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.ClassroomId, ct)
            ?? throw new NotFoundException("Classroom", request.ClassroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != teacherId && !currentUser.IsAdmin))
        {
            throw new ForbiddenAccessException("You are not authorized to manage this classroom.");
        }

        bool isEnrolled = await dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(e => e.ClassroomId == request.ClassroomId && e.StudentId == request.StudentId, ct);

        if (!isEnrolled)
        {
            throw new ForbiddenAccessException("Target student is not enrolled in this classroom.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var query = dbContext.SrsProgresses.Where(s => s.UserId == request.StudentId);

        if (request.WordIds is { Count: > 0 })
        {
            query = query.Where(s => request.WordIds.Contains(s.WordId));
        }

        var itemsToDrill = await query.ToListAsync(ct);
        foreach (var item in itemsToDrill)
        {
            item.NextReviewDate = today.ToDateTime(TimeOnly.MinValue);
        }

        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(itemsToDrill.Count, "Vocabulary drill assigned to student successfully.");
    }
}
