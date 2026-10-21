using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="Word"/> mapped to <c>public.words</c>.
/// </summary>
public sealed class WordConfiguration : IEntityTypeConfiguration<Word>
{
    public void Configure(EntityTypeBuilder<Word> builder)
    {
        builder.ToTable("words", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Term).HasColumnName("word").IsRequired();
        builder.Property(x => x.DictionaryData).HasColumnType("jsonb");
        builder.Property(x => x.Synonyms).HasColumnType("text[]");
        builder.Property(x => x.Antonyms).HasColumnType("text[]");
        builder.Property(x => x.ImageConfidence).HasColumnType("smallint");

        builder.HasOne(x => x.Classroom)
            .WithMany(c => c.Words)
            .HasForeignKey(x => x.ClassroomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AddedByUser)
            .WithMany()
            .HasForeignKey(x => x.AddedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }
}