using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Links a vocabulary word at a specific position within a user's vocabulary pack (public.user_vocab_pack_words).
/// </summary>
public class UserVocabPackWord : BaseAuditableEntity
{
    public Guid UserVocabPackId { get; set; }
    public Guid UserId { get; set; }
    public string PackId { get; set; } = string.Empty;
    public Guid WordId { get; set; }
    public int Position { get; set; }

    public virtual UserVocabPack Pack { get; set; } = null!;
    public virtual Profile User { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}
