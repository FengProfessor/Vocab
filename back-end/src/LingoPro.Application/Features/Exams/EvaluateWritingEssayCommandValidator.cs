using FluentValidation;

namespace LingoPro.Application.Features.Exams;

/// <summary>
/// Validates <see cref="EvaluateWritingEssayCommand"/> inputs.
/// </summary>
public class EvaluateWritingEssayCommandValidator : AbstractValidator<EvaluateWritingEssayCommand>
{
    public EvaluateWritingEssayCommandValidator()
    {
        RuleFor(x => x.ExamType).IsInEnum().WithMessage("A valid ExamType is required.");
        RuleFor(x => x.PromptText).NotEmpty().WithMessage("Writing prompt is required.");
        RuleFor(x => x.EssayText)
            .NotEmpty().WithMessage("Essay content is required.")
            .MinimumLength(30).WithMessage("Essay must contain at least 30 characters.")
            .MaximumLength(10000).WithMessage("Essay must not exceed 10000 characters.");
    }
}
