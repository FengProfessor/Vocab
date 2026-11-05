namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Teacher portal dashboard payload containing owned classrooms and enrolled student progress for the selected classroom.
/// </summary>
public record TeacherStatsDto(
    IReadOnlyList<TeacherClassroomSummaryDto> Classrooms,
    IReadOnlyList<TeacherStudentProgressDto> Students);
