namespace LingoPro.WebApi.Services.Ipa;

/// <summary>One of the 4 pedagogical stages of the IPA pathway.</summary>
public sealed record IpaStage(
    string Id,
    int StageNumber,
    string Title,
    string ShortTitle,
    string Badge,
    string CoachNote,
    string PedagogicalTip,
    IReadOnlyList<string> PhonemeIds,
    IReadOnlyList<IpaPair>? Pairs = null);
