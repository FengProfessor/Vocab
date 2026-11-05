namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Detailed quiz or communicative evaluation record for the teacher student inspection view.
/// </summary>
public record TeacherStudentQuizDto(
    Guid Id,
    string QuizType,
    int Score,
    int TotalQuestions,
    int? TimeSpentSeconds,
    string? DetailsJson,
    DateTime? CompletedAt);
