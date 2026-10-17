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
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence;

/// <summary>
/// Primary Entity Framework Core 10 database context mapped to the PostgreSQL (Supabase) schema.
/// </summary>
public sealed class LingoProDbContext : DbContext, IApplicationDbContext
{
    public LingoProDbContext(DbContextOptions<LingoProDbContext> options)
        : base(options)
    {
    }

    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Word> Words => Set<Word>();
    public DbSet<SrsProgress> SrsProgresses => Set<SrsProgress>();
    public DbSet<GlobalDictionary> GlobalDictionaries => Set<GlobalDictionary>();
    public DbSet<UserRoadmap> UserRoadmaps => Set<UserRoadmap>();
    public DbSet<UserRoadmapStep> UserRoadmapSteps => Set<UserRoadmapStep>();
    public DbSet<ToeicTestResult> ToeicTestResults => Set<ToeicTestResult>();
    public DbSet<UserToeicQuestionHistory> UserToeicQuestionHistories => Set<UserToeicQuestionHistory>();
    public DbSet<ClassroomEntity> Classrooms => Set<ClassroomEntity>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChallengeParticipant> ChallengeParticipants => Set<ChallengeParticipant>();
    public DbSet<ChallengeDailyLog> ChallengeDailyLogs => Set<ChallengeDailyLog>();
    public DbSet<GrammarTopic> GrammarTopics => Set<GrammarTopic>();
    public DbSet<GrammarLesson> GrammarLessons => Set<GrammarLesson>();
    public DbSet<GrammarExercise> GrammarExercises => Set<GrammarExercise>();
    public DbSet<GrammarProgress> GrammarProgresses => Set<GrammarProgress>();
    public DbSet<DailyReadingExercise> DailyReadingExercises => Set<DailyReadingExercise>();
    public DbSet<DailyReadingCompletion> DailyReadingCompletions => Set<DailyReadingCompletion>();
    public DbSet<ReadingArticle> ReadingArticles => Set<ReadingArticle>();
    public DbSet<UserReadingLibraryProgress> UserReadingLibraryProgresses => Set<UserReadingLibraryProgress>();
    public DbSet<FoundationLexicalConcept> FoundationLexicalConcepts => Set<FoundationLexicalConcept>();
    public DbSet<LearnerLexicalEvidence> LearnerLexicalEvidences => Set<LearnerLexicalEvidence>();
    public DbSet<LearnerLexicalState> LearnerLexicalStates => Set<LearnerLexicalState>();
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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("public");
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        builder.Entity<GlobalDictionary>(e =>
        {
            e.ToTable("global_dictionary");
            e.HasIndex(x => x.Term).IsUnique();
        });
        builder.Entity<ClassroomEntity>(e =>
        {
            e.ToTable("classrooms");
            e.HasIndex(x => x.InviteCode).IsUnique();
        });
        builder.Entity<Enrollment>(e =>
        {
            e.ToTable("enrollments");
            e.HasIndex(x => new { x.ClassroomId, x.StudentId }).IsUnique();
        });
        builder.Entity<UserRoadmap>(e =>
        {
            e.ToTable("user_roadmap");
            e.HasIndex(x => new { x.UserId, x.Track }).IsUnique();
        });
        builder.Entity<UserRoadmapStep>(e =>
        {
            e.ToTable("user_roadmap_steps");
            e.HasIndex(x => new { x.UserRoadmapId, x.StepId }).IsUnique();
        });
        builder.Entity<ToeicTestResult>().ToTable("toeic_test_results");
        builder.Entity<UserToeicQuestionHistory>().ToTable("user_toeic_question_history");
        builder.Entity<GrammarLesson>().ToTable("grammar_lessons");
        builder.Entity<GrammarExercise>().ToTable("grammar_exercises");
        builder.Entity<GrammarProgress>(e =>
        {
            e.ToTable("grammar_progress");
            e.HasIndex(x => new { x.UserId, x.TopicSlug }).IsUnique();
        });
        builder.Entity<DailyReadingExercise>().ToTable("daily_reading_exercises");
        builder.Entity<DailyReadingCompletion>(e =>
        {
            e.ToTable("daily_reading_completions");
            e.HasIndex(x => new { x.UserId, x.ExerciseId }).IsUnique();
        });
        builder.Entity<UserReadingLibraryProgress>(e =>
        {
            e.ToTable("user_reading_library_progress");
            e.HasIndex(x => new { x.UserId, x.ArticleId }).IsUnique();
        });
        builder.Entity<FoundationLexicalConcept>(e =>
        {
            e.ToTable("foundation_lexical_concepts");
            e.HasIndex(x => x.Headword).IsUnique();
        });
        builder.Entity<LearnerLexicalEvidence>().ToTable("learner_lexical_evidence");
        builder.Entity<LearnerLexicalState>(e =>
        {
            e.ToTable("learner_lexical_states");
            e.HasIndex(x => new { x.LearnerId, x.ConceptId }).IsUnique();
        });
        builder.Entity<Coupon>(e =>
        {
            e.ToTable("coupons");
            e.HasIndex(x => x.Code).IsUnique();
        });
        builder.Entity<Challenge>().ToTable("challenges");
        builder.Entity<ChallengeParticipant>(e =>
        {
            e.ToTable("challenge_participants");
            e.HasIndex(x => new { x.ChallengeId, x.UserId }).IsUnique();
        });
        builder.Entity<ChallengeDailyLog>(e =>
        {
            e.ToTable("challenge_daily_logs");
            e.HasIndex(x => new { x.ChallengeId, x.UserId, x.LogDate }).IsUnique();
        });
        builder.Entity<ReferralLink>(e =>
        {
            e.ToTable("referral_links");
            e.HasIndex(x => x.Code).IsUnique();
        });
        builder.Entity<ReferralLog>().ToTable("referral_logs");
        builder.Entity<RewardTransaction>().ToTable("reward_transactions");
        builder.Entity<PayoutRequest>().ToTable("payout_requests");
        builder.Entity<StudyGroup>(e =>
        {
            e.ToTable("groups");
            e.HasIndex(x => x.InviteCode).IsUnique();
        });
        builder.Entity<GroupMember>(e =>
        {
            e.ToTable("group_members");
            e.HasIndex(x => new { x.GroupId, x.UserId }).IsUnique();
        });
        builder.Entity<StudyRoomPresence>().ToTable("study_room_presence");
        builder.Entity<PilotLead>().ToTable("speaking_pilot_leads");
        builder.Entity<PushSubscriptionEntity>().ToTable("push_subscriptions");
        builder.Entity<ExtensionToken>(e =>
        {
            e.ToTable("extension_tokens");
            e.HasIndex(x => x.TokenHash).IsUnique();
        });

        var configureMethod = typeof(LingoProDbContext)
            .GetMethod(nameof(ApplyAuditableConfiguration), BindingFlags.NonPublic | BindingFlags.Static)!;

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseAuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                configureMethod.MakeGenericMethod(entityType.ClrType).Invoke(null, [builder]);
            }
        }
    }

    private static void ApplyAuditableConfiguration<TEntity>(ModelBuilder builder)
        where TEntity : BaseAuditableEntity
    {
        builder.Entity<TEntity>(entity =>
        {
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            entity.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            entity.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
            entity.HasQueryFilter(x => x.IsDeleted != true);
        });
    }
}

