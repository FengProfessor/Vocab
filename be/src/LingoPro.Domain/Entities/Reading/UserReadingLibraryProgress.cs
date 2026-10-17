using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Tracks a learner's reading progress and quiz score on a library article (public.user_reading_library_progress).
/// </summary>
public class UserReadingLibraryProgress : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string ArticleId { get; set; } = string.Empty;
    public UserReadingProgressStatus Status { get; set; } = UserReadingProgressStatus.Completed;
    public bool IsCompleted { get; set; }
    public int QuizScore { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
