namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents a single quiz completion point for accuracy trend analysis.
/// </summary>
public sealed record QuizHistoryPointDto(
    string Date,
    string Type,
    int Accuracy,
    int Score,
    int Total
);
