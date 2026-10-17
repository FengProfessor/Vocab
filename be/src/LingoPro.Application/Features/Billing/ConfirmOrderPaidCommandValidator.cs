using FluentValidation;

namespace LingoPro.Application.Features.Billing;

/// <summary>
/// Validates <see cref="ConfirmOrderPaidCommand"/> inputs.
/// </summary>
public class ConfirmOrderPaidCommandValidator : AbstractValidator<ConfirmOrderPaidCommand>
{
    public ConfirmOrderPaidCommandValidator()
    {
        RuleFor(x => x.TransferCode).NotEmpty().WithMessage("TransferCode is required.");
        RuleFor(x => x.PaidAmount).GreaterThan(0).WithMessage("PaidAmount must be greater than zero.");
    }
}
