using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Billing.Commands;

/// <summary>
/// Represents a subscription or challenge order and its VietQR payment URL.
/// </summary>
public record OrderDto(
    Guid Id,
    Guid UserId,
    SubscriptionPlanType PlanId,
    OrderKind OrderKind,
    int DurationMonths,
    int SeatLimit,
    decimal Amount,
    string Currency,
    OrderStatus Status,
    string TransferCode,
    string VietQrUrl,
    DateTime CreatedAt,
    DateTime? PaidAt
);
