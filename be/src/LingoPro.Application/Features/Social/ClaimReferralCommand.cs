using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Social;

/// <summary>
/// Command to attribute the authenticated user (referee) to a referral code captured before sign-up.
/// </summary>
public sealed record ClaimReferralCommand(string ReferralCode) : IRequest<ApiResponse<ClaimReferralResultDto>>;
