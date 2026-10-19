using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Events;

/// <summary>
/// Domain event raised when a subscription or challenge order is confirmed as paid.
/// </summary>
public sealed record OrderPaidEvent(
    Guid OrderId,
    Guid UserId,
    SubscriptionPlanType PlanId,
    OrderKind OrderKind,
    decimal Amount,
    DateTime OccurredOnUtc) : IDomainEvent;
