namespace LingoPro.Application.Common.Models;

/// <summary>
/// Represents syntactic decomposition and progressive sentence-building levels.
/// </summary>
public record AiSentenceAnalysisDto(
    string MainClause,
    IReadOnlyList<string> SecondaryClauses,
    object Kernel,
    IReadOnlyList<string> BuildLevels,
    IReadOnlyList<object> Chunks,
    string AiSource
);
