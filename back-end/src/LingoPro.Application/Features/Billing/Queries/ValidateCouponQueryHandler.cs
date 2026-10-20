using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Billing.Queries;

/// <summary>
/// Validates a coupon code against active status, usage limits, and expiration timestamp in the database.
/// </summary>
public class ValidateCouponQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<ValidateCouponQuery, ApiResponse<CouponValidationDto>>
{
    public async Task<ApiResponse<CouponValidationDto>> Handle(ValidateCouponQuery request, CancellationToken ct)
    {
        string normalized = request.Code.Trim().ToUpperInvariant();
        var nowUtc = DateTime.UtcNow;

        var coupon = await dbContext.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.Code == normalized &&
                c.IsActive &&
                c.UsedCount < c.MaxUses &&
                (c.ExpiresAt == null || c.ExpiresAt > nowUtc), ct)
            ?? throw new DomainException("The coupon code is invalid, expired, or has reached its usage limit.", "INVALID_COUPON");

        var dto = new CouponValidationDto(coupon.Code, coupon.DiscountPercent, coupon.MaxDiscountAmount, true);
        return ApiResponse<CouponValidationDto>.Ok(dto, "Coupon code validated successfully.");
    }
}
