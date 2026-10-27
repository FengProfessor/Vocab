using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Reading.Queries;

/// <summary>
/// Represents a published CEFR reading library article.
/// </summary>
public record ReadingArticleDto(
    Guid Id,
    string Slug,
    string Title,
    string Topic,
    string CertLevel,
    string SourceType,
    int WordCount,
    string ContentText,
    string QuestionsJson,
    string PassagePlain = "",
    int EstimatedReadMinutes = 1,
    string? Translation = null,
    string? Summary = null,
    string ClozeJson = "{}",
    string VocabularyHighlightsJson = "[]",
    string? AudioUrl = null,
    string? PodcastMetaJson = "{}",
    string? MindmapDataJson = "{}",
    string? SourceId = null,
    string? SourceMetadataJson = "{}",
    double? DifficultyScore = 0,
    DateTimeOffset? CreatedAt = null,
    DateTimeOffset? UpdatedAt = null
);
