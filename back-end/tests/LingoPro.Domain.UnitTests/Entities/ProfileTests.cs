using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Entities;

/// <summary>
/// NUnit business unit tests for <see cref="Profile"/> and <see cref="UserGamification"/>.
/// </summary>
[TestFixture]
public sealed class ProfileTests
{
    [Test]
    public void AwardXpAndUpdateStreak_ConsecutiveDays_IncrementsCurrentAndLongestStreak()
    {
        // Arrange
        var gamification = new UserGamification { UserId = Guid.NewGuid() };
        var day1 = new DateOnly(2026, 10, 16);
        var day2 = new DateOnly(2026, 10, 17);

        // Act
        gamification.AwardXpAndUpdateStreak(50, day1);
        gamification.AwardXpAndUpdateStreak(70, day2);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(gamification.CurrentStreak, Is.EqualTo(2));
            Assert.That(gamification.LongestStreak, Is.EqualTo(2));
            Assert.That(gamification.TotalXp, Is.EqualTo(120));
        });
    }

    [Test]
    public void GrantSubscriptionEntitlement_ValidPlanAndExpiry_SetsActiveProStatus()
    {
        // Arrange
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            Email = "pro@lingopro.online",
            FullName = "Pro Learner",
            Plan = SubscriptionPlanType.Free
        };
        var now = new DateTime(2026, 10, 17, 10, 0, 0, DateTimeKind.Utc);
        var expiresAt = now.AddDays(30);

        // Act
        profile.GrantSubscriptionEntitlement(SubscriptionPlanType.Pro, expiresAt);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.Plan, Is.EqualTo(SubscriptionPlanType.Pro));
            Assert.That(profile.PlanExpiresAt, Is.EqualTo(expiresAt));
        });
    }
}
