using LingoPro.Domain.Common;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Represents a curated CEFR reading library article (public.reading_articles).
/// </summary>
public class ReadingArticle : BaseAuditableEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Topic { get; set; } = "general";
    public CertLevel CertLevel { get; set; } = CertLevel.B1;
    public ReadingArticleSourceType SourceType { get; set; } = ReadingArticleSourceType.Custom;
    public ReadingArticleStatus Status { get; set; } = ReadingArticleStatus.Published;
    public int WordCount { get; set; }
    public string ContentText { get; set; } = string.Empty;
    public string QuestionsJson { get; set; } = "[]";
}
