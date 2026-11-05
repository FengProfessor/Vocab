namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Comprehensive TESOL pedagogical metrics and FSRS learning progress for an enrolled classroom student.
/// </summary>
public record TeacherStudentProgressDto(
    Guid StudentId,
    string Email,
    string? FullName,
    string? AvatarUrl,
    Guid ClassroomId,
    string ClassroomName,
    int TotalWordsLearned,
    int WordsDue,
    double AvgEaseFactor,
    int TotalReviews,
    DateTime? LastStudyAt,
    int Vms,
    int ActiveVms,
    int Lcs,
    int CommunicativeDepth,
    string CefrLevel,
    DateTime? TrueLastActive,
    TeacherStudentLatestQuizDto? LatestQuiz,
    int SavedWordsCount,
    string Plan,
    DateTime? PlanExpiresAt,
    DateTime? JoinedAt);
