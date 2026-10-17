namespace LingoPro.Application.Common.Models;

/// <summary>
/// Represents rubric-based AI writing essay evaluation scores and upgraded sample text.
/// </summary>
public record AiWritingEvaluationDto(
    double TaskFulfillmentScore,
    double OrganizationScore,
    double VocabularyScore,
    double GrammarScore,
    double OverallScore,
    string DetailedFeedback,
    string UpgradedSampleEssay
);
