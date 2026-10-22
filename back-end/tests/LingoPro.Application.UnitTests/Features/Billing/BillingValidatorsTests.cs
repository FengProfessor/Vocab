using LingoPro.Application.Features.Billing.Commands;
using LingoPro.Application.Features.Billing.Queries;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Billing;

/// <summary>
/// NUnit unit tests for the Billing FluentValidation validators:
/// <see cref="CreateOrderCommandValidator"/> (BIL-07..BIL-09), <see cref="ConfirmOrderPaidCommandValidator"/>
/// and <see cref="ValidateCouponQueryValidator"/>.
/// </summary>
[TestFixture]
[Category("Billing")]
public sealed class BillingValidatorsTests
{
    private readonly CreateOrderCommandValidator _createOrder = new();

    private static CreateOrderCommand ValidOrder(
        SubscriptionPlanType plan = SubscriptionPlanType.Pro,
        OrderKind kind = OrderKind.Individual,
        int months = 1,
        int seats = 1) => new(plan, kind, months, seats);

    /// <summary>BIL-07: only Pro and Premium may be purchased.</summary>
    [TestCase(SubscriptionPlanType.Pro, true, TestName = "Validate_PlanPro_IsValid")]
    [TestCase(SubscriptionPlanType.Premium, true, TestName = "Validate_PlanPremium_IsValid")]
    [TestCase(SubscriptionPlanType.Free, false, TestName = "Validate_PlanFree_IsInvalid")]
    [TestCase(SubscriptionPlanType.School, false, TestName = "Validate_PlanSchool_IsInvalid")]
    [Property("PlanId", "BIL-07")]
    public void Validate_PlanId_AllowsOnlyProAndPremium(SubscriptionPlanType plan, bool expectedValid)
    {
        // Arrange
        var command = ValidOrder(plan: plan);

        // Act
        var result = _createOrder.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
        if (!expectedValid)
        {
            Assert.That(result.Errors.Select(e => e.PropertyName), Does.Contain(nameof(CreateOrderCommand.PlanId)));
        }
    }

    /// <summary>BIL-08: duration must be 1, 3, 6 or 12 months.</summary>
    [TestCase(1, true)]
    [TestCase(3, true)]
    [TestCase(6, true)]
    [TestCase(12, true)]
    [TestCase(0, false)]
    [TestCase(2, false)]
    [TestCase(5, false)]
    [TestCase(13, false)]
    [TestCase(-1, false)]
    [Property("PlanId", "BIL-08")]
    public void Validate_DurationMonths_AllowsOnlyOneThreeSixTwelve(int months, bool expectedValid)
    {
        // Arrange
        var command = ValidOrder(months: months);

        // Act
        var result = _createOrder.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
        if (!expectedValid)
        {
            Assert.That(result.Errors.Select(e => e.PropertyName), Does.Contain(nameof(CreateOrderCommand.DurationMonths)));
        }
    }

    /// <summary>BIL-09: seat limit must be within 1..20.</summary>
    [TestCase(1, true)]
    [TestCase(2, true)]
    [TestCase(20, true)]
    [TestCase(0, false)]
    [TestCase(21, false)]
    [TestCase(-5, false)]
    [Property("PlanId", "BIL-09")]
    public void Validate_SeatLimit_MustBeBetweenOneAndTwenty(int seats, bool expectedValid)
    {
        // Arrange
        var command = ValidOrder(kind: OrderKind.Group, seats: seats);

        // Act
        var result = _createOrder.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
        if (!expectedValid)
        {
            Assert.That(result.Errors.Select(e => e.PropertyName), Does.Contain(nameof(CreateOrderCommand.SeatLimit)));
        }
    }

    /// <summary>BIL-09: an undefined <c>OrderKind</c> value is rejected, defined ones are accepted.</summary>
    [Test]
    [Property("PlanId", "BIL-09")]
    public void Validate_OrderKind_RejectsUndefinedEnumValue()
    {
        // Arrange
        var invalid = ValidOrder(kind: (OrderKind)99);

        // Act
        var invalidResult = _createOrder.Validate(invalid);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(invalidResult.IsValid, Is.False);
            Assert.That(_createOrder.Validate(ValidOrder(kind: OrderKind.Challenge)).IsValid, Is.True);
        });
    }

    /// <summary>Confirm-paid command requires a transfer code and a positive paid amount.</summary>
    [TestCase("LP260101ABC123", 100000, true)]
    [TestCase("", 100000, false)]
    [TestCase("LP260101ABC123", 0, false)]
    [TestCase("LP260101ABC123", -1, false)]
    [Property("PlanId", "BIL-20")]
    public void Validate_ConfirmOrderPaid_RequiresCodeAndPositiveAmount(string code, int amount, bool expectedValid)
    {
        // Arrange
        var validator = new ConfirmOrderPaidCommandValidator();

        // Act
        var result = validator.Validate(new ConfirmOrderPaidCommand(code, amount, "TX-1"));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    /// <summary>Coupon validation query requires a non-empty code of at most 32 characters.</summary>
    [TestCase("SAVE20", true)]
    [TestCase("", false)]
    [TestCase("12345678901234567890123456789012", true)]
    [TestCase("123456789012345678901234567890123", false)]
    [Property("PlanId", "BIL-10")]
    public void Validate_ValidateCouponQuery_CodeLengthBounds(string code, bool expectedValid)
    {
        // Arrange
        var validator = new ValidateCouponQueryValidator();

        // Act
        var result = validator.Validate(new ValidateCouponQuery(code));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }
}
