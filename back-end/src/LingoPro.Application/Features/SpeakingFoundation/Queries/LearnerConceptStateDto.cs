namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Multi-dimensional mastery and gap state for a single Grade 6 Foundation lexical concept.
/// </summary>
public record LearnerConceptStateDto(
    string ConceptId,
    string Lemma,
    string MeaningVi,
    string Cluster,
    int Stage,
    int GenerativePower,
    string StatusBucket,
    string ActiveGap,
    bool SoundRecognition,
    bool TextRecognition,
    bool MeaningRecall,
    bool FormRecall,
    bool ChunkUse,
    bool GenerativeUse,
    decimal UncertaintyScore,
    int ConsecutiveIndependentPasses,
    DateTime? LastProbedAt,
    string? AudioUrl,
    string? ImageUrl,
    IReadOnlyList<string> TargetChunks);
