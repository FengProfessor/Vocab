using FluentValidation;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Validates <see cref="UpdateOnboardingCommand"/> inputs.
/// </summary>
public class UpdateOnboardingCommandValidator : AbstractValidator<UpdateOnboardingCommand>
{
    public UpdateOnboardingCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Full name is required.").MaximumLength(100);
        RuleFor(x => x.LearningGoal).NotEmpty().WithMessage("Learning goal is required.");
        RuleFor(x => x.DailyTargetMins).InclusiveBetween(5, 180).WithMessage("Daily target minutes must be between 5 and 180.");
    }
}
