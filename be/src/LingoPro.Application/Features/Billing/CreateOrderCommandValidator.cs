using FluentValidation;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Billing;

/// <summary>
/// Validates <see cref="CreateOrderCommand"/> inputs.
/// </summary>
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    private static readonly int[] AllowedDurations = [1, 3, 6, 12];

    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.PlanId)
            .Must(p => p is SubscriptionPlanType.Pro or SubscriptionPlanType.Premium)
            .WithMessage("PlanId must be either Pro or Premium.");

        RuleFor(x => x.OrderKind)
            .IsInEnum()
            .WithMessage("OrderKind must be Individual, Group, or Challenge.");

        RuleFor(x => x.DurationMonths)
            .Must(d => AllowedDurations.Contains(d))
            .WithMessage("DurationMonths must be 1, 3, 6, or 12.");

        RuleFor(x => x.SeatLimit)
            .InclusiveBetween(1, 20)
            .WithMessage("SeatLimit must be between 1 and 20.");
    }
}
