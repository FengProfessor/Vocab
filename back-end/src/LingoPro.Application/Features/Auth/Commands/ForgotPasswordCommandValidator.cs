using FluentValidation;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Validates <see cref="ForgotPasswordCommand"/> inputs.
/// </summary>
public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email address is required.")
            .MaximumLength(254).WithMessage("Email address must not exceed 254 characters.")
            .EmailAddress().WithMessage("Email address format is invalid.");
    }
}
