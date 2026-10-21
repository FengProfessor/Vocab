using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Billing;

/// <summary>
/// Represents a promotional discount coupon (public.coupons). Exactly one of <see cref="DiscountPct"/> / <see cref="DiscountAmount"/> is set.
/// </summary>
public class Coupon : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public int? DiscountPct { get; set; }
    public int? DiscountAmount { get; set; }
    public int? MaxUses { get; set; }
    public int? UsedCount { get; set; } = 0;
    public DateTime? ValidFrom { get; set; } = DateTime.UtcNow;
    public DateTime? ValidUntil { get; set; }
    public string[]? ApplicablePlans { get; set; }
    public bool? IsActive { get; set; } = true;
}
