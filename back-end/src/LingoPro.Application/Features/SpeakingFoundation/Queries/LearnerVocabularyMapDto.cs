namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Complete 6-dimension lexical gap map and remediation queue for a learner in the Speaking Foundation curriculum.
/// </summary>
public record LearnerVocabularyMapDto(
    Guid LearnerId,
    int TotalConcepts,
    VocabularyBucketCountsDto BucketCounts,
    IReadOnlyDictionary<string, int> GapBreakdown,
    IReadOnlyList<LearnerConceptStateDto> TopRemediationQueue,
    IReadOnlyList<LearnerConceptStateDto> Concepts);
