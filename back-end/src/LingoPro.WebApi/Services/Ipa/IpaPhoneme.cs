namespace LingoPro.WebApi.Services.Ipa;

/// <summary>One of the 44 IPA phonemes (mirrors IpaPhoneme in src/types/ipa.ts).</summary>
public sealed record IpaPhoneme
{
    public string Id { get; init; } = string.Empty;
    public string Symbol { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    /// <summary>monophthong | diphthong | consonant</summary>
    public string Type { get; init; } = string.Empty;
    /// <summary>long-vowel | short-vowel | diphthong | voiceless-consonant | voiced-consonant | sonorant</summary>
    public string SubType { get; init; } = string.Empty;
    public string? PartnerId { get; init; }
    public string AnchorWord { get; init; } = string.Empty;
    public string AnchorWordIpa { get; init; } = string.Empty;
    public string VietnameseNote { get; init; } = string.Empty;
    public string MouthTip { get; init; } = string.Empty;
    /// <summary>high | medium | low</summary>
    public string DifficultyForVn { get; init; } = string.Empty;
    public IpaVideo? Video { get; init; }
    public IReadOnlyList<string> InitialWords { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> MedialWords { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> FinalWords { get; init; } = Array.Empty<string>();
    public IReadOnlyList<IpaMinimalPair> MinimalPairs { get; init; } = Array.Empty<IpaMinimalPair>();
    public IReadOnlyList<IpaPracticeSentence> PracticeSentences { get; init; } = Array.Empty<IpaPracticeSentence>();
}
