namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Result returned when saving a single vocabulary word into a classroom or personal workspace.
/// </summary>
public record SaveClassroomWordResultDto(
    Guid WordId,
    bool AlreadyExists,
    string Status);
