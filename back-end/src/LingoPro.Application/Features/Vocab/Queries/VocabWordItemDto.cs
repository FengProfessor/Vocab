namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents a vocabulary word item enriched with its FSRS level and review schedule for the student dashboard.
/// </summary>
public sealed record VocabWordItemDto(
    Guid Id,
    string Word,
    string Translation,
    string? Ipa,
    string? Pos,
    string? Example,
    string? ExampleVi,
    string? ImageUrl,
    Guid ClassroomId,
    int SrsLevel,
    double Stability,
    double Difficulty,
    int IntervalDays,
    int ReviewCount,
    DateTime? NextReviewDate,
    DateTime? LastReviewedAt,
    DateTime CreatedAt
);
