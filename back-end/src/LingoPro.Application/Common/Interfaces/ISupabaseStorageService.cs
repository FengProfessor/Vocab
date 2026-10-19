namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Abstraction for uploading media files to Supabase Storage buckets.
/// </summary>
public interface ISupabaseStorageService
{
    Task<(string PublicUrl, string StoragePath)> UploadAudioRecordingAsync(
        Guid userId,
        Stream audioStream,
        string fileName,
        string contentType,
        CancellationToken ct = default);
}
