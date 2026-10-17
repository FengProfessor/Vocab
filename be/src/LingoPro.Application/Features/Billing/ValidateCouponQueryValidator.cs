using FluentValidation;

namespace LingoPro.Application.Features.Billing;

/// <summary>
/// Validates <see cref="ValidateCouponQuery"/> inputs.
/// </summary>
public class ValidateCouponQueryValidator : AbstractValidator<ValidateCouponQuery>
{
    public ValidateCouponQueryValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Coupon code is required.")
            .MaximumLength(32).WithMessage("Coupon code must not exceed 32 characters.");
    }
}
