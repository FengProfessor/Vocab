using FluentValidation;

namespace LingoPro.Application.Features.Auth.Queries;

/// <summary>
/// Validates <see cref="GetGoogleOAuthUrlQuery"/> inputs.
/// </summary>
public class GetGoogleOAuthUrlQueryValidator : AbstractValidator<GetGoogleOAuthUrlQuery>
{
    public GetGoogleOAuthUrlQueryValidator()
    {
        RuleFor(x => x.RedirectUri)
            .NotEmpty().WithMessage("Redirect URI is required.");

        RuleFor(x => x.CodeChallenge)
            .NotEmpty().WithMessage("PKCE code challenge is required.")
            .Matches("^[A-Za-z0-9_-]{43}$").WithMessage("PKCE code challenge must be a base64url S256 digest.");
    }
}
