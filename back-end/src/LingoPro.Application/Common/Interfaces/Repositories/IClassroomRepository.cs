using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.Features.Classrooms.Queries;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for classroom management, student enrollments, teacher portal analytics, and vocabulary drill assignments.
/// </summary>
public interface IClassroomRepository
{
    void AddClassroom(ClassroomEntity classroom);

    void RemoveClassroom(ClassroomEntity classroom);

    Task<ClassroomEntity?> GetClassroomByIdAsync(Guid classroomId, CancellationToken ct = default);

    Task<ClassroomEntity?> GetPublicClassroomWithEnrollmentsByInviteCodeAsync(string normalizedCode, CancellationToken ct = default);

    void AddEnrollment(Enrollment enrollment);

    Task<ClassroomEntity?> GetClassroomByIdAsNoTrackingAsync(Guid classroomId, CancellationToken ct = default);

    Task<bool> IsStudentEnrolledAsync(Guid classroomId, Guid studentId, CancellationToken ct = default);

    Task<List<SrsProgress>> GetStudentSrsProgressesForDrillAsync(
        Guid studentId,
        IReadOnlyList<Guid>? wordIds,
        Guid? classroomId = null,
        CancellationToken ct = default);

    Task<IReadOnlyList<ClassroomDto>> GetUserClassroomsAsync(Guid userId, CancellationToken ct = default);

    Task<TeacherStatsDto> GetTeacherStatsAsync(
        Guid userId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<TeacherAnalyticsDto> GetTeacherAnalyticsAsync(
        Guid userId,
        Guid classroomId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<TeacherStudentDetailDto> GetTeacherStudentDetailAsync(
        Guid userId,
        Guid studentId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<IReadOnlyList<TeacherStudentErrorWordDto>> GetTeacherStudentErrorsAsync(
        Guid userId,
        Guid studentId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<TeacherAddedStudentDto> AddStudentByEmailAsync(
        Guid teacherId,
        Guid classroomId,
        string email,
        bool isAdmin,
        CancellationToken ct = default);

    Task RemoveStudentFromClassroomAsync(
        Guid teacherId,
        Guid classroomId,
        Guid studentId,
        bool isAdmin,
        CancellationToken ct = default);

    Task<ClassroomLeaderboardDto> GetClassroomLeaderboardAsync(
        Guid userId,
        Guid classroomId,
        string period,
        bool isAdmin,
        CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
