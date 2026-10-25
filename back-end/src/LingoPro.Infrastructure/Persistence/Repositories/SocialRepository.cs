using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Social;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing referral attribution, reward aggregation, and study group membership queries and mutations.
/// </summary>
public sealed class SocialRepository(IApplicationDbContext dbContext) : ISocialRepository
{
    public Task<ReferralLog?> GetReferralLogByRefereeIdAsNoTrackingAsync(Guid refereeId, CancellationToken ct = default)
        => dbContext.ReferralLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IsDeleted != true && x.RefereeId == refereeId, ct);

    public Task<ReferralLink?> GetReferralLinkByCodeAsNoTrackingAsync(string code, CancellationToken ct = default)
        => dbContext.ReferralLinks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IsDeleted != true && x.ReferralCode == code, ct);

    public Task<Guid?> GetLatestActiveReferralCampaignIdAsync(CancellationToken ct = default)
        => dbContext.ReferralCampaigns
            .AsNoTracking()
            .Where(x => x.IsDeleted != true && x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(ct);

    public void AddReferralLog(ReferralLog log)
        => dbContext.ReferralLogs.Add(log);

    public Task<StudyGroup?> GetStudyGroupByInviteCodeAsync(string inviteCode, CancellationToken ct = default)
        => dbContext.StudyGroups.FirstOrDefaultAsync(x => x.IsDeleted != true && x.InviteCode == inviteCode, ct);

    public Task<int> GetGroupMemberCountAsync(Guid groupId, CancellationToken ct = default)
        => dbContext.GroupMembers.CountAsync(x => x.GroupId == groupId, ct);

    public Task<bool> IsGroupMemberAsync(Guid groupId, Guid userId, CancellationToken ct = default)
        => dbContext.GroupMembers.AnyAsync(x => x.GroupId == groupId && x.UserId == userId, ct);

    public void AddGroupMember(GroupMember member)
        => dbContext.GroupMembers.Add(member);

    public Task<ReferralLink?> GetReferralLinkByUserIdAsync(Guid userId, CancellationToken ct = default)
        => dbContext.ReferralLinks.FirstOrDefaultAsync(x => x.IsDeleted != true && x.UserId == userId, ct);

    public void AddReferralLink(ReferralLink link)
        => dbContext.ReferralLinks.Add(link);

    public Task<List<ReferralLog>> GetReferralLogsByReferrerAsNoTrackingAsync(Guid referrerId, CancellationToken ct = default)
        => dbContext.ReferralLogs
            .AsNoTracking()
            .Where(x => x.IsDeleted != true && x.ReferrerId == referrerId)
            .ToListAsync(ct);

    public Task<int> GetAvailableRewardSumAsync(Guid userId, CancellationToken ct = default)
        => dbContext.RewardTransactions
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.Status == "available")
            .SumAsync(x => x.Amount, ct);

    public async Task<List<StudyGroup>> GetUserStudyGroupsAsNoTrackingAsync(Guid userId, CancellationToken ct = default)
    {
        var groupIds = await dbContext.GroupMembers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.GroupId)
            .ToListAsync(ct);

        return await dbContext.StudyGroups
            .AsNoTracking()
            .Where(x => x.IsDeleted != true && groupIds.Contains(x.Id))
            .ToListAsync(ct);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
