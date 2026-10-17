using FluentValidation;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Validates <see cref="GetGoogleOAuthUrlQuery"/> inputs.
/// </summary>
public class GetGoogleOAuthUrlQueryValidator : AbstractValidator<GetGoogleOAuthUrlQuery>
{
    public GetGoogleOAuthUrlQueryValidator()
    {
        RuleFor(x => x.RedirectUri)
            .NotEmpty().WithMessage("Redirect URI is required.");
    }
}
