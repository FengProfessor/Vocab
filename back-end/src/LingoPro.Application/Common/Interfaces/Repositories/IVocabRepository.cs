using LingoPro.Application.Features.Vocab.Commands;
using LingoPro.Application.Features.Vocab.Queries;
using LingoPro.Domain.Entities.Vocab;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for vocabulary words, curated packs, FSRS review progress, and due review queues.
/// </summary>
public interface IVocabRepository
{
    Task<Word?> GetWordByIdAsNoTrackingAsync(Guid wordId, CancellationToken ct = default);

    Task<SrsProgress?> GetSrsProgressAsync(Guid userId, Guid wordId, CancellationToken ct = default);

    Task<bool> WordExistsAsync(Guid wordId, CancellationToken ct = default);

    void AddSrsProgress(SrsProgress srs);

    Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default);

    Task<List<SrsProgress>> GetDueSrsProgressesWithWordAsync(
        Guid userId,
        DateTime dueUntilUtc,
        int limit,
        CancellationToken ct = default);

    Task<VocabAnalyticsDto> GetVocabAnalyticsAsync(
        Guid userId,
        string? classroomScope,
        int limit,
        int offset,
        string? filter = null,
        string? searchQuery = null,
        string? sort = null,
        string? ids = null,
        CancellationToken ct = default);

    Task<ImportVocabPackResultDto> ImportVocabPackAsync(
        Guid userId,
        ImportVocabPackCommand command,
        CancellationToken ct = default);

    Task<IReadOnlyList<UserVocabPackDto>> GetUserVocabPacksAsync(
        Guid userId,
        CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
