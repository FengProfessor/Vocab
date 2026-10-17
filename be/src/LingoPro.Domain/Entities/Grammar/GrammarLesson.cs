using LingoPro.Domain.Common;
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
}
