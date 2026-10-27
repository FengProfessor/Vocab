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

namespace LingoPro.Application.Common.Interfaces;

/// <summary>
/// Abstraction over the Entity Framework Core 10 database context for the Application layer.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Profile> Profiles { get; }
    DbSet<UserGamification> UserGamifications { get; }
    DbSet<XpAwardEvent> XpAwardEvents { get; }
    DbSet<Word> Words { get; }
    DbSet<SrsProgress> SrsProgresses { get; }
    DbSet<SrsReviewEvent> SrsReviewEvents { get; }
    DbSet<UserVocabPack> UserVocabPacks { get; }
    DbSet<UserVocabPackWord> UserVocabPackWords { get; }
    DbSet<QuizResult> QuizResults { get; }
    DbSet<GlobalDictionary> GlobalDictionaries { get; }
    DbSet<TranslationCache> Translations { get; }
    DbSet<UserRoadmap> UserRoadmaps { get; }
    DbSet<UserRoadmapStep> UserRoadmapSteps { get; }
    DbSet<UserRoadmapAssessment> UserRoadmapAssessments { get; }
    DbSet<ToeicTestResult> ToeicTestResults { get; }
    DbSet<UserToeicQuestionHistory> UserToeicQuestionHistories { get; }
    DbSet<ClassroomEntity> Classrooms { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<StudentDailyStat> StudentDailyStats { get; }
    DbSet<Order> Orders { get; }
    DbSet<SubscriptionHistory> SubscriptionHistories { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Challenge> Challenges { get; }
    DbSet<ChallengeParticipant> ChallengeParticipants { get; }
    DbSet<ChallengeDailyLog> ChallengeDailyLogs { get; }
    DbSet<GrammarTopic> GrammarTopics { get; }
    DbSet<GrammarLesson> GrammarLessons { get; }
    DbSet<GrammarQuizCache> GrammarQuizCaches { get; }
    DbSet<GrammarExercise> GrammarExercises { get; }
    DbSet<GrammarResult> GrammarResults { get; }
    DbSet<GrammarProgress> GrammarProgresses { get; }
    DbSet<GrammarMicroProgress> GrammarMicroProgresses { get; }
    DbSet<DailyReadingExercise> DailyReadingExercises { get; }
    DbSet<DailyReadingCompletion> DailyReadingCompletions { get; }
    DbSet<ReadingArticle> ReadingArticles { get; }
    DbSet<UserReadingLibraryProgress> UserReadingLibraryProgresses { get; }
    DbSet<FoundationLexicalConcept> FoundationLexicalConcepts { get; }
    DbSet<FoundationRepresentation> FoundationRepresentations { get; }
    DbSet<LearnerLexicalEvidence> LearnerLexicalEvidences { get; }
    DbSet<LearnerLexicalState> LearnerLexicalStates { get; }
    DbSet<ReferralCampaign> ReferralCampaigns { get; }
    DbSet<ReferralLink> ReferralLinks { get; }
    DbSet<ReferralLog> ReferralLogs { get; }
    DbSet<RewardTransaction> RewardTransactions { get; }
    DbSet<PayoutRequest> PayoutRequests { get; }
    DbSet<StudyGroup> StudyGroups { get; }
    DbSet<GroupMember> GroupMembers { get; }
    DbSet<StudyRoomPresence> StudyRoomPresences { get; }
    DbSet<PilotLead> PilotLeads { get; }
    DbSet<PushSubscriptionEntity> PushSubscriptions { get; }
    DbSet<ExtensionToken> ExtensionTokens { get; }
    DbSet<AiDailyUsage> AiDailyUsages { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
