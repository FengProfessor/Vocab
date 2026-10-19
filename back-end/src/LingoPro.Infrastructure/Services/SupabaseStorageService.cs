using System.Net.Http.Headers;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Exceptions;
using Microsoft.Extensions.Configuration;

namespace LingoPro.Infrastructure.Services;

public class SupabaseStorageService(HttpClient httpClient, IConfiguration configuration) : ISupabaseStorageService
{
    private string SupabaseUrl => (configuration["Supabase:Url"] ?? "https://your-project.supabase.co").TrimEnd('/');
    private string ServiceRoleKey => configuration["Supabase:ServiceRoleKey"] ?? string.Empty;
    private const string BucketName = "speaking-recordings";

    public async Task<(string PublicUrl, string StoragePath)> UploadAudioRecordingAsync(
        Guid userId,
        Stream audioStream,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        string safeExt = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(safeExt)) safeExt = ".webm";

        string storagePath = $"{userId}/{DateTime.UtcNow:yyyyMMdd}/{Guid.NewGuid():N}{safeExt}";
        string uploadEndpoint = $"{SupabaseUrl}/storage/v1/object/{BucketName}/{storagePath}";

        var req = new HttpRequestMessage(HttpMethod.Post, uploadEndpoint);
        req.Headers.Add("apikey", ServiceRoleKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ServiceRoleKey);
        req.Content = new StreamContent(audioStream);
        req.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Failed to upload audio recording to Supabase Storage.", "STORAGE_UPLOAD_FAILED");
        }

        string publicUrl = $"{SupabaseUrl}/storage/v1/object/public/{BucketName}/{storagePath}";
        return (publicUrl, storagePath);
    }
}
