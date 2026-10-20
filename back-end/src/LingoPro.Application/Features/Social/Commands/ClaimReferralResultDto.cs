using LingoPro.Application.Features.Social.Queries;
namespace LingoPro.Application.Features.Social.Commands;

/// <summary>
/// Outcome of a referral attribution claim.
/// </summary>
/// <param name="AlreadyClaimed">True when the user already had a referral attribution.</param>
/// <param name="ReferralCode">The attributed referral code.</param>
public sealed record ClaimReferralResultDto(bool AlreadyClaimed, string ReferralCode);
