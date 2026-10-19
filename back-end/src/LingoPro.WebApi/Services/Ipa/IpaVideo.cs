namespace LingoPro.WebApi.Services.Ipa;

/// <summary>Rachel's English clip metadata (mirrors RachelVideoMeta).</summary>
public sealed record IpaVideo(
    string YoutubeVideoId,
    double StartSeconds,
    double EndSeconds,
    string ChannelName,
    string VideoTip,
    string? ClipTitle = null,
    string? MouthTipSummary = null);
