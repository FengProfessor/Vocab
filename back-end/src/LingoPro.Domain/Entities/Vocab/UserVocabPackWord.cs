namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Links a vocabulary word at a specific position within a user's vocabulary pack
/// (public.user_vocab_pack_words, PK user_id + pack_id + position; FK (user_id, pack_id) to user_vocab_packs).
/// </summary>
public class UserVocabPackWord
{
    public Guid UserId { get; set; }
    public string PackId { get; set; } = string.Empty;
    public Guid WordId { get; set; }
    public int Position { get; set; }

    public virtual UserVocabPack Pack { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}