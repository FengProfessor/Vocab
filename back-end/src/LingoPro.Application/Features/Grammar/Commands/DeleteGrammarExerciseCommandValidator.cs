using FluentValidation;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Validates <see cref="DeleteGrammarExerciseCommand"/> inputs.
/// </summary>
public class DeleteGrammarExerciseCommandValidator : AbstractValidator<DeleteGrammarExerciseCommand>
{
    public DeleteGrammarExerciseCommandValidator()
    {
        RuleFor(x => x.ExerciseId)
            .NotEmpty().WithMessage("Grammar exercise ID is required.");
    }
}
