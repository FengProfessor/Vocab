using LingoPro.Application.Features.Billing.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Billing;

/// <summary>
/// NUnit business unit tests for <see cref="ConfirmOrderPaidCommandHandler"/>: entitlement activation, renewal stacking,
/// idempotency, tier protection, underpayment, group and challenge orders (plan IDs BIL-20..BIL-29).
/// Original rules come from the production RPC <c>confirm_paid_order</c>
/// (supabase/migrations/20260710_atomic_paid_order_confirmation.sql) and src/lib/billing.ts:601-657.
/// </summary>
[TestFixture]
[Category("Billing")]
public sealed class ConfirmOrderPaidCommandHandlerTests
{
    private const string Code = "LP260101ABC123";

    private static Profile NewProfile(
        SubscriptionPlanType plan = SubscriptionPlanType.Free,
        DateTime? expiresAt = null) => new()
    {
        Id = Guid.NewGuid(),
        Email = $"{Guid.NewGuid():N}@lingopro.online",
        FullName = "Buyer",
        Plan = plan,
        PlanExpiresAt = expiresAt
    };

    /// <summary>Builds an order aligned to <c>public.orders</c> (the transfer code lives in <c>PaymentRef</c>).</summary>
    private static Order NewOrder(
        Guid userId,
        OrderKind kind = OrderKind.Individual,
        SubscriptionPlanType plan = SubscriptionPlanType.Pro,
        int months = 1,
        int amount = 79000,
        int seats = 1,
        OrderStatus status = OrderStatus.Pending,
        string? couponCode = null) => new()
    {
        UserId = userId,
        OrderKind = kind,
        Plan = plan,
        PeriodMonths = months,
        Amount = amount,
        Seats = seats,
        Status = status,
        PaymentRef = Code,
        CouponCode = couponCode
    };

    private static async Task<LingoProDbContext> SeedAsync(Profile profile, Order order)
    {
        var db = TestHelpers.CreateDb();
        db.Profiles.Add(profile);
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return db;
    }

    private static ConfirmOrderPaidCommand Pay(decimal amount, string code = Code, string tx = "TX-1") =>
        new(code, amount, tx);

    /// <summary>BIL-20: first confirmation marks the order paid and grants the plan for the purchased term (confirm_paid_order lines 77-85).</summary>
    [TestCase(1)]
    [TestCase(3)]
    [TestCase(12)]
    [Property("PlanId", "BIL-20")]
    public async Task Handle_FirstConfirmationOfIndividualOrder_GrantsPlanForTerm(int months)
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, months: months));
        var handler = new ConfirmOrderPaidCommandHandler(db);
        var before = DateTime.UtcNow;

        // Act
        var response = await handler.Handle(Pay(79000m, tx: "GW-9"), CancellationToken.None);

        // Assert
        var after = DateTime.UtcNow;
        var savedProfile = await db.Profiles.SingleAsync();
        var savedOrder = await db.Orders.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.Status, Is.EqualTo(OrderStatus.Paid));
            Assert.That(savedOrder.Status, Is.EqualTo(OrderStatus.Paid));
            Assert.That(savedOrder.PaidAt, Is.Not.Null);
            Assert.That(savedOrder.Note, Is.EqualTo("gateway_tx:GW-9"), "SQL orders have no gateway column; the handler keeps it in note.");
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(savedProfile.PlanExpiresAt, Is.InRange(before.AddMonths(months), after.AddMonths(months)));
        });
    }

    /// <summary>BIL-20: the paid order records <c>starts_at</c>/<c>expires_at</c> of the granted term — confirm_paid_order lines 167-170.</summary>
    [Test]
    [Property("PlanId", "BIL-20")]
    [Category("KnownDeviation")] // C# never fills Order.StartsAt / Order.ExpiresAt.
    public async Task Handle_FirstConfirmation_RecordsStartsAtAndExpiresAtOnOrder()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, months: 3));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(79000m), CancellationToken.None);

        // Assert
        var savedOrder = await db.Orders.SingleAsync();
        var savedProfile = await db.Profiles.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(savedOrder.StartsAt, Is.Not.Null);
            Assert.That(savedOrder.ExpiresAt, Is.EqualTo(savedProfile.PlanExpiresAt));
        });
    }

    /// <summary>BIL-20: a successful payment writes a <c>subscription_history</c> row (reason payment, order link) — confirm_paid_order lines 87-92.</summary>
    [Test]
    [Property("PlanId", "BIL-20")]
    [Category("KnownDeviation")] // C# ConfirmOrderPaid does not write SubscriptionHistory.
    public async Task Handle_FirstConfirmation_WritesPaymentSubscriptionHistory()
    {
        // Arrange
        var profile = NewProfile();
        var order = NewOrder(profile.Id);
        await using var db = await SeedAsync(profile, order);
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(79000m), CancellationToken.None);

        // Assert
        var history = await db.SubscriptionHistories.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(history.UserId, Is.EqualTo(profile.Id));
            Assert.That(history.OldPlan, Is.EqualTo(SubscriptionPlanType.Free));
            Assert.That(history.NewPlan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(history.Reason, Is.EqualTo(SubscriptionChangeReason.Payment));
            Assert.That(history.OrderId, Is.EqualTo(order.Id));
        });
    }

    /// <summary>BIL-17: confirming an order that carries a coupon increments the coupon <c>used_count</c> — confirm_paid_order lines 178-182.</summary>
    [Test]
    [Property("PlanId", "BIL-17")]
    [Category("KnownDeviation")] // C# increments UsedCount at order creation and never at confirmation.
    public async Task Handle_ConfirmationOfOrderWithCoupon_IncrementsCouponUsedCount()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, couponCode: "SAVE20"));
        db.Coupons.Add(new Coupon { Code = "SAVE20", DiscountPct = 20, UsedCount = 0 });
        await db.SaveChangesAsync();
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(79000m), CancellationToken.None);

        // Assert
        Assert.That((await db.Coupons.SingleAsync()).UsedCount, Is.EqualTo(1));
    }

    /// <summary>BIL-21: renewing an active plan stacks the new term on top of the current expiry (confirm_paid_order lines 77-81).</summary>
    [Test]
    [Property("PlanId", "BIL-21")]
    public async Task Handle_RenewalWhilePlanActive_StacksFromCurrentExpiry()
    {
        // Arrange
        var currentExpiry = DateTime.UtcNow.AddDays(10);
        var profile = NewProfile(SubscriptionPlanType.Pro, currentExpiry);
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, months: 1));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(79000m), CancellationToken.None);

        // Assert
        var savedProfile = await db.Profiles.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(savedProfile.PlanExpiresAt, Is.EqualTo(currentExpiry.AddMonths(1)));
        });
    }

    /// <summary>BIL-21: when the plan already expired the new term starts from now, not from the stale expiry.</summary>
    [Test]
    [Property("PlanId", "BIL-21")]
    public async Task Handle_RenewalAfterExpiry_StartsFromNow()
    {
        // Arrange
        var profile = NewProfile(SubscriptionPlanType.Pro, DateTime.UtcNow.AddDays(-20));
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, months: 1));
        var handler = new ConfirmOrderPaidCommandHandler(db);
        var before = DateTime.UtcNow;

        // Act
        await handler.Handle(Pay(79000m), CancellationToken.None);

        // Assert
        var after = DateTime.UtcNow;
        var savedProfile = await db.Profiles.SingleAsync();
        Assert.That(savedProfile.PlanExpiresAt, Is.InRange(before.AddMonths(1), after.AddMonths(1)));
    }

    /// <summary>BIL-22: confirming the same order twice is idempotent and does not extend the plan again (SRS_07 line 154).</summary>
    [Test]
    [Property("PlanId", "BIL-22")]
    public async Task Handle_SecondConfirmation_IsIdempotentAndDoesNotChangeEntitlement()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id));
        var handler = new ConfirmOrderPaidCommandHandler(db);
        await handler.Handle(Pay(79000m, tx: "GW-1"), CancellationToken.None);
        var firstExpiry = (await db.Profiles.SingleAsync()).PlanExpiresAt;
        var firstPaidAt = (await db.Orders.SingleAsync()).PaidAt;

        // Act
        var second = await handler.Handle(Pay(79000m, tx: "GW-2"), CancellationToken.None);

        // Assert
        var savedProfile = await db.Profiles.SingleAsync();
        var savedOrder = await db.Orders.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(second.Success, Is.True);
            Assert.That(second.Data!.Status, Is.EqualTo(OrderStatus.Paid));
            Assert.That(savedProfile.PlanExpiresAt, Is.EqualTo(firstExpiry));
            Assert.That(savedOrder.PaidAt, Is.EqualTo(firstPaidAt));
            Assert.That(savedOrder.Note, Is.EqualTo("gateway_tx:GW-1"));
        });
    }

    /// <summary>BIL-22: the transfer code (payment_ref) lookup is trimmed and case-insensitive.</summary>
    [Test]
    [Property("PlanId", "BIL-22")]
    public async Task Handle_LowercaseTransferCodeWithSpaces_FindsOrder()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        var response = await handler.Handle(Pay(79000m, code: "  lp260101abc123 "), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.TransferCode, Is.EqualTo(Code));
    }

    /// <summary>BIL-20: unknown transfer code is reported as not found (confirm_paid_order "Order not found").</summary>
    [Test]
    [Property("PlanId", "BIL-20")]
    public async Task Handle_UnknownTransferCode_ThrowsNotFound()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(Pay(79000m, code: "NOPE"), CancellationToken.None));
    }

    /// <summary>
    /// BIL-23: an active Premium holder buying Pro keeps Premium but the expiry is still extended
    /// (product-owner pinned tier protection; SRS_14 line 18 "never downgrade"; the individual RPC path itself would overwrite the plan).
    /// </summary>
    [Test]
    [Property("PlanId", "BIL-23")]
    public async Task Handle_ActivePremiumBuysPro_KeepsPremiumAndExtendsExpiry()
    {
        // Arrange
        var currentExpiry = DateTime.UtcNow.AddDays(30);
        var profile = NewProfile(SubscriptionPlanType.Premium, currentExpiry);
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, plan: SubscriptionPlanType.Pro, months: 1));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(79000m), CancellationToken.None);

        // Assert
        var savedProfile = await db.Profiles.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Premium));
            Assert.That(savedProfile.PlanExpiresAt, Is.EqualTo(currentExpiry.AddMonths(1)));
        });
    }

    /// <summary>BIL-23: an active Pro holder buying Premium is upgraded.</summary>
    [Test]
    [Property("PlanId", "BIL-23")]
    public async Task Handle_ActiveProBuysPremium_UpgradesToPremium()
    {
        // Arrange
        var profile = NewProfile(SubscriptionPlanType.Pro, DateTime.UtcNow.AddDays(5));
        await using var db = await SeedAsync(
            profile, NewOrder(profile.Id, plan: SubscriptionPlanType.Premium, amount: 129000));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(129000m), CancellationToken.None);

        // Assert
        Assert.That((await db.Profiles.SingleAsync()).Plan, Is.EqualTo(SubscriptionPlanType.Premium));
    }

    /// <summary>BIL-24: paying less than the order amount is rejected, the order stays pending and no plan is granted.</summary>
    [Test]
    [Property("PlanId", "BIL-24")]
    public async Task Handle_PaidAmountBelowOrderAmount_ThrowsAndGrantsNothing()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, amount: 79000));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        var ex = Assert.ThrowsAsync<DomainException>(
            async () => await handler.Handle(Pay(50000m), CancellationToken.None));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ex!.ErrorCode, Is.EqualTo("INSUFFICIENT_PAYMENT_AMOUNT"));
            Assert.That(db.Orders.Single().Status, Is.EqualTo(OrderStatus.Pending));
            Assert.That(db.Profiles.Single().Plan, Is.EqualTo(SubscriptionPlanType.Free));
        });
    }

    /// <summary>BIL-24: exact payment and overpayment are accepted.</summary>
    [TestCase(79000, TestName = "Handle_ExactPayment_Confirms")]
    [TestCase(100000, TestName = "Handle_Overpayment_Confirms")]
    [Property("PlanId", "BIL-24")]
    public async Task Handle_PaidAmountAtLeastOrderAmount_Confirms(int paid)
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, amount: 79000));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        var response = await handler.Handle(Pay(paid), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Status, Is.EqualTo(OrderStatus.Paid));
    }

    /// <summary>BIL-24: the original system tolerates a 1,000 VND shortfall (bank fee rounding).</summary>
    [Test]
    [Property("PlanId", "BIL-24")]
    [Category("KnownDeviation")] // C# requires PaidAmount >= Amount with no tolerance.
    public async Task Handle_PaidAmountWithinThousandDongTolerance_Confirms()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, amount: 79000));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        var response = await handler.Handle(Pay(78000m), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Status, Is.EqualTo(OrderStatus.Paid));
    }

    /// <summary>BIL-26: first group order creates the group, makes the owner its first member and grants Pro until group expiry (confirm_paid_order lines 113-137).</summary>
    [Test]
    [Property("PlanId", "BIL-26")]
    public async Task Handle_FirstGroupOrder_CreatesGroupWithOwnerMemberAndGrantsPro()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(
            profile, NewOrder(profile.Id, OrderKind.Group, months: 3, amount: 526500, seats: 5));
        var handler = new ConfirmOrderPaidCommandHandler(db);
        var before = DateTime.UtcNow;

        // Act
        await handler.Handle(Pay(526500m), CancellationToken.None);

        // Assert
        var after = DateTime.UtcNow;
        var group = await db.StudyGroups.Include(g => g.Members).SingleAsync();
        var savedProfile = await db.Profiles.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(group.OwnerId, Is.EqualTo(profile.Id));
            Assert.That(group.SeatLimit, Is.EqualTo(5));
            Assert.That(group.Status, Is.EqualTo("active"));
            Assert.That(group.InviteCode, Does.StartWith("GRP-"));
            Assert.That(group.ExpiresAt, Is.InRange(before.AddMonths(3), after.AddMonths(3)));
            Assert.That(group.OrderId, Is.Not.Null);
            Assert.That(group.Members.Select(m => m.UserId), Is.EqualTo(new[] { profile.Id }));
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(savedProfile.PlanExpiresAt, Is.EqualTo(group.ExpiresAt));
        });
    }

    /// <summary>Seeds an owner with an existing group (default: active, expiring in 10 days, 5 seats) and a pending group order.</summary>
    private static async Task<(LingoProDbContext Db, Profile Owner, StudyGroup Group)> SeedGroupRenewalAsync(
        string groupStatus = "active", int orderSeats = 8)
    {
        var profile = NewProfile(SubscriptionPlanType.Pro, DateTime.UtcNow.AddDays(10));
        var order = NewOrder(profile.Id, OrderKind.Group, months: 1, amount: 195000, seats: orderSeats);
        var db = await SeedAsync(profile, order);
        var group = new StudyGroup
        {
            OwnerId = profile.Id,
            InviteCode = "GRP-EXIST",
            SeatLimit = 5,
            Status = groupStatus,
            ExpiresAt = DateTime.UtcNow.AddDays(10)
        };
        db.StudyGroups.Add(group);
        db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = profile.Id });
        await db.SaveChangesAsync();
        return (db, profile, group);
    }

    /// <summary>BIL-27: renewing an existing active group reuses it (same invite code) and raises the seat limit to the greater value — confirm_paid_order lines 105-112.</summary>
    [Test]
    [Property("PlanId", "BIL-27")]
    public async Task Handle_GroupRenewal_ReusesGroupAndRaisesSeatLimit()
    {
        // Arrange
        var (db, _, _) = await SeedGroupRenewalAsync();
        await using var dbLease = db;
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(195000m), CancellationToken.None);

        // Assert
        var savedGroup = await db.StudyGroups.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(db.StudyGroups.Count(), Is.EqualTo(1));
            Assert.That(savedGroup.SeatLimit, Is.EqualTo(8));
            Assert.That(savedGroup.InviteCode, Is.EqualTo("GRP-EXIST"));
            Assert.That(savedGroup.Status, Is.EqualTo("active"));
        });
    }

    /// <summary>
    /// BIL-27: the production RPC renews a group to <c>now + period_months</c> (it does not stack on the remaining days:
    /// <c>v_expires_at := v_now + make_interval(months =&gt; period_months)</c>, confirm_paid_order lines 95-96,107-112).
    /// </summary>
    [Test]
    [Property("PlanId", "BIL-27")]
    [Category("KnownDeviation")] // C# stacks the renewal on the existing group expiry.
    public async Task Handle_GroupRenewal_ExpiryIsNowPlusPeriod()
    {
        // Arrange
        var (db, _, _) = await SeedGroupRenewalAsync();
        await using var dbLease = db;
        var handler = new ConfirmOrderPaidCommandHandler(db);
        var before = DateTime.UtcNow;

        // Act
        await handler.Handle(Pay(195000m), CancellationToken.None);

        // Assert
        var after = DateTime.UtcNow;
        Assert.That((await db.StudyGroups.SingleAsync()).ExpiresAt, Is.InRange(before.AddMonths(1), after.AddMonths(1)));
    }

    /// <summary>BIL-27: only an <c>active</c> group of the owner is renewed; an expired/cancelled group makes the RPC create a fresh group — confirm_paid_order lines 98-103.</summary>
    [Test]
    [Property("PlanId", "BIL-27")]
    [Category("KnownDeviation")] // C# picks the owner's group regardless of Status and reactivates it.
    public async Task Handle_OwnerHasOnlyExpiredGroup_CreatesNewGroup()
    {
        // Arrange
        var (db, _, oldGroup) = await SeedGroupRenewalAsync(groupStatus: "expired");
        await using var dbLease = db;
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(195000m), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(db.StudyGroups.Count(), Is.EqualTo(2));
            Assert.That(db.StudyGroups.Single(g => g.Id == oldGroup.Id).Status, Is.EqualTo("expired"));
        });
    }

    /// <summary>BIL-26/27: the group entitlement is synchronised to every member (not only the owner) — confirm_paid_order lines 139-156, billing.ts:824-834.</summary>
    [Test]
    [Property("PlanId", "BIL-27")]
    [Category("KnownDeviation")] // C# grants the entitlement to the owner only.
    public async Task Handle_GroupRenewal_GrantsProToExistingMembers()
    {
        // Arrange
        var (db, _, group) = await SeedGroupRenewalAsync();
        await using var dbLease = db;
        var member = NewProfile();
        db.Profiles.Add(member);
        db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = member.Id });
        await db.SaveChangesAsync();
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(195000m), CancellationToken.None);

        // Assert
        var savedMember = await db.Profiles.SingleAsync(p => p.Id == member.Id);
        Assert.Multiple(() =>
        {
            Assert.That(savedMember.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(savedMember.PlanExpiresAt, Is.Not.Null);
        });
    }

    /// <summary>BIL-28: confirming a challenge deposit order activates the participant linked by <c>OrderId</c> without touching the plan.</summary>
    [Test]
    [Property("PlanId", "BIL-28")]
    public async Task Handle_ChallengeOrder_ActivatesPendingParticipantAndKeepsPlan()
    {
        // Arrange
        var profile = NewProfile();
        var challengeId = Guid.NewGuid();
        var order = NewOrder(profile.Id, OrderKind.Challenge, amount: 100000);
        await using var db = await SeedAsync(profile, order);
        db.ChallengeParticipants.Add(new ChallengeParticipant
        {
            ChallengeId = challengeId,
            UserId = profile.Id,
            OrderId = order.Id,
            Status = ChallengeParticipantStatus.Pending
        });
        await db.SaveChangesAsync();
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(100000m), CancellationToken.None);

        // Assert
        var participant = await db.ChallengeParticipants.SingleAsync();
        var savedProfile = await db.Profiles.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(participant.Status, Is.EqualTo(ChallengeParticipantStatus.Active));
            Assert.That(participant.OrderId, Is.EqualTo(order.Id));
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Free));
            Assert.That(savedProfile.PlanExpiresAt, Is.Null);
        });
    }

    /// <summary>BIL-28: a challenge order whose participant row is missing still confirms (marks paid) and leaves the plan untouched; participants of other orders stay pending.</summary>
    [Test]
    [Property("PlanId", "BIL-28")]
    public async Task Handle_ChallengeOrderWithoutLinkedParticipant_ConfirmsAndLeavesOtherParticipantsPending()
    {
        // Arrange
        var profile = NewProfile();
        var order = NewOrder(profile.Id, OrderKind.Challenge, amount: 100000);
        await using var db = await SeedAsync(profile, order);
        db.ChallengeParticipants.Add(new ChallengeParticipant
        {
            ChallengeId = Guid.NewGuid(),
            UserId = profile.Id,
            OrderId = Guid.NewGuid(),
            Status = ChallengeParticipantStatus.Pending
        });
        await db.SaveChangesAsync();
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        var response = await handler.Handle(Pay(100000m), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.Status, Is.EqualTo(OrderStatus.Paid));
            Assert.That(db.ChallengeParticipants.Single().Status, Is.EqualTo(ChallengeParticipantStatus.Pending));
            Assert.That(db.Profiles.Single().Plan, Is.EqualTo(SubscriptionPlanType.Free));
        });
    }

    /// <summary>BIL-29: orders that are not pending (expired, failed, refunded) must not be confirmed or grant entitlements — confirm_paid_order lines 52-54 ("Order already %").</summary>
    [Test]
    [Property("PlanId", "BIL-29")]
    [Category("KnownDeviation")] // C# does not check that the order is still Pending before marking it paid.
    public async Task Handle_NonPendingOrder_IsRejectedAndGrantsNothing(
        [Values(OrderStatus.Expired, OrderStatus.Failed, OrderStatus.Refunded)] OrderStatus status)
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, status: status));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act & Assert
        Assert.CatchAsync<DomainException>(
            async () => await handler.Handle(Pay(79000m), CancellationToken.None));
        Assert.Multiple(() =>
        {
            Assert.That(db.Orders.Single().Status, Is.EqualTo(status));
            Assert.That(db.Profiles.Single().Plan, Is.EqualTo(SubscriptionPlanType.Free));
        });
    }
}
