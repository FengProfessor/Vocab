using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Algorithms;

/// <summary>
/// Business-rule tests (plan IDs VOC-01, VOC-04..09, VOC-12, GRM-01) for <see cref="FsrsEngine"/>,
/// asserting the original/SRS behaviour of the spaced repetition scheduler.
/// </summary>
[TestFixture]
[Category("Vocab")]
public sealed class FsrsEngineBusinessRulesTests
{
    private static readonly DateTime Now = new(2026, 10, 17, 10, 0, 0, DateTimeKind.Utc);

    private static FsrsCalculationInput NewCard() => new(
        Stability: 0, Difficulty: 0, IntervalDays: 0, Reps: 0, Lapses: 0,
        State: SrsCardState.New, LastReviewedAt: null);

    private static FsrsCalculationInput ReviewedCard(double stability = 10.0, double difficulty = 5.0, int daysAgo = 10) => new(
        Stability: stability, Difficulty: difficulty, IntervalDays: (int)stability, Reps: 3, Lapses: 0,
        State: SrsCardState.Review, LastReviewedAt: Now.AddDays(-daysAgo));

    // VOC-04 / VOC-05
    [TestCase(SrsReviewQuality.Again, 0.40, SrsCardState.Learning, 1)]
    [TestCase(SrsReviewQuality.Hard, 1.18, SrsCardState.Learning, 0)]
    [TestCase(SrsReviewQuality.Good, 3.17, SrsCardState.Review, 0)]
    [TestCase(SrsReviewQuality.Easy, 15.69, SrsCardState.Review, 0)]
    [Property("PlanId", "VOC-04/05")]
    public void ScheduleNext_NewCard_UsesInitialStabilityPerRating(
        SrsReviewQuality rating, double expectedStability, SrsCardState expectedState, int expectedLapses)
    {
        // Arrange
        var input = NewCard();

        // Act
        var result = FsrsEngine.ScheduleNext(input, rating, Now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Stability, Is.EqualTo(expectedStability).Within(0.01));
            Assert.That(result.State, Is.EqualTo(expectedState));
            Assert.That(result.Lapses, Is.EqualTo(expectedLapses));
            Assert.That(result.Reps, Is.EqualTo(1));
        });
    }

    // VOC-06
    [Test]
    [Property("PlanId", "VOC-06")]
    public void ScheduleNext_AgainOnReviewedCard_IncrementsLapsesRelearningIntervalOne()
    {
        // Arrange
        var input = ReviewedCard();

        // Act
        var result = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Again, Now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Lapses, Is.EqualTo(input.Lapses + 1));
            Assert.That(result.State, Is.EqualTo(SrsCardState.Relearning));
            Assert.That(result.IntervalDays, Is.EqualTo(1));
            Assert.That(result.Stability, Is.GreaterThanOrEqualTo(0.2));
            Assert.That(result.Reps, Is.EqualTo(input.Reps + 1));
        });
    }

    // VOC-07
    [Test]
    [Property("PlanId", "VOC-07")]
    public void ScheduleNext_GoodOnReviewedCard_IncreasesStabilityAndStaysInReview()
    {
        // Arrange
        var input = ReviewedCard();

        // Act
        var result = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Good, Now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.State, Is.EqualTo(SrsCardState.Review));
            Assert.That(result.Stability, Is.GreaterThan(input.Stability));
            Assert.That(result.Lapses, Is.EqualTo(input.Lapses));
            Assert.That(result.IntervalDays, Is.GreaterThan(1));
        });
    }

    // VOC-08
    [Test]
    [Property("PlanId", "VOC-08")]
    public void ScheduleNext_ReviewedCard_HardLessThanGoodLessThanEasy()
    {
        // Arrange
        var input = ReviewedCard();

        // Act
        var hard = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Hard, Now);
        var good = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Good, Now);
        var easy = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Easy, Now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(hard.Stability, Is.LessThan(good.Stability));
            Assert.That(good.Stability, Is.LessThan(easy.Stability));
            Assert.That(hard.IntervalDays, Is.LessThanOrEqualTo(good.IntervalDays));
            Assert.That(good.IntervalDays, Is.LessThanOrEqualTo(easy.IntervalDays));
            Assert.That(hard.Difficulty, Is.GreaterThan(good.Difficulty));
            Assert.That(good.Difficulty, Is.GreaterThan(easy.Difficulty));
        });
    }

    // VOC-09
    [Test]
    [Property("PlanId", "VOC-09")]
    public void ScheduleNext_VeryHighStability_IntervalCappedAt365Days()
    {
        // Arrange
        var input = ReviewedCard(stability: 3000.0, difficulty: 3.0, daysAgo: 3000);

        // Act
        var result = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Easy, Now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.IntervalDays, Is.EqualTo(365));
            Assert.That(result.NextReviewDate, Is.EqualTo(DateOnly.FromDateTime(Now).AddDays(365)));
        });
    }

    // VOC-09
    [TestCase(SrsReviewQuality.Hard)]
    [TestCase(SrsReviewQuality.Good)]
    [TestCase(SrsReviewQuality.Easy)]
    [Property("PlanId", "VOC-09")]
    public void ScheduleNext_AnyPassingRating_IntervalAtLeastOneAndNextDateMatches(SrsReviewQuality rating)
    {
        // Arrange
        var input = NewCard();

        // Act
        var result = FsrsEngine.ScheduleNext(input, rating, Now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.IntervalDays, Is.InRange(1, 365));
            Assert.That(result.NextReviewDate, Is.EqualTo(DateOnly.FromDateTime(Now).AddDays(result.IntervalDays)));
        });
    }

    // VOC-12
    [TestCase(SrsReviewQuality.Again, 2)]
    [TestCase(SrsReviewQuality.Hard, 5)]
    [TestCase(SrsReviewQuality.Good, 10)]
    [TestCase(SrsReviewQuality.Easy, 15)]
    [Property("PlanId", "VOC-12")]
    public void ScheduleNext_Rating_AwardsExpectedXp(SrsReviewQuality rating, int expectedXp)
    {
        // Arrange
        var input = ReviewedCard();

        // Act
        var result = FsrsEngine.ScheduleNext(input, rating, Now);

        // Assert
        Assert.That(result.XpAwarded, Is.EqualTo(expectedXp));
    }

    // VOC-01: valid qualities {0,3,4,5}
    [TestCase(0, SrsReviewQuality.Again)]
    [TestCase(3, SrsReviewQuality.Hard)]
    [TestCase(4, SrsReviewQuality.Good)]
    [TestCase(5, SrsReviewQuality.Easy)]
    [Property("PlanId", "VOC-01")]
    public void MapQualityToRating_ValidQuality_MapsToRating(int quality, SrsReviewQuality expected)
    {
        // Act
        var rating = FsrsEngine.MapQualityToRating(quality);

        // Assert
        Assert.That(rating, Is.EqualTo(expected));
    }

    // VOC-01/02: original API only accepts quality in {0,3,4,5}; C# silently accepts 0..5 and beyond.
    [TestCase(1)]
    [TestCase(2)]
    [TestCase(6)]
    [TestCase(-1)]
    [Category("KnownDeviation")]
    [Property("PlanId", "VOC-01/02")]
    public void MapQualityToRating_QualityOutsideAllowedSet_IsRejected(int quality)
    {
        // Act + Assert: original rejects (HTTP 400); the engine is expected to refuse the value.
        Assert.That(() => FsrsEngine.MapQualityToRating(quality), Throws.Exception);
    }

    // GRM-01
    [TestCase(0.0, SrsReviewQuality.Again)]
    [TestCase(49.99, SrsReviewQuality.Again)]
    [TestCase(50.0, SrsReviewQuality.Hard)]
    [TestCase(69.99, SrsReviewQuality.Hard)]
    [TestCase(70.0, SrsReviewQuality.Good)]
    [TestCase(89.99, SrsReviewQuality.Good)]
    [TestCase(90.0, SrsReviewQuality.Easy)]
    [TestCase(100.0, SrsReviewQuality.Easy)]
    [Category("Grammar")]
    [Property("PlanId", "GRM-01")]
    public void MapAccuracyToRating_Boundaries_MapToExpectedRating(double accuracy, SrsReviewQuality expected)
    {
        // Act
        var rating = FsrsEngine.MapAccuracyToRating(accuracy);

        // Assert
        Assert.That(rating, Is.EqualTo(expected));
    }
}
