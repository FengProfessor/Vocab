using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Vocab;

/// <summary>
/// Caches machine translations between source and target languages to minimize external NMT latency (public.translations).
/// </summary>
public class TranslationCache : BaseAuditableEntity
{
    public string SourceText { get; set; } = string.Empty;
    public string SourceLang { get; set; } = "en";
    public string TargetLang { get; set; } = "vi";
    public string TranslatedText { get; set; } = string.Empty;
    public string Provider { get; set; } = "libretranslate";
}
