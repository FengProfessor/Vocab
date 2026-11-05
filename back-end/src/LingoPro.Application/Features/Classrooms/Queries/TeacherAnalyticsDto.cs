namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Complete analytics payload for a teacher classroom including class-wide stats, student rankings, word diagnostics, and live feed.
/// </summary>
public record TeacherAnalyticsDto(
    TeacherClassStatsDto ClassStats,
    IReadOnlyList<TeacherStudentSummaryDto> TopStudents,
    IReadOnlyList<TeacherStudentSummaryDto> StrugglingStudents,
    IReadOnlyList<TeacherWordCoverageItemDto> WordCoverage,
    IReadOnlyList<TeacherWordDifficultyItemDto> WordDifficulty,
    IReadOnlyList<TeacherActivityFeedItemDto> ActivityFeed);
