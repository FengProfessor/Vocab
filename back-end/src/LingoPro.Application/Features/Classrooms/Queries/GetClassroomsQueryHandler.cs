using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Retrieves classrooms owned by or joined by the authenticated user directly from the database.
/// </summary>
public sealed class GetClassroomsQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetClassroomsQuery, ApiResponse<IReadOnlyList<ClassroomDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ClassroomDto>>> Handle(
        GetClassroomsQuery request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classrooms = await dbContext.Classrooms
            .AsNoTracking()
            .Where(c => c.Name != "__personal__" &&
                        (c.TeacherId == userId || c.Enrollments.Any(e => e.StudentId == userId)))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClassroomDto(
                c.Id,
                c.Name,
                c.Description,
                c.InviteCode,
                c.TeacherId,
                c.Enrollments.Count,
                c.CreatedAt ?? DateTime.UtcNow))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<ClassroomDto>>.Ok(classrooms, "Classrooms retrieved successfully.");
    }
}
