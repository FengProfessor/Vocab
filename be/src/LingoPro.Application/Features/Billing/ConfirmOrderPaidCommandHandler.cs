using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Billing;

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
            .FirstOrDefaultAsync(o => o.TransferCode == normalizedCode, ct)
            ?? throw new NotFoundException("Order", normalizedCode);

        if (order.Status == OrderStatus.Paid)
        {
            string existingQr = $"https://img.vietqr.io/image/MB-0123456789-compact2.png?amount={order.Amount}&addInfo={order.TransferCode}";
            return ApiResponse<OrderDto>.Ok(
                new OrderDto(
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
                    existingQr,
                    order.CreatedAt,
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
        order.GatewayTransactionId = request.GatewayTransactionId;

        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == order.UserId, ct)
            ?? throw new NotFoundException("Profile", order.UserId);

        if (order.OrderKind == OrderKind.Individual)
        {
            DateTime baseDate = profile.PlanExpiresAt.HasValue && profile.PlanExpiresAt.Value > nowUtc
                ? profile.PlanExpiresAt.Value
                : nowUtc;
            profile.GrantSubscriptionEntitlement(order.PlanId, baseDate.AddMonths(order.DurationMonths));
        }
        else if (order.OrderKind == OrderKind.Group)
        {
            var existingGroup = await dbContext.StudyGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.OwnerId == order.UserId, ct);

            DateTime baseExpiry = existingGroup != null && existingGroup.ExpiresAt > nowUtc
                ? existingGroup.ExpiresAt
                : nowUtc;
            DateTime newExpiry = baseExpiry.AddMonths(order.DurationMonths);

            if (existingGroup == null)
            {
                existingGroup = new StudyGroup
                {
                    Name = $"{profile.FullName}'s Pro Group",
                    OwnerId = order.UserId,
                    InviteCode = $"GRP-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
                    SeatLimit = order.SeatLimit,
                    Status = StudyGroupStatus.Active,
                    ExpiresAt = newExpiry
                };
                dbContext.StudyGroups.Add(existingGroup);
                dbContext.GroupMembers.Add(new GroupMember
                {
                    GroupId = existingGroup.Id,
                    UserId = order.UserId,
                    JoinedAt = nowUtc
                });
            }
            else
            {
                existingGroup.Status = StudyGroupStatus.Active;
                existingGroup.SeatLimit = Math.Max(existingGroup.SeatLimit, order.SeatLimit);
                existingGroup.ExpiresAt = newExpiry;
            }

            profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Pro, newExpiry);
        }
        else if (order.OrderKind == OrderKind.Challenge)
        {
            var participant = await dbContext.ChallengeParticipants
                .FirstOrDefaultAsync(cp =>
                    cp.OrderId == order.Id ||
                    (cp.ChallengeId == order.TargetChallengeId && cp.UserId == order.UserId), ct);

            if (participant != null)
            {
                participant.Status = ChallengeParticipantStatus.Active;
                participant.OrderId = order.Id;
            }
        }

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

        return ApiResponse<OrderDto>.Ok(dto, "Payment confirmed and entitlement activated successfully.");
    }
}
