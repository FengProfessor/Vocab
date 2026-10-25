using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Billing.Queries;

/// <summary>
/// Validates a coupon code against active status, usage limits, and expiration timestamp in the database.
/// </summary>
public class ValidateCouponQueryHandler(IBillingRepository billingRepository)
    : IRequestHandler<ValidateCouponQuery, ApiResponse<CouponValidationDto>>
{
    public async Task<ApiResponse<CouponValidationDto>> Handle(ValidateCouponQuery request, CancellationToken ct)
    {
        string normalized = request.Code.Trim().ToUpperInvariant();
        var nowUtc = DateTime.UtcNow;

        var coupon = await billingRepository.GetActiveValidCouponAsNoTrackingAsync(normalized, nowUtc, ct)
            ?? throw new DomainException("The coupon code is invalid, expired, or has reached its usage limit.", "INVALID_COUPON");

        var dto = new CouponValidationDto(coupon.Code, coupon.DiscountPct ?? 0, coupon.DiscountAmount, true);
        // SQL coupons are either percent (discount_pct) or fixed amount (discount_amount). The DTO shape is kept:
        // percent coupons return DiscountPercent; fixed-amount coupons return DiscountPercent = 0 and the fixed value in MaxDiscountAmount.
        return ApiResponse<CouponValidationDto>.Ok(dto, "Coupon code validated successfully.");
    }
}
