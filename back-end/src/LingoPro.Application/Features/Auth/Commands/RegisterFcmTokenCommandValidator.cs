using FluentValidation;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Validates <see cref="RegisterFcmTokenCommand"/> inputs.
/// </summary>
public class RegisterFcmTokenCommandValidator : AbstractValidator<RegisterFcmTokenCommand>
{
    public RegisterFcmTokenCommandValidator()
    {
        RuleFor(x => x.FcmToken)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.FcmToken))
            .WithMessage("FCM token must not exceed 500 characters.");
    }
}
