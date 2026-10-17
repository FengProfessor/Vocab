using FluentValidation;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Validates <see cref="UnlinkGoogleAccountCommand"/> inputs.
/// </summary>
public class UnlinkGoogleAccountCommandValidator : AbstractValidator<UnlinkGoogleAccountCommand>
{
    public UnlinkGoogleAccountCommandValidator()
    {
        RuleFor(x => x.UserAccessToken).NotEmpty().WithMessage("Active user access token is required.");
        RuleFor(x => x.IdentityId).NotEmpty().WithMessage("Identity ID is required.");
    }
}
