using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Entities.Social;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for subscription orders, coupon validation, and entitlement fulfillment.
/// </summary>
public interface IBillingRepository
{
    Task<Coupon?> GetActiveValidCouponAsync(string normalizedCode, DateTime nowUtc, CancellationToken ct = default);

    Task<Coupon?> GetActiveValidCouponAsNoTrackingAsync(string normalizedCode, DateTime nowUtc, CancellationToken ct = default);

    void AddOrder(Order order);

    void AddChallengeParticipant(ChallengeParticipant participant);

    Task<Order?> GetOrderByPaymentRefAsync(string normalizedCode, CancellationToken ct = default);

    Task<Profile?> GetProfileByIdAsync(Guid? userId, CancellationToken ct = default);

    Task<StudyGroup?> GetStudyGroupWithMembersByOwnerIdAsync(Guid ownerId, CancellationToken ct = default);

    void AddStudyGroup(StudyGroup group);

    void AddGroupMember(GroupMember member);

    Task<ChallengeParticipant?> GetChallengeParticipantByOrderIdAsync(Guid orderId, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
