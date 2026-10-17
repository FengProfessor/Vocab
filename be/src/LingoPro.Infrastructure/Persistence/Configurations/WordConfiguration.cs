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

        builder.Property(x => x.Term).HasColumnName("term").IsRequired().HasMaxLength(160);
        builder.Property(x => x.PartOfSpeech).HasColumnName("pos").HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Level).HasColumnName("cefr_level").HasConversion<string>().HasMaxLength(8);
        builder.Property(x => x.Status).HasColumnName("approval_status").HasConversion<string>().HasMaxLength(32);
        builder.HasIndex(x => new { x.Term, x.ClassroomId });
    }
}
