using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Tracks a user's progress on a curated micro-vocabulary pack (public.user_vocab_packs, PK user_id + pack_id).
/// Status values: 'not_started', 'in_progress', 'completed'.
/// </summary>
public class UserVocabPack
{
    public Guid UserId { get; set; }
    public string PackId { get; set; } = string.Empty;
    public string CatalogVersion { get; set; } = "v1";
    public string TopicId { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public int PackIndex { get; set; }
    public string Status { get; set; } = "not_started";
    public int WordCount { get; set; }
    public int ReviewedCount { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? LastStudiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual ICollection<UserVocabPackWord> PackWords { get; set; } = new List<UserVocabPackWord>();
}