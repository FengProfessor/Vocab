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

        // 1. Auth & Account Tables (user_gamification, fcm_tokens, extension_tokens, ai_daily_usage)
        builder.Entity<UserGamification>(e =>
        {
            e.ToTable("user_gamification");
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User)
                .WithOne(p => p.Gamification)
                .HasForeignKey<UserGamification>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PushSubscriptionEntity>(e =>
        {
            e.ToTable("fcm_tokens");
            e.HasIndex(x => new { x.UserId, x.FcmToken }).IsUnique();
            e.HasOne(x => x.User)
                .WithMany(p => p.PushSubscriptions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ExtensionToken>(e =>
        {
            e.ToTable("extension_tokens");
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.User)
                .WithMany(p => p.ExtensionTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AiDailyUsage>(e =>
        {
            e.ToTable("ai_daily_usage");
            e.HasIndex(x => new { x.UserId, x.UsageDate }).IsUnique();
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. Classrooms, Enrollments, Analytics & Presence
        builder.Entity<ClassroomEntity>(e =>
        {
            e.ToTable("classrooms");
            e.HasIndex(x => x.InviteCode).IsUnique();
            e.HasOne(x => x.Teacher)
                .WithMany()
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Enrollment>(e =>
        {
            e.ToTable("enrollments");
            e.HasIndex(x => new { x.ClassroomId, x.StudentId }).IsUnique();
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
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User)
                .WithOne(p => p.RoomPresence)
                .HasForeignKey<StudyRoomPresence>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Classroom)
                .WithMany()
                .HasForeignKey(x => x.ClassroomId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // 3. Vocabulary, FSRS Events, Packs, Quizzes & Dictionary
        builder.Entity<SrsReviewEvent>(e =>
        {
            e.ToTable("srs_review_events");
            e.HasIndex(x => new { x.UserId, x.ReviewId }).IsUnique();
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Word)
                .WithMany()
                .HasForeignKey(x => x.WordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserVocabPack>(e =>
        {
            e.ToTable("user_vocab_packs");
            e.HasIndex(x => new { x.UserId, x.PackId }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserVocabPackWord>(e =>
        {
            e.ToTable("user_vocab_pack_words");
            e.HasIndex(x => new { x.UserId, x.PackId, x.Position }).IsUnique();
            e.HasIndex(x => new { x.UserId, x.PackId, x.WordId }).IsUnique();
            e.HasOne(x => x.Pack)
                .WithMany(p => p.PackWords)
                .HasForeignKey(x => x.UserVocabPackId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Word)
                .WithMany()
                .HasForeignKey(x => x.WordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<QuizResult>(e =>
        {
            e.ToTable("quiz_results");
            e.Property(x => x.QuizType).HasConversion<string>().HasMaxLength(32);
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
            e.HasIndex(x => x.Term).IsUnique();
        });

        builder.Entity<TranslationCache>(e =>
        {
            e.ToTable("translations");
            e.HasIndex(x => new { x.SourceText, x.SourceLang, x.TargetLang }).IsUnique();
        });

        // 4. Roadmap, Steps, Assessments & TOEIC Exam History
        builder.Entity<UserRoadmap>(e =>
        {
            e.ToTable("user_roadmap");
            e.HasIndex(x => new { x.UserId, x.Track }).IsUnique();
            e.Property(x => x.Track).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.LevelId).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany(p => p.Roadmaps)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserRoadmapStep>(e =>
        {
            e.ToTable("user_roadmap_steps");
            e.HasIndex(x => new { x.UserRoadmapId, x.StepId }).IsUnique();
            e.Property(x => x.Track).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Roadmap)
                .WithMany(r => r.Steps)
                .HasForeignKey(x => x.UserRoadmapId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserRoadmapAssessment>(e =>
        {
            e.ToTable("user_roadmap_assessments");
            e.HasIndex(x => new { x.UserId, x.TargetId });
            e.Property(x => x.Track).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Tier).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Roadmap)
                .WithMany()
                .HasForeignKey(x => x.UserRoadmapId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ToeicTestResult>(e =>
        {
            e.ToTable("toeic_test_results");
            e.Property(x => x.ExamType).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserToeicQuestionHistory>(e =>
        {
            e.ToTable("user_toeic_question_history");
            e.HasIndex(x => new { x.UserId, x.QuestionId });
            e.HasIndex(x => new { x.UserId, x.Part });
            e.Property(x => x.ExamType).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 5. Grammar System (Topics, Lessons, Quiz Cache, Exercises, Results, Progress, Micro Progress)
        builder.Entity<GrammarLesson>(e =>
        {
            e.ToTable("grammar_lessons");
            e.Property(x => x.Source).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Topic)
                .WithMany(t => t.Lessons)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Author)
                .WithMany()
                .HasForeignKey(x => x.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<GrammarQuizCache>(e =>
        {
            e.ToTable("grammar_quiz_cache");
            e.HasIndex(x => x.LessonId).IsUnique();
            e.HasOne(x => x.Lesson)
                .WithOne(l => l.QuizCache)
                .HasForeignKey<GrammarQuizCache>(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<GrammarExercise>(e =>
        {
            e.ToTable("grammar_exercises");
            e.Property(x => x.CertLevel).HasConversion<string>().HasMaxLength(8);
            e.Property(x => x.ExerciseType).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Topic)
                .WithMany()
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Lesson)
                .WithMany(l => l.Exercises)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Classroom)
                .WithMany()
                .HasForeignKey(x => x.ClassroomId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CreatedByTeacher)
                .WithMany()
                .HasForeignKey(x => x.CreatedByTeacherId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<GrammarResult>(e =>
        {
            e.ToTable("grammar_results");
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Exercise)
                .WithMany(ex => ex.Results)
                .HasForeignKey(x => x.ExerciseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<GrammarProgress>(e =>
        {
            e.ToTable("grammar_progress");
            e.HasIndex(x => new { x.UserId, x.TopicSlug }).IsUnique();
            e.Property(x => x.State).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Topic)
                .WithMany()
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Lesson)
                .WithMany(l => l.Progresses)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<GrammarMicroProgress>(e =>
        {
            e.ToTable("grammar_micro_progress");
            e.HasIndex(x => new { x.UserId, x.Stage }).IsUnique();
            e.Property(x => x.Stage).HasConversion<string>().HasMaxLength(16);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 6. Daily Reading & Reading Library
        builder.Entity<DailyReadingExercise>(e =>
        {
            e.ToTable("daily_reading_exercises");
            e.Property(x => x.CertLevel).HasConversion<string>().HasMaxLength(8);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Classroom)
                .WithMany()
                .HasForeignKey(x => x.ClassroomId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.TargetUser)
                .WithMany()
                .HasForeignKey(x => x.TargetUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DailyReadingCompletion>(e =>
        {
            e.ToTable("daily_reading_completions");
            e.HasIndex(x => new { x.UserId, x.ExerciseId }).IsUnique();
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Exercise)
                .WithMany(ex => ex.Completions)
                .HasForeignKey(x => x.ExerciseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserReadingLibraryProgress>(e =>
        {
            e.ToTable("user_reading_library_progress");
            e.HasIndex(x => new { x.UserId, x.ArticleId }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Article)
                .WithMany(a => a.UserProgresses)
                .HasForeignKey(x => x.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 7. Speaking Foundation Curriculum & Gap Map
        builder.Entity<FoundationLexicalConcept>(e =>
        {
            e.ToTable("foundation_lexical_concepts");
            e.HasIndex(x => x.Headword).IsUnique();
            e.HasIndex(x => x.ConceptCode).IsUnique();
            e.Property(x => x.CertLevel).HasConversion<string>().HasMaxLength(8);
        });

        builder.Entity<FoundationRepresentation>(e =>
        {
            e.ToTable("foundation_representations");
            e.HasIndex(x => x.RepresentationCode).IsUnique();
            e.Property(x => x.Modality).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.ClarityRating).HasConversion<string>().HasMaxLength(16);
            e.HasOne(x => x.Concept)
                .WithMany(c => c.Representations)
                .HasForeignKey(x => x.ConceptId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LearnerLexicalEvidence>(e =>
        {
            e.ToTable("learner_lexical_evidence");
            e.HasIndex(x => new { x.LearnerId, x.ConceptId });
            e.Property(x => x.EvidenceSource).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.SupportLevel).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Learner)
                .WithMany()
                .HasForeignKey(x => x.LearnerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ActorUser)
                .WithMany()
                .HasForeignKey(x => x.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Concept)
                .WithMany(c => c.Evidences)
                .HasForeignKey(x => x.ConceptId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Representation)
                .WithMany()
                .HasForeignKey(x => x.RepresentationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<LearnerLexicalState>(e =>
        {
            e.ToTable("learner_lexical_state");
            e.HasIndex(x => new { x.LearnerId, x.ConceptId }).IsUnique();
            e.Property(x => x.StatusBucket).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Learner)
                .WithMany()
                .HasForeignKey(x => x.LearnerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Concept)
                .WithMany(c => c.LearnerStates)
                .HasForeignKey(x => x.ConceptId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 8. Billing, Subscription History & Coupons
        builder.Entity<SubscriptionHistory>(e =>
        {
            e.ToTable("subscription_history");
            e.Property(x => x.OldPlan).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.NewPlan).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Reason).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ChangedByUser)
                .WithMany()
                .HasForeignKey(x => x.ChangedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Coupon>(e =>
        {
            e.ToTable("coupons");
            e.HasIndex(x => x.Code).IsUnique();
        });

        // 9. Commitment Challenges & Daily Logs
        builder.Entity<Challenge>(e =>
        {
            e.ToTable("challenges");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Creator)
                .WithMany()
                .HasForeignKey(x => x.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChallengeParticipant>(e =>
        {
            e.ToTable("challenge_participants");
            e.HasIndex(x => new { x.ChallengeId, x.UserId }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Challenge)
                .WithMany(c => c.Participants)
                .HasForeignKey(x => x.ChallengeId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ChallengeDailyLog>(e =>
        {
            e.ToTable("challenge_daily_log");
            e.HasIndex(x => new { x.ChallengeId, x.UserId, x.LogDate }).IsUnique();
            e.HasOne(x => x.Challenge)
                .WithMany(c => c.DailyLogs)
                .HasForeignKey(x => x.ChallengeId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Participant)
                .WithMany(p => p.DailyLogs)
                .HasForeignKey(x => x.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 10. Referral System, Study Groups & Pilot Leads
        builder.Entity<ReferralCampaign>(e =>
        {
            e.ToTable("referral_campaigns");
            e.HasIndex(x => x.Slug).IsUnique();
        });

        builder.Entity<ReferralLink>(e =>
        {
            e.ToTable("referral_links");
            e.HasIndex(x => x.Code).IsUnique();
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
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.Referrer)
                .WithMany()
                .HasForeignKey(x => x.ReferrerId)
                .OnDelete(DeleteBehavior.Restrict);
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
            e.Property(x => x.RewardType).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.SourceReferee)
                .WithMany()
                .HasForeignKey(x => x.SourceRefereeId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ReferralLog)
                .WithMany()
                .HasForeignKey(x => x.ReferralLogId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PayoutRequest>(e =>
        {
            e.ToTable("payout_requests");
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
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
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
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
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
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
