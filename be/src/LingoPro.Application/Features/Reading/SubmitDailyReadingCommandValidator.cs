using FluentValidation;

namespace LingoPro.Application.Features.Reading;

/// <summary>
/// Validates <see cref="SubmitDailyReadingCommand"/> inputs.
/// </summary>
public class SubmitDailyReadingCommandValidator : AbstractValidator<SubmitDailyReadingCommand>
{
    public SubmitDailyReadingCommandValidator()
    {
        RuleFor(x => x.ExerciseId).NotEmpty().WithMessage("ExerciseId is required.");
        RuleFor(x => x.McqTotal).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ClozeTotal).GreaterThanOrEqualTo(0);
    }
}
