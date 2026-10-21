using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Billing;

/// <summary>
/// Represents a subscription payment order (public.orders).
/// </summary>
public class Order : BaseAuditableEntity
{
    public Guid? UserId { get; set; }
    public SubscriptionPlanType Plan { get; set; } = SubscriptionPlanType.Pro;
    public int Amount { get; set; }
    public string? Currency { get; set; } = "VND";
    public PaymentMethodType? PaymentMethod { get; set; }
    public string? PaymentRef { get; set; }
    public OrderStatus? Status { get; set; } = OrderStatus.Pending;
    public string? Note { get; set; }
    public string? CouponCode { get; set; }
    public int? PeriodMonths { get; set; } = 1;
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public Guid? ProcessedBy { get; set; }
    public OrderKind OrderKind { get; set; } = OrderKind.Individual;
    public int Seats { get; set; } = 1;

    public virtual Profile? User { get; set; }
    public virtual Profile? ProcessedByUser { get; set; }
}
