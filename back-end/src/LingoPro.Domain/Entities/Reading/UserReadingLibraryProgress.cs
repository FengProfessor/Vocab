using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Tracks a learner's reading progress, bookmarks and quiz scores on a library article (public.user_reading_library_progress).
/// </summary>
public class UserReadingLibraryProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ArticleId { get; set; }

    /// <summary>'in_progress' | 'completed' | 'bookmarked'. SQL default 'in_progress'.</summary>
    public string? Status { get; set; } = "in_progress";
    public bool? IsBookmarked { get; set; } = false;
    public int? ReadCount { get; set; } = 0;
    public DateTime? LastReadAt { get; set; }
    public int? ReadingTimeSeconds { get; set; } = 0;
    public int? McqScore { get; set; } = 0;
    public int? McqTotal { get; set; } = 0;
    public int? ClozeScore { get; set; } = 0;
    public int? ClozeTotal { get; set; } = 0;
    public string? UserNotes { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual ReadingArticle Article { get; set; } = null!;
}
