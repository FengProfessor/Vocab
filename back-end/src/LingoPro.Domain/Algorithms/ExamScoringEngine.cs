using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Algorithms;

/// <summary>
/// Standardized Exam Scoring Engine for ETS TOEIC (10-990) and VSTEP/VNU (0-10 scale).
/// </summary>
public static class ExamScoringEngine
{
    /// <summary>
    /// Converts raw listening and reading correct counts into ETS scaled scores (5-495 per section) and <see cref="CertLevel"/>.
    /// </summary>
    public static ToeicScoreResult CalculateToeicScore(
        int listeningCorrect,
        int readingCorrect,
        int totalListeningQuestions = 100,
        int totalReadingQuestions = 100)
    {
        int normalizedListening = totalListeningQuestions > 0
            ? (int)Math.Round((double)listeningCorrect / totalListeningQuestions * 100)
            : 0;
        int normalizedReading = totalReadingQuestions > 0
            ? (int)Math.Round((double)readingCorrect / totalReadingQuestions * 100)
            : 0;

        int listeningScaled = ConvertListeningToScaled(Math.Clamp(normalizedListening, 0, 100));
        int readingScaled = ConvertReadingToScaled(Math.Clamp(normalizedReading, 0, 100));
        int totalScore = listeningScaled + readingScaled;

        (CertLevel certLevel, string band) = totalScore switch
        {
            >= 905 => (CertLevel.C1, "C1 (International Professional Proficiency)"),
            >= 785 => (CertLevel.B2, "B2 (Working Proficiency Plus)"),
            >= 550 => (CertLevel.B1, "B1 (Limited Working Proficiency)"),
            >= 225 => (CertLevel.A2, "A2 (Elementary Proficiency)"),
            _ => (CertLevel.A1, "A1 (Beginner)")
        };

        return new ToeicScoreResult(
            listeningCorrect,
            readingCorrect,
            listeningScaled,
            readingScaled,
            totalScore,
            certLevel,
            band
        );
    }

    /// <summary>
    /// Calculates the 4-skill average VSTEP score rounded to the nearest 0.5 and maps it to <see cref="CertLevel"/>.
    /// </summary>
    public static VstepScoreResult CalculateVstepScore(
        double listening,
        double reading,
        double writing,
        double speaking)
    {
        double rawAvg = (listening + reading + writing + speaking) / 4.0;
        double overall = Math.Round(rawAvg * 2.0, MidpointRounding.AwayFromZero) / 2.0;

        (CertLevel certLevel, string bandDescription) = overall switch
        {
            >= 8.5 => (CertLevel.C1, "C1 (Level 5)"),
            >= 6.0 => (CertLevel.B2, "B2 (Level 4)"),
            >= 4.0 => (CertLevel.B1, "B1 (Level 3)"),
            _ => (CertLevel.A2, "Below B1")
        };

        return new VstepScoreResult(
            listening,
            reading,
            writing,
            speaking,
            overall,
            certLevel,
            bandDescription
        );
    }

    private static int ConvertListeningToScaled(int rawCorrect)
    {
        if (rawCorrect <= 6) return 5;
        if (rawCorrect >= 96) return 495;
        int scaled = 5 + (int)Math.Round((rawCorrect - 6) * (490.0 / 90.0));
        return Math.Clamp((scaled / 5) * 5, 5, 495);
    }

    private static int ConvertReadingToScaled(int rawCorrect)
    {
        if (rawCorrect <= 9) return 5;
        if (rawCorrect >= 99) return 495;
        int scaled = 5 + (int)Math.Round((rawCorrect - 9) * (490.0 / 90.0));
        return Math.Clamp((scaled / 5) * 5, 5, 495);
    }
}
