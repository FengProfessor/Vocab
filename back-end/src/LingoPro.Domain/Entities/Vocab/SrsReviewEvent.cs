using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Records an idempotent FSRS vocabulary review event for a user and word (public.srs_review_events).
/// </summary>
public class SrsReviewEvent : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string ReviewId { get; set; } = string.Empty;
    public Guid WordId { get; set; }
    public SrsReviewQuality Quality { get; set; } = SrsReviewQuality.Good;

    public virtual Profile User { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}
