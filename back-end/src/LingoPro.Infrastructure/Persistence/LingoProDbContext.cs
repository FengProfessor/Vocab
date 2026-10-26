using System.Reflection;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Admin;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Exam;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Entities.Reading;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence.Converters;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence;

/// <summary>
/// Primary Entity Framework Core 10 database context mapped 100% to the Supabase PostgreSQL schema and foreign key relationships.
/// </summary>
public sealed class LingoProDbContext : DbContext, IApplicationDbContext
{
    public LingoProDbContext(DbContextOptions<LingoProDbContext> options)
        : base(options)
    {
    }

    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<UserGamification> UserGamifications => Set<UserGamification>();
    public DbSet<XpAwardEvent> XpAwardEvents => Set<XpAwardEvent>();
    public DbSet<Word> Words => Set<Word>();
    public DbSet<SrsProgress> SrsProgresses => Set<SrsProgress>();
    public DbSet<SrsReviewEvent> SrsReviewEvents => Set<SrsReviewEvent>();
    public DbSet<UserVocabPack> UserVocabPacks => Set<UserVocabPack>();
    public DbSet<UserVocabPackWord> UserVocabPackWords => Set<UserVocabPackWord>();
    public DbSet<QuizResult> QuizResults => Set<QuizResult>();
    public DbSet<GlobalDictionary> GlobalDictionaries => Set<GlobalDictionary>();
    public DbSet<TranslationCache> Translations => Set<TranslationCache>();
    public DbSet<UserRoadmap> UserRoadmaps => Set<UserRoadmap>();
    public DbSet<UserRoadmapStep> UserRoadmapSteps => Set<UserRoadmapStep>();
    public DbSet<UserRoadmapAssessment> UserRoadmapAssessments => Set<UserRoadmapAssessment>();
    public DbSet<ToeicTestResult> ToeicTestResults => Set<ToeicTestResult>();
    public DbSet<UserToeicQuestionHistory> UserToeicQuestionHistories => Set<UserToeicQuestionHistory>();
    public DbSet<ClassroomEntity> Classrooms => Set<ClassroomEntity>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<StudentDailyStat> StudentDailyStats => Set<StudentDailyStat>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<SubscriptionHistory> SubscriptionHistories => Set<SubscriptionHistory>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChallengeParticipant> ChallengeParticipants => Set<ChallengeParticipant>();
    public DbSet<ChallengeDailyLog> ChallengeDailyLogs => Set<ChallengeDailyLog>();
    public DbSet<GrammarTopic> GrammarTopics => Set<GrammarTopic>();
    public DbSet<GrammarLesson> GrammarLessons => Set<GrammarLesson>();
    public DbSet<GrammarQuizCache> GrammarQuizCaches => Set<GrammarQuizCache>();
    public DbSet<GrammarExercise> GrammarExercises => Set<GrammarExercise>();
    public DbSet<GrammarResult> GrammarResults => Set<GrammarResult>();
    public DbSet<GrammarProgress> GrammarProgresses => Set<GrammarProgress>();
    public DbSet<GrammarMicroProgress> GrammarMicroProgresses => Set<GrammarMicroProgress>();
    public DbSet<DailyReadingExercise> DailyReadingExercises => Set<DailyReadingExercise>();
    public DbSet<DailyReadingCompletion> DailyReadingCompletions => Set<DailyReadingCompletion>();
    public DbSet<ReadingArticle> ReadingArticles => Set<ReadingArticle>();
    public DbSet<UserReadingLibraryProgress> UserReadingLibraryProgresses => Set<UserReadingLibraryProgress>();
    public DbSet<FoundationLexicalConcept> FoundationLexicalConcepts => Set<FoundationLexicalConcept>();
    public DbSet<FoundationRepresentation> FoundationRepresentations => Set<FoundationRepresentation>();
    public DbSet<LearnerLexicalEvidence> LearnerLexicalEvidences => Set<LearnerLexicalEvidence>();
    public DbSet<LearnerLexicalState> LearnerLexicalStates => Set<LearnerLexicalState>();
    public DbSet<ReferralCampaign> ReferralCampaigns => Set<ReferralCampaign>();
    public DbSet<ReferralLink> ReferralLinks => Set<ReferralLink>();
    public DbSet<ReferralLog> ReferralLogs => Set<ReferralLog>();
    public DbSet<RewardTransaction> RewardTransactions => Set<RewardTransaction>();
    public DbSet<PayoutRequest> PayoutRequests => Set<PayoutRequest>();
    public DbSet<StudyGroup> StudyGroups => Set<StudyGroup>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<StudyRoomPresence> StudyRoomPresences => Set<StudyRoomPresence>();
    public DbSet<PilotLead> PilotLeads => Set<PilotLead>();
    public DbSet<PushSubscriptionEntity> PushSubscriptions => Set<PushSubscriptionEntity>();
    public DbSet<ExtensionToken> ExtensionTokens => Set<ExtensionToken>();
    public DbSet<AiDailyUsage> AiDailyUsages => Set<AiDailyUsage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("public");
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // 1. Auth & Account Tables (user_gamification, xp_award_events, fcm_tokens, extension_tokens, ai_daily_usage)
        builder.Entity<XpAwardEvent>(e =>
        {
            e.ToTable("xp_award_events");
            e.HasKey(x => new { x.UserId, x.EventKey });
            e.Property(x => x.ClaimedAt).HasDefaultValueSql("now()");
        });
        builder.Entity<UserGamification>(e =>
        {
            e.ToTable("user_gamification");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).ValueGeneratedNever();
            e.Property(x => x.TotalXp).HasDefaultValue(0);
            e.Property(x => x.CurrentStreak).HasDefaultValue(0);
            e.Property(x => x.LongestStreak).HasDefaultValue(0);
            e.Property(x => x.DailyGoal).HasDefaultValue(30);
            e.Property(x => x.TodayXp).HasDefaultValue(0);
            e.HasOne(x => x.User)
                .WithOne(p => p.Gamification)
                .HasForeignKey<UserGamification>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PushSubscriptionEntity>(e =>
        {
            e.ToTable("fcm_tokens");
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.LastUsedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => new { x.UserId, x.Token }).IsUnique();
            e.HasIndex(x => x.UserId).HasDatabaseName("idx_fcm_tokens_user");
            e.HasOne(x => x.User)
                .WithMany(p => p.PushSubscriptions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ExtensionToken>(e =>
        {
            e.ToTable("extension_tokens");
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => new { x.UserId, x.CreatedAt })
                .IsDescending(false, true)
                .HasFilter("revoked_at is null")
                .HasDatabaseName("idx_extension_tokens_user_active");
        });

        builder.Entity<AiDailyUsage>(e =>
        {
            e.ToTable("ai_daily_usage");
            e.HasKey(x => new { x.UserId, x.UsageDate });
            e.Property(x => x.UsageDate).HasDefaultValueSql("current_date");
            e.Property(x => x.Count).HasDefaultValue(0);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. Classrooms, Enrollments, Analytics & Presence
        builder.Entity<ClassroomEntity>(e =>
        {
            e.ToTable("classrooms");
            e.Ignore(x => x.IsPersonal);
            e.Property(x => x.InviteCode).HasDefaultValueSql("upper(substring(md5(random()::text), 1, 6))");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => x.InviteCode).IsUnique();
            e.HasIndex(x => new { x.TeacherId, x.Name }).HasDatabaseName("idx_classrooms_teacher_name");
            e.HasOne(x => x.Teacher)
                .WithMany()
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Enrollment>(e =>
        {
            e.ToTable("enrollments");
            e.Property(x => x.JoinedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => new { x.StudentId, x.ClassroomId }).IsUnique();
            e.HasIndex(x => x.StudentId).HasDatabaseName("idx_enrollments_student");
            e.HasIndex(x => x.ClassroomId).HasDatabaseName("idx_enrollments_classroom");
            e.HasOne(x => x.Classroom)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(x => x.ClassroomId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<StudentDailyStat>(e =>
        {
            e.ToTable("student_daily_stats");
            e.Property(x => x.RecordedAt).HasDefaultValueSql("current_date");
            e.HasIndex(x => new { x.StudentId, x.RecordedAt }).IsUnique();
            e.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Classroom)
                .WithMany(c => c.DailyStats)
                .HasForeignKey(x => x.ClassroomId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<StudyRoomPresence>(e =>
        {
            e.ToTable("room_presence");
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User)
                .WithOne(p => p.RoomPresence)
                .HasForeignKey<StudyRoomPresence>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 3. Vocabulary, FSRS Events, Packs, Quizzes & Dictionary
        builder.Entity<SrsReviewEvent>(e =>
        {
            e.ToTable("srs_review_events");
            e.HasKey(x => new { x.UserId, x.ReviewId });
            e.HasOne(x => x.Word)
                .WithMany()
                .HasForeignKey(x => x.WordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserVocabPack>(e =>
        {
            e.ToTable("user_vocab_packs");
            e.HasKey(x => new { x.UserId, x.PackId });
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserVocabPackWord>(e =>
        {
            e.ToTable("user_vocab_pack_words");
            e.HasKey(x => new { x.UserId, x.PackId, x.Position });
            e.HasIndex(x => new { x.UserId, x.PackId, x.WordId }).IsUnique();
            e.HasIndex(x => new { x.UserId, x.WordId, x.PackId });
            e.HasOne(x => x.Pack)
                .WithMany(p => p.PackWords)
                .HasForeignKey(x => new { x.UserId, x.PackId })
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Word)
                .WithMany()
                .HasForeignKey(x => x.WordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<QuizResult>(e =>
        {
            e.ToTable("quiz_results");
            e.Property(x => x.Accuracy)
                .HasColumnType("double precision")
                .HasComputedColumnSql("score::float / total_questions", stored: true);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Classroom)
                .WithMany()
                .HasForeignKey(x => x.ClassroomId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<GlobalDictionary>(e =>
        {
            e.ToTable("global_dictionary");
            e.Property(x => x.Word).IsRequired();
            e.Property(x => x.Tags).HasColumnType("text[]");
            e.Property(x => x.Data).HasColumnType("jsonb");
            e.Property(x => x.ImageConfidence).HasColumnType("smallint");
            e.HasIndex(x => x.Word).IsUnique();
        });

        builder.Entity<TranslationCache>(e =>
        {
            e.ToTable("translations");
            e.HasIndex(x => new { x.SourceText, x.SourceLang, x.TargetLang }).IsUnique();
        });

        // 4. TOEIC Exam History (Roadmap/Challenge/Speaking Foundation mappings live in Configurations/)
        builder.Entity<ToeicTestResult>(e =>
        {
            e.ToTable("toeic_test_results");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.ExamType).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserToeicQuestionHistory>(e =>
        {
            e.ToTable("user_toeic_question_history");
            e.HasKey(x => new { x.UserId, x.QuestionId }).HasName("user_toeic_question_history_pkey");
            e.HasIndex(x => new { x.UserId, x.Part }).HasDatabaseName("idx_user_toeic_question_history_user_part");
            e.HasIndex(x => new { x.UserId, x.Part, x.IsCorrect }).HasDatabaseName("idx_user_toeic_question_history_user_part_correct");
            e.Property(x => x.LastAnsweredAt).HasDefaultValueSql("now()");
            e.Property(x => x.AttemptCount).HasDefaultValue(1);
            e.Property(x => x.SelectedOption).HasDefaultValue(string.Empty);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
            // user_id references auth.users(id) ON DELETE CASCADE (no navigation in the model).
        });

        // 5-6. Grammar and Reading entities are configured in Configurations/GrammarLessonConfiguration.cs,
        // GrammarTopicConfiguration.cs, DailyReadingConfiguration.cs and ReadingArticleConfiguration.cs.

        // 8. Billing, Subscription History & Coupons
        builder.Entity<SubscriptionHistory>(e =>
        {
            e.ToTable("subscription_history");
            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.OldPlan).HasConversion(new SnakeCaseEnumConverter<SubscriptionPlanType>());
            e.Property(x => x.NewPlan).HasConversion(new SnakeCaseEnumConverter<SubscriptionPlanType>());
            e.Property(x => x.Reason).HasConversion(new SnakeCaseEnumConverter<SubscriptionChangeReason>());
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => x.UserId).HasDatabaseName("idx_subscription_history_user");
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.ChangedByUser)
                .WithMany()
                .HasForeignKey(x => x.ChangedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<Coupon>(e =>
        {
            e.ToTable("coupons");
            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.ApplicablePlans).HasColumnType("text[]");
            e.Property(x => x.UsedCount).HasDefaultValue(0);
            e.Property(x => x.ValidFrom).HasDefaultValueSql("now()");
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => x.Code).IsUnique();
        });

        // 10. Referral System, Study Groups & Pilot Leads
        builder.Entity<ReferralCampaign>(e =>
        {
            e.ToTable("referral_campaigns");
            e.Property(x => x.ActivationCriteria).HasColumnType("jsonb");
            e.HasIndex(x => x.Slug).IsUnique();
        });

        builder.Entity<ReferralLink>(e =>
        {
            e.ToTable("referral_links");
            e.HasIndex(x => x.ReferralCode).IsUnique();
            e.HasIndex(x => x.CustomSlug).IsUnique();
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User)
                .WithOne(p => p.ReferralLink)
                .HasForeignKey<ReferralLink>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ReferralLog>(e =>
        {
            e.ToTable("referral_logs");
            e.HasIndex(x => x.RefereeId).IsUnique();
            e.HasOne(x => x.Referrer)
                .WithMany()
                .HasForeignKey(x => x.ReferrerId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Referee)
                .WithMany()
                .HasForeignKey(x => x.RefereeId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Campaign)
                .WithMany(c => c.ReferralLogs)
                .HasForeignKey(x => x.CampaignId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.FirstOrder)
                .WithMany()
                .HasForeignKey(x => x.FirstOrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<RewardTransaction>(e =>
        {
            e.ToTable("reward_transactions");
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ReferralLog)
                .WithMany()
                .HasForeignKey(x => x.ReferralLogId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => new { x.OrderId, x.UserId })
                .IsUnique()
                .HasFilter("reward_type IN ('affiliate_cash', 'cash_commission')");
        });

        builder.Entity<PayoutRequest>(e =>
        {
            e.ToTable("payout_requests");
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ProcessedByUser)
                .WithMany()
                .HasForeignKey(x => x.ProcessedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<StudyGroup>(e =>
        {
            e.ToTable("groups");
            e.HasIndex(x => x.InviteCode).IsUnique();
            e.HasOne(x => x.Owner)
                .WithMany()
                .HasForeignKey(x => x.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<GroupMember>(e =>
        {
            e.ToTable("group_members");
            e.HasIndex(x => new { x.GroupId, x.UserId }).IsUnique();
            e.HasOne(x => x.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(x => x.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<PilotLead>(e =>
        {
            e.ToTable("pilot_leads");
            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Source).HasDefaultValue("teacher_landing");
            e.Property(x => x.Status).HasConversion(new SnakeCaseEnumConverter<PilotLeadStatus>()).HasDefaultValueSql("'new'");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("now()");
            e.HasIndex(x => new { x.Status, x.CreatedAt }).IsDescending(false, true).HasDatabaseName("idx_pilot_leads_status_created");
        });

        var configureMethod = typeof(LingoProDbContext)
            .GetMethod(nameof(ApplySoftDeleteConfiguration), BindingFlags.NonPublic | BindingFlags.Static)!;

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
            {
                configureMethod.MakeGenericMethod(entityType.ClrType).Invoke(null, [builder]);
            }
        }

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseAuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType, entity =>
                {
                    entity.Property(nameof(BaseAuditableEntity.CreatedAt)).HasDefaultValueSql("now()");
                    entity.Property(nameof(BaseAuditableEntity.UpdatedAt)).HasDefaultValueSql("now()");
                });
            }
        }
    }

    private static void ApplySoftDeleteConfiguration<TEntity>(ModelBuilder builder)
        where TEntity : class, ISoftDelete
    {
        builder.Entity<TEntity>(entity =>
        {
            entity.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            entity.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
            entity.HasQueryFilter(x => x.IsDeleted != true);
        });
    }
}
