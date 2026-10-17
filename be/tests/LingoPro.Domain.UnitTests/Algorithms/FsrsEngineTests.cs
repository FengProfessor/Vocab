using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Algorithms;

/// <summary>
/// NUnit business unit tests for the FSRS-5 spaced repetition memory scheduling engine.
/// </summary>
[TestFixture]
public sealed class FsrsEngineTests
{
    [TestCase(SrsReviewQuality.Again, SrsCardState.Learning)]
    [TestCase(SrsReviewQuality.Hard, SrsCardState.Learning)]
    [TestCase(SrsReviewQuality.Good, SrsCardState.Review)]
    [TestCase(SrsReviewQuality.Easy, SrsCardState.Review)]
    public void ScheduleNext_FirstReviewOnNewCard_TransitionsToExpectedState(
        SrsReviewQuality quality,
        SrsCardState expectedState)
    {
        // Arrange
        var now = new DateTime(2026, 10, 17, 10, 0, 0, DateTimeKind.Utc);
        var input = new FsrsCalculationInput(
            Stability: 0,
            Difficulty: 5.0,
            IntervalDays: 0,
            Reps: 0,
            Lapses: 0,
            State: SrsCardState.New,
            LastReviewedAt: null);

        // Act
        var result = FsrsEngine.ScheduleNext(input, quality, now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.State, Is.EqualTo(expectedState));
            Assert.That(result.Stability, Is.GreaterThan(0));
            Assert.That(result.Difficulty, Is.InRange(1.0, 10.0));
            Assert.That(result.Reps, Is.EqualTo(1));
            Assert.That(result.XpAwarded, Is.GreaterThan(0));
        });
    }

    [Test]
    public void ScheduleNext_LapseOnReviewCard_IncrementsLapsesAndEntersRelearning()
    {
        // Arrange
        var lastReview = new DateTime(2026, 10, 1, 10, 0, 0, DateTimeKind.Utc);
        var now = new DateTime(2026, 10, 17, 10, 0, 0, DateTimeKind.Utc);
        var input = new FsrsCalculationInput(
            Stability: 14.0,
            Difficulty: 5.0,
            IntervalDays: 14,
            Reps: 5,
            Lapses: 1,
            State: SrsCardState.Review,
            LastReviewedAt: lastReview);

        // Act
        var result = FsrsEngine.ScheduleNext(input, SrsReviewQuality.Again, now);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.State, Is.EqualTo(SrsCardState.Relearning));
            Assert.That(result.Lapses, Is.EqualTo(2));
            Assert.That(result.IntervalDays, Is.EqualTo(1));
            Assert.That(result.Stability, Is.LessThan(input.Stability));
        });
    }
}
