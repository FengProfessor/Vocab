using FluentValidation;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Validates <see cref="LinkGoogleAccountCommand"/> inputs.
/// </summary>
public class LinkGoogleAccountCommandValidator : AbstractValidator<LinkGoogleAccountCommand>
{
    public LinkGoogleAccountCommandValidator()
    {
        RuleFor(x => x.UserAccessToken).NotEmpty().WithMessage("Active user access token is required.");
        RuleFor(x => x.RedirectUri).NotEmpty().WithMessage("Redirect URI is required.");
    }
}
