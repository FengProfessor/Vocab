using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching.Commands;

/// <summary>
/// Command to upload a user's spoken audio recording to Supabase Storage.
/// </summary>
[Authorize]
public record UploadSpeakingAudioCommand(
    Stream AudioStream,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    double DurationSeconds) : IRequest<ApiResponse<AudioUploadResultDto>>;
