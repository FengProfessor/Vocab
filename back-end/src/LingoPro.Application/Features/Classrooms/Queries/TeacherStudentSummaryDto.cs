namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Student performance summary used in classroom top-performer and struggling-student rankings.
/// </summary>
public record TeacherStudentSummaryDto(
    Guid StudentId,
    string? FullName,
    string Email,
    string? AvatarUrl,
    int WordsLearned,
    int WordsDue,
    int TotalReviews,
    int MasteryPct,
    int EasePct,
    DateTime? LastStudyAt,
    int? DaysSinceActive,
    bool IsActive7d,
    int Lcs = 0);
