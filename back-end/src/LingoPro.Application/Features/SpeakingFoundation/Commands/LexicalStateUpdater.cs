using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Applies a lexical evidence event to a <see cref="LearnerLexicalState"/>.
/// SQL (public.learner_lexical_state) has no evidence_count/confidence_score columns, so confidence is derived
/// as <c>1 - uncertainty_score</c> and the bucket is recomputed from it.
/// </summary>
internal static class LexicalStateUpdater
{
    public static LearnerLexicalState CreateInitial(Guid learnerId, string conceptId) => new()
    {
        LearnerId = learnerId,
        ConceptId = conceptId,
        UncertaintyScore = 1.00m,
        StatusBucket = LexicalStatusBucket.Unknown
    };

    public static void Apply(
        LearnerLexicalState state,
        bool isCorrect,
        decimal confidenceGain,
        LexicalSupportLevel supportLevel,
        int latencyMs,
        LexicalStatusBucket lowBucket)
    {
        decimal confidence = 1.00m - state.UncertaintyScore;
        confidence = isCorrect
            ? Math.Min(1.00m, confidence + confidenceGain)
            : Math.Max(0.00m, confidence - 0.25m);
        state.UncertaintyScore = 1.00m - confidence;

        state.StatusBucket = confidence switch
        {
            >= 0.75m => LexicalStatusBucket.Solid,
            >= 0.40m => LexicalStatusBucket.Partial,
            _ => lowBucket
        };

        state.LastSupportLevel = supportLevel;
        state.LastLatencyMs = latencyMs;
        state.ConsecutiveIndependentPasses = isCorrect && supportLevel == LexicalSupportLevel.Independent
            ? state.ConsecutiveIndependentPasses + 1
            : 0;
        state.LastProbedAt = DateTime.UtcNow;
        state.UpdatedAt = DateTime.UtcNow;
    }
}
