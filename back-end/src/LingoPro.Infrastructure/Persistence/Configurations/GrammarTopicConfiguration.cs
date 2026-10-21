using LingoPro.Domain.Entities.Grammar;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="GrammarTopic"/> mapped to <c>public.grammar_topics</c>.
/// </summary>
public sealed class GrammarTopicConfiguration : IEntityTypeConfiguration<GrammarTopic>
{
    public void Configure(EntityTypeBuilder<GrammarTopic> builder)
    {
        builder.ToTable("grammar_topics", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Slug).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.Level).HasDefaultValueSql("'beginner'");
        builder.Property(x => x.OrderIndex).HasDefaultValueSql("0");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

        builder.HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
