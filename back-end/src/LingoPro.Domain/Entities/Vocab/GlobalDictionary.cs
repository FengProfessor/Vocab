using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Represents a canonical dictionary headword entry stored as a jsonb payload (public.global_dictionary).
/// </summary>
public class GlobalDictionary : BaseEntity
{
    public string Word { get; set; } = string.Empty;
    public string[]? Tags { get; set; } = [];
    public string Data { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ImageUrl { get; set; }
    public string? ImageSource { get; set; } = "none";
    public short? ImageConfidence { get; set; }
    public string? ImageQuery { get; set; }
    public DateTime? ImageVerifiedAt { get; set; }
}