using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// Shared value converters for the roadmap text columns whose CHECK constraints use irregular literals.
/// </summary>
internal static class RoadmapConverters
{
    public static SnakeCaseEnumConverter<RoadmapTrackType> Track() => new(
        (RoadmapTrackType.Cefr, "cefr"),
        (RoadmapTrackType.Thpt, "thpt"),
        (RoadmapTrackType.Toeic, "toeic"),
        (RoadmapTrackType.Vstep, "vstep"),
        (RoadmapTrackType.VnuBac3, "vnu-bac-3"));

    public static SnakeCaseEnumConverter<RoadmapLevelId> Level() => new(
        (RoadmapLevelId.A0, "A0"),
        (RoadmapLevelId.A1, "A1"),
        (RoadmapLevelId.A2, "A2"),
        (RoadmapLevelId.B1, "B1"),
        (RoadmapLevelId.B2, "B2"),
        (RoadmapLevelId.C1, "C1"),
        (RoadmapLevelId.C2, "C2"),
        (RoadmapLevelId.Lop10, "lop-10"),
        (RoadmapLevelId.Lop11, "lop-11"),
        (RoadmapLevelId.Lop12, "lop-12"),
        (RoadmapLevelId.Toeic450, "toeic-450"),
        (RoadmapLevelId.Toeic650, "toeic-650"),
        (RoadmapLevelId.Toeic800, "toeic-800"));
}

/// <summary>
/// EF Core mapping for public.user_roadmap (composite PK user_id + track; user_id references auth.users).
/// </summary>
public class UserRoadmapConfiguration : IEntityTypeConfiguration<UserRoadmap>
{
    public void Configure(EntityTypeBuilder<UserRoadmap> builder)
    {
        builder.ToTable("user_roadmap");
        builder.HasKey(x => new { x.UserId, x.Track }).HasName("user_roadmap_pkey");

        builder.Property(x => x.Track)
            .HasConversion(RoadmapConverters.Track())
            .HasDefaultValueSql("'cefr'")
            .ValueGeneratedNever();
        builder.Property(x => x.RoadmapVersion).HasDefaultValueSql("'roadmap-v1'").ValueGeneratedNever();
        builder.Property(x => x.LevelId).HasConversion(RoadmapConverters.Level());
        builder.Property(x => x.Placement).HasColumnType("jsonb");
        builder.Property(x => x.StartedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();
        builder.Property(x => x.UpdatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => x.UserId).HasDatabaseName("idx_user_roadmap_user");
    }
}

/// <summary>
/// EF Core mapping for public.user_roadmap_steps (composite PK user_id + step_id; user_id references auth.users).
/// </summary>
public class UserRoadmapStepConfiguration : IEntityTypeConfiguration<UserRoadmapStep>
{
    public void Configure(EntityTypeBuilder<UserRoadmapStep> builder)
    {
        builder.ToTable("user_roadmap_steps");
        builder.HasKey(x => new { x.UserId, x.StepId });

        builder.Property(x => x.Status)
            .HasConversion(new SnakeCaseEnumConverter<RoadmapStepStatus>())
            .HasDefaultValueSql("'completed'")
            .ValueGeneratedNever();
        builder.Property(x => x.CompletedAt).HasColumnType("timestamptz");
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => x.UserId).HasDatabaseName("idx_user_roadmap_steps_user");
    }
}

/// <summary>
/// EF Core mapping for public.user_roadmap_assessments (user_id references auth.users).
/// </summary>
public class UserRoadmapAssessmentConfiguration : IEntityTypeConfiguration<UserRoadmapAssessment>
{
    public void Configure(EntityTypeBuilder<UserRoadmapAssessment> builder)
    {
        builder.ToTable("user_roadmap_assessments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Track)
            .HasConversion(RoadmapConverters.Track())
            .HasDefaultValueSql("'cefr'")
            .ValueGeneratedNever();
        builder.Property(x => x.Tier).HasConversion(new SnakeCaseEnumConverter<RoadmapAssessmentTier>());
        builder.Property(x => x.Passed).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.Details).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb").ValueGeneratedNever();
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()").ValueGeneratedNever();

        builder.HasIndex(x => new { x.UserId, x.TargetId, x.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("idx_user_roadmap_assessments_lookup");
        builder.HasIndex(x => new { x.UserId, x.Track, x.Tier }).HasDatabaseName("idx_user_roadmap_assessments_user_tier");
    }
}