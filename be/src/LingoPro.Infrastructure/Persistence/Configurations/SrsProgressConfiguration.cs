using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="SrsProgress"/> mapped to <c>public.srs_progress</c> with optimistic concurrency.
/// </summary>
public sealed class SrsProgressConfiguration : IEntityTypeConfiguration<SrsProgress>
{
    public void Configure(EntityTypeBuilder<SrsProgress> builder)
    {
        builder.ToTable("srs_progress", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.State).HasColumnName("state").HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Version).IsRowVersion();

        builder.HasIndex(x => new { x.UserId, x.WordId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.NextReviewDate });
    }
}
