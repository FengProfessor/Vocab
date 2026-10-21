using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core mapping for public.challenges.
/// </summary>
public class ChallengeConfiguration : IEntityTypeConfiguration<Challenge>
{
    public void Configure(EntityTypeBuilder<Challenge> builder)
    {
        builder.ToTable("challenges");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Slug).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("challenges_slug_key");

        builder.Property(x => x.RefundPct).HasDefaultValue(100).ValueGeneratedNever();
        builder.Property(x => x.BonusProDays).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.DailyCriteria)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{\"min_srs_reviews\": 10, \"min_quizzes\": 1, \"min_reading_sessions\": 0, \"min_listening_sessions\": 0}'::jsonb")
            .ValueGeneratedNever();

        builder.Property(x => x.RegistrationOpensAt).HasColumnType("timestamptz");
        builder.Property(x => x.RegistrationClosesAt).HasColumnType("timestamptz");
        builder.Property(x => x.StartsAt).HasColumnType("timestamptz");
        builder.Property(x => x.EndsAt).HasColumnType("timestamptz");

        builder.Property(x => x.Status)
            .HasConversion(new SnakeCaseEnumConverter<ChallengeStatus>())
            .HasDefaultValueSql("'draft'");
        builder.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()");
        builder.Property(x => x.UpdatedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()");

        builder.Property(x => x.RefundCashAmount).HasDefaultValue(200000).ValueGeneratedNever();
        builder.Property(x => x.StreakFreezePrice).HasDefaultValue(50000).ValueGeneratedNever();
        builder.Property(x => x.MaxStreakFreezes).HasDefaultValue(3).ValueGeneratedNever();

        builder.HasIndex(x => x.Status).HasDatabaseName("idx_challenges_status");
        builder.HasIndex(x => x.Slug).HasDatabaseName("idx_challenges_slug");
        builder.HasIndex(x => x.StartsAt).HasDatabaseName("idx_challenges_starts_at");

        builder.HasOne(x => x.Creator)
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

/// <summary>
/// EF Core mapping for public.challenge_participants.
/// </summary>
public class ChallengeParticipantConfiguration : IEntityTypeConfiguration<ChallengeParticipant>
{
    public void Configure(EntityTypeBuilder<ChallengeParticipant> builder)
    {
        builder.ToTable("challenge_participants");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status)
            .HasConversion(new SnakeCaseEnumConverter<ChallengeParticipantStatus>())
            .HasDefaultValueSql("'pending'");
        builder.Property(x => x.JoinedAt).HasColumnType("timestamptz").HasDefaultValueSql("now()");
        builder.Property(x => x.ActivatedAt).HasColumnType("timestamptz");
        builder.Property(x => x.FailedAt).HasColumnType("timestamptz");
        builder.Property(x => x.CompletedAt).HasColumnType("timestamptz");
        builder.Property(x => x.RefundedAt).HasColumnType("timestamptz");
        builder.Property(x => x.BonusExpiresAt).HasColumnType("timestamptz");

        builder.Property(x => x.CurrentStreak).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.LongestStreak).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.TotalActiveDays).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.StreakFreezesUsed).HasDefaultValue(0).ValueGeneratedNever();

        builder.HasIndex(x => new { x.ChallengeId, x.UserId }).IsUnique();
        builder.HasIndex(x => x.ChallengeId).HasDatabaseName("idx_challenge_participants_challenge");
        builder.HasIndex(x => x.UserId).HasDatabaseName("idx_challenge_participants_user");
        builder.HasIndex(x => x.Status).HasDatabaseName("idx_challenge_participants_status");
        builder.HasIndex(x => new { x.ChallengeId, x.Status }).HasDatabaseName("idx_challenge_participants_challenge_status");

        builder.HasOne(x => x.Challenge)
            .WithMany(c => c.Participants)
            .HasForeignKey(x => x.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

/// <summary>
/// EF Core mapping for public.challenge_daily_log.
/// </summary>
public class ChallengeDailyLogConfiguration : IEntityTypeConfiguration<ChallengeDailyLog>
{
    public void Configure(EntityTypeBuilder<ChallengeDailyLog> builder)
    {
        builder.ToTable("challenge_daily_log");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SrsReviews).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.QuizzesDone).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.ReadingSessions).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.ListeningSessions).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.XpEarned).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(x => x.CriteriaMet).HasDefaultValue(false).ValueGeneratedNever();
        builder.Property(x => x.CheckedAt).HasColumnType("timestamptz");

        builder.HasIndex(x => new { x.ParticipantId, x.LogDate }).IsUnique();
        builder.HasIndex(x => x.ParticipantId).HasDatabaseName("idx_challenge_daily_log_participant");
        builder.HasIndex(x => x.LogDate).HasDatabaseName("idx_challenge_daily_log_date");

        builder.HasOne(x => x.Participant)
            .WithMany(p => p.DailyLogs)
            .HasForeignKey(x => x.ParticipantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Challenge)
            .WithMany(c => c.DailyLogs)
            .HasForeignKey(x => x.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}