namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Summary DTO representing an imported vocabulary micro-pack and its live FSRS study progress.
/// </summary>
public sealed record UserVocabPackDto(
    string PackId,
    string TopicId,
    string TopicTitle,
    int PackIndex,
    string Status,
    int WordCount,
    int ReviewedCount,
    DateTime? StartedAt,
    DateTime? LastStudiedAt,
    DateTime? CompletedAt,
    IReadOnlyList<Guid> WordIds
);
