using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Records a student's completed vocabulary or grammar quiz score in a classroom (public.quiz_results).
/// QuizType values: 'vocabulary', 'grammar'. Accuracy is a generated column (score / total_questions).
/// </summary>
public class QuizResult : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ClassroomId { get; set; }
    public string? QuizType { get; set; } = "vocabulary";
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public double? Accuracy { get; private set; }
    public DateTime? CompletedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual ClassroomEntity Classroom { get; set; } = null!;
}