using LingoPro.Domain.Entities.Reading;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="ReadingArticle"/> mapped to <c>public.reading_articles</c>.
/// </summary>
public sealed class ReadingArticleConfiguration : IEntityTypeConfiguration<ReadingArticle>
{
    public void Configure(EntityTypeBuilder<ReadingArticle> builder)
    {
        builder.ToTable("reading_articles", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Slug).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.CefrLevel).IsRequired();
        builder.Property(x => x.ThemeId).IsRequired();
        builder.Property(x => x.Passage).IsRequired();
        builder.Property(x => x.PassagePlain).IsRequired();
        builder.Property(x => x.WordCount).HasDefaultValueSql("0");
        builder.Property(x => x.EstimatedReadMinutes).HasDefaultValueSql("1");
        builder.Property(x => x.Cloze).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
        builder.Property(x => x.Questions).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
        builder.Property(x => x.VocabularyHighlights).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
        builder.Property(x => x.PodcastMeta).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
        builder.Property(x => x.MindmapData).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
        builder.Property(x => x.SourceType).HasDefaultValueSql("'custom'");
        builder.Property(x => x.SourceMetadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
        builder.Property(x => x.Status).HasDefaultValueSql("'published'");
        builder.Property(x => x.DifficultyScore).HasDefaultValueSql("0");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

        builder.HasIndex(x => new { x.CefrLevel, x.ThemeId, x.Status }).HasDatabaseName("reading_articles_level_theme_status_idx");
        builder.HasIndex(x => new { x.ThemeId, x.Status }).HasDatabaseName("reading_articles_theme_status_idx");
        builder.HasIndex(x => new { x.SourceType, x.SourceId }).HasDatabaseName("reading_articles_source_idx");
        builder.HasIndex(x => x.CreatedAt).IsDescending().HasDatabaseName("reading_articles_created_idx");
    }
}
