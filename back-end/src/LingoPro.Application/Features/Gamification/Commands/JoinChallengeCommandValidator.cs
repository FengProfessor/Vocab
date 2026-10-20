using FluentValidation;

namespace LingoPro.Application.Features.Gamification.Commands;

/// <summary>
/// Validates <see cref="JoinChallengeCommand"/> inputs.
/// </summary>
public class JoinChallengeCommandValidator : AbstractValidator<JoinChallengeCommand>
{
    public JoinChallengeCommandValidator()
    {
        RuleFor(x => x.ChallengeId).NotEmpty().WithMessage("ChallengeId is required.");
    }
}
