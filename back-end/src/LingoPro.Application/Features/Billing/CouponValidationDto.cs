namespace LingoPro.Application.Features.Billing;

/// <summary>
/// Represents validation details for a promotional discount coupon.
/// </summary>
public record CouponValidationDto(
    string Code,
    int DiscountPercent,
    decimal? MaxDiscountAmount,
    bool IsValid
);
