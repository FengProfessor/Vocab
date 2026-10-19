namespace LingoPro.Application.Features.Social;

/// <summary>
/// Data transfer object representing a user's referral hub metrics and study group memberships.
/// </summary>
public sealed record ReferralHubDto(
    string ReferralCode,
    int TotalReferredUsers,
    int ActivatedReferrals,
    decimal TotalAvailableRewardsVnd,
    IReadOnlyList<StudyGroupDto> ActiveGroups);
