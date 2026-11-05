using FluentValidation;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Validates <see cref="DeleteVocabWordCommand"/> input parameters.
/// </summary>
public sealed class DeleteVocabWordCommandValidator : AbstractValidator<DeleteVocabWordCommand>
{
    public DeleteVocabWordCommandValidator()
    {
        RuleFor(x => x.WordId).NotEmpty();
    }
}
