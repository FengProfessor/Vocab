namespace LingoPro.WebApi.Services.Ipa;

/// <summary>A minimal pair used by the ear-training quiz.</summary>
public sealed record IpaMinimalPair(string Target, string Contrast, string ContrastPhoneme, string Note);
