using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Vocab;

/// <summary>
/// Represents a vocabulary word along with its current FSRS scheduling state for the active user.
/// </summary>
public record WordWithSrsDto(
    Guid Id,
    string Term,
    string Ipa,
    string Translation,
    PartOfSpeechType PartOfSpeech,
    string? ImageUrl,
    string? ExampleSentence,
    string? ExampleTranslation,
    string Topic,
    CertLevel Level,
    SrsCardState SrsState,
    double Stability,
    double Difficulty,
    int IntervalDays,
    DateOnly? NextReviewDate
);
