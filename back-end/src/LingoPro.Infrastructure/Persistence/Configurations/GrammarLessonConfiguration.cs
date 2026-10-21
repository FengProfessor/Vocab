using LingoPro.Domain.Entities.Grammar;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for <see cref="GrammarLesson"/> mapped to <c>public.grammar_lessons</c>.
/// </summary>
public sealed class GrammarLessonConfiguration : IEntityTypeConfiguration<GrammarLesson>
{
    public void Configure(EntityTypeBuilder<GrammarLesson> builder)
    {
        builder.ToTable("grammar_lessons", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.Examples).HasColumnType("jsonb").HasDefaultValueSql("'[]'");
        builder.Property(x => x.Sections).HasColumnType("jsonb");
        builder.Property(x => x.Exercises).HasColumnType("jsonb");
        builder.Property(x => x.OrderIndex).HasDefaultValueSql("0");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(x => x.TopicId).HasDatabaseName("idx_grammar_lessons_topic");

        builder.HasOne(x => x.Topic)
            .WithMany(t => t.Lessons)
            .HasForeignKey(x => x.TopicId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Author)
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

/// <summary>
/// EF Core configuration for <see cref="GrammarQuizCache"/> mapped to <c>public.grammar_quiz_cache</c> (PK lesson_id).
/// </summary>
public sealed class GrammarQuizCacheConfiguration : IEntityTypeConfiguration<GrammarQuizCache>
{
    public void Configure(EntityTypeBuilder<GrammarQuizCache> builder)
    {
        builder.ToTable("grammar_quiz_cache", "public");
        builder.HasKey(x => x.LessonId);

        builder.Property(x => x.Questions).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

        builder.HasOne(x => x.Lesson)
            .WithOne(l => l.QuizCache)
            .HasForeignKey<GrammarQuizCache>(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// EF Core configuration for <see cref="GrammarExercise"/> mapped to <c>public.grammar_exercises</c>.
/// </summary>
public sealed class GrammarExerciseConfiguration : IEntityTypeConfiguration<GrammarExercise>
{
    public void Configure(EntityTypeBuilder<GrammarExercise> builder)
    {
        builder.ToTable("grammar_exercises", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Topic).IsRequired();
        builder.Property(x => x.Level).HasDefaultValueSql("'beginner'");
        builder.Property(x => x.Question).IsRequired();
        builder.Property(x => x.Options).HasColumnType("text[]").IsRequired();
        builder.Property(x => x.CorrectAnswer).IsRequired();
        builder.Property(x => x.Type).HasDefaultValueSql("'multiple_choice'");
        builder.Property(x => x.Difficulty).HasDefaultValueSql("2");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(x => new { x.ClassroomId, x.Difficulty }).HasDatabaseName("idx_grammar_exercises_difficulty");

        builder.HasOne(x => x.Classroom)
            .WithMany()
            .HasForeignKey(x => x.ClassroomId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.CreatedByProfile)
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(x => x.Lesson)
            .WithMany(l => l.GrammarExercises)
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

/// <summary>
/// EF Core configuration for <see cref="GrammarResult"/> mapped to <c>public.grammar_results</c>.
/// </summary>
public sealed class GrammarResultConfiguration : IEntityTypeConfiguration<GrammarResult>
{
    public void Configure(EntityTypeBuilder<GrammarResult> builder)
    {
        builder.ToTable("grammar_results", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ChosenAnswer).IsRequired();
        builder.Property(x => x.IsCorrect).HasDefaultValueSql("false");
        builder.Property(x => x.CompletedAt).HasDefaultValueSql("now()");
        builder.HasIndex(x => new { x.UserId, x.ExerciseId }).HasDatabaseName("idx_grammar_results_user_exercise");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Exercise)
            .WithMany(e => e.Results)
            .HasForeignKey(x => x.ExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// EF Core configuration for <see cref="GrammarProgress"/> mapped to <c>public.grammar_progress</c>.
/// </summary>
public sealed class GrammarProgressConfiguration : IEntityTypeConfiguration<GrammarProgress>
{
    public void Configure(EntityTypeBuilder<GrammarProgress> builder)
    {
        builder.ToTable("grammar_progress", "public");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Stability).HasDefaultValueSql("0");
        builder.Property(x => x.Difficulty).HasDefaultValueSql("0");
        builder.Property(x => x.IntervalDays).HasDefaultValueSql("0");
        builder.Property(x => x.ReviewCount).HasDefaultValueSql("0");
        builder.Property(x => x.NextReviewDate).HasDefaultValueSql("now()");
        builder.Property(x => x.State).HasDefaultValueSql("'new'");
        builder.Property(x => x.MasteryScore).HasDefaultValueSql("0");
        builder.Property(x => x.Lapses).HasDefaultValueSql("0");
        builder.Property(x => x.LearningSteps).HasDefaultValueSql("0");

        builder.HasIndex(x => new { x.UserId, x.LessonId }).IsUnique();
        builder.HasIndex(x => x.UserId).HasDatabaseName("idx_grammar_progress_user");
        builder.HasIndex(x => new { x.UserId, x.LastReviewedAt }).HasDatabaseName("idx_grammar_progress_user_reviewed");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Lesson)
            .WithMany(l => l.Progresses)
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>
/// EF Core configuration for <see cref="GrammarMicroProgress"/> mapped to <c>public.grammar_micro_progress</c> (PK user_id, stage).
/// </summary>
public sealed class GrammarMicroProgressConfiguration : IEntityTypeConfiguration<GrammarMicroProgress>
{
    public void Configure(EntityTypeBuilder<GrammarMicroProgress> builder)
    {
        builder.ToTable("grammar_micro_progress", "public");
        builder.HasKey(x => new { x.UserId, x.Stage });

        builder.Property(x => x.Stage).IsRequired();
        builder.Property(x => x.CompletedSteps).HasColumnType("integer[]").HasDefaultValueSql("'{}'");
        builder.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
