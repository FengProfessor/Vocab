namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Represents a high-difficulty or low-stability vocabulary card for a specific student in a classroom.
/// </summary>
public record TeacherStudentErrorWordDto(
    Guid WordId,
    string Word,
    string Translation,
    string? Pos,
    string? Ipa,
    string? Example,
    double Difficulty,
    double Stability,
    int ReviewCount,
    DateTime? NextReviewDate,
    DateTime? LastReviewedAt);
