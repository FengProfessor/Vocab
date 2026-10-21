using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents a vocabulary word along with its current FSRS scheduling state for the active user.
/// </summary>
public record WordWithSrsDto(
    Guid Id,
    string Term,
    string? Ipa,
    string? Translation,
    string? PartOfSpeech,
    string? ImageUrl,
    string? ExampleSentence,
    string? ExampleTranslation,
    string? Topic,
    string? Level,
    SrsCardState SrsState,
    double Stability,
    double Difficulty,
    int IntervalDays,
    DateOnly? NextReviewDate
);
