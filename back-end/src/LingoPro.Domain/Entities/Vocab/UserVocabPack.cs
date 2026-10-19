using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Tracks a user's progress on a curated micro-vocabulary pack (public.user_vocab_packs).
/// </summary>
public class UserVocabPack : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string PackId { get; set; } = string.Empty;
    public string CatalogVersion { get; set; } = "v1";
    public string TopicId { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public int PackIndex { get; set; }
    public VocabPackStatus Status { get; set; } = VocabPackStatus.NotStarted;
    public int WordCount { get; set; }
    public int ReviewedCount { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? LastStudiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual ICollection<UserVocabPackWord> PackWords { get; set; } = new List<UserVocabPackWord>();
}
