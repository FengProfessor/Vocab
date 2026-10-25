using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Social;
using MediatR;

namespace LingoPro.Application.Features.Social.Queries;

/// <summary>
/// Handles retrieving the authenticated user's referral statistics, rewards, and study groups via the social repository.
/// </summary>
public sealed class GetReferralHubQueryHandler(
    ICurrentUserService currentUser,
    ISocialRepository socialRepository) : IRequestHandler<GetReferralHubQuery, ApiResponse<ReferralHubDto>>
{
    public async Task<ApiResponse<ReferralHubDto>> Handle(GetReferralHubQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var referralLink = await socialRepository.GetReferralLinkByUserIdAsync(userId, ct);

        if (referralLink == null)
        {
            referralLink = new ReferralLink
            {
                UserId = userId,
                ReferralCode = $"REF-{userId.ToString("N")[..6].ToUpperInvariant()}",
                ClicksCount = 0
            };
            socialRepository.AddReferralLink(referralLink);
            await socialRepository.SaveChangesAsync(ct);
        }

        var logs = await socialRepository.GetReferralLogsByReferrerAsNoTrackingAsync(userId, ct);
        var rewards = await socialRepository.GetAvailableRewardSumAsync(userId, ct);
        var groups = await socialRepository.GetUserStudyGroupsAsNoTrackingAsync(userId, ct);

        // SQL groups has no name column: derive a display name from the invite code.
        var groupDtos = groups
            .Select(x => new StudyGroupDto(
                x.Id,
                $"Study group {x.InviteCode}",
                x.InviteCode,
                x.SeatLimit,
                StudyGroupDtoMapper.ParseStatus(x.Status),
                x.ExpiresAt))
            .ToList();

        return ApiResponse<ReferralHubDto>.Ok(
            new ReferralHubDto(
                referralLink.ReferralCode,
                logs.Count,
                logs.Count(x => x.Status is "activated" or "converted"),
                rewards,
                groupDtos),
            "Referral hub statistics retrieved successfully.");
    }
}
