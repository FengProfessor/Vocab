using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Social.Queries;

/// <summary>
/// Query to retrieve the authenticated user's referral hub statistics and active study groups.
/// </summary>
[Authorize]
public sealed record GetReferralHubQuery : IRequest<ApiResponse<ReferralHubDto>>;
