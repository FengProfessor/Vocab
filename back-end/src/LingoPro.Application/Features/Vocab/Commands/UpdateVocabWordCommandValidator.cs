using FluentValidation;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Validates <see cref="UpdateVocabWordCommand"/> input parameters.
/// </summary>
public sealed class UpdateVocabWordCommandValidator : AbstractValidator<UpdateVocabWordCommand>
{
    public UpdateVocabWordCommandValidator()
    {
        RuleFor(x => x.WordId).NotEmpty();
    }
}
