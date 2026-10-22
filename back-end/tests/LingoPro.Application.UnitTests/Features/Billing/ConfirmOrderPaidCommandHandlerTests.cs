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

    private static Order NewOrder(
        Guid userId,
        OrderKind kind = OrderKind.Individual,
        SubscriptionPlanType plan = SubscriptionPlanType.Pro,
        int months = 1,
        decimal amount = 79000m,
        int seats = 1,
        OrderStatus status = OrderStatus.Pending,
        Guid? targetChallengeId = null) => new()
    {
        UserId = userId,
        OrderKind = kind,
        PlanId = plan,
        DurationMonths = months,
        Amount = amount,
        SeatLimit = seats,
        Status = status,
        TransferCode = Code,
        TargetChallengeId = targetChallengeId
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

    /// <summary>BIL-20: first confirmation marks the order paid and grants the plan for the purchased term.</summary>
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
            Assert.That(savedOrder.GatewayTransactionId, Is.EqualTo("GW-9"));
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(savedProfile.PlanExpiresAt, Is.InRange(before.AddMonths(months), after.AddMonths(months)));
        });
    }

    /// <summary>BIL-21: renewing an active plan stacks the new term on top of the current expiry.</summary>
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

    /// <summary>BIL-22: confirming the same order twice is idempotent and does not extend the plan again.</summary>
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
            Assert.That(savedOrder.GatewayTransactionId, Is.EqualTo("GW-1"));
        });
    }

    /// <summary>BIL-22: the transfer code lookup is trimmed and case-insensitive.</summary>
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

    /// <summary>BIL-20: unknown transfer code is reported as not found.</summary>
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

    /// <summary>BIL-23: an active Premium holder buying Pro keeps Premium but the expiry is still extended.</summary>
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
            profile, NewOrder(profile.Id, plan: SubscriptionPlanType.Premium, amount: 129000m));
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
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, amount: 79000m));
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
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, amount: 79000m));
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
        await using var db = await SeedAsync(profile, NewOrder(profile.Id, amount: 79000m));
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        var response = await handler.Handle(Pay(78000m), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Status, Is.EqualTo(OrderStatus.Paid));
    }

    /// <summary>BIL-26: first group order creates the group, makes the owner its first member and grants Pro until group expiry.</summary>
    [Test]
    [Property("PlanId", "BIL-26")]
    public async Task Handle_FirstGroupOrder_CreatesGroupWithOwnerMemberAndGrantsPro()
    {
        // Arrange
        var profile = NewProfile();
        await using var db = await SeedAsync(
            profile, NewOrder(profile.Id, OrderKind.Group, months: 3, amount: 526500m, seats: 5));
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
            Assert.That(group.Status, Is.EqualTo(StudyGroupStatus.Active));
            Assert.That(group.InviteCode, Does.StartWith("GRP-"));
            Assert.That(group.ExpiresAt, Is.InRange(before.AddMonths(3), after.AddMonths(3)));
            Assert.That(group.Members.Select(m => m.UserId), Is.EqualTo(new[] { profile.Id }));
            Assert.That(savedProfile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(savedProfile.PlanExpiresAt, Is.EqualTo(group.ExpiresAt));
        });
    }

    /// <summary>BIL-27: renewing an existing group keeps the remaining days (new term stacks on the current expiry) and reuses the group.</summary>
    [Test]
    [Property("PlanId", "BIL-27")]
    public async Task Handle_GroupRenewal_StacksOnRemainingDaysAndReusesGroup()
    {
        // Arrange
        var profile = NewProfile(SubscriptionPlanType.Pro, DateTime.UtcNow.AddDays(10));
        var order = NewOrder(profile.Id, OrderKind.Group, months: 1, amount: 195000m, seats: 8);
        await using var db = await SeedAsync(profile, order);
        var groupExpiry = DateTime.UtcNow.AddDays(10);
        var group = new StudyGroup
        {
            Name = "Existing",
            OwnerId = profile.Id,
            InviteCode = "GRP-EXIST",
            SeatLimit = 5,
            Status = StudyGroupStatus.Active,
            ExpiresAt = groupExpiry
        };
        db.StudyGroups.Add(group);
        db.GroupMembers.Add(new GroupMember { GroupId = group.Id, UserId = profile.Id });
        await db.SaveChangesAsync();
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(195000m), CancellationToken.None);

        // Assert
        var savedGroup = await db.StudyGroups.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(db.StudyGroups.Count(), Is.EqualTo(1));
            Assert.That(savedGroup.ExpiresAt, Is.EqualTo(groupExpiry.AddMonths(1)));
            Assert.That(savedGroup.SeatLimit, Is.EqualTo(8));
            Assert.That(savedGroup.InviteCode, Is.EqualTo("GRP-EXIST"));
        });
    }

    /// <summary>BIL-28: confirming a challenge deposit order activates the pending participant without touching the plan.</summary>
    [Test]
    [Property("PlanId", "BIL-28")]
    public async Task Handle_ChallengeOrder_ActivatesPendingParticipantAndKeepsPlan()
    {
        // Arrange
        var profile = NewProfile();
        var challengeId = Guid.NewGuid();
        var order = NewOrder(profile.Id, OrderKind.Challenge, amount: 100000m, targetChallengeId: challengeId);
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

    /// <summary>BIL-28: a pending participant without an order link is matched by challenge and user.</summary>
    [Test]
    [Property("PlanId", "BIL-28")]
    public async Task Handle_ChallengeOrderWithoutParticipantOrderLink_MatchesByChallengeAndUser()
    {
        // Arrange
        var profile = NewProfile();
        var challengeId = Guid.NewGuid();
        var order = NewOrder(profile.Id, OrderKind.Challenge, amount: 100000m, targetChallengeId: challengeId);
        await using var db = await SeedAsync(profile, order);
        db.ChallengeParticipants.Add(new ChallengeParticipant
        {
            ChallengeId = challengeId,
            UserId = profile.Id,
            Status = ChallengeParticipantStatus.Pending
        });
        await db.SaveChangesAsync();
        var handler = new ConfirmOrderPaidCommandHandler(db);

        // Act
        await handler.Handle(Pay(100000m), CancellationToken.None);

        // Assert
        var participant = await db.ChallengeParticipants.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(participant.Status, Is.EqualTo(ChallengeParticipantStatus.Active));
            Assert.That(participant.OrderId, Is.EqualTo(order.Id));
        });
    }

    /// <summary>BIL-29: orders that are not pending (expired, failed, refunded) must not be confirmed or grant entitlements.</summary>
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
