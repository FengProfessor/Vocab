using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Represents the updated FSRS schedule and XP reward returned after submitting a word review.
/// </summary>
public record SrsReviewResponseDto(
    Guid WordId,
    SrsCardState State,
    double Stability,
    double Difficulty,
    int IntervalDays,
    DateOnly NextReviewDate,
    int Reps,
    int Lapses,
    int XpAwarded
);
