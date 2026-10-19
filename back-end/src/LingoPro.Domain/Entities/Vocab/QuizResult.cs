using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Records a student's completed vocabulary or grammar quiz score in a classroom (public.quiz_results).
/// </summary>
public class QuizResult : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid ClassroomId { get; set; }
    public QuizType QuizType { get; set; } = QuizType.Vocabulary;
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public double Accuracy { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual ClassroomEntity Classroom { get; set; } = null!;
}
