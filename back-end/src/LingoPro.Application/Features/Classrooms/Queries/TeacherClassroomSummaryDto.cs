namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Summary projection of a teacher-owned classroom including its active student enrollment count.
/// </summary>
public record TeacherClassroomSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    string InviteCode,
    Guid TeacherId,
    DateTime CreatedAt,
    int EnrollmentCount);
