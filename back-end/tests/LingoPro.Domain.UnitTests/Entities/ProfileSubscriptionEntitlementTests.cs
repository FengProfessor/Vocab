using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Entities;

/// <summary>
/// Business-rule tests (plan ID BIL-23) for <see cref="Profile.GrantSubscriptionEntitlement"/>.
/// </summary>
[TestFixture]
[Category("Billing")]
public sealed class ProfileSubscriptionEntitlementTests
{
    private static Profile CreateProfile(SubscriptionPlanType plan, DateTime? expiresAt) => new()
    {
        Id = Guid.NewGuid(),
        Email = "student@lingopro.online",
        FullName = "Student",
        Plan = plan,
        PlanExpiresAt = expiresAt
    };

    [Test]
    [Property("PlanId", "BIL-23")]
    public void GrantSubscriptionEntitlement_ActivePremiumBuysPro_KeepsPremium()
    {
        // Arrange
        var premiumExpiry = DateTime.UtcNow.AddDays(30);
        var profile = CreateProfile(SubscriptionPlanType.Premium, premiumExpiry);

        // Act
        profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Pro, DateTime.UtcNow.AddDays(60));

        // Assert
        Assert.That(profile.Plan, Is.EqualTo(SubscriptionPlanType.Premium));
    }

    [Test]
    [Property("PlanId", "BIL-23")]
    public void GrantSubscriptionEntitlement_ExpiredPremiumBuysPro_BecomesPro()
    {
        // Arrange
        var profile = CreateProfile(SubscriptionPlanType.Premium, DateTime.UtcNow.AddDays(-1));
        var newExpiry = DateTime.UtcNow.AddDays(30);

        // Act
        profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Pro, newExpiry);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(profile.PlanExpiresAt, Is.EqualTo(newExpiry));
        });
    }

    [Test]
    [Property("PlanId", "BIL-23")]
    public void GrantSubscriptionEntitlement_FreeUserBuysPro_BecomesPro()
    {
        // Arrange
        var profile = CreateProfile(SubscriptionPlanType.Free, null);
        var newExpiry = DateTime.UtcNow.AddDays(30);

        // Act
        profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Pro, newExpiry);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(profile.PlanExpiresAt, Is.EqualTo(newExpiry));
        });
    }

    [Test]
    [Property("PlanId", "BIL-23")]
    public void GrantSubscriptionEntitlement_ActiveProBuysPremium_UpgradesToPremium()
    {
        // Arrange
        var profile = CreateProfile(SubscriptionPlanType.Pro, DateTime.UtcNow.AddDays(10));

        // Act
        profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Premium, DateTime.UtcNow.AddDays(40));

        // Assert
        Assert.That(profile.Plan, Is.EqualTo(SubscriptionPlanType.Premium));
    }
}
