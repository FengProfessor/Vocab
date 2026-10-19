namespace LingoPro.WebApi.Services.Ipa;

/// <summary>Root object of ipa-chart-v1.json.</summary>
public sealed record IpaChartData
{
    public string Version { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public int TotalPhonemes { get; init; }
    public int MonophthongsCount { get; init; }
    public int DiphthongsCount { get; init; }
    public int ConsonantsCount { get; init; }
    public IReadOnlyList<IpaPhoneme> Phonemes { get; init; } = Array.Empty<IpaPhoneme>();
}
