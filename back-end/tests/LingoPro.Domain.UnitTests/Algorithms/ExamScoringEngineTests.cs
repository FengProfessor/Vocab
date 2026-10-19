using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Domain.UnitTests.Algorithms;

/// <summary>
/// NUnit business unit tests for TOEIC (ETS scaled 10-990) and VSTEP (10-point scale) exam scoring algorithms.
/// </summary>
[TestFixture]
public sealed class ExamScoringEngineTests
{
    [TestCase(95, 92, 945, CertLevel.C1)]
    [TestCase(80, 78, 785, CertLevel.B2)]
    [TestCase(60, 58, 550, CertLevel.B1)]
    [TestCase(30, 28, 225, CertLevel.A2)]
    public void CalculateToeicScore_ValidRawCounts_ReturnsExpectedTotalAndCefrLevel(
        int listeningCorrect,
        int readingCorrect,
        int minimumExpectedTotal,
        CertLevel expectedCefr)
    {
        // Act
        var result = ExamScoringEngine.CalculateToeicScore(listeningCorrect, readingCorrect);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.TotalScaledScore, Is.GreaterThanOrEqualTo(minimumExpectedTotal));
            Assert.That(result.CertLevel, Is.EqualTo(expectedCefr));
            Assert.That(result.ListeningScaledScore, Is.InRange(5, 495));
            Assert.That(result.ReadingScaledScore, Is.InRange(5, 495));
        });
    }

    [TestCase(8.5, 8.5, 8.5, 8.5, "C1 (Level 5)", CertLevel.C1)]
    [TestCase(6.5, 6.0, 6.0, 6.5, "B2 (Level 4)", CertLevel.B2)]
    [TestCase(4.5, 4.0, 4.0, 4.5, "B1 (Level 3)", CertLevel.B1)]
    [TestCase(3.0, 3.0, 3.0, 3.0, "Below B1", CertLevel.A2)]
    public void CalculateVstepScore_FourSkillScores_ReturnsHalfPointRoundedBandAndCefr(
        double listening,
        double reading,
        double writing,
        double speaking,
        string expectedBand,
        CertLevel expectedCefr)
    {
        // Act
        var result = ExamScoringEngine.CalculateVstepScore(listening, reading, writing, speaking);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.BandDescription, Is.EqualTo(expectedBand));
            Assert.That(result.CertLevel, Is.EqualTo(expectedCefr));
            Assert.That(result.OverallScore, Is.InRange(0.0, 10.0));
        });
    }
}
