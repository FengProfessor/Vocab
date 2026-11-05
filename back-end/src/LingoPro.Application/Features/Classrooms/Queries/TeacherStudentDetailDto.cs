namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Full student profile inspection payload including current TESOL metrics, 30-day history, quizzes, saved words, and universal activity timeline.
/// </summary>
public record TeacherStudentDetailDto(
    TeacherStudentProgressDto? Current,
    IReadOnlyList<TeacherStudentHistoryPointDto> History,
    IReadOnlyList<TeacherStudentQuizDto> Quizzes,
    IReadOnlyList<TeacherStudentSavedWordDto> SavedWords,
    IReadOnlyList<TeacherStudentAssessmentDto> ToeicAssessments,
    IReadOnlyList<TeacherTimelineEventDto> Timeline);
