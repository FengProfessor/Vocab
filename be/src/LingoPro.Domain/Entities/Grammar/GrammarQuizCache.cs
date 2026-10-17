using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Caches AI-generated quiz questions for a grammar lesson to reduce LLM calls (public.grammar_quiz_cache).
/// </summary>
public class GrammarQuizCache : BaseAuditableEntity
{
    public Guid LessonId { get; set; }
    public string QuestionsJson { get; set; } = "[]";
    public string? Model { get; set; }

    public virtual GrammarLesson Lesson { get; set; } = null!;
}
