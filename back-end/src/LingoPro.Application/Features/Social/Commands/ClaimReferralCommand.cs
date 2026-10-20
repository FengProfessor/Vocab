using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Social.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Social.Commands;

/// <summary>
/// Command to attribute the authenticated user (referee) to a referral code captured before sign-up.
/// </summary>
[Authorize]
public sealed record ClaimReferralCommand(string ReferralCode) : IRequest<ApiResponse<ClaimReferralResultDto>>;
