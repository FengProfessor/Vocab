using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents a canonical CEFR grammar topic in the 62-topic curriculum (public.grammar_topics).
/// </summary>
public class GrammarTopic : BaseAuditableEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public GrammarLevel Level { get; set; } = GrammarLevel.A1;
    public CertLevel CertLevel { get; set; } = CertLevel.A1;
    public string Category { get; set; } = "general";
    public int SortOrder { get; set; }
    public Guid? ParentId { get; set; }

    public virtual GrammarTopic? Parent { get; set; }
    public virtual ICollection<GrammarTopic> Children { get; set; } = new List<GrammarTopic>();
    public virtual ICollection<GrammarLesson> Lessons { get; set; } = new List<GrammarLesson>();
}
