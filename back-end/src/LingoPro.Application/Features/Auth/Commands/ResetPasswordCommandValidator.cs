using FluentValidation;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Validates <see cref="ResetPasswordCommand"/> inputs.
/// </summary>
public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters long.")
            .MaximumLength(1024).WithMessage("Password must not exceed 1024 characters.");

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.AccessToken) || !string.IsNullOrWhiteSpace(x.TokenHash))
            .WithMessage("Recovery access token or token hash is required.");
    }
}
