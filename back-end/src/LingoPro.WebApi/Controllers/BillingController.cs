using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Billing.Commands;
using LingoPro.Application.Features.Billing.Queries;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for coupon validation, VietQR order creation, and payment confirmation.
/// </summary>
[Route("api/v1/billing")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class BillingController : ApiControllerBase
{
    [HttpGet("coupons/validate")]
    public async Task<ActionResult<ApiResponse<CouponValidationDto>>> ValidateCoupon(
        [FromQuery] string code,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new ValidateCouponQuery(code), ct);
        return OkResponse(result, "Coupon validation completed.");
    }

    [HttpPost("orders")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder(
        [FromBody] CreateOrderCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result, "Payment order created successfully.");
    }

    [HttpPost("orders/confirm-paid")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> ConfirmOrderPaid(
        [FromBody] ConfirmOrderPaidCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return OkResponse(result, "Order payment confirmed and subscription activated.");
    }
}
