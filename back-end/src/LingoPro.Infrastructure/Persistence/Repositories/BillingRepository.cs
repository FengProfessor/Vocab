using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Entities.Social;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing billing order, coupon validation, and entitlement fulfillment operations.
/// </summary>
public sealed class BillingRepository(IApplicationDbContext dbContext) : IBillingRepository
{
    public Task<Coupon?> GetActiveValidCouponAsync(string normalizedCode, DateTime nowUtc, CancellationToken ct = default)
        => dbContext.Coupons.FirstOrDefaultAsync(
            c => c.IsDeleted != true &&
                 c.Code == normalizedCode &&
                 c.IsActive == true &&
                 (c.MaxUses == null || c.UsedCount < c.MaxUses) &&
                 (c.ValidFrom == null || c.ValidFrom <= nowUtc) &&
                 (c.ValidUntil == null || c.ValidUntil > nowUtc),
            ct);

    public Task<Coupon?> GetActiveValidCouponAsNoTrackingAsync(string normalizedCode, DateTime nowUtc, CancellationToken ct = default)
        => dbContext.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.IsDeleted != true &&
                     c.Code == normalizedCode &&
                     c.IsActive == true &&
                     (c.MaxUses == null || c.UsedCount < c.MaxUses) &&
                     (c.ValidFrom == null || c.ValidFrom <= nowUtc) &&
                     (c.ValidUntil == null || c.ValidUntil > nowUtc),
                ct);

    public void AddOrder(Order order)
        => dbContext.Orders.Add(order);

    public void AddChallengeParticipant(ChallengeParticipant participant)
        => dbContext.ChallengeParticipants.Add(participant);

    public Task<Order?> GetOrderByPaymentRefAsync(string normalizedCode, CancellationToken ct = default)
        => dbContext.Orders.FirstOrDefaultAsync(o => o.IsDeleted != true && o.PaymentRef == normalizedCode, ct);

    public Task<Profile?> GetProfileByIdAsync(Guid? userId, CancellationToken ct = default)
        => dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId && p.IsDeleted != true, ct);

    public Task<StudyGroup?> GetStudyGroupWithMembersByOwnerIdAsync(Guid ownerId, CancellationToken ct = default)
        => dbContext.StudyGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.IsDeleted != true && g.OwnerId == ownerId, ct);

    public void AddStudyGroup(StudyGroup group)
        => dbContext.StudyGroups.Add(group);

    public void AddGroupMember(GroupMember member)
        => dbContext.GroupMembers.Add(member);

    public Task<ChallengeParticipant?> GetChallengeParticipantByOrderIdAsync(Guid orderId, CancellationToken ct = default)
        => dbContext.ChallengeParticipants.FirstOrDefaultAsync(cp => cp.OrderId == orderId, ct);

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
