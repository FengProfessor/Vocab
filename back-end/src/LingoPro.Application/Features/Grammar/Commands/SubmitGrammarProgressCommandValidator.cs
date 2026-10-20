using FluentValidation;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Validates <see cref="SubmitGrammarProgressCommand"/> inputs.
/// </summary>
public class SubmitGrammarProgressCommandValidator : AbstractValidator<SubmitGrammarProgressCommand>
{
    public SubmitGrammarProgressCommandValidator()
    {
        RuleFor(x => x.TopicSlug)
            .NotEmpty().WithMessage("TopicSlug is required.")
            .MaximumLength(100);

        RuleFor(x => x.AccuracyPercent)
            .InclusiveBetween(0.0, 100.0)
            .WithMessage("AccuracyPercent must be between 0 and 100.");
    }
}
