namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Aggregate classroom engagement, mastery, and vocabulary coverage metrics for a teacher classroom.
/// </summary>
public record TeacherClassStatsDto(
    int TotalStudents,
    int Active7d,
    int Inactive7d,
    int TotalWords,
    int AvgWordsLearned,
    int TotalReviews,
    int AvgMasteryPct,
    int EngagementRate,
    int WordsDueToday = 0);
