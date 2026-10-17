using System.ComponentModel.DataAnnotations;
using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Tracks a user's FSRS v5 spaced repetition schedule for a vocabulary word (public.srs_progress).
/// </summary>
public class SrsProgress : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid WordId { get; set; }
    public double Stability { get; set; }
    public double Difficulty { get; set; } = 5.0;
    public int IntervalDays { get; set; }
    public DateOnly NextReviewDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public int Lapses { get; set; }
    public int Reps { get; set; }
    public SrsCardState State { get; set; } = SrsCardState.New;
    public DateTime? LastReviewedAt { get; set; }
    public string? LastReviewId { get; set; }

    [Timestamp]
    public uint Version { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}
