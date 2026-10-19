using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Records a student's submitted answer and accuracy on a grammar exercise (public.grammar_results).
/// </summary>
public class GrammarResult : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
    public string ChosenAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int? TimeTakenMs { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual GrammarExercise Exercise { get; set; } = null!;
}
