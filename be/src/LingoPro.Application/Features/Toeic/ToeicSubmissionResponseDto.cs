using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Toeic;

/// <summary>
/// Represents ETS-scaled score results and proficiency classification for a submitted TOEIC exam.
/// </summary>
public record ToeicSubmissionResponseDto(
    Guid ResultId,
    string TestId,
    int ListeningCorrect,
    int ReadingCorrect,
    int ListeningScaledScore,
    int ReadingScaledScore,
    int TotalScaledScore,
    CertLevel CertLevel,
    string ProficiencyBand,
    int XpAwarded
);
