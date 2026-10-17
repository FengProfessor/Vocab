using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Multi-provider AI gateway with deterministic Golden Cache and local heuristic fallback (05_MODULE_MAPPING_SRS).
/// </summary>
public interface IAiRouterService
{
    Task<AiSpeakingFeedbackDto> EvaluateSpeakingDialogueAsync(
        string topic,
        string lastTranscript,
        IReadOnlyList<string> history,
        CancellationToken ct = default);

    Task<AiSentenceAnalysisDto> AnalyzeSentenceStructureAsync(
        string sentence,
        string? context,
        CancellationToken ct = default);

    Task<AiWritingEvaluationDto> EvaluateEssayAsync(
        ExamType examType,
        string promptText,
        string essayText,
        CancellationToken ct = default);

    Task<int> SelectSmartSenseIndexAsync(
        string word,
        string context,
        IReadOnlyList<string> definitions,
        CancellationToken ct = default);

    Task<IReadOnlyList<string>> ExtractWordsFromOcrImageAsync(
        string base64Image,
        string mimeType,
        CancellationToken ct = default);
}
