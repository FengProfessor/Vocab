using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Social.Queries;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Social.Commands;

/// <summary>
/// Attributes a new user to the referrer owning the code. Mirrors the original /api/referral/claim rules:
/// idempotent per referee, unknown codes are rejected, and self-referral is forbidden.
/// </summary>
public sealed class ClaimReferralCommandHandler(
    ICurrentUserService currentUser,
    ISocialRepository socialRepository) : IRequestHandler<ClaimReferralCommand, ApiResponse<ClaimReferralResultDto>>
{
    public async Task<ApiResponse<ClaimReferralResultDto>> Handle(ClaimReferralCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var code = request.ReferralCode.Trim().ToUpperInvariant();

        var existing = await socialRepository.GetReferralLogByRefereeIdAsNoTrackingAsync(userId, ct);
        if (existing is not null)
        {
            return ApiResponse<ClaimReferralResultDto>.Ok(
                new ClaimReferralResultDto(true, existing.ReferralCode),
                "Referral already attributed to this account.");
        }

        var link = await socialRepository.GetReferralLinkByCodeAsNoTrackingAsync(code, ct)
            ?? throw new NotFoundException("ReferralCode", code);

        if (link.UserId == userId)
        {
            throw new DomainException("You cannot use your own referral code.", "SELF_REFERRAL");
        }

        var campaignId = await socialRepository.GetLatestActiveReferralCampaignIdAsync(ct);

        socialRepository.AddReferralLog(new ReferralLog
        {
            ReferrerId = link.UserId,
            RefereeId = userId,
            CampaignId = campaignId,
            ReferralCode = code,
            Status = "registered"
        });
        await socialRepository.SaveChangesAsync(ct);

        return ApiResponse<ClaimReferralResultDto>.Ok(
            new ClaimReferralResultDto(false, code),
            "Referral attributed successfully.");
    }
}
