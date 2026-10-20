using FluentValidation;

namespace LingoPro.Application.Features.Toeic.Commands;

/// <summary>
/// Validates <see cref="SubmitToeicExamCommand"/> inputs.
/// </summary>
public class SubmitToeicExamCommandValidator : AbstractValidator<SubmitToeicExamCommand>
{
    public SubmitToeicExamCommandValidator()
    {
        RuleFor(x => x.TestId).NotEmpty().WithMessage("TestId is required.");
        RuleFor(x => x.ListeningCorrectCount).InclusiveBetween(0, 100).WithMessage("ListeningCorrectCount must be between 0 and 100.");
        RuleFor(x => x.ReadingCorrectCount).InclusiveBetween(0, 100).WithMessage("ReadingCorrectCount must be between 0 and 100.");
        RuleFor(x => x.DurationSeconds).GreaterThanOrEqualTo(0).WithMessage("DurationSeconds must be non-negative.");
    }
}
