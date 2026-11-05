namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Summary of a student's most recent vocabulary or communicative quiz attempt.
/// </summary>
public record TeacherStudentLatestQuizDto(
    int Score,
    int TotalQuestions,
    string? QuizType,
    DateTime? CompletedAt);
