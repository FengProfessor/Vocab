using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Social.Queries;

/// <summary>
/// Handles retrieving the authenticated user's referral statistics, rewards, and study groups from the database.
/// </summary>
public sealed class GetReferralHubQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetReferralHubQuery, ApiResponse<ReferralHubDto>>
{
    public async Task<ApiResponse<ReferralHubDto>> Handle(GetReferralHubQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var referralLink = await dbContext.ReferralLinks
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);

        if (referralLink == null)
        {
            referralLink = new ReferralLink
            {
                UserId = userId,
                ReferralCode = $"REF-{userId.ToString("N")[..6].ToUpperInvariant()}",
                ClicksCount = 0
            };
            dbContext.ReferralLinks.Add(referralLink);
            await dbContext.SaveChangesAsync(ct);
        }

        var logs = await dbContext.ReferralLogs
            .AsNoTracking()
            .Where(x => x.ReferrerId == userId)
            .ToListAsync(ct);

        var rewards = await dbContext.RewardTransactions
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.Status == "available")
            .SumAsync(x => x.Amount, ct);

        var groupIds = await dbContext.GroupMembers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.GroupId)
            .ToListAsync(ct);

        var groups = await dbContext.StudyGroups
            .AsNoTracking()
            .Where(x => groupIds.Contains(x.Id))
            .ToListAsync(ct);

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
