namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents a single day's study activity count for the 30-day activity timeline.
/// </summary>
public sealed record DailyActivityPointDto(
    string Date,
    int Count
);
