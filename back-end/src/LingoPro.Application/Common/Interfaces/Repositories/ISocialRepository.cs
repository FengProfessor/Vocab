using LingoPro.Domain.Entities.Social;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for the 5-tier referral program, reward transactions, and collaborative study groups.
/// </summary>
public interface ISocialRepository
{
    Task<ReferralLog?> GetReferralLogByRefereeIdAsNoTrackingAsync(Guid refereeId, CancellationToken ct = default);

    Task<ReferralLink?> GetReferralLinkByCodeAsNoTrackingAsync(string code, CancellationToken ct = default);

    Task<Guid?> GetLatestActiveReferralCampaignIdAsync(CancellationToken ct = default);

    void AddReferralLog(ReferralLog log);

    Task<StudyGroup?> GetStudyGroupByInviteCodeAsync(string inviteCode, CancellationToken ct = default);

    Task<int> GetGroupMemberCountAsync(Guid groupId, CancellationToken ct = default);

    Task<bool> IsGroupMemberAsync(Guid groupId, Guid userId, CancellationToken ct = default);

    void AddGroupMember(GroupMember member);

    Task<ReferralLink?> GetReferralLinkByUserIdAsync(Guid userId, CancellationToken ct = default);

    void AddReferralLink(ReferralLink link);

    Task<List<ReferralLog>> GetReferralLogsByReferrerAsNoTrackingAsync(Guid referrerId, CancellationToken ct = default);

    Task<int> GetAvailableRewardSumAsync(Guid userId, CancellationToken ct = default);

    Task<List<StudyGroup>> GetUserStudyGroupsAsNoTrackingAsync(Guid userId, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
