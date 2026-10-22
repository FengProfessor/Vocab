using LingoPro.Application.Features.Social.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Social;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Social;

/// <summary>
/// Unit tests for <see cref="GetReferralHubQueryHandler"/> (plan IDs RF-04, RF-05..RF-08):
/// referral counts, reward ledger sum and pending-clearance handling.
/// </summary>
[TestFixture]
[Category("Social")]
public sealed class GetReferralHubQueryHandlerTests
{
    private static ReferralLog Log(Guid referrer, string status) => new()
    {
        ReferrerId = referrer,
        RefereeId = Guid.NewGuid(),
        ReferralCode = "REF-X",
        Status = status
    };

    /// <summary>RF-04: hub counts all referred users and only Activated/Converted as activated; others' logs ignored.</summary>
    [Test]
    [Property("PlanId", "RF-04")]
    public async Task Handle_Logs_CountsTotalAndActivated()
    {
        // Arrange
        var me = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.ReferralLinks.Add(new ReferralLink { UserId = me, ReferralCode = "MYCODE" });
        db.ReferralLogs.AddRange(
            Log(me, "registered"),
            Log(me, "activated"),
            Log(me, "converted"),
            Log(me, "fraud_flagged"),
            Log(Guid.NewGuid(), "activated"));
        await db.SaveChangesAsync();
        var handler = new GetReferralHubQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var response = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.ReferralCode, Is.EqualTo("MYCODE"));
            Assert.That(response.Data.TotalReferredUsers, Is.EqualTo(4));
            Assert.That(response.Data.ActivatedReferrals, Is.EqualTo(2));
        });
    }

    /// <summary>RF-04: hub creates a referral link on first visit and returns the same code afterwards.</summary>
    [Test]
    [Property("PlanId", "RF-04")]
    public async Task Handle_NoLink_CreatesLinkOnceAndReuses()
    {
        // Arrange
        var me = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new GetReferralHubQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var first = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);
        var second = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(first.Data!.ReferralCode, Is.Not.Empty);
            Assert.That(second.Data!.ReferralCode, Is.EqualTo(first.Data.ReferralCode));
            Assert.That(db.ReferralLinks.Count(), Is.EqualTo(1));
            Assert.That(first.Data.TotalReferredUsers, Is.EqualTo(0));
        });
    }

    /// <summary>RF-07: wallet sums only available rewards of the caller; pending/withdrawn/others excluded (original: src/app/api/referral/hub/route.ts:120-138).</summary>
    [Test]
    [Property("PlanId", "RF-07")]
    public async Task Handle_Rewards_SumsOnlyAvailableOfCaller()
    {
        // Arrange
        var me = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.RewardTransactions.AddRange(
            new RewardTransaction { UserId = me, RewardType = "affiliate_cash", Amount = 50000, Status = "available" },
            new RewardTransaction { UserId = me, RewardType = "affiliate_cash", Amount = 30000, Status = "available" },
            new RewardTransaction
            {
                UserId = me,
                RewardType = "affiliate_cash", Amount = 99000,
                Status = "pending_clearance",
                AvailableAt = DateTime.UtcNow.AddDays(3)
            },
            new RewardTransaction { UserId = me, RewardType = "affiliate_cash", Amount = 70000, Status = "withdrawn" },
            new RewardTransaction { UserId = Guid.NewGuid(), RewardType = "affiliate_cash", Amount = 1000000, Status = "available" });
        await db.SaveChangesAsync();
        var handler = new GetReferralHubQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var response = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.TotalAvailableRewardsVnd, Is.EqualTo(80000m));
    }

    /// <summary>RF-08: pending_clearance rewards whose available_at has passed must be auto-promoted and counted as available (original: hub/route.ts:126-146).</summary>
    [Test]
    [Property("PlanId", "RF-08")]
    [Category("KnownDeviation")]
    public async Task Handle_PendingRewardDueInThePast_IsPromotedToAvailable()
    {
        // Arrange
        var me = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.RewardTransactions.AddRange(
            new RewardTransaction { UserId = me, RewardType = "affiliate_cash", Amount = 40000, Status = "available" },
            new RewardTransaction
            {
                UserId = me,
                RewardType = "affiliate_cash", Amount = 60000,
                Status = "pending_clearance",
                AvailableAt = DateTime.UtcNow.AddDays(-1)
            },
            new RewardTransaction
            {
                UserId = me,
                RewardType = "affiliate_cash", Amount = 25000,
                Status = "pending_clearance",
                AvailableAt = DateTime.UtcNow.AddDays(5)
            });
        await db.SaveChangesAsync();
        var handler = new GetReferralHubQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var response = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.TotalAvailableRewardsVnd, Is.EqualTo(100000m));
    }

    /// <summary>RF-04: hub lists the groups the caller is a member of.</summary>
    [Test]
    [Property("PlanId", "RF-04")]
    public async Task Handle_GroupMembership_ListsGroups()
    {
        // Arrange
        var me = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var mine = new StudyGroup { InviteCode = "AAAAAA", OwnerId = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddDays(5) };
        var other = new StudyGroup { InviteCode = "BBBBBB", OwnerId = Guid.NewGuid(), ExpiresAt = DateTime.UtcNow.AddDays(5) };
        db.StudyGroups.AddRange(mine, other);
        db.GroupMembers.Add(new GroupMember { GroupId = mine.Id, UserId = me });
        await db.SaveChangesAsync();
        var handler = new GetReferralHubQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var response = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.ActiveGroups.Select(g => g.InviteCode), Is.EqualTo(new[] { "AAAAAA" }));
    }

    /// <summary>
    /// RF-07: payout_debit rows with status "deducted" carry a negative amount and reduce the wallet
    /// (original: src/app/api/referral/hub/route.ts:135-137). The handler ignores them.
    /// </summary>
    [Test]
    [Property("PlanId", "RF-07")]
    [Category("KnownDeviation")]
    public async Task Handle_DeductedPayoutDebit_ReducesWallet()
    {
        // Arrange
        var me = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.RewardTransactions.AddRange(
            new RewardTransaction { UserId = me, RewardType = "affiliate_cash", Amount = 100000, Status = "available" },
            new RewardTransaction { UserId = me, RewardType = "payout_debit", Amount = -100000, Status = "deducted" });
        await db.SaveChangesAsync();
        var handler = new GetReferralHubQueryHandler(TestHelpers.CreateUser(me), db);

        // Act
        var response = await handler.Handle(new GetReferralHubQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.TotalAvailableRewardsVnd, Is.EqualTo(0m));
    }
}