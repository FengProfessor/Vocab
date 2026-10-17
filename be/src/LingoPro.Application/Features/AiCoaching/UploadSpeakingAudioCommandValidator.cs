using FluentValidation;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Validates <see cref="UploadSpeakingAudioCommand"/> audio file size and MIME type constraints.
/// </summary>
public class UploadSpeakingAudioCommandValidator : AbstractValidator<UploadSpeakingAudioCommand>
{
    private static readonly string[] AllowedMimeTypes =
    [
        "audio/webm", "audio/mp4", "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg", "audio/mp3", "audio/mpeg", "audio/m4a"
    ];

    public UploadSpeakingAudioCommandValidator()
    {
        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("Audio file cannot be empty.")
            .LessThanOrEqualTo(10 * 1024 * 1024).WithMessage("Audio file size must not exceed 10MB.");

        RuleFor(x => x.ContentType)
            .Must(mime => AllowedMimeTypes.Any(a => mime.StartsWith(a, StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Unsupported audio MIME type. Allowed formats: webm, mp4, wav, aac, ogg, m4a.");
    }
}
