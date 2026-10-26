namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents a weak or low-stability vocabulary word for diagnostic analytics.
/// </summary>
public sealed record WeakWordDiagnosticDto(
    string Word,
    string Translation,
    double Stability,
    double Difficulty,
    int ReviewCount,
    int Level
);
