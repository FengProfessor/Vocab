using LingoPro.Application.Features.Billing.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Billing;

/// <summary>
/// NUnit business unit tests for <see cref="ValidateCouponQueryHandler"/>: valid coupon lookup and
/// the domain error raised for invalid, inactive, expired or exhausted coupons (plan IDs BIL-10, BIL-11, BIL-13).
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

    /// <summary>BIL-10/11: a valid coupon is returned with its percent and cap; code lookup is trimmed and case-insensitive.</summary>
    [Test]
    [Property("PlanId", "BIL-10")]
    public async Task Handle_ValidCouponWithMixedCase_ReturnsDiscountDetails()
    {
        // Arrange
        await using var db = await SeedAsync(new Coupon
        {
            Code = "SAVE20",
            DiscountPercent = 20,
            MaxDiscountAmount = 30000m,
            MaxUses = 10,
            UsedCount = 9
        });
        var handler = new ValidateCouponQueryHandler(db);

        // Act
        var response = await handler.Handle(new ValidateCouponQuery("  save20 "), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.Code, Is.EqualTo("SAVE20"));
            Assert.That(response.Data.DiscountPercent, Is.EqualTo(20));
            Assert.That(response.Data.MaxDiscountAmount, Is.EqualTo(30000m));
            Assert.That(response.Data.IsValid, Is.True);
        });
    }

    /// <summary>BIL-13: unknown, inactive, expired or exhausted coupons throw <c>INVALID_COUPON</c>.</summary>
    [Test]
    [Property("PlanId", "BIL-13")]
    public async Task Handle_InvalidCoupon_ThrowsInvalidCouponDomainError(
        [Values("UNKNOWN", "INACTIVE", "EXPIRED", "EXHAUSTED")] string code)
    {
        // Arrange
        await using var db = await SeedAsync(
            new Coupon { Code = "INACTIVE", DiscountPercent = 10, IsActive = false },
            new Coupon { Code = "EXPIRED", DiscountPercent = 10, ExpiresAt = DateTime.UtcNow.AddMinutes(-1) },
            new Coupon { Code = "EXHAUSTED", DiscountPercent = 10, MaxUses = 3, UsedCount = 3 });
        var handler = new ValidateCouponQueryHandler(db);

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
            new Coupon { Code = "FUTURE", DiscountPercent = 15, ExpiresAt = DateTime.UtcNow.AddDays(1) });
        var handler = new ValidateCouponQueryHandler(db);

        // Act
        var response = await handler.Handle(new ValidateCouponQuery("FUTURE"), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.IsValid, Is.True);
    }
}
