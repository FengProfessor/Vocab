using FluentValidation;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Validates <see cref="AnalyzeSentenceCommand"/> inputs.
/// </summary>
public class AnalyzeSentenceCommandValidator : AbstractValidator<AnalyzeSentenceCommand>
{
    public AnalyzeSentenceCommandValidator()
    {
        RuleFor(x => x.Sentence)
            .NotEmpty().WithMessage("Sentence is required.")
            .MinimumLength(4).WithMessage("Sentence must contain at least two words.")
            .MaximumLength(1500).WithMessage("Sentence must not exceed 1500 characters.");
    }
}
