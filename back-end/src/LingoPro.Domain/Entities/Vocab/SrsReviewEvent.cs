namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Records an idempotent FSRS vocabulary review event (public.srs_review_events, PK user_id + review_id).
/// <see cref="UserId"/> references auth.users, so there is no navigation property.
/// Quality is one of 0, 3, 4, 5.
/// </summary>
public class SrsReviewEvent
{
    public Guid UserId { get; set; }
    public Guid ReviewId { get; set; }
    public Guid WordId { get; set; }
    public int Quality { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Word Word { get; set; } = null!;
}