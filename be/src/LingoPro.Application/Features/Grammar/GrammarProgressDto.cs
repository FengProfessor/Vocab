using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Grammar;

/// <summary>
/// Represents a learner's updated FSRS grammar progress and XP reward.
/// </summary>
public record GrammarProgressDto(
    string TopicSlug,
    double MasteryScore,
    SrsCardState State,
    double Stability,
    double Difficulty,
    int IntervalDays,
    DateOnly NextReviewDate,
    int XpAwarded
);
