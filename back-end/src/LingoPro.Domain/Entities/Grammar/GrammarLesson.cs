using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Represents an instructional grammar lesson authored by a teacher or curriculum pipeline (public.grammar_lessons).
/// </summary>
public class GrammarLesson : BaseAuditableEntity
{
    public Guid TopicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Theory { get; set; }
    public string? TheoryVi { get; set; }

    /// <summary>jsonb array of { en, vi, note }. SQL default '[]'.</summary>
    public string? Examples { get; set; } = "[]";
    public string? ImageUrl { get; set; }
    public string? ImageSource { get; set; }
    public short? ImageConfidence { get; set; }

    /// <summary>Authoring source, e.g. 'mai-lan-huong-pdf', 'web-scrape', 'ai'.</summary>
    public string? Source { get; set; }
    public string? SourceUrl { get; set; }
    public int? OrderIndex { get; set; } = 0;

    /// <summary>jsonb golden-section content.</summary>
    public string? Sections { get; set; }

    /// <summary>jsonb embedded exercises payload (not the grammar_exercises table).</summary>
    public string? Exercises { get; set; }

    public virtual GrammarTopic Topic { get; set; } = null!;
    public virtual Profile? Author { get; set; }
    public virtual GrammarQuizCache? QuizCache { get; set; }
    public virtual ICollection<GrammarExercise> GrammarExercises { get; set; } = new List<GrammarExercise>();
    public virtual ICollection<GrammarProgress> Progresses { get; set; } = new List<GrammarProgress>();
}
