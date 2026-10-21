using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Tracks a user's FSRS spaced repetition schedule for a vocabulary word (public.srs_progress).
/// State is stored as int (0=New, 1=Learning, 2=Review, 3=Relearning).
/// </summary>
public class SrsProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid WordId { get; set; }
    public double? EaseFactor { get; set; } = 2.5;
    public int? IntervalDays { get; set; } = 1;
    public int? ReviewCount { get; set; }
    public DateTime? NextReviewDate { get; set; }
    public DateTime? LastReviewedAt { get; set; }
    public double? Stability { get; set; }
    public double? Difficulty { get; set; }
    public SrsCardState? State { get; set; } = SrsCardState.New;
    public string? AlgorithmVersion { get; set; } = "sm2";
    public int? Lapses { get; set; }
    public int? LearningSteps { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}