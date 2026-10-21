using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Billing;

/// <summary>
/// Audit log tracking subscription plan upgrades, downgrades, expirations, and order entitlements (public.subscription_history).
/// </summary>
public class SubscriptionHistory : BaseEntity
{
    public Guid UserId { get; set; }
    public SubscriptionPlanType? OldPlan { get; set; }
    public SubscriptionPlanType NewPlan { get; set; } = SubscriptionPlanType.Pro;
    public SubscriptionChangeReason? Reason { get; set; }
    public Guid? OrderId { get; set; }
    public Guid? ChangedBy { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual Profile? ChangedByUser { get; set; }
}
