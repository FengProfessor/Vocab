using FluentValidation;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Validates <see cref="GenerateGrammarExercisesCommand"/> input parameters.
/// </summary>
public sealed class GenerateGrammarExercisesCommandValidator : AbstractValidator<GenerateGrammarExercisesCommand>
{
    public GenerateGrammarExercisesCommandValidator()
    {
        RuleFor(x => x.ClassroomId).NotEmpty();
        RuleFor(x => x.Topic).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Count).InclusiveBetween(1, 20);
    }
}
