using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Uploads a user's speaking audio recording to Supabase Storage via the backend gateway.
/// </summary>
public class UploadSpeakingAudioCommandHandler(
    ICurrentUserService currentUser,
    ISupabaseStorageService storageService) : IRequestHandler<UploadSpeakingAudioCommand, ApiResponse<AudioUploadResultDto>>
{
    public async Task<ApiResponse<AudioUploadResultDto>> Handle(UploadSpeakingAudioCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var (publicUrl, storagePath) = await storageService.UploadAudioRecordingAsync(
            userId,
            request.AudioStream,
            request.FileName,
            request.ContentType,
            ct
        );

        return ApiResponse<AudioUploadResultDto>.Ok(
            new AudioUploadResultDto(publicUrl, storagePath, request.DurationSeconds),
            "Speaking audio recording uploaded successfully."
        );
    }
}
