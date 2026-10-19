using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Algorithms;

/// <summary>
/// Input parameters required to calculate the next FSRS v5 review schedule.
/// </summary>
public record FsrsCalculationInput(
    double Stability,
    double Difficulty,
    int IntervalDays,
    int Reps,
    int Lapses,
    SrsCardState State,
    DateTime? LastReviewedAt
);
