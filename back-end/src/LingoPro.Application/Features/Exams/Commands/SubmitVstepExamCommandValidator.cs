using FluentValidation;

namespace LingoPro.Application.Features.Exams.Commands;

/// <summary>
/// Validates <see cref="SubmitVstepExamCommand"/> inputs.
/// </summary>
public class SubmitVstepExamCommandValidator : AbstractValidator<SubmitVstepExamCommand>
{
    public SubmitVstepExamCommandValidator()
    {
        RuleFor(x => x.ExamType).IsInEnum().WithMessage("A valid ExamType is required.");
        RuleFor(x => x.TestId).NotEmpty().WithMessage("TestId is required.");
        RuleFor(x => x.ListeningScore).InclusiveBetween(0.0, 10.0);
        RuleFor(x => x.ReadingScore).InclusiveBetween(0.0, 10.0);
        RuleFor(x => x.WritingScore).InclusiveBetween(0.0, 10.0);
        RuleFor(x => x.SpeakingScore).InclusiveBetween(0.0, 10.0);
    }
}
