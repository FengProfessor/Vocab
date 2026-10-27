using FluentValidation;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Validates <see cref="ImportVocabPackCommand"/> requests before execution.
/// </summary>
public sealed class ImportVocabPackCommandValidator : AbstractValidator<ImportVocabPackCommand>
{
    public ImportVocabPackCommandValidator()
    {
        RuleFor(x => x.PackId)
            .NotEmpty().WithMessage("PackId is required.")
            .MaximumLength(120).WithMessage("PackId must not exceed 120 characters.");

        RuleFor(x => x.Words)
            .NotNull().WithMessage("Words list is required.")
            .Must(w => w != null && w.Count > 0).WithMessage("At least one word is required to import a pack.");
    }
}
