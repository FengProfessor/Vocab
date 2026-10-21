using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Tracks a learner's FSRS mastery schedule for a specific grammar lesson (public.grammar_progress).
/// </summary>
public class GrammarProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }
    public double? Stability { get; set; } = 0;
    public double? Difficulty { get; set; } = 0;
    public int? IntervalDays { get; set; } = 0;
    public int? ReviewCount { get; set; } = 0;
    public DateTime? NextReviewDate { get; set; }
    public DateTime? LastReviewedAt { get; set; }

    /// <summary>FSRS card state text. SQL default 'new'.</summary>
    public string? State { get; set; } = "new";
    public short? MasteryScore { get; set; } = 0;
    public int? Lapses { get; set; } = 0;
    public int? LearningSteps { get; set; } = 0;

    public virtual Profile User { get; set; } = null!;
    public virtual GrammarLesson Lesson { get; set; } = null!;
}
