namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Comprehensive server response containing FSRS L1-L6 level distribution, learning analytics KPIs,
/// skill radar scores, quiz trends, weak word diagnostics, and paginated vocabulary items.
/// </summary>
public sealed record VocabAnalyticsDto(
    Guid? ClassroomId,
    int Total,
    int NewCount,
    int ReviewDueCount,
    int DueCount,
    int GrammarDueCount,
    IReadOnlyList<int> LevelCounts,
    double AvgStabilityDays,
    int RetentionRatePercent,
    int StudyStreak,
    int LongestStreak,
    int TotalXp,
    int TodayXp,
    int DailyGoal,
    int TodayWords,
    int TodayNewWords,
    int TodayReviewWords,
    SkillRadarScoresDto SkillScores,
    IReadOnlyList<DailyActivityPointDto> DailyActivity,
    IReadOnlyList<QuizHistoryPointDto> QuizHistory,
    IReadOnlyList<WeakWordDiagnosticDto> WeakWords,
    IReadOnlyList<VocabWordItemDto> Words
);
