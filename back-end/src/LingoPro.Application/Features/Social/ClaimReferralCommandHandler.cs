using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Social;

/// <summary>
/// Attributes a new user to the referrer owning the code. Mirrors the original /api/referral/claim rules:
/// idempotent per referee, unknown codes are rejected, and self-referral is forbidden.
/// </summary>
public sealed class ClaimReferralCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<ClaimReferralCommand, ApiResponse<ClaimReferralResultDto>>
{
    public async Task<ApiResponse<ClaimReferralResultDto>> Handle(ClaimReferralCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var code = request.ReferralCode.Trim().ToUpperInvariant();

        var existing = await dbContext.ReferralLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.RefereeId == userId, ct);
        if (existing is not null)
        {
            return ApiResponse<ClaimReferralResultDto>.Ok(
                new ClaimReferralResultDto(true, existing.ReferralCode),
                "Referral already attributed to this account.");
        }

        var link = await dbContext.ReferralLinks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Code == code, ct)
            ?? throw new NotFoundException("ReferralCode", code);

        if (link.UserId == userId)
        {
            throw new DomainException("You cannot use your own referral code.", "SELF_REFERRAL");
        }

        var campaignId = await dbContext.ReferralCampaigns
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(ct);

        dbContext.ReferralLogs.Add(new ReferralLog
        {
            ReferrerId = link.UserId,
            RefereeId = userId,
            CampaignId = campaignId,
            ReferralCode = code,
            Status = ReferralLogStatus.Registered
        });
        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<ClaimReferralResultDto>.Ok(
            new ClaimReferralResultDto(false, code),
            "Referral attributed successfully.");
    }
}
