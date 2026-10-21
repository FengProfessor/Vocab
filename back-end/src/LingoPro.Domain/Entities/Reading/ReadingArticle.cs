using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Reading;

/// <summary>
/// Represents a curated CEFR reading library article (public.reading_articles).
/// </summary>
public class ReadingArticle : BaseAuditableEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    /// <summary>'A1'..'C2'.</summary>
    public string CefrLevel { get; set; } = string.Empty;
    public string ThemeId { get; set; } = string.Empty;
    public string Passage { get; set; } = string.Empty;
    public string PassagePlain { get; set; } = string.Empty;
    public int WordCount { get; set; }
    public int EstimatedReadMinutes { get; set; } = 1;
    public string? Translation { get; set; }
    public string? Summary { get; set; }

    /// <summary>jsonb. SQL default '{}'.</summary>
    public string Cloze { get; set; } = "{}";

    /// <summary>jsonb. SQL default '[]'.</summary>
    public string Questions { get; set; } = "[]";

    /// <summary>jsonb. SQL default '[]'.</summary>
    public string VocabularyHighlights { get; set; } = "[]";
    public string? AudioUrl { get; set; }
    public string? PodcastMeta { get; set; } = "{}";
    public string? MindmapData { get; set; } = "{}";

    /// <summary>'vstep' | 'toeic' | 'voa' | 'race' | 'openstax' | 'custom'. SQL default 'custom'.</summary>
    public string SourceType { get; set; } = "custom";
    public string? SourceId { get; set; }
    public string? SourceMetadata { get; set; } = "{}";

    /// <summary>'draft' | 'published' | 'archived'. SQL default 'published'.</summary>
    public string Status { get; set; } = "published";
    public double? DifficultyScore { get; set; } = 0;

    public virtual ICollection<UserReadingLibraryProgress> UserProgresses { get; set; } = new List<UserReadingLibraryProgress>();
}
