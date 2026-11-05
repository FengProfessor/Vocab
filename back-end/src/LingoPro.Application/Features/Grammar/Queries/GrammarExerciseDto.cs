namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Classroom grammar exercise projection returned to teachers and enrolled students.
/// </summary>
public record GrammarExerciseDto(
    Guid Id,
    Guid ClassroomId,
    string Topic,
    string Level,
    string Question,
    IReadOnlyList<string> Options,
    string CorrectAnswer,
    string? Explanation,
    string Type,
    short Difficulty,
    Guid? LessonId,
    DateTime? CreatedAt);
