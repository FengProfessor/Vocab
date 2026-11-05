namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Recent vocabulary review activity item for the classroom live activity feed.
/// </summary>
public record TeacherActivityFeedItemDto(
    string StudentName,
    string? StudentAvatar,
    string Word,
    string Translation,
    int IntervalDays,
    int ReviewCount,
    DateTime? ReviewedAt);
