namespace LingoPro.WebApi.Services.Ipa;

/// <summary>A shadowing sentence with highlighted target words.</summary>
public sealed record IpaPracticeSentence(string Sentence, string TranslationVi, IReadOnlyList<string> TargetWords);
