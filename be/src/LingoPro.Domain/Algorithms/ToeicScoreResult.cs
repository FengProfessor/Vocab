using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Algorithms;

/// <summary>
/// Scaled score result for a full or partial ETS TOEIC exam attempt.
/// </summary>
public record ToeicScoreResult(
    int ListeningCorrect,
    int ReadingCorrect,
    int ListeningScaledScore,
    int ReadingScaledScore,
    int TotalScaledScore,
    CertLevel CertLevel,
    string ProficiencyBand
);
