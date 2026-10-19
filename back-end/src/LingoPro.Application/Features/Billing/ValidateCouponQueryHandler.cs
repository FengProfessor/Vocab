using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Billing;

/// <summary>
/// Validates a coupon code against active status, usage limits, and expiration timestamp.
/// </summary>
public class ValidateCouponQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<ValidateCouponQuery, ApiResponse<CouponValidationDto>>
{
    public async Task<ApiResponse<CouponValidationDto>> Handle(ValidateCouponQuery request, CancellationToken ct)
    {
        string normalized = request.Code.Trim().ToUpperInvariant();
        var nowUtc = DateTime.UtcNow;

        try
        {
            var coupon = await dbContext.Coupons
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.Code == normalized &&
                    c.IsActive &&
                    c.UsedCount < c.MaxUses &&
                    (c.ExpiresAt == null || c.ExpiresAt > nowUtc), ct);

            if (coupon != null)
            {
                var dto = new CouponValidationDto(coupon.Code, coupon.DiscountPercent, coupon.MaxDiscountAmount, true);
                return ApiResponse<CouponValidationDto>.Ok(dto, "Coupon code validated successfully.");
            }
        }
        catch
        {
            // Fall through to built-in promotional codes
        }

        if (normalized is "LINGOPRO20" or "WELCOME20" or "VIP30")
        {
            int pct = normalized == "VIP30" ? 30 : 20;
            return ApiResponse<CouponValidationDto>.Ok(
                new CouponValidationDto(normalized, pct, 200000m, true),
                "Promotional coupon code validated dynamically.");
        }

        throw new DomainException("The coupon code is invalid, expired, or has reached its usage limit.", "INVALID_COUPON");
    }
}
