using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Tracks a learner's reading progress and quiz score on a library article (public.user_reading_library_progress).
/// </summary>
public class UserReadingLibraryProgress : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public Guid ArticleId { get; set; }
    public UserReadingProgressStatus Status { get; set; } = UserReadingProgressStatus.Completed;
    public bool IsCompleted { get; set; }
    public int QuizScore { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual ReadingArticle Article { get; set; } = null!;
}
