using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents a single vocabulary word's full details and the current learner's FSRS schedule state.
/// </summary>
public record VocabWordDetailDto(
    Guid Id,
    Guid ClassroomId,
    Guid? AddedBy,
    string Term,
    string Translation,
    string? Ipa,
    string? Pos,
    string? Example,
    string? ExampleVi,
    string? SourceUrl,
    string? ImageUrl,
    string? DictionaryData,
    string[] Synonyms,
    string[] Antonyms,
    DateTime? CreatedAt,
    SrsCardState? SrsState,
    double Stability,
    double Difficulty,
    int IntervalDays,
    int ReviewCount,
    double EaseFactor,
    DateTime? NextReviewDate,
    DateTime? LastReviewedAt
);
