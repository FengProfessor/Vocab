using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Exam;

/// <summary>
/// Tracks per-question attempt accuracy for TOEIC listening and reading practice (public.user_toeic_question_history).
/// Composite primary key (user_id, question_id); user_id references auth.users (no navigation).
/// </summary>
public class UserToeicQuestionHistory
{
    public Guid UserId { get; set; }
    public string QuestionId { get; set; } = string.Empty;
    public int Part { get; set; } = 1;
    public DateTime LastAnsweredAt { get; set; } = DateTime.UtcNow;
    public bool IsCorrect { get; set; }
    public int AttemptCount { get; set; } = 1;
    public string SelectedOption { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
