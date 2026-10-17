using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Algorithms;

/// <summary>
/// Output schedule produced by the FSRS v5 spaced repetition engine.
/// </summary>
public record FsrsCalculationResult(
    double Stability,
    double Difficulty,
    int IntervalDays,
    DateOnly NextReviewDate,
    int Reps,
    int Lapses,
    SrsCardState State,
    int XpAwarded
);
