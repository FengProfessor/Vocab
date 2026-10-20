using System.Net.Http.Headers;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace LingoPro.Infrastructure.Services;

public class SupabaseStorageService(
    HttpClient httpClient,
    IOptions<SupabaseOptions> supabaseOptions) : ISupabaseStorageService
{
    private readonly SupabaseOptions _options = supabaseOptions.Value;

    public async Task<(string PublicUrl, string StoragePath)> UploadAudioRecordingAsync(
        Guid userId,
        Stream audioStream,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        string safeExt = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(safeExt)) safeExt = ".webm";

        string bucket = _options.StorageBucket.Trim();
        string storagePath = $"{userId}/{DateTime.UtcNow:yyyyMMdd}/{Guid.NewGuid():N}{safeExt}";
        string uploadEndpoint = $"{_options.NormalizedUrl}/storage/v1/object/{bucket}/{storagePath}";

        var req = new HttpRequestMessage(HttpMethod.Post, uploadEndpoint);
        req.Headers.Add("apikey", _options.ServiceRoleKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ServiceRoleKey);
        req.Content = new StreamContent(audioStream);
        req.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var response = await httpClient.SendAsync(req, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new DomainException("Failed to upload audio recording to Supabase Storage.", "STORAGE_UPLOAD_FAILED");
        }

        string publicUrl = $"{_options.NormalizedUrl}/storage/v1/object/public/{bucket}/{storagePath}";
        return (publicUrl, storagePath);
    }
}
