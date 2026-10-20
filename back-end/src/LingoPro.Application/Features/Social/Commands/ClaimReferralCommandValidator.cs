using LingoPro.Application.Features.Social.Queries;
using FluentValidation;

namespace LingoPro.Application.Features.Social.Commands;

/// <summary>
/// Validates <see cref="ClaimReferralCommand"/> inputs (same 3-32 char alphanumeric rule as the client tracker).
/// </summary>
public sealed class ClaimReferralCommandValidator : AbstractValidator<ClaimReferralCommand>
{
    public ClaimReferralCommandValidator()
    {
        RuleFor(x => x.ReferralCode)
            .NotEmpty().WithMessage("Referral code is required.")
            .Matches("^[A-Za-z0-9_-]{3,32}$").WithMessage("Referral code format is invalid.");
    }
}
