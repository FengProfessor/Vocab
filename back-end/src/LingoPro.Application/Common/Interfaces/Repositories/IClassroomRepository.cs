using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for classroom management, student enrollments, and vocabulary drill assignments.
/// </summary>
public interface IClassroomRepository
{
    void AddClassroom(ClassroomEntity classroom);

    Task<ClassroomEntity?> GetPublicClassroomWithEnrollmentsByInviteCodeAsync(string normalizedCode, CancellationToken ct = default);

    void AddEnrollment(Enrollment enrollment);

    Task<ClassroomEntity?> GetClassroomByIdAsNoTrackingAsync(Guid classroomId, CancellationToken ct = default);

    Task<bool> IsStudentEnrolledAsync(Guid classroomId, Guid studentId, CancellationToken ct = default);

    Task<List<SrsProgress>> GetStudentSrsProgressesForDrillAsync(
        Guid studentId,
        IReadOnlyList<Guid>? wordIds,
        CancellationToken ct = default);

    Task<IReadOnlyList<ClassroomDto>> GetUserClassroomsAsync(Guid userId, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
