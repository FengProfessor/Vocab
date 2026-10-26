namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Represents the 5-axis skill competency radar scores (0-100) computed from actual user study records.
/// </summary>
public sealed record SkillRadarScoresDto(
    int VocabScore,
    int GrammarScore,
    int ReflexScore,
    int ReadingScore,
    int ListeningScore
);
