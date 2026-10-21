using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents a canonical CEFR grammar topic in the 62-topic curriculum (public.grammar_topics).
/// </summary>
public class GrammarTopic : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }

    /// <summary>
    /// Check-constrained text: 'A0', 'A1', 'A2', 'B1', 'B2', 'beginner', 'intermediate', 'advanced'. SQL default 'beginner'.
    /// </summary>
    public string? Level { get; set; } = "beginner";
    public int? OrderIndex { get; set; } = 0;
    public Guid? ParentId { get; set; }
    public DateTime? CreatedAt { get; set; }

    public virtual GrammarTopic? Parent { get; set; }
    public virtual ICollection<GrammarTopic> Children { get; set; } = new List<GrammarTopic>();
    public virtual ICollection<GrammarLesson> Lessons { get; set; } = new List<GrammarLesson>();
}
