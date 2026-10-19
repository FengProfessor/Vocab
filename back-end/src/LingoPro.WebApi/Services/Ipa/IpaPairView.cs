namespace LingoPro.WebApi.Services.Ipa;

/// <summary>View model for a rendered contrast pair (pair + both resolved phonemes).</summary>
public sealed record IpaPairView(IpaPair Pair, IpaPhoneme First, IpaPhoneme Second, int Index);
