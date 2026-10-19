using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents a grammar drill exercise linked to a grammar topic, lesson, or classroom (public.grammar_exercises).
/// </summary>
public class GrammarExercise : BaseAuditableEntity
{
    public string TopicSlug { get; set; } = string.Empty;
    public Guid? TopicId { get; set; }
    public Guid? LessonId { get; set; }
    public CertLevel CertLevel { get; set; } = CertLevel.A2;
    public GrammarExerciseType ExerciseType { get; set; } = GrammarExerciseType.MultipleChoice;
    public string QuestionText { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = "[]";
    public string CorrectAnswer { get; set; } = string.Empty;
    public string ExplanationVi { get; set; } = string.Empty;
    public Guid? ClassroomId { get; set; }
    public Guid? CreatedByTeacherId { get; set; }

    public virtual GrammarTopic? Topic { get; set; }
    public virtual GrammarLesson? Lesson { get; set; }
    public virtual ClassroomEntity? Classroom { get; set; }
    public virtual Profile? CreatedByTeacher { get; set; }
    public virtual ICollection<GrammarResult> Results { get; set; } = new List<GrammarResult>();
}
