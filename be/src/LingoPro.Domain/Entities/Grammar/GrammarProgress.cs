using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Grammar;

/// <summary>
/// Tracks a learner's FSRS mastery schedule for a specific grammar topic (public.grammar_progress).
/// </summary>
public class GrammarProgress : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string TopicSlug { get; set; } = string.Empty;
    public double MasteryScore { get; set; }
    public double Stability { get; set; }
    public double Difficulty { get; set; } = 5.0;
    public int IntervalDays { get; set; }
    public DateOnly NextReviewDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public int Reps { get; set; }
    public int Lapses { get; set; }
    public SrsCardState State { get; set; } = SrsCardState.New;
    public DateTime? LastReviewedAt { get; set; }
}
