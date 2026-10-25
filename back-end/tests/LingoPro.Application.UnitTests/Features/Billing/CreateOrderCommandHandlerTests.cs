using LingoPro.Application.Features.Billing.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Billing;

/// <summary>
/// NUnit business unit tests for <see cref="CreateOrderCommandHandler"/> covering pricing (original system prices,
/// src/lib/billing.ts:113-237), coupon discounts, coupon rejection rules and order shape (plan IDs BIL-01..BIL-17).
/// The order is aligned to <c>public.orders</c>: <c>Plan</c>, <c>PeriodMonths</c>, <c>Seats</c>, <c>PaymentRef</c>
/// (the bank-transfer code), <c>Amount</c> as int.
/// </summary>
[TestFixture]
[Category("Billing")]
public sealed class CreateOrderCommandHandlerTests
{
    private static async Task<(LingoProDbContext Db, CreateOrderCommandHandler Handler)> CreateSutAsync(
        params Coupon[] coupons)
    {
        var db = TestHelpers.CreateDb();
        if (coupons.Length > 0)
        {
            db.Coupons.AddRange(coupons);
            await db.SaveChangesAsync();
        }

        var user = TestHelpers.CreateUser(Guid.NewGuid());
        return (db, new CreateOrderCommandHandler(user, new BillingRepository(db)));
    }

    /// <summary>
    /// Builds a coupon row aligned to <c>public.coupons</c>: either a percent coupon (<paramref name="percent"/>)
    /// or a fixed-amount coupon (<paramref name="amount"/>), never both.
    /// </summary>
    private static Coupon NewCoupon(
        string code,
        int? percent = null,
        int? amount = null,
        int? maxUses = 100,
        int usedCount = 0,
        bool isActive = true,
        DateTime? validFrom = null,
        DateTime? validUntil = null,
        string[]? applicablePlans = null) => new()
    {
        Code = code,
        DiscountPct = percent,
        DiscountAmount = amount,
        MaxUses = maxUses,
        UsedCount = usedCount,
        IsActive = isActive,
        ValidFrom = validFrom ?? DateTime.UtcNow.AddDays(-1),
        ValidUntil = validUntil,
        ApplicablePlans = applicablePlans
    };

    // ───────────────────────── Pricing (original system prices) ─────────────────────────

    /// <summary>BIL-01..BIL-04: individual plan price per term (79k/129k per month, 3 months -10%, 6 months -20%, 12 months fixed annual price) — src/lib/billing.ts:114-157.</summary>
    [TestCase(SubscriptionPlanType.Pro, 1, 79000, TestName = "Handle_ProOneMonth_Amount79000")]
    [TestCase(SubscriptionPlanType.Premium, 1, 129000, TestName = "Handle_PremiumOneMonth_Amount129000")]
    [TestCase(SubscriptionPlanType.Pro, 3, 213300, TestName = "Handle_ProThreeMonths_Amount213300")]
    [TestCase(SubscriptionPlanType.Premium, 3, 348300, TestName = "Handle_PremiumThreeMonths_Amount348300")]
    [TestCase(SubscriptionPlanType.Pro, 6, 379200, TestName = "Handle_ProSixMonths_Amount379200")]
    [TestCase(SubscriptionPlanType.Premium, 6, 619200, TestName = "Handle_PremiumSixMonths_Amount619200")]
    [TestCase(SubscriptionPlanType.Pro, 12, 599000, TestName = "Handle_ProTwelveMonths_Amount599000")]
    [TestCase(SubscriptionPlanType.Premium, 12, 899000, TestName = "Handle_PremiumTwelveMonths_Amount899000")]
    [Property("PlanId", "BIL-01..04")]
    [Category("KnownDeviation")] // C# uses 99k/199k per month and applies no term discount / annual price.
    public async Task Handle_IndividualPlanTerm_UsesOriginalPrice(
        SubscriptionPlanType plan, int months, decimal expectedAmount)
    {
        // Arrange
        var (db, handler) = await CreateSutAsync();
        await using var dbLease = db;
        var command = new CreateOrderCommand(plan, OrderKind.Individual, months);

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Amount, Is.EqualTo(expectedAmount));
    }

    /// <summary>BIL-05/BIL-06: group plan price = seats x seat-tier price x months x (1 - term discount); tiers 59k/49k/45k/39k — src/lib/billing.ts:208-230.</summary>
    [TestCase(2, 1, 118000, TestName = "Handle_GroupTwoSeatsOneMonth_Amount118000")]
    [TestCase(3, 1, 147000, TestName = "Handle_GroupThreeSeatsOneMonth_Amount147000")]
    [TestCase(4, 1, 180000, TestName = "Handle_GroupFourSeatsOneMonth_Amount180000")]
    [TestCase(5, 1, 195000, TestName = "Handle_GroupFiveSeatsOneMonth_Amount195000")]
    [TestCase(20, 1, 780000, TestName = "Handle_GroupTwentySeatsOneMonth_Amount780000")]
    [TestCase(5, 3, 526500, TestName = "Handle_GroupFiveSeatsThreeMonths_Amount526500")]
    [TestCase(2, 6, 566400, TestName = "Handle_GroupTwoSeatsSixMonths_Amount566400")]
    [Property("PlanId", "BIL-05..06")]
    [Category("KnownDeviation")] // C# uses 99k x seats x 0.75 and no seat tiers / term discount.
    public async Task Handle_GroupOrder_UsesOriginalSeatTierPrice(int seats, int months, decimal expectedAmount)
    {
        // Arrange
        var (db, handler) = await CreateSutAsync();
        await using var dbLease = db;
        var command = new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Group, months, seats);

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Amount, Is.EqualTo(expectedAmount));
    }

    // ───────────────────────── Coupon discounts ─────────────────────────

    /// <summary>BIL-10: percent coupon removes exactly that percentage from the undiscounted amount (price-independent) — src/lib/billing.ts:257-261.</summary>
    [Test]
    [Property("PlanId", "BIL-10")]
    public async Task Handle_PercentCoupon_ReducesAmountByPercent()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("SAVE20", percent: 20));
        await using var dbLease = db;
        var baseline = await handler.Handle(
            new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Individual, 1), CancellationToken.None);

        // Act
        var response = await handler.Handle(
            new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "SAVE20"),
            CancellationToken.None);

        // Assert
        decimal expected = Math.Round(baseline.Data!.Amount * 0.8m, 0);
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.Amount, Is.EqualTo(expected));
            Assert.That(response.StatusCode, Is.EqualTo(201));
        });
    }

    /// <summary>BIL-10: coupon code is trimmed and matched case-insensitively and stored normalized on the order.</summary>
    [Test]
    [Property("PlanId", "BIL-10")]
    public async Task Handle_CouponWithLowercaseAndSpaces_NormalizesCodeAndApplies()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("SAVE20", percent: 20));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "  save20 ");

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var order = await db.Orders.SingleAsync();
        Assert.That(order.CouponCode, Is.EqualTo("SAVE20"));
    }

    /// <summary>
    /// BIL-11 (re-based on the SQL schema): a fixed-amount coupon (<c>discount_amount</c>) subtracts exactly that amount
    /// from the undiscounted price — src/lib/billing.ts:262-264. The legacy percent cap (<c>MaxDiscountAmount</c>) no
    /// longer exists in <c>public.coupons</c>, so the cap tests were replaced by this one.
    /// </summary>
    [Test]
    [Property("PlanId", "BIL-11")]
    public async Task Handle_FixedAmountCoupon_SubtractsFixedAmount()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("OFF20K", amount: 20000));
        await using var dbLease = db;
        var baseline = await handler.Handle(
            new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Individual, 1), CancellationToken.None);

        // Act
        var response = await handler.Handle(
            new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "OFF20K"),
            CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Amount, Is.EqualTo(baseline.Data!.Amount - 20000m));
    }

    /// <summary>BIL-11: a fixed-amount coupon larger than the price floors the amount at 0 (never negative, no 10,000 floor) — src/lib/billing.ts:263.</summary>
    [Test]
    [Property("PlanId", "BIL-11")]
    [Category("KnownDeviation")] // C# floors the discounted amount at 10,000 VND.
    public async Task Handle_FixedAmountCouponAbovePrice_FloorsAmountAtZero()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("OFF500K", amount: 500000));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "OFF500K");

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Amount, Is.EqualTo(0m));
    }

    /// <summary>BIL-12: a 100% coupon yields amount 0 and the order is confirmed automatically — src/lib/billing.ts:260,568 (redeem free coupon).</summary>
    [Test]
    [Property("PlanId", "BIL-12")]
    [Category("KnownDeviation")] // C# floors the amount at 10,000 VND and never auto-confirms.
    public async Task Handle_FullDiscountCoupon_AmountZeroAndOrderAutoConfirmed()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("FREE100", percent: 100));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "FREE100");

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.Amount, Is.EqualTo(0m));
            Assert.That(response.Data.Status, Is.EqualTo(OrderStatus.Paid));
        });
    }

    /// <summary>BIL-14: a 100% (free) coupon cannot be applied to a 12-month order — src/lib/billing.ts:95-103.</summary>
    [Test]
    [Property("PlanId", "BIL-14")]
    [Category("KnownDeviation")] // C# does not block free coupons on long terms.
    public async Task Handle_FullDiscountCouponOnTwelveMonths_IsRejected()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("FREE100", percent: 100));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 12, CouponCode: "FREE100");

        // Act & Assert
        Assert.CatchAsync<DomainException>(async () => await handler.Handle(command, CancellationToken.None));
    }

    /// <summary>BIL-15: a 100% (free) coupon cannot be applied to a group order — src/lib/billing.ts:104-106.</summary>
    [Test]
    [Property("PlanId", "BIL-15")]
    [Category("KnownDeviation")] // C# does not block free coupons on group orders.
    public async Task Handle_FullDiscountCouponOnGroupOrder_IsRejected()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("FREE100", percent: 100));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Group, 1, SeatLimit: 5, CouponCode: "FREE100");

        // Act & Assert
        Assert.CatchAsync<DomainException>(async () => await handler.Handle(command, CancellationToken.None));
    }

    /// <summary>
    /// BIL-13: unknown, inactive, expired, not-yet-valid or exhausted coupons are rejected with <c>INVALID_COUPON</c>
    /// and create no order (product owner pinned: C# throws a domain error where the original ignores the coupon).
    /// </summary>
    [Test]
    [Property("PlanId", "BIL-13")]
    public void Handle_InvalidCoupon_ThrowsInvalidCouponAndCreatesNoOrder(
        [Values("UNKNOWN", "INACTIVE", "EXPIRED", "EXHAUSTED", "NOTYET")] string code)
    {
        // Arrange
        var (db, handler) = CreateSutAsync(
            NewCoupon("INACTIVE", percent: 10, isActive: false),
            NewCoupon("EXPIRED", percent: 10, validUntil: DateTime.UtcNow.AddMinutes(-1)),
            NewCoupon("EXHAUSTED", percent: 10, maxUses: 5, usedCount: 5),
            NewCoupon("NOTYET", percent: 10, validFrom: DateTime.UtcNow.AddDays(1))).GetAwaiter().GetResult();
        using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: code);

        // Act
        var ex = Assert.ThrowsAsync<DomainException>(async () => await handler.Handle(command, CancellationToken.None));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ex!.ErrorCode, Is.EqualTo("INVALID_COUPON"));
            Assert.That(db.Orders.Count(), Is.EqualTo(0));
        });
    }

    /// <summary>BIL-13: a coupon restricted to <c>applicable_plans</c> that excludes the purchased plan is not applicable — src/lib/billing.ts:351,353.</summary>
    [Test]
    [Property("PlanId", "BIL-13")]
    [Category("KnownDeviation")] // C# handler never checks Coupon.ApplicablePlans.
    public async Task Handle_CouponNotApplicableToPurchasedPlan_ThrowsInvalidCoupon()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(
            NewCoupon("PREMIUMONLY", percent: 30, applicablePlans: ["premium"]));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "PREMIUMONLY");

        // Act
        var ex = Assert.CatchAsync<DomainException>(async () => await handler.Handle(command, CancellationToken.None));

        // Assert
        Assert.That(ex!.ErrorCode, Is.EqualTo("INVALID_COUPON"));
    }

    /// <summary>BIL-16: the legacy <c>WLU</c> code has no free shortcut; without a coupon row it is simply invalid.</summary>
    [Test]
    [Property("PlanId", "BIL-16")]
    public async Task Handle_WluCodeWithoutCouponRow_IsRejectedAndNotFree()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync();
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Premium, OrderKind.Individual, 12, CouponCode: "WLU");

        // Act
        var ex = Assert.ThrowsAsync<DomainException>(async () => await handler.Handle(command, CancellationToken.None));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ex!.ErrorCode, Is.EqualTo("INVALID_COUPON"));
            Assert.That(db.Orders.Count(), Is.EqualTo(0));
        });
    }

    /// <summary>BIL-17: coupon <c>UsedCount</c> only grows when the order is paid (confirm_paid_order), not when the pending order is created.</summary>
    [Test]
    [Property("PlanId", "BIL-17")]
    [Category("KnownDeviation")] // C# increments UsedCount immediately on order creation.
    public async Task Handle_CouponOnPendingOrder_DoesNotIncrementUsedCount()
    {
        // Arrange
        var (db, handler) = await CreateSutAsync(NewCoupon("SAVE20", percent: 20));
        await using var dbLease = db;
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Individual, 1, CouponCode: "SAVE20");

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var coupon = await db.Coupons.SingleAsync();
        Assert.That(coupon.UsedCount, Is.EqualTo(0));
    }

    // ───────────────────────── Order shape ─────────────────────────

    /// <summary>Creates a pending VND order owned by the caller whose <c>PaymentRef</c> is an <c>LP</c> transfer code, plus a VietQR URL.</summary>
    [Test]
    [Property("PlanId", "BIL-01")]
    public async Task Handle_IndividualOrder_CreatesPendingVndOrderForCaller()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateOrderCommandHandler(TestHelpers.CreateUser(userId), new BillingRepository(db));
        var command = new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Individual, 3, SeatLimit: 15);

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        var order = await db.Orders.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(order.UserId, Is.EqualTo(userId));
            Assert.That(order.Status, Is.EqualTo(OrderStatus.Pending));
            Assert.That(order.Currency, Is.EqualTo("VND"));
            Assert.That(order.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(order.PeriodMonths, Is.EqualTo(3));
            Assert.That(order.OrderKind, Is.EqualTo(OrderKind.Individual));
            Assert.That(order.Seats, Is.EqualTo(1), "Individual orders always have a single seat (billing.ts:312).");
            Assert.That(order.PaymentRef, Does.StartWith("LP"));
            Assert.That(response.Data!.TransferCode, Is.EqualTo(order.PaymentRef));
            Assert.That(response.Data.VietQrUrl, Does.Contain(order.PaymentRef));
        });
    }

    /// <summary>Group orders keep the requested seat count within the original 2..20 range (billing.ts:179-180).</summary>
    [TestCase(2, 2, TestName = "Handle_GroupTwoSeats_StaysTwo")]
    [TestCase(7, 7, TestName = "Handle_GroupSevenSeats_StaysSeven")]
    [TestCase(20, 20, TestName = "Handle_GroupTwentySeats_StaysTwenty")]
    [Property("PlanId", "BIL-05")]
    public async Task Handle_GroupOrder_PersistsRequestedSeats(int requestedSeats, int expectedSeats)
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateOrderCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), new BillingRepository(db));
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Group, 1, SeatLimit: requestedSeats);

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.SeatLimit, Is.EqualTo(expectedSeats));
            Assert.That(db.Orders.Single().Seats, Is.EqualTo(expectedSeats));
            Assert.That(db.Orders.Single().OrderKind, Is.EqualTo(OrderKind.Group));
        });
    }

    /// <summary>
    /// BIL-30: a challenge order links to its challenge through a pending participant carrying <c>OrderId</c>
    /// (the SQL orders table has no target_challenge_id column).
    /// </summary>
    [Test]
    [Property("PlanId", "BIL-30")]
    public async Task Handle_ChallengeOrder_CreatesPendingParticipantLinkedToOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var challengeId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateOrderCommandHandler(TestHelpers.CreateUser(userId), new BillingRepository(db));
        var command = new CreateOrderCommand(
            SubscriptionPlanType.Pro, OrderKind.Challenge, 1, TargetChallengeId: challengeId);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert
        var order = await db.Orders.SingleAsync();
        var participant = await db.ChallengeParticipants.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(order.OrderKind, Is.EqualTo(OrderKind.Challenge));
            Assert.That(participant.ChallengeId, Is.EqualTo(challengeId));
            Assert.That(participant.UserId, Is.EqualTo(userId));
            Assert.That(participant.OrderId, Is.EqualTo(order.Id));
            Assert.That(participant.Status, Is.EqualTo(ChallengeParticipantStatus.Pending));
        });
    }

    /// <summary>Anonymous callers cannot create orders.</summary>
    [Test]
    [Property("PlanId", "BIL-01")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateOrderCommandHandler(TestHelpers.CreateUser(null), new BillingRepository(db));
        var command = new CreateOrderCommand(SubscriptionPlanType.Pro, OrderKind.Individual, 1);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(command, CancellationToken.None));
    }
}
