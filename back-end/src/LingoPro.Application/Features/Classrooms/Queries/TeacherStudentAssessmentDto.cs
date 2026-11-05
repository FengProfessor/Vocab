namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Roadmap or TOEIC assessment result for the student's multi-tier exam history.
/// </summary>
public record TeacherStudentAssessmentDto(
    Guid Id,
    string Tier,
    string TargetId,
    int Score,
    bool Passed,
    string? DetailsJson,
    DateTime CreatedAt);
