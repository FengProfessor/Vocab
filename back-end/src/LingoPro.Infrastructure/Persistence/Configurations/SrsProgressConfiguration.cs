using LingoPro.Domain.Entities.Vocab;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="SrsProgress"/> mapped to <c>public.srs_progress</c>.
/// </summary>
public sealed class SrsProgressConfiguration : IEntityTypeConfiguration<SrsProgress>
{
    public void Configure(EntityTypeBuilder<SrsProgress> builder)
    {
        builder.ToTable("srs_progress", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.State).HasColumnName("state").HasConversion<int>();
        builder.Property(x => x.NextReviewDate).HasColumnType("timestamptz");
        builder.Property(x => x.LastReviewedAt).HasColumnType("timestamptz");

        builder.HasIndex(x => new { x.UserId, x.WordId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(p => p.SrsProgresses)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Word)
            .WithMany(w => w.SrsProgresses)
            .HasForeignKey(x => x.WordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}