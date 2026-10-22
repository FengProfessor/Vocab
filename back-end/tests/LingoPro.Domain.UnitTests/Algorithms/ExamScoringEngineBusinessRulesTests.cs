using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Algorithms;

/// <summary>
/// Business-rule tests (plan IDs TO-01..07, VS-01, VS-02) for <see cref="ExamScoringEngine"/>,
/// using the original ETS barem tables (src/lib/toeic-barem.ts) and CEFR thresholds (src/lib/toeic-scoring.ts).
/// </summary>
[TestFixture]
[Category("Exam")]
public sealed class ExamScoringEngineBusinessRulesTests
{
    // Original ETS tables, index = raw correct answers (0..100).
    private static readonly int[] EtsListening =
    [
        5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70,
        75, 80, 85, 90, 95, 100, 110, 115, 120, 125, 130, 135, 140, 145, 150, 160,
        165, 170, 175, 180, 185, 190, 195, 200, 210, 215, 220, 230, 240, 245, 250,
        255, 260, 270, 275, 280, 290, 295, 300, 310, 315, 320, 325, 330, 335, 340,
        345, 350, 360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420,
        425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495,
        495, 495, 495, 495, 495
    ];

    private static readonly int[] EtsReading =
    [
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
        60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135,
        140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 210, 215,
        220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290,
        295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365,
        370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 445,
        455, 465, 475, 485, 495
    ];

    [Test]
    [Property("PlanId", "TO-01")]
    public void CalculateToeicScore_ZeroCorrect_Returns10()
    {
        // Act
        var result = ExamScoringEngine.CalculateToeicScore(0, 0);

        // Assert
        Assert.That(result.TotalScaledScore, Is.EqualTo(10));
    }

    [Test]
    [Property("PlanId", "TO-02")]
    public void CalculateToeicScore_AllCorrect_Returns990()
    {
        // Act
        var result = ExamScoringEngine.CalculateToeicScore(100, 100);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.TotalScaledScore, Is.EqualTo(990));
            Assert.That(result.ListeningScaledScore, Is.EqualTo(495));
            Assert.That(result.ReadingScaledScore, Is.EqualTo(495));
        });
    }

    [Test]
    [Category("KnownDeviation")]
    [Property("PlanId", "TO-03")]
    public void CalculateToeicScore_ListeningRaw0To100_MatchesEtsTable()
    {
        // Arrange + Act + Assert: all 101 raw values vs the original ETS listening table
        Assert.That(EtsListening, Has.Length.EqualTo(101));
        Assert.Multiple(() =>
        {
            for (int raw = 0; raw <= 100; raw++)
            {
                var result = ExamScoringEngine.CalculateToeicScore(raw, 0);
                Assert.That(result.ListeningScaledScore, Is.EqualTo(EtsListening[raw]), $"Listening raw={raw}");
            }
        });
    }

    [Test]
    [Category("KnownDeviation")]
    [Property("PlanId", "TO-04")]
    public void CalculateToeicScore_ReadingRaw0To100_MatchesEtsTable()
    {
        // Arrange + Act + Assert: all 101 raw values vs the original ETS reading table
        Assert.That(EtsReading, Has.Length.EqualTo(101));
        Assert.Multiple(() =>
        {
            for (int raw = 0; raw <= 100; raw++)
            {
                var result = ExamScoringEngine.CalculateToeicScore(0, raw);
                Assert.That(result.ReadingScaledScore, Is.EqualTo(EtsReading[raw]), $"Reading raw={raw}");
            }
        });
    }

    [Test]
    [Property("PlanId", "TO-05")]
    public void CalculateToeicScore_AllRawValues_SectionScoresAreMultiplesOfFiveWithinRange()
    {
        Assert.Multiple(() =>
        {
            for (int raw = 0; raw <= 100; raw++)
            {
                var result = ExamScoringEngine.CalculateToeicScore(raw, raw);
                Assert.That(result.ListeningScaledScore % 5, Is.EqualTo(0), $"Listening raw={raw}");
                Assert.That(result.ReadingScaledScore % 5, Is.EqualTo(0), $"Reading raw={raw}");
                Assert.That(result.ListeningScaledScore, Is.InRange(5, 495), $"Listening raw={raw}");
                Assert.That(result.ReadingScaledScore, Is.InRange(5, 495), $"Reading raw={raw}");
                Assert.That(result.TotalScaledScore, Is.EqualTo(result.ListeningScaledScore + result.ReadingScaledScore));
            }
        });
    }

    [Test]
    [Property("PlanId", "TO-06")]
    public void CalculateToeicScore_IncreasingRaw_ScaledScoresAreMonotonicNonDecreasing()
    {
        int prevListening = 0;
        int prevReading = 0;
        Assert.Multiple(() =>
        {
            for (int raw = 0; raw <= 100; raw++)
            {
                var result = ExamScoringEngine.CalculateToeicScore(raw, raw);
                Assert.That(result.ListeningScaledScore, Is.GreaterThanOrEqualTo(prevListening), $"Listening raw={raw}");
                Assert.That(result.ReadingScaledScore, Is.GreaterThanOrEqualTo(prevReading), $"Reading raw={raw}");
                prevListening = result.ListeningScaledScore;
                prevReading = result.ReadingScaledScore;
            }
        });
    }

    // TO-07: original thresholds C1>=905, B2>=605, B1>=405, A2>=255, else A1.
    // Raw pairs are chosen from the ETS tables so that the (original) total equals the given value.
    [TestCase(87, 95, 900, CertLevel.B2)]
    [TestCase(88, 95, 905, CertLevel.C1)]
    [TestCase(59, 65, 600, CertLevel.B1)]
    [TestCase(59, 66, 605, CertLevel.B2)]
    [TestCase(41, 49, 400, CertLevel.A2)]
    [TestCase(42, 49, 405, CertLevel.B1)]
    [TestCase(27, 35, 250, CertLevel.A1)]
    [TestCase(28, 35, 255, CertLevel.A2)]
    [Category("KnownDeviation")]
    [Property("PlanId", "TO-07")]
    public void CalculateToeicScore_CefrBoundaries_FollowOriginalThresholds(
        int listeningRaw, int readingRaw, int expectedEtsTotal, CertLevel expectedLevel)
    {
        // Arrange
        Assert.That(EtsListening[listeningRaw] + EtsReading[readingRaw], Is.EqualTo(expectedEtsTotal));

        // Act
        var result = ExamScoringEngine.CalculateToeicScore(listeningRaw, readingRaw);

        // Assert
        Assert.That(result.CertLevel, Is.EqualTo(expectedLevel));
    }

    // VS-01
    [TestCase(3.5, CertLevel.A2)]
    [TestCase(4.0, CertLevel.B1)]
    [TestCase(5.5, CertLevel.B1)]
    [TestCase(6.0, CertLevel.B2)]
    [TestCase(8.0, CertLevel.B2)]
    [TestCase(8.5, CertLevel.C1)]
    [Property("PlanId", "VS-01")]
    public void CalculateVstepScore_CefrBoundaries_MapToExpectedLevel(double score, CertLevel expectedLevel)
    {
        // Act
        var result = ExamScoringEngine.CalculateVstepScore(score, score, score, score);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.OverallScore, Is.EqualTo(score));
            Assert.That(result.CertLevel, Is.EqualTo(expectedLevel));
        });
    }

    // VS-02
    [TestCase(5.24, 5.0)]
    [TestCase(5.25, 5.5)]
    [TestCase(5.74, 5.5)]
    [TestCase(5.75, 6.0)]
    [Property("PlanId", "VS-02")]
    public void CalculateVstepScore_AverageRounding_RoundsToNearestHalf(double average, double expectedOverall)
    {
        // Act
        var result = ExamScoringEngine.CalculateVstepScore(average, average, average, average);

        // Assert
        Assert.That(result.OverallScore, Is.EqualTo(expectedOverall));
    }
}
