namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Represents how many students in a classroom have learned a specific classroom vocabulary word.
/// </summary>
public record TeacherWordCoverageItemDto(
    Guid Id,
    string Word,
    string Translation,
    string? Pos,
    int StudentsLearned,
    int TotalStudents,
    int CoveragePct);
