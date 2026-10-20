using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Billing.Commands;

/// <summary>
/// Command to create a new subscription or challenge deposit order.
/// </summary>
[Authorize]
public record CreateOrderCommand(
    SubscriptionPlanType PlanId,
    OrderKind OrderKind,
    int DurationMonths,
    int SeatLimit = 1,
    string? CouponCode = null,
    Guid? TargetChallengeId = null) : IRequest<ApiResponse<OrderDto>>;
