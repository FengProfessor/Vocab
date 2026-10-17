using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Algorithms;

/// <summary>
/// Standardized 10-point score result for VSTEP / VNU proficiency exams.
/// </summary>
public record VstepScoreResult(
    double ListeningScore,
    double ReadingScore,
    double WritingScore,
    double SpeakingScore,
    double OverallScore,
    CertLevel CertLevel,
    string BandDescription
);
