using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Billing;

/// <summary>
/// Represents a subscription or challenge deposit payment order (public.orders).
/// </summary>
public class Order : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public SubscriptionPlanType PlanId { get; set; } = SubscriptionPlanType.Pro;
    public OrderKind OrderKind { get; set; } = OrderKind.Individual;
    public int DurationMonths { get; set; } = 1;
    public int SeatLimit { get; set; } = 1;
    public Guid? TargetChallengeId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string TransferCode { get; set; } = string.Empty;
    public string? CouponCode { get; set; }
    public string? PaymentGateway { get; set; }
    public string? GatewayTransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public Guid? ProcessedBy { get; set; }

    public virtual Profile User { get; set; } = null!;
    public virtual Challenge? TargetChallenge { get; set; }
    public virtual Profile? ProcessedByUser { get; set; }
}
