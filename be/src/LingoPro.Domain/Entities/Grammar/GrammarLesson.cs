using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents an instructional grammar lesson authored by a teacher or curriculum pipeline (public.grammar_lessons).
/// </summary>
public class GrammarLesson : BaseAuditableEntity
{
    public Guid TopicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string TheoryHtml { get; set; } = string.Empty;
    public string FormulasJson { get; set; } = "[]";
    public string ExamplesJson { get; set; } = "[]";
    public GrammarLessonSource Source { get; set; } = GrammarLessonSource.MaiLanHuongPdf;

    public virtual GrammarTopic Topic { get; set; } = null!;
    public virtual Profile? Author { get; set; }
    public virtual GrammarQuizCache? QuizCache { get; set; }
    public virtual ICollection<GrammarExercise> Exercises { get; set; } = new List<GrammarExercise>();
    public virtual ICollection<GrammarProgress> Progresses { get; set; } = new List<GrammarProgress>();
}
