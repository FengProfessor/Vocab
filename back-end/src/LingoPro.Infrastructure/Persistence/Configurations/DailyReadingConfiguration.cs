using LingoPro.Domain.Entities.Reading;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="DailyReadingExercise"/> mapped to <c>public.daily_reading_exercises</c>.
/// </summary>
public sealed class DailyReadingExerciseConfiguration : IEntityTypeConfiguration<DailyReadingExercise>
{
    public void Configure(EntityTypeBuilder<DailyReadingExercise> builder)
    {
        builder.ToTable("daily_reading_exercises", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.Passage).IsRequired();
        builder.Property(x => x.PassagePlain).IsRequired();
        builder.Property(x => x.Level).HasDefaultValueSql("'A2'");
        builder.Property(x => x.Questions).HasColumnType("jsonb").HasDefaultValueSql("'[]'");
        builder.Property(x => x.Cloze).HasColumnType("jsonb").HasDefaultValueSql("'{}'");
        builder.Property(x => x.SourceWords).HasColumnType("jsonb").HasDefaultValueSql("'[]'");
        builder.Property(x => x.UsedWords).HasColumnType("text[]").HasDefaultValueSql("'{}'");
        builder.Property(x => x.Coverage).HasDefaultValueSql("0");
        builder.Property(x => x.BonusWords).HasColumnType("jsonb").HasDefaultValueSql("'[]'");
        builder.Property(x => x.Status).HasDefaultValueSql("'ready'");
        builder.Property(x => x.GeneratedAt).HasDefaultValueSql("now()");
        builder.Property(x => x.GenerationMeta).HasColumnType("jsonb").HasDefaultValueSql("'{}'");

        // unique nulls not distinct (classroom_id, exercise_date, target_user_id)
        builder.HasIndex(x => new { x.ClassroomId, x.ExerciseDate, x.TargetUserId })
            .IsUnique()
            .AreNullsDistinct(false);
        builder.HasIndex(x => new { x.ClassroomId, x.ExerciseDate }).IsDescending(false, true)
            .HasDatabaseName("daily_reading_exercises_classroom_date_idx");
        builder.HasIndex(x => new { x.TargetUserId, x.ExerciseDate })
            .IsUnique()
            .HasFilter("target_user_id is not null")
            .HasDatabaseName("daily_reading_exercises_user_date_uidx");
        builder.HasIndex(x => new { x.ClassroomId, x.ExerciseDate })
            .IsUnique()
            .HasFilter("target_user_id is null")
            .HasDatabaseName("daily_reading_exercises_class_date_uidx");
        builder.HasIndex(x => new { x.ExerciseDate, x.Status }).HasDatabaseName("daily_reading_exercises_date_status_idx");

        builder.HasOne(x => x.Classroom)
            .WithMany()
            .HasForeignKey(x => x.ClassroomId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.TargetUser)
            .WithMany()
            .HasForeignKey(x => x.TargetUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// EF Core configuration for <see cref="DailyReadingCompletion"/> mapped to <c>public.daily_reading_completions</c>.
/// </summary>
public sealed class DailyReadingCompletionConfiguration : IEntityTypeConfiguration<DailyReadingCompletion>
{
    public void Configure(EntityTypeBuilder<DailyReadingCompletion> builder)
    {
        builder.ToTable("daily_reading_completions", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.McqScore).HasDefaultValueSql("0");
        builder.Property(x => x.McqTotal).HasDefaultValueSql("0");
        builder.Property(x => x.ClozeScore).HasDefaultValueSql("0");
        builder.Property(x => x.ClozeTotal).HasDefaultValueSql("0");
        builder.Property(x => x.StartedAt).HasDefaultValueSql("now()");
        builder.HasIndex(x => new { x.UserId, x.ExerciseId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Exercise)
            .WithMany(e => e.Completions)
            .HasForeignKey(x => x.ExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// EF Core configuration for <see cref="UserReadingLibraryProgress"/> mapped to <c>public.user_reading_library_progress</c>.
/// </summary>
public sealed class UserReadingLibraryProgressConfiguration : IEntityTypeConfiguration<UserReadingLibraryProgress>
{
    public void Configure(EntityTypeBuilder<UserReadingLibraryProgress> builder)
    {
        builder.ToTable("user_reading_library_progress", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).HasDefaultValueSql("'in_progress'");
        builder.Property(x => x.IsBookmarked).HasDefaultValueSql("false");
        builder.Property(x => x.ReadCount).HasDefaultValueSql("0");
        builder.Property(x => x.LastReadAt).HasDefaultValueSql("now()");
        builder.Property(x => x.ReadingTimeSeconds).HasDefaultValueSql("0");
        builder.Property(x => x.McqScore).HasDefaultValueSql("0");
        builder.Property(x => x.McqTotal).HasDefaultValueSql("0");
        builder.Property(x => x.ClozeScore).HasDefaultValueSql("0");
        builder.Property(x => x.ClozeTotal).HasDefaultValueSql("0");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

        builder.HasIndex(x => new { x.UserId, x.ArticleId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.LastReadAt }).IsDescending(false, true).HasDatabaseName("user_reading_progress_user_idx");
        builder.HasIndex(x => new { x.UserId, x.IsBookmarked }).HasFilter("is_bookmarked = true").HasDatabaseName("user_reading_progress_bookmarked_idx");
        builder.HasIndex(x => x.ArticleId).HasDatabaseName("user_reading_progress_article_idx");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Article)
            .WithMany(a => a.UserProgresses)
            .HasForeignKey(x => x.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
