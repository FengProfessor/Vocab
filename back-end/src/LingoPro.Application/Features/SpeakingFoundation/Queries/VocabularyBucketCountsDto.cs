namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Aggregate concept counts across the four diagnostic mastery buckets (STABLE, FRAGILE, MISSING, UNCERTAIN).
/// </summary>
public record VocabularyBucketCountsDto(
    int Stable,
    int Fragile,
    int Missing,
    int Uncertain);
