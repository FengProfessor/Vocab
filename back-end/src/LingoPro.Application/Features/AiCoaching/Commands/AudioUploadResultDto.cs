namespace LingoPro.Application.Features.AiCoaching.Commands;

/// <summary>
/// Represents the public URL and storage path of an uploaded speaking audio recording.
/// </summary>
public record AudioUploadResultDto(
    string AudioUrl,
    string StoragePath,
    double DurationSeconds
);
