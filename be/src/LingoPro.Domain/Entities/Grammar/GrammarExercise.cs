using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents a grammar practice question in a global topic or teacher classroom (public.grammar_exercises).
/// </summary>
public class GrammarExercise : BaseAuditableEntity
{
    public string TopicSlug { get; set; } = string.Empty;
    public CertLevel CertLevel { get; set; } = CertLevel.A2;
    public GrammarExerciseType ExerciseType { get; set; } = GrammarExerciseType.MultipleChoice;
    public string QuestionText { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = "[]";
    public string CorrectAnswer { get; set; } = string.Empty;
    public string ExplanationVi { get; set; } = string.Empty;
    public Guid? ClassroomId { get; set; }
    public Guid? CreatedByTeacherId { get; set; }
}
