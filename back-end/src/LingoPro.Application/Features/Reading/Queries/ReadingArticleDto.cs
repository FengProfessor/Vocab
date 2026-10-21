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
    string QuestionsJson
);
