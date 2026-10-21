using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
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
                c.IsActive == true &&
                (c.MaxUses == null || c.UsedCount < c.MaxUses) &&
                (c.ValidFrom == null || c.ValidFrom <= DateTime.UtcNow) &&
                (c.ValidUntil == null || c.ValidUntil > DateTime.UtcNow), ct)
                ?? throw new DomainException("The coupon code is invalid, expired, or has reached its usage limit.", "INVALID_COUPON");

            // SQL coupons carry either discount_pct or a fixed discount_amount (no max-discount cap column).
            decimal discount = coupon.DiscountPct.HasValue
                ? rawAmount * coupon.DiscountPct.Value / 100m
                : (coupon.DiscountAmount ?? 0);

            rawAmount = Math.Max(10000m, rawAmount - discount);
            coupon.UsedCount = (coupon.UsedCount ?? 0) + 1;
        }

        string transferCode = $"LP{DateTime.UtcNow:yyMMdd}{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var order = new Order
        {
            UserId = userId,
            Plan = request.PlanId,
            OrderKind = request.OrderKind,
            PeriodMonths = request.DurationMonths,
            Seats = request.OrderKind == OrderKind.Group ? Math.Clamp(request.SeatLimit, 2, 20) : 1,
            Amount = (int)Math.Round(rawAmount, 0),
            Currency = "VND",
            Status = OrderStatus.Pending,
            // SQL orders have no transfer_code column: the bank-transfer code is stored in payment_ref.
            PaymentRef = transferCode,
            CouponCode = normalizedCoupon
        };

        dbContext.Orders.Add(order);

        // SQL orders have no target_challenge_id column: the order<->challenge link is the pending
        // challenge_participants row carrying order_id.
        if (request.OrderKind == OrderKind.Challenge && request.TargetChallengeId.HasValue)
        {
            dbContext.ChallengeParticipants.Add(new ChallengeParticipant
            {
                ChallengeId = request.TargetChallengeId.Value,
                UserId = userId,
                OrderId = order.Id,
                Status = ChallengeParticipantStatus.Pending
            });
        }

        await dbContext.SaveChangesAsync(ct);

        string qrUrl = $"https://img.vietqr.io/image/MB-0123456789-compact2.png?amount={order.Amount}&addInfo={order.PaymentRef}";

        var dto = new OrderDto(
            order.Id,
            order.UserId ?? userId,
            order.Plan,
            order.OrderKind,
            order.PeriodMonths ?? 1,
            order.Seats,
            order.Amount,
            order.Currency ?? "VND",
            order.Status ?? OrderStatus.Pending,
            order.PaymentRef ?? string.Empty,
            qrUrl,
            order.CreatedAt ?? DateTime.UtcNow,
            order.PaidAt
        );

        return ApiResponse<OrderDto>.Created(dto, "Subscription order created successfully.");
    }
}
