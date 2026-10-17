using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Social;

/// <summary>
/// Query to retrieve the authenticated user's referral hub statistics and active study groups.
/// </summary>
public sealed record GetReferralHubQuery : IRequest<ApiResponse<ReferralHubDto>>;
