using LingoPro.Application.Features.Billing.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Billing;

/// <summary>
/// NUnit business unit tests for <see cref="ValidateCouponQueryHandler"/>: valid coupon lookup and
/// the domain error raised for invalid, inactive, expired, not-yet-valid or exhausted coupons (plan IDs BIL-10, BIL-11, BIL-13).
/// Coupons follow <c>public.coupons</c>: <c>DiscountPct</c> / <c>DiscountAmount</c> / <c>ValidFrom</c> / <c>ValidUntil</c>.
/// </summary>
[TestFixture]
[Category("Billing")]
public sealed class ValidateCouponQueryHandlerTests
{
    private static async Task<LingoProDbContext> SeedAsync(params Coupon[] coupons)
    {
        var db = TestHelpers.CreateDb();
        db.Coupons.AddRange(coupons);
        await db.SaveChangesAsync();
        return db;
    }

    /// <summary>BIL-10: a valid percent coupon is returned with its percent; code lookup is trimmed and case-insensitive.</summary>
    [Test]
    [Property("PlanId", "BIL-10")]
    public async Task Handle_ValidPercentCouponWithMixedCase_ReturnsDiscountPercent()
    {
        // Arrange
        await using var db = await SeedAsync(new Coupon
        {
            Code = "SAVE20",
            DiscountPct = 20,
            MaxUses = 10,
            UsedCount = 9
        });
        var handler = new ValidateCouponQueryHandler(new BillingRepository(db));

        // Act
        var response = await handler.Handle(new ValidateCouponQuery("  save20 "), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.Code, Is.EqualTo("SAVE20"));
            Assert.That(response.Data.DiscountPercent, Is.EqualTo(20));
            Assert.That(response.Data.MaxDiscountAmount, Is.Null);
            Assert.That(response.Data.IsValid, Is.True);
        });
    }

    /// <summary>
    /// BIL-11: a fixed-amount coupon (<c>discount_amount</c>) has no percent; its value is exposed through
    /// <c>MaxDiscountAmount</c> (DTO shape kept by the handler) — src/lib/billing.ts:262-264.
    /// </summary>
    [Test]
    [Property("PlanId", "BIL-11")]
    public async Task Handle_ValidFixedAmountCoupon_ReturnsZeroPercentAndFixedValue()
    {
        // Arrange
        await using var db = await SeedAsync(new Coupon { Code = "OFF30K", DiscountAmount = 30000 });
        var handler = new ValidateCouponQueryHandler(new BillingRepository(db));

        // Act
        var response = await handler.Handle(new ValidateCouponQuery("OFF30K"), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.DiscountPercent, Is.EqualTo(0));
            Assert.That(response.Data.MaxDiscountAmount, Is.EqualTo(30000m));
            Assert.That(response.Data.IsValid, Is.True);
        });
    }

    /// <summary>BIL-13: unknown, inactive, expired, not-yet-valid or exhausted coupons throw <c>INVALID_COUPON</c> (product owner pinned: domain error).</summary>
    [Test]
    [Property("PlanId", "BIL-13")]
    public async Task Handle_InvalidCoupon_ThrowsInvalidCouponDomainError(
        [Values("UNKNOWN", "INACTIVE", "EXPIRED", "EXHAUSTED", "NOTYET")] string code)
    {
        // Arrange
        await using var db = await SeedAsync(
            new Coupon { Code = "INACTIVE", DiscountPct = 10, IsActive = false },
            new Coupon { Code = "EXPIRED", DiscountPct = 10, ValidUntil = DateTime.UtcNow.AddMinutes(-1) },
            new Coupon { Code = "EXHAUSTED", DiscountPct = 10, MaxUses = 3, UsedCount = 3 },
            new Coupon { Code = "NOTYET", DiscountPct = 10, ValidFrom = DateTime.UtcNow.AddDays(1) });
        var handler = new ValidateCouponQueryHandler(new BillingRepository(db));

        // Act
        var ex = Assert.ThrowsAsync<DomainException>(
            async () => await handler.Handle(new ValidateCouponQuery(code), CancellationToken.None));

        // Assert
        Assert.That(ex!.ErrorCode, Is.EqualTo("INVALID_COUPON"));
    }

    /// <summary>BIL-13: a coupon without expiry or with a future expiry is accepted.</summary>
    [Test]
    [Property("PlanId", "BIL-13")]
    public async Task Handle_CouponWithFutureExpiry_IsValid()
    {
        // Arrange
        await using var db = await SeedAsync(
            new Coupon { Code = "FUTURE", DiscountPct = 15, ValidUntil = DateTime.UtcNow.AddDays(1) });
        var handler = new ValidateCouponQueryHandler(new BillingRepository(db));

        // Act
        var response = await handler.Handle(new ValidateCouponQuery("FUTURE"), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.IsValid, Is.True);
    }
}
