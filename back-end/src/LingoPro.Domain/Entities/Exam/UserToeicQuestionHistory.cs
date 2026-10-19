using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Exam;

/// <summary>
/// Tracks per-question attempt accuracy for TOEIC listening and reading practice (public.user_toeic_question_history).
/// </summary>
public class UserToeicQuestionHistory : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string QuestionId { get; set; } = string.Empty;
    public ExamType ExamType { get; set; } = ExamType.Toeic;
    public int Part { get; set; } = 1;
    public bool IsCorrect { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}
