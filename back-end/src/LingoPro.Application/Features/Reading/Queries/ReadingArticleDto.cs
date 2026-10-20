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
    CertLevel CertLevel,
    ReadingArticleSourceType SourceType,
    int WordCount,
    string ContentText,
    string QuestionsJson
);
