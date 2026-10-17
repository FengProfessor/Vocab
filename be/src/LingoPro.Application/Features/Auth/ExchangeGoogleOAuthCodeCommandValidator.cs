using FluentValidation;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Validates <see cref="ExchangeGoogleOAuthCodeCommand"/> inputs.
/// </summary>
public class ExchangeGoogleOAuthCodeCommandValidator : AbstractValidator<ExchangeGoogleOAuthCodeCommand>
{
    public ExchangeGoogleOAuthCodeCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("OAuth authorization code is required.");
    }
}
