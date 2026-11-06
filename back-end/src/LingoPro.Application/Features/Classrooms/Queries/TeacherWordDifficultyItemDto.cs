namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Diagnostic difficulty metrics for a classroom vocabulary word aggregated across enrolled students.
/// </summary>
public record TeacherWordDifficultyItemDto(
    Guid WordId,
    string Word,
    string Translation,
    string? Pos,
    string? Ipa,
    int StudentCount,
    double AvgStability,
    double AvgDifficulty,
    int TotalReviews,
    double FailRate = 1.0);
