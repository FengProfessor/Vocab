using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing classroom creation, student enrollment, and drill assignment queries and mutations.
/// </summary>
public sealed class ClassroomRepository(IApplicationDbContext dbContext) : IClassroomRepository
{
    public void AddClassroom(ClassroomEntity classroom)
        => dbContext.Classrooms.Add(classroom);

    public Task<ClassroomEntity?> GetPublicClassroomWithEnrollmentsByInviteCodeAsync(string normalizedCode, CancellationToken ct = default)
        => dbContext.Classrooms
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(
                c => c.IsDeleted != true && c.InviteCode == normalizedCode && c.Name != "__personal__",
                ct);

    public void AddEnrollment(Enrollment enrollment)
        => dbContext.Enrollments.Add(enrollment);

    public Task<ClassroomEntity?> GetClassroomByIdAsNoTrackingAsync(Guid classroomId, CancellationToken ct = default)
        => dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct);

    public Task<bool> IsStudentEnrolledAsync(Guid classroomId, Guid studentId, CancellationToken ct = default)
        => dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(
                e => e.ClassroomId == classroomId &&
                     e.StudentId == studentId &&
                     (e.Classroom == null || e.Classroom.IsDeleted != true),
                ct);

    public Task<List<SrsProgress>> GetStudentSrsProgressesForDrillAsync(
        Guid studentId,
        IReadOnlyList<Guid>? wordIds,
        CancellationToken ct = default)
    {
        var query = dbContext.SrsProgresses.Where(
            s => s.UserId == studentId && (s.Word == null || s.Word.IsDeleted != true));
        if (wordIds is { Count: > 0 })
        {
            query = query.Where(s => wordIds.Contains(s.WordId));
        }

        return query.ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ClassroomDto>> GetUserClassroomsAsync(Guid userId, CancellationToken ct = default)
    {
        return await dbContext.Classrooms
            .AsNoTracking()
            .Where(c => c.IsDeleted != true &&
                        c.Name != "__personal__" &&
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
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
