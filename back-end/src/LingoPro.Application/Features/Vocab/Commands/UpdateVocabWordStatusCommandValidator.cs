using FluentValidation;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Validates <see cref="UpdateVocabWordStatusCommand"/> input parameters.
/// </summary>
public sealed class UpdateVocabWordStatusCommandValidator : AbstractValidator<UpdateVocabWordStatusCommand>
{
    public UpdateVocabWordStatusCommandValidator()
    {
        RuleFor(x => x.WordId).NotEmpty();
        RuleFor(x => x.Status).NotEmpty();
    }
}
