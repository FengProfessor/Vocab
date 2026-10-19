using FluentValidation;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Validates <see cref="RefreshTokenCommand"/> inputs.
/// </summary>
public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}
