using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Entities;

/// <summary>
/// NUnit business unit tests for the <see cref="Profile"/> aggregate root.
/// </summary>
[TestFixture]
public sealed class ProfileTests
{
    [Test]
    public void AwardXpAndUpdateStreak_ConsecutiveDays_IncrementsCurrentAndLongestStreak()
    {
        // Arrange
        var profile = new Profile
        {
            Id = Guid.NewGuid(),
            Email = "student@lingopro.online",
            FullName = "Student",
            Role = UserRole.Student
        };
        var day1 = new DateOnly(2026, 10, 16);
        var day2 = new DateOnly(2026, 10, 17);

        // Act
        profile.AwardXpAndUpdateStreak(50, day1);
        profile.AwardXpAndUpdateStreak(70, day2);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(2));
            Assert.That(profile.LongestStreak, Is.EqualTo(2));
            Assert.That(profile.TotalXp, Is.EqualTo(120));
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
