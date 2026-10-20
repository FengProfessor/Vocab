using LingoPro.Application.Features.Auth.Queries;
using FluentValidation;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Validates <see cref="ExchangeGoogleOAuthCodeCommand"/> inputs.
/// </summary>
public class ExchangeGoogleOAuthCodeCommandValidator : AbstractValidator<ExchangeGoogleOAuthCodeCommand>
{
    public ExchangeGoogleOAuthCodeCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("OAuth authorization code is required.")
            .MaximumLength(2048).WithMessage("OAuth authorization code is too long.");

        RuleFor(x => x.CodeVerifier)
            .NotEmpty().WithMessage("PKCE code verifier is required.")
            .Matches("^[A-Za-z0-9_-]{43,128}$").WithMessage("PKCE code verifier format is invalid.");
    }
}
