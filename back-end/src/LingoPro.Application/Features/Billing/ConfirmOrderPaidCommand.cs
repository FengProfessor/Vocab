using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Billing;

/// <summary>
/// Command to confirm an order payment and activate individual, group, or challenge entitlements.
/// </summary>
public record ConfirmOrderPaidCommand(
    string TransferCode,
    decimal PaidAmount,
    string GatewayTransactionId) : IRequest<ApiResponse<OrderDto>>;
