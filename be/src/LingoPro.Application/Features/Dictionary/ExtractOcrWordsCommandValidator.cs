using FluentValidation;

namespace LingoPro.Application.Features.Dictionary;

/// <summary>
/// Validates <see cref="ExtractOcrWordsCommand"/> image payloads.
/// </summary>
public class ExtractOcrWordsCommandValidator : AbstractValidator<ExtractOcrWordsCommand>
{
    public ExtractOcrWordsCommandValidator()
    {
        RuleFor(x => x.Base64Image).NotEmpty().WithMessage("Base64Image payload is required.");
        RuleFor(x => x.MimeType)
            .NotEmpty()
            .Must(m => m.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Valid image MimeType (image/jpeg, image/png, image/webp) is required.");
    }
}
