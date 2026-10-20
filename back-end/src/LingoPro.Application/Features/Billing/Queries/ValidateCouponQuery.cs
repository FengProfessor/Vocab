using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Billing.Queries;

/// <summary>
/// Query to validate a promotional coupon code in real time (never cached).
/// </summary>
public record ValidateCouponQuery(string Code) : IRequest<ApiResponse<CouponValidationDto>>;
