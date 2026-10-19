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

        builder.Property(x => x.Slug).HasColumnName("slug").IsRequired().HasMaxLength(200);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.CertLevel).HasColumnName("cefr_level").HasConversion<string>().HasMaxLength(8);
        builder.Property(x => x.SourceType).HasColumnName("source_type").HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32);
    }
}
