using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Billing;

/// <summary>
/// Represents a promotional discount coupon (public.coupons).
/// </summary>
public class Coupon : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public int DiscountPercent { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public int MaxUses { get; set; } = 100;
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
}
