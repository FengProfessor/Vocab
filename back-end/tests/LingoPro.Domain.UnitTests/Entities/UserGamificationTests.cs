using LingoPro.Domain.Entities.Auth;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Entities;

/// <summary>
/// Business-rule tests (plan IDs GAM-01..06) for XP awarding and daily streak progression
/// implemented by <see cref="UserGamification.AwardXpAndUpdateStreak"/>.
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class UserGamificationTests
{
    private static readonly DateOnly Today = new(2026, 10, 17);

    private static UserGamification CreateProfile(int streak = 0, int longest = 0, DateOnly? lastActive = null, int totalXp = 0) => new()
    {
        UserId = Guid.NewGuid(),
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

    /// <summary>
    /// Original award_xp RAISEs 'Invalid XP award' for p_xp &lt;= 0 (supabase/migrations/20260710_security_hardening.sql:168),
    /// so no streak/last-active change may happen; the domain method still advances the streak.
    /// </summary>
    [TestCase(0)]
    [TestCase(-5)]
    [Category("KnownDeviation")]
    [Property("PlanId", "GAM-06")]
    public void AwardXpAndUpdateStreak_NonPositiveXp_DoesNotTouchStreakOrLastActive(int xp)
    {
        // Arrange
        var profile = CreateProfile(streak: 3, longest: 3, lastActive: Today.AddDays(-1), totalXp: 50);

        // Act
        profile.AwardXpAndUpdateStreak(xp, Today);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(profile.CurrentStreak, Is.EqualTo(3));
            Assert.That(profile.LastActiveDate, Is.EqualTo(Today.AddDays(-1)));
        });
    }

    // award_xp today_xp/today_date handling: 20260710_security_hardening.sql:186-189, 206
    [Test]
    [Property("PlanId", "GAM-07")]
    public void AwardXpAndUpdateStreak_SameDayTwice_AccumulatesTodayXp_AndResetsOnNewDay()
    {
        // Arrange
        var profile = CreateProfile();

        // Act
        profile.AwardXpAndUpdateStreak(10, Today);
        profile.AwardXpAndUpdateStreak(5, Today);
        var sameDayTodayXp = profile.TodayXp;
        profile.AwardXpAndUpdateStreak(7, Today.AddDays(1));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(sameDayTodayXp, Is.EqualTo(15));
            Assert.That(profile.TodayXp, Is.EqualTo(7));
            Assert.That(profile.TodayDate, Is.EqualTo(Today.AddDays(1)));
            Assert.That(profile.TotalXp, Is.EqualTo(22));
        });
    }
}