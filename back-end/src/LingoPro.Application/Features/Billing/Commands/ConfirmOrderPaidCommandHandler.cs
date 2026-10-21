using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Billing.Commands;

/// <summary>
/// Marks an order as paid idempotently and grants individual, group, or challenge entitlements.
/// </summary>
public class ConfirmOrderPaidCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<ConfirmOrderPaidCommand, ApiResponse<OrderDto>>
{
    public async Task<ApiResponse<OrderDto>> Handle(ConfirmOrderPaidCommand request, CancellationToken ct)
    {
        string normalizedCode = request.TransferCode.Trim().ToUpperInvariant();
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.PaymentRef == normalizedCode, ct)
            ?? throw new NotFoundException("Order", normalizedCode);

        if (order.Status == OrderStatus.Paid)
        {
            string existingQr = $"https://img.vietqr.io/image/MB-0123456789-compact2.png?amount={order.Amount}&addInfo={order.PaymentRef}";
            return ApiResponse<OrderDto>.Ok(
                new OrderDto(
                    order.Id,
                    order.UserId ?? Guid.Empty,
                    order.Plan,
                    order.OrderKind,
                    order.PeriodMonths ?? 1,
                    order.Seats,
                    order.Amount,
                    order.Currency ?? "VND",
                    order.Status ?? OrderStatus.Pending,
                    order.PaymentRef ?? string.Empty,
                    existingQr,
                    order.CreatedAt ?? DateTime.UtcNow,
                    order.PaidAt),
                "Order was already marked as paid (idempotent response)."
            );
        }

        if (request.PaidAmount < order.Amount)
        {
            throw new DomainException(
                $"Paid amount ({request.PaidAmount}) is less than required order amount ({order.Amount}).",
                "INSUFFICIENT_PAYMENT_AMOUNT");
        }

        var nowUtc = DateTime.UtcNow;
        order.Status = OrderStatus.Paid;
        order.PaidAt = nowUtc;
        // SQL orders have no gateway_transaction_id column: keep it in the free-text note.
        if (!string.IsNullOrWhiteSpace(request.GatewayTransactionId))
        {
            order.Note = $"gateway_tx:{request.GatewayTransactionId}";
        }

        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == order.UserId, ct)
            ?? throw new NotFoundException("Profile", order.UserId);

        if (order.OrderKind == OrderKind.Individual)
        {
            DateTime baseDate = profile.PlanExpiresAt.HasValue && profile.PlanExpiresAt.Value > nowUtc
                ? profile.PlanExpiresAt.Value
                : nowUtc;
            profile.GrantSubscriptionEntitlement(order.Plan, baseDate.AddMonths(order.PeriodMonths ?? 1));
        }
        else if (order.OrderKind == OrderKind.Group)
        {
            var existingGroup = await dbContext.StudyGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.OwnerId == profile.Id, ct);

            DateTime baseExpiry = existingGroup != null && existingGroup.ExpiresAt > nowUtc
                ? existingGroup.ExpiresAt.Value
                : nowUtc;
            DateTime newExpiry = baseExpiry.AddMonths(order.PeriodMonths ?? 1);

            if (existingGroup == null)
            {
                existingGroup = new StudyGroup
                {
                    OwnerId = profile.Id,
                    InviteCode = $"GRP-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
                    SeatLimit = order.Seats,
                    Status = "active",
                    OrderId = order.Id,
                    ExpiresAt = newExpiry
                };
                dbContext.StudyGroups.Add(existingGroup);
                dbContext.GroupMembers.Add(new GroupMember
                {
                    GroupId = existingGroup.Id,
                    UserId = profile.Id,
                    JoinedAt = nowUtc
                });
            }
            else
            {
                existingGroup.Status = "active";
                existingGroup.SeatLimit = Math.Max(existingGroup.SeatLimit, order.Seats);
                existingGroup.ExpiresAt = newExpiry;
            }

            profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Pro, newExpiry);
        }
        else if (order.OrderKind == OrderKind.Challenge)
        {
            var participant = await dbContext.ChallengeParticipants
                .FirstOrDefaultAsync(cp =>
                    cp.OrderId == order.Id, ct);

            if (participant != null)
            {
                participant.Status = ChallengeParticipantStatus.Active;
                participant.OrderId = order.Id;
            }
        }

        await dbContext.SaveChangesAsync(ct);

        string qrUrl = $"https://img.vietqr.io/image/MB-0123456789-compact2.png?amount={order.Amount}&addInfo={order.PaymentRef}";
        var dto = new OrderDto(
            order.Id,
            order.UserId ?? Guid.Empty,
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

        return ApiResponse<OrderDto>.Ok(dto, "Payment confirmed and entitlement activated successfully.");
    }
}
