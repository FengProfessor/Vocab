namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Unified chronological learning event across vocabulary reviews, quizzes, grammar, reading, and TOEIC exams.
/// </summary>
public record TeacherTimelineEventDto(
    string Id,
    string Type,
    DateTime Timestamp,
    string Title,
    string Subtitle,
    int? Score,
    int? Total,
    bool? Passed,
    string? Badge,
    string? DetailsJson);
