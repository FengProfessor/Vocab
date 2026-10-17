using FluentValidation;

namespace LingoPro.Application.Features.Gamification;

/// <summary>
/// Validates <see cref="CreateChallengeCommand"/> inputs.
/// </summary>
public class CreateChallengeCommandValidator : AbstractValidator<CreateChallengeCommand>
{
    public CreateChallengeCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Challenge title is required.").MaximumLength(150);
        RuleFor(x => x.Description).NotEmpty().WithMessage("Challenge description is required.");
        RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate).WithMessage("EndDate must be after StartDate.");
        RuleFor(x => x.DailyTargetWords).InclusiveBetween(5, 200).WithMessage("DailyTargetWords must be between 5 and 200.");
        RuleFor(x => x.MaxParticipants).InclusiveBetween(2, 5000).WithMessage("MaxParticipants must be between 2 and 5000.");
        RuleFor(x => x.DepositAmount).GreaterThanOrEqualTo(0).WithMessage("DepositAmount cannot be negative.");
    }
}
