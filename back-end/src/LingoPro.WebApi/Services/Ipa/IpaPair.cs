namespace LingoPro.WebApi.Services.Ipa;

/// <summary>A contrast pair shown on stages 2 and 3.</summary>
public sealed record IpaPair(string Title, string MouthPosition, string Phoneme1Id, string Phoneme2Id, string? Tip = null);
