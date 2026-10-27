namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Represents the result of importing a curated vocabulary micro-pack into the user's personal classroom.
/// </summary>
public sealed record ImportVocabPackResultDto(
    int Imported,
    int TotalInPack,
    Guid ClassroomId,
    string PackId,
    string TopicTitle,
    int PackIndex,
    IReadOnlyList<Guid> WordIds
);
