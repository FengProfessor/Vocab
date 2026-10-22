using LingoPro.Domain.Entities.Auth;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Entities;

/// <summary>
/// Business-rule tests (plan IDs GAM-01..06) for XP awarding and daily streak progression
/// implemented by <see cref="Profile.AwardXpAndUpdateStreak"/>.
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class UserGamificationTests
{
    private static readonly DateOnly Today = new(2026, 10, 17);

    private static Profile CreateProfile(int streak = 0, int longest = 0, DateOnly? lastActive = null, int totalXp = 0) => new()
    {
        Id = Guid.NewGuid(),
        Email = "student@lingopro.online",
        FullName = "Student",
        CurrentStreak = streak,
        LongestStreak = longest,
        LastActiveDate = lastActive,
        TotalXp = totalXp
    };

    [Test]
    [Property("PlanId", "GAM-01")]
    public void AwardXpAndUpdateStreak_FirstActivity_StartsStreakAtOne()
    {
        // Arrange
        var profile = CreateProfile();

        // Act
        profile.AwardXpAndUpdateStreak(10, Today);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(1));
            Assert.That(profile.LongestStreak, Is.EqualTo(1));
            Assert.That(profile.LastActiveDate, Is.EqualTo(Today));
            Assert.That(profile.TotalXp, Is.EqualTo(10));
        });
    }

    [Test]
    [Property("PlanId", "GAM-02")]
    public void AwardXpAndUpdateStreak_ConsecutiveDay_IncrementsStreak()
    {
        // Arrange
        var profile = CreateProfile(streak: 4, longest: 4, lastActive: Today.AddDays(-1));

        // Act
        profile.AwardXpAndUpdateStreak(5, Today);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(5));
            Assert.That(profile.LongestStreak, Is.EqualTo(5));
            Assert.That(profile.LastActiveDate, Is.EqualTo(Today));
        });
    }

    [Test]
    [Property("PlanId", "GAM-03")]
    public void AwardXpAndUpdateStreak_SameDay_KeepsStreakButAddsXp()
    {
        // Arrange
        var profile = CreateProfile(streak: 3, longest: 7, lastActive: Today, totalXp: 100);

        // Act
        profile.AwardXpAndUpdateStreak(15, Today);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(3));
            Assert.That(profile.LongestStreak, Is.EqualTo(7));
            Assert.That(profile.TotalXp, Is.EqualTo(115));
        });
    }

    [TestCase(2)]
    [TestCase(10)]
    [Property("PlanId", "GAM-04")]
    public void AwardXpAndUpdateStreak_GapOfMoreThanOneDay_ResetsStreakToOne(int gapDays)
    {
        // Arrange
        var profile = CreateProfile(streak: 6, longest: 6, lastActive: Today.AddDays(-gapDays));

        // Act
        profile.AwardXpAndUpdateStreak(10, Today);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(1));
            Assert.That(profile.LongestStreak, Is.EqualTo(6));
            Assert.That(profile.LastActiveDate, Is.EqualTo(Today));
        });
    }

    [Test]
    [Property("PlanId", "GAM-05")]
    public void AwardXpAndUpdateStreak_StreakBelowLongest_DoesNotLowerLongest()
    {
        // Arrange
        var profile = CreateProfile(streak: 2, longest: 20, lastActive: Today.AddDays(-1));

        // Act
        profile.AwardXpAndUpdateStreak(10, Today);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(3));
            Assert.That(profile.LongestStreak, Is.EqualTo(20));
        });
    }

    [Test]
    [Property("PlanId", "GAM-05")]
    public void AwardXpAndUpdateStreak_StreakExceedsLongest_UpdatesLongest()
    {
        // Arrange
        var profile = CreateProfile(streak: 9, longest: 9, lastActive: Today.AddDays(-1));

        // Act
        profile.AwardXpAndUpdateStreak(10, Today);

        // Assert
        Assert.That(profile.LongestStreak, Is.EqualTo(10));
    }

    [TestCase(0)]
    [TestCase(-5)]
    [Property("PlanId", "GAM-06")]
    public void AwardXpAndUpdateStreak_NonPositiveXp_DoesNotChangeTotalXp(int xp)
    {
        // Arrange
        var profile = CreateProfile(totalXp: 50);

        // Act
        profile.AwardXpAndUpdateStreak(xp, Today);

        // Assert
        Assert.That(profile.TotalXp, Is.EqualTo(50));
    }
}
