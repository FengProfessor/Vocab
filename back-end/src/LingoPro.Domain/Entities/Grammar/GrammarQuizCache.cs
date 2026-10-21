namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Caches AI-generated quiz questions for a grammar lesson to reduce LLM calls (public.grammar_quiz_cache).
/// The primary key is <see cref="LessonId"/>.
/// </summary>
public class GrammarQuizCache
{
    public Guid LessonId { get; set; }

    /// <summary>jsonb array of validated quiz questions.</summary>
    public string Questions { get; set; } = "[]";
    public string? Model { get; set; }
    public DateTime? CreatedAt { get; set; }

    public virtual GrammarLesson Lesson { get; set; } = null!;
}
