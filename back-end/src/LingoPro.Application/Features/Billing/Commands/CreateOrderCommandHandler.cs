using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Billing.Commands;

/// <summary>
/// Creates a pending subscription or challenge order in the database and generates a VietQR bank transfer payload.
/// </summary>
public class CreateOrderCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<CreateOrderCommand, ApiResponse<OrderDto>>
{
    public async Task<ApiResponse<OrderDto>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        decimal baseMonthlyPrice = request.PlanId == SubscriptionPlanType.Premium ? 199000m : 99000m;
        decimal rawAmount = baseMonthlyPrice
            * request.DurationMonths
            * (request.OrderKind == OrderKind.Group ? Math.Max(2, request.SeatLimit) * 0.75m : 1m);

        string? normalizedCoupon = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            normalizedCoupon = request.CouponCode.Trim().ToUpperInvariant();
            var coupon = await dbContext.Coupons.FirstOrDefaultAsync(c =>
                c.Code == normalizedCoupon &&
                c.IsActive &&
                c.UsedCount < c.MaxUses &&
                (c.ExpiresAt == null || c.ExpiresAt > DateTime.UtcNow), ct)
                ?? throw new DomainException("The coupon code is invalid, expired, or has reached its usage limit.", "INVALID_COUPON");

            decimal discount = rawAmount * coupon.DiscountPercent / 100m;
            if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
            {
                discount = coupon.MaxDiscountAmount.Value;
            }

            rawAmount = Math.Max(10000m, rawAmount - discount);
            coupon.UsedCount += 1;
        }

        string transferCode = $"LP{DateTime.UtcNow:yyMMdd}{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var order = new Order
        {
            UserId = userId,
            PlanId = request.PlanId,
            OrderKind = request.OrderKind,
            DurationMonths = request.DurationMonths,
            SeatLimit = request.OrderKind == OrderKind.Group ? Math.Clamp(request.SeatLimit, 2, 20) : 1,
            TargetChallengeId = request.TargetChallengeId,
            Amount = Math.Round(rawAmount, 0),
            Currency = "VND",
            Status = OrderStatus.Pending,
            TransferCode = transferCode,
            CouponCode = normalizedCoupon
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(ct);

        string qrUrl = $"https://img.vietqr.io/image/MB-0123456789-compact2.png?amount={order.Amount}&addInfo={order.TransferCode}";

        var dto = new OrderDto(
            order.Id,
            order.UserId,
            order.PlanId,
            order.OrderKind,
            order.DurationMonths,
            order.SeatLimit,
            order.Amount,
            order.Currency,
            order.Status,
            order.TransferCode,
            qrUrl,
            order.CreatedAt,
            order.PaidAt
        );

        return ApiResponse<OrderDto>.Created(dto, "Subscription order created successfully.");
    }
}
