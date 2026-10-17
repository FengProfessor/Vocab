using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Command to upload a user's spoken audio recording to Supabase Storage.
/// </summary>
public record UploadSpeakingAudioCommand(
    Stream AudioStream,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    double DurationSeconds) : IRequest<ApiResponse<AudioUploadResultDto>>;
