# Đặc Tả Tầng Dữ Liệu: Entity Framework Core 10 & Supabase PostgreSQL (Đồng Bộ 100% Từ `supabase/migrations`)

Tài liệu này chi tiết hóa thiết kế tầng lưu trữ và truy cập dữ liệu (Data Access Layer) của giải pháp Monolith bằng **EF Core 10** kết nối tới cơ sở dữ liệu **Supabase PostgreSQL**, được trích xuất và chuẩn hóa trực tiếp từ `supabase/schema.sql` cùng toàn bộ hơn 50 file migrations trong `supabase/migrations/`.
*(Lưu ý: Toàn bộ comment trong mã nguồn bắt buộc viết bằng tiếng Anh).*

---

## 1. Kiến Trúc Kết Nối Supabase PostgreSQL Trong .NET 10

### 1.1 Cấu Hình Chuỗi Kết Nối (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "SupabasePostgres": "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.your-project-ref;Password=your-db-password;SSL Mode=Require;Trust Server Certificate=true;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;No Reset On Close=true;"
  }
}
```

### 1.2 Đăng Ký `LingoProDbContext` Với `Npgsql` (`PersistenceExtensions.cs` — 1 File = 1 Class)
```csharp
// LingoPro.Infrastructure/Persistence/PersistenceExtensions.cs
namespace LingoPro.Infrastructure.Persistence;

/// <summary>
/// Registers EF Core 10 DbContext configured for Supabase PostgreSQL (Npgsql).
/// </summary>
public static class PersistenceExtensions
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SupabasePostgres")
            ?? throw new InvalidOperationException("ConnectionStrings:SupabasePostgres is missing.");

        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        // Enable dynamic JSON serialization for PostgreSQL JSONB columns
        dataSourceBuilder.EnableDynamicJson();
        var dataSource = dataSourceBuilder.Build();

        services.AddDbContext<LingoProDbContext>((sp, options) =>
        {
            options.UseNpgsql(dataSource, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
                npgsqlOptions.CommandTimeout(30);
            });
            // Automatically map C# PascalCase properties to PostgreSQL snake_case columns
            options.UseSnakeCaseNamingConvention();
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<LingoProDbContext>());
        return services;
    }
}
```

---

## 2. Hệ Thống Business Enums Trích Xuất Từ `supabase/migrations` (Chuẩn 1 File = 1 Enum)

Toàn bộ các ràng buộc `CHECK (...)` và phân loại nghiệp vụ trong `supabase/migrations/` được chuẩn hóa thành các **Business Enums** tại `LingoPro.Domain/Enums/`:

### 2.1 Nhóm Chứng Chỉ & Cấp Độ (`LingoPro.Domain/Enums/Certification/`)

```csharp
// LingoPro.Domain/Enums/Certification/CertLevel.cs
// Source migrations: 20260703_learning_roadmap.sql, 20260930_unify_grammar_roadmap.sql, 20261015_reading_library_articles.sql
namespace LingoPro.Domain.Enums.Certification;

/// <summary>
/// Represents standardized certification proficiency levels (A0 through C2).
/// </summary>
public enum CertLevel
{
    A0 = 0,
    A1 = 1,
    A2 = 2,
    B1 = 3,
    B2 = 4,
    C1 = 5,
    C2 = 6
}
```

```csharp
// LingoPro.Domain/Enums/Certification/RoadmapLevelId.cs
// Source migration: 20260907_roadmap_toeic_track.sql (check level_id in A0..B2, lop-10..lop-12, toeic-450..toeic-800)
namespace LingoPro.Domain.Enums.Certification;

/// <summary>
/// Represents target proficiency or grade levels across CEFR, High School (THPT), and TOEIC tracks.
/// </summary>
public enum RoadmapLevelId
{
    A0 = 1,
    A1 = 2,
    A2 = 3,
    B1 = 4,
    B2 = 5,
    Lop10 = 10,     // 'lop-10'
    Lop11 = 11,     // 'lop-11'
    Lop12 = 12,     // 'lop-12'
    Toeic450 = 450, // 'toeic-450'
    Toeic650 = 650, // 'toeic-650'
    Toeic800 = 800  // 'toeic-800'
}
```

```csharp
// LingoPro.Domain/Enums/Certification/GrammarLevel.cs
// Source migration: 20260930_unify_grammar_roadmap.sql
namespace LingoPro.Domain.Enums.Certification;

/// <summary>
/// Represents difficulty and certification levels for grammar topics.
/// </summary>
public enum GrammarLevel
{
    A0 = 0,
    A1 = 1,
    A2 = 2,
    B1 = 3,
    B2 = 4,
    Beginner = 10,     // 'beginner'
    Intermediate = 11, // 'intermediate'
    Advanced = 12      // 'advanced'
}
```

```csharp
// LingoPro.Domain/Enums/Certification/GrammarMicroStage.cs
// Source migration: 20260923_grammar_micro_progress.sql (check stage in ('a0', 'a1'))
namespace LingoPro.Domain.Enums.Certification;

/// <summary>
/// Represents foundation micro-grammar stages.
/// </summary>
public enum GrammarMicroStage
{
    A0 = 0, // 'a0'
    A1 = 1  // 'a1'
}
```

### 2.2 Nhóm Auth, Vai Trò & Gói Cước (`LingoPro.Domain/Enums/Auth/` & `Billing/`)

```csharp
// LingoPro.Domain/Enums/Auth/UserRole.cs
// Source migrations: schema.sql & 20261015_reading_library_articles.sql
namespace LingoPro.Domain.Enums.Auth;

/// <summary>
/// Defines user authorization roles in the platform.
/// </summary>
public enum UserRole
{
    Student = 1, // 'student'
    Teacher = 2, // 'teacher'
    Admin = 3    // 'admin'
}
```

```csharp
// LingoPro.Domain/Enums/Billing/SubscriptionPlanType.cs
// Source migrations: 20260530_entitlement_quiz_cache.sql & 20260531_billing_system.sql
namespace LingoPro.Domain.Enums.Billing;

/// <summary>
/// Defines subscription entitlement tiers.
/// </summary>
public enum SubscriptionPlanType
{
    Free = 0,    // 'free'
    Pro = 1,     // 'pro'
    Premium = 2, // 'premium'
    School = 3   // 'school'
}
```

```csharp
// LingoPro.Domain/Enums/Billing/OrderKind.cs
// Source migrations: 20260617_group_plan.sql & 20260914_challenge_campaigns.sql
namespace LingoPro.Domain.Enums.Billing;

/// <summary>
/// Distinguishes individual subscriptions, group plans, and commitment challenge deposits.
/// </summary>
public enum OrderKind
{
    Individual = 1, // 'individual'
    Group = 2,      // 'group'
    Challenge = 3   // 'challenge'
}
```

```csharp
// LingoPro.Domain/Enums/Billing/PaymentMethodType.cs
// Source migration: 20260531_billing_system.sql
namespace LingoPro.Domain.Enums.Billing;

public enum PaymentMethodType
{
    VnPay = 1,        // 'vnpay'
    MoMo = 2,         // 'momo'
    BankTransfer = 3, // 'bank_transfer'
    Manual = 4        // 'manual'
}
```

```csharp
// LingoPro.Domain/Enums/Billing/OrderStatus.cs
// Source migration: 20260531_billing_system.sql
namespace LingoPro.Domain.Enums.Billing;

public enum OrderStatus
{
    Pending = 1,  // 'pending'
    Paid = 2,     // 'paid'
    Failed = 3,   // 'failed'
    Refunded = 4, // 'refunded'
    Expired = 5   // 'expired'
}
```

```csharp
// LingoPro.Domain/Enums/Billing/SubscriptionChangeReason.cs
// Source migration: 20260531_billing_system.sql
namespace LingoPro.Domain.Enums.Billing;

public enum SubscriptionChangeReason
{
    Upgrade = 1,     // 'upgrade'
    Downgrade = 2,   // 'downgrade'
    Expired = 3,     // 'expired'
    AdminManual = 4, // 'admin_manual'
    Payment = 5      // 'payment'
}
```

```csharp
// LingoPro.Domain/Enums/Billing/StudyGroupStatus.cs
// Source migration: 20260617_group_plan.sql
namespace LingoPro.Domain.Enums.Billing;

public enum StudyGroupStatus
{
    Active = 1,   // 'active'
    Expired = 2,  // 'expired'
    Cancelled = 3 // 'cancelled'
}
```

### 2.3 Nhóm Từ Vựng, FSRS, Packs & Ngữ Pháp (`LingoPro.Domain/Enums/Vocab/` & `Grammar/`)

```csharp
// LingoPro.Domain/Enums/Vocab/SrsCardState.cs
// Source migration: 20260411_fsrs_upgrade.sql (0=New, 1=Learning, 2=Review, 3=Relearning)
namespace LingoPro.Domain.Enums.Vocab;

public enum SrsCardState
{
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3
}
```

```csharp
// LingoPro.Domain/Enums/Vocab/SrsReviewQuality.cs
// Source migration: 20260923_fix_vocab_review_consistency.sql (CHECK quality IN (0, 3, 4, 5))
namespace LingoPro.Domain.Enums.Vocab;

public enum SrsReviewQuality
{
    Again = 0,
    Hard = 3,
    Good = 4,
    Easy = 5
}
```

```csharp
// LingoPro.Domain/Enums/Vocab/VocabPackStatus.cs
// Source migration: 20260612_vocab_pack_progress.sql
namespace LingoPro.Domain.Enums.Vocab;

public enum VocabPackStatus
{
    NotStarted = 0, // 'not_started'
    InProgress = 1, // 'in_progress'
    Completed = 2   // 'completed'
}
```

```csharp
// LingoPro.Domain/Enums/Vocab/QuizType.cs
// Source migration: schema.sql (check quiz_type in ('vocabulary', 'grammar'))
namespace LingoPro.Domain.Enums.Vocab;

public enum QuizType
{
    Vocabulary = 1, // 'vocabulary'
    Grammar = 2     // 'grammar'
}
```

```csharp
// LingoPro.Domain/Enums/Grammar/GrammarExerciseType.cs
// Source migration: schema.sql (check type in ('multiple_choice', 'fill_blank', 'error_correction'))
namespace LingoPro.Domain.Enums.Grammar;

public enum GrammarExerciseType
{
    MultipleChoice = 1, // 'multiple_choice'
    FillBlank = 2,      // 'fill_blank'
    ErrorCorrection = 3 // 'error_correction'
}
```

```csharp
// LingoPro.Domain/Enums/Grammar/GrammarLessonSource.cs
// Source migration: 20260519_grammar_lessons.sql
namespace LingoPro.Domain.Enums.Grammar;

public enum GrammarLessonSource
{
    MaiLanHuongPdf = 1, // 'mai-lan-huong-pdf'
    WebScrape = 2,      // 'web-scrape'
    Ai = 3              // 'ai'
}
```

### 2.4 Nhóm Lộ Trình, Khảo Thí & Luyện Đọc (`Roadmap/`, `Exam/`, `Reading/`)

```csharp
// LingoPro.Domain/Enums/Roadmap/RoadmapTrackType.cs
// Source migration: 20261014_roadmap_vstep_vnu_tracks.sql (check track in ('cefr', 'thpt', 'toeic', 'vstep', 'vnu-bac-3'))
namespace LingoPro.Domain.Enums.Roadmap;

public enum RoadmapTrackType
{
    Cefr = 1,    // 'cefr'
    Thpt = 2,    // 'thpt'
    Toeic = 3,   // 'toeic'
    Vstep = 4,   // 'vstep'
    VnuBac3 = 5  // 'vnu-bac-3'
}
```

```csharp
// LingoPro.Domain/Enums/Roadmap/RoadmapStepStatus.cs
// Source migration: 20260703_learning_roadmap.sql (check status in ('in_progress', 'completed'))
namespace LingoPro.Domain.Enums.Roadmap;

public enum RoadmapStepStatus
{
    InProgress = 1, // 'in_progress'
    Completed = 2   // 'completed'
}
```

```csharp
// LingoPro.Domain/Enums/Roadmap/RoadmapAssessmentTier.cs
// Source migration: 20260906_roadmap_assessments.sql (check tier in ('mini_quiz', 'checkpoint', 'exit_exam'))
namespace LingoPro.Domain.Enums.Roadmap;

public enum RoadmapAssessmentTier
{
    MiniQuiz = 1,   // 'mini_quiz'
    Checkpoint = 2, // 'checkpoint'
    ExitExam = 3    // 'exit_exam'
}
```

```csharp
// LingoPro.Domain/Enums/Exam/ToeicPart.cs
// Source migration: 20260911_toeic_question_history.sql (check part between 1 and 7)
namespace LingoPro.Domain.Enums.Exam;

public enum ToeicPart
{
    Part1Photographs = 1,
    Part2QuestionResponse = 2,
    Part3Conversations = 3,
    Part4Talks = 4,
    Part5IncompleteSentences = 5,
    Part6TextCompletion = 6,
    Part7ReadingComprehension = 7
}
```

```csharp
// LingoPro.Domain/Enums/Reading/DailyReadingStatus.cs
// Source migration: 20260811_daily_reading_exercises.sql
namespace LingoPro.Domain.Enums.Reading;

public enum DailyReadingStatus
{
    Generating = 1, // 'generating'
    Ready = 2,      // 'ready'
    Failed = 3,     // 'failed'
    Archived = 4    // 'archived'
}
```

```csharp
// LingoPro.Domain/Enums/Reading/ReadingArticleSourceType.cs
// Source migration: 20261015_reading_library_articles.sql (check source_type in ('vstep', 'toeic', 'voa', 'race', 'openstax', 'custom'))
namespace LingoPro.Domain.Enums.Reading;

public enum ReadingArticleSourceType
{
    Vstep = 1,    // 'vstep'
    Toeic = 2,    // 'toeic'
    Voa = 3,      // 'voa'
    Race = 4,     // 'race'
    OpenStax = 5, // 'openstax'
    Custom = 6    // 'custom'
}
```

```csharp
// LingoPro.Domain/Enums/Reading/ReadingArticleStatus.cs
// Source migration: 20261015_reading_library_articles.sql (check status in ('draft', 'published', 'archived'))
namespace LingoPro.Domain.Enums.Reading;

public enum ReadingArticleStatus
{
    Draft = 1,     // 'draft'
    Published = 2, // 'published'
    Archived = 3   // 'archived'
}
```

```csharp
// LingoPro.Domain/Enums/Reading/UserReadingProgressStatus.cs
// Source migration: 20261015_reading_library_articles.sql (check status in ('in_progress', 'completed', 'bookmarked'))
namespace LingoPro.Domain.Enums.Reading;

public enum UserReadingProgressStatus
{
    InProgress = 1, // 'in_progress'
    Completed = 2,  // 'completed'
    Bookmarked = 3  // 'bookmarked'
}
```

### 2.5 Nhóm Foundation Curriculum, Challenge & Referral (`Foundation/`, `Gamification/`, `Referral/`)

```csharp
// LingoPro.Domain/Enums/Foundation/FoundationModalityType.cs
// Source migration: 20261009_foundation_curriculum_gap_map.sql
namespace LingoPro.Domain.Enums.Foundation;

public enum FoundationModalityType
{
    Text = 1,           // 'TEXT'
    Audio = 2,          // 'AUDIO'
    Visual = 3,         // 'VISUAL'
    SyntacticFrame = 4  // 'SYNTACTIC_FRAME'
}
```

```csharp
// LingoPro.Domain/Enums/Foundation/LexicalStatusBucket.cs
// Source migration: 20261009_foundation_curriculum_gap_map.sql
namespace LingoPro.Domain.Enums.Foundation;

public enum LexicalStatusBucket
{
    Solid = 1,     // 'SOLID'
    Partial = 2,   // 'PARTIAL'
    Unknown = 3,   // 'UNKNOWN'
    Uncertain = 4, // 'UNCERTAIN'
    Recheck = 5    // 'RECHECK'
}
```

```csharp
// LingoPro.Domain/Enums/Gamification/ChallengeStatus.cs
// Source migration: 20260914_challenge_campaigns.sql (check status in ('draft','open','active','completed','cancelled'))
namespace LingoPro.Domain.Enums.Gamification;

public enum ChallengeStatus
{
    Draft = 1,     // 'draft'
    Open = 2,      // 'open'
    Active = 3,    // 'active'
    Completed = 4, // 'completed'
    Cancelled = 5  // 'cancelled'
}
```

```csharp
// LingoPro.Domain/Enums/Gamification/ChallengeParticipantStatus.cs
// Source migration: 20260914_challenge_campaigns.sql
namespace LingoPro.Domain.Enums.Gamification;

public enum ChallengeParticipantStatus
{
    Pending = 1,   // 'pending'
    Active = 2,    // 'active'
    Failed = 3,    // 'failed'
    Completed = 4, // 'completed'
    Refunded = 5   // 'refunded'
}
```

```csharp
// LingoPro.Domain/Enums/Gamification/ChallengeRewardChoice.cs
// Source migration: 20260914_challenge_model_c.sql (check reward_choice in ('cash', 'pro'))
namespace LingoPro.Domain.Enums.Gamification;

public enum ChallengeRewardChoice
{
    Cash = 1, // 'cash'
    Pro = 2   // 'pro'
}
```

```csharp
// LingoPro.Domain/Enums/Referral/ReferralLogStatus.cs
// Source migration: 20260918_referral_system.sql
namespace LingoPro.Domain.Enums.Referral;

public enum ReferralLogStatus
{
    Registered = 1,   // 'registered'
    Activated = 2,    // 'activated'
    Converted = 3,    // 'converted'
    FraudFlagged = 4  // 'fraud_flagged'
}
```

```csharp
// LingoPro.Domain/Enums/Referral/RewardTransactionType.cs
// Source migration: 20260918_referral_system.sql
namespace LingoPro.Domain.Enums.Referral;

public enum RewardTransactionType
{
    ProDays = 1,        // 'pro_days'
    CashCommission = 2, // 'cash_commission'
    AffiliateCash = 3,  // 'affiliate_cash'
    MilestoneBonus = 4, // 'milestone_bonus'
    PayoutDebit = 5,    // 'payout_debit'
    ClawbackDebt = 6    // 'clawback_debt'
}
```

```csharp
// LingoPro.Domain/Enums/Referral/RewardTransactionStatus.cs
// Source migration: 20260918_referral_system.sql
namespace LingoPro.Domain.Enums.Referral;

public enum RewardTransactionStatus
{
    PendingClearance = 1, // 'pending_clearance'
    Available = 2,        // 'available'
    Deducted = 3,         // 'deducted'
    Withdrawn = 4,        // 'withdrawn'
    Cancelled = 5,        // 'cancelled'
    Clawback = 6          // 'clawback'
}
```

```csharp
// LingoPro.Domain/Enums/Referral/PayoutRequestStatus.cs
// Source migration: 20260918_referral_system.sql
namespace LingoPro.Domain.Enums.Referral;

public enum PayoutRequestStatus
{
    Pending = 1,   // 'pending'
    Approved = 2,  // 'approved'
    Rejected = 3,  // 'rejected'
    Completed = 4  // 'completed'
}
```

```csharp
// LingoPro.Domain/Enums/Referral/PilotLeadStatus.cs
// Source migration: 20260614_teacher_sales_pilot.sql
namespace LingoPro.Domain.Enums.Referral;

public enum PilotLeadStatus
{
    New = 1,       // 'new'
    Contacted = 2, // 'contacted'
    Qualified = 3, // 'qualified'
    Won = 4,       // 'won'
    Lost = 5       // 'lost'
}
```

---

## 3. Thiết Kế Các Domain Entities Ánh Xạ Từ `supabase/migrations` (Chuẩn 1 File = 1 Class)

### 3.1 Nhóm Auth, Profile & Thiết Bị (`public.profiles`, `public.fcm_tokens`, `public.extension_tokens`)

```csharp
// LingoPro.Domain/Entities/Auth/Profile.cs
namespace LingoPro.Domain.Entities.Auth;

/// <summary>
/// Represents a user profile linked 1-to-1 with Supabase auth.users.
/// </summary>
public class Profile
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public SubscriptionPlanType Plan { get; set; } = SubscriptionPlanType.Free;
    public DateTime? PlanExpiresAt { get; set; }
    public string? GeminiApiKey { get; set; }
    public string? FcmToken { get; set; }
    public int DailyGoal { get; set; } = 10;
    public int NotificationHour { get; set; } = 20;
    public string? TelegramId { get; set; }
    public string? LastDuePushSlot { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual UserGamification? Gamification { get; set; }
    public virtual ICollection<FcmToken> FcmTokens { get; set; } = new List<FcmToken>();
    public virtual ICollection<ExtensionToken> ExtensionTokens { get; set; } = new List<ExtensionToken>();
    public virtual ICollection<SrsProgress> SrsProgresses { get; set; } = new List<SrsProgress>();
    public virtual ICollection<UserRoadmap> Roadmaps { get; set; } = new List<UserRoadmap>();
}
```

```csharp
// LingoPro.Domain/Entities/Auth/FcmToken.cs
// Source migration: 20260603_fcm_tokens.sql
namespace LingoPro.Domain.Entities.Auth;

public class FcmToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? DeviceLabel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Auth/ExtensionToken.cs
// Source migrations: 20260611_extension_tokens.sql & 20260711_extension_tokens_multi_device.sql
namespace LingoPro.Domain.Entities.Auth;

public class ExtensionToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    public virtual Profile User { get; set; } = null!;
}
```

---

### 3.2 Nhóm Lớp Học & Phòng Tự Học (`public.classrooms`, `public.enrollments`, `public.student_daily_stats`, `public.room_presence`)

```csharp
// LingoPro.Domain/Entities/Classroom/Classroom.cs
namespace LingoPro.Domain.Entities.Classroom;

public class Classroom
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    // Uses '__personal__' for private student word collections
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile Teacher { get; set; } = null!;
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public virtual ICollection<Word> Words { get; set; } = new List<Word>();
}
```

```csharp
// LingoPro.Domain/Entities/Classroom/Enrollment.cs
namespace LingoPro.Domain.Entities.Classroom;

public class Enrollment
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid ClassroomId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile Student { get; set; } = null!;
    public virtual Classroom Classroom { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Classroom/StudentDailyStat.cs
// Source migration: 20260421_analytics_history.sql
namespace LingoPro.Domain.Entities.Classroom;

public class StudentDailyStat
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid ClassroomId { get; set; }
    public int Vms { get; set; }
    public int Lcs { get; set; }
    public int TotalWords { get; set; }
    public DateOnly RecordedAt { get; set; }

    public virtual Profile Student { get; set; } = null!;
    public virtual Classroom Classroom { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Classroom/RoomPresence.cs
// Source migration: 20260717_room_presence.sql
namespace LingoPro.Domain.Entities.Classroom;

public class RoomPresence
{
    public Guid UserId { get; set; }
    public string RoomId { get; set; } = "lobby";
    public string DisplayName { get; set; } = string.Empty;
    public string ActivityKey { get; set; } = "idle";
    public string ActivityLabel { get; set; } = string.Empty;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}
```

---

### 3.3 Nhóm Từ Vựng, FSRS, Vocab Packs & Từ Điển (`words`, `srs_progress`, `srs_review_events`, `user_vocab_packs`, `global_dictionary`, `translations`, `quiz_results`)

```csharp
// LingoPro.Domain/Entities/Vocab/Word.cs
// Source migrations: schema.sql, 20260410, 20260412, 20260519_words_image_metadata.sql, 20260718_words_example_vi.sql
namespace LingoPro.Domain.Entities.Vocab;

public class Word
{
    public Guid Id { get; set; }
    public Guid ClassroomId { get; set; }
    public Guid? AddedBy { get; set; }
    // Maps to column 'word' in public.words
    public string WordText { get; set; } = string.Empty;
    public string? Translation { get; set; }
    public string? Ipa { get; set; }
    public string? Pos { get; set; }
    public string? Example { get; set; }
    public string? ExampleVi { get; set; }
    public string? SourceUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageSource { get; set; }
    public short? ImageConfidence { get; set; }
    public string[] Synonyms { get; set; } = [];
    public string[] Antonyms { get; set; } = [];
    public JsonDocument? DictionaryData { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Classroom.Classroom Classroom { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/SrsProgress.cs
// Source migrations: schema.sql, 20260411_fsrs_upgrade.sql, 20260604_fsrs_ts_learning_steps.sql, 20260923_fix_vocab_review_consistency.sql
namespace LingoPro.Domain.Entities.Vocab;

public class SrsProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid WordId { get; set; }
    public double EaseFactor { get; set; } = 2.5;
    public int IntervalDays { get; set; } = 1;
    public int ReviewCount { get; set; }
    public DateTime NextReviewDate { get; set; } = DateTime.UtcNow;
    public DateTime? LastReviewedAt { get; set; }
    public double Stability { get; set; }
    public double Difficulty { get; set; }
    public SrsCardState State { get; set; } = SrsCardState.New;
    public int Lapses { get; set; }
    public int LearningSteps { get; set; }
    public string AlgorithmVersion { get; set; } = "ts-fsrs";

    public virtual Profile User { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/SrsReviewEvent.cs
// Source migration: 20260923_fix_vocab_review_consistency.sql (Composite PK: user_id, review_id)
namespace LingoPro.Domain.Entities.Vocab;

public class SrsReviewEvent
{
    public Guid UserId { get; set; }
    public Guid ReviewId { get; set; }
    public Guid WordId { get; set; }
    public SrsReviewQuality Quality { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/UserVocabPack.cs
// Source migration: 20260612_vocab_pack_progress.sql (Composite PK: user_id, pack_id)
namespace LingoPro.Domain.Entities.Vocab;

public class UserVocabPack
{
    public Guid UserId { get; set; }
    public string PackId { get; set; } = string.Empty;
    public string CatalogVersion { get; set; } = "v1";
    public string TopicId { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public int PackIndex { get; set; }
    public VocabPackStatus Status { get; set; } = VocabPackStatus.NotStarted;
    public int WordCount { get; set; }
    public int ReviewedCount { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? LastStudiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public virtual ICollection<UserVocabPackWord> Words { get; set; } = new List<UserVocabPackWord>();
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/UserVocabPackWord.cs
// Source migration: 20260612_vocab_pack_progress.sql (Composite PK: user_id, pack_id, position)
namespace LingoPro.Domain.Entities.Vocab;

public class UserVocabPackWord
{
    public Guid UserId { get; set; }
    public string PackId { get; set; } = string.Empty;
    public int Position { get; set; }
    public Guid WordId { get; set; }

    public virtual UserVocabPack Pack { get; set; } = null!;
    public virtual Word Word { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/GlobalDictionary.cs
// Source migration: 20260430_create_global_dictionary.sql
namespace LingoPro.Domain.Entities.Vocab;

public class GlobalDictionary
{
    public Guid Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public JsonDocument Data { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/TranslationCache.cs
// Source migration: 20260906_create_translations_cache.sql (public.translations)
namespace LingoPro.Domain.Entities.Vocab;

public class TranslationCache
{
    public Guid Id { get; set; }
    public string SourceText { get; set; } = string.Empty;
    public string SourceLang { get; set; } = "en";
    public string TargetLang { get; set; } = "vi";
    public string TranslatedText { get; set; } = string.Empty;
    public string Provider { get; set; } = "libretranslate";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Vocab/QuizResult.cs
// Source migration: schema.sql
namespace LingoPro.Domain.Entities.Vocab;

public class QuizResult
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ClassroomId { get; set; }
    public QuizType QuizType { get; set; } = QuizType.Vocabulary;
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    // Computed stored column in PostgreSQL
    public double Accuracy { get; private set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
```

---

### 3.4 Nhóm Hệ Thống Ngữ Pháp (`grammar_topics`, `grammar_lessons`, `grammar_progress`, `grammar_exercises`, `grammar_results`, `grammar_quiz_cache`, `grammar_micro_progress`)

```csharp
// LingoPro.Domain/Entities/Grammar/GrammarTopic.cs
// Source migrations: 20260519_grammar_lessons.sql & 20260930_unify_grammar_roadmap.sql
namespace LingoPro.Domain.Entities.Grammar;

public class GrammarTopic
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? TitleVi { get; set; }
    public GrammarLevel Level { get; set; } = GrammarLevel.A0;
    public int OrderIndex { get; set; }
    public Guid? ParentId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual GrammarTopic? Parent { get; set; }
    public virtual ICollection<GrammarLesson> Lessons { get; set; } = new List<GrammarLesson>();
}
```

```csharp
// LingoPro.Domain/Entities/Grammar/GrammarLesson.cs
// Source migrations: 20260519_grammar_lessons.sql & 20260612_grammar_golden_sections.sql
namespace LingoPro.Domain.Entities.Grammar;

public class GrammarLesson
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Theory { get; set; }
    public string? TheoryVi { get; set; }
    public JsonDocument? Examples { get; set; }
    public JsonDocument? Sections { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageSource { get; set; }
    public short? ImageConfidence { get; set; }
    public GrammarLessonSource? Source { get; set; }
    public string? SourceUrl { get; set; }
    public int OrderIndex { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual GrammarTopic Topic { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Grammar/GrammarProgress.cs
// Source migrations: 20260519_grammar_lessons.sql & 20260604_fsrs_ts_learning_steps.sql
namespace LingoPro.Domain.Entities.Grammar;

public class GrammarProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }
    public double Stability { get; set; }
    public double Difficulty { get; set; }
    public int IntervalDays { get; set; }
    public int ReviewCount { get; set; }
    public DateTime NextReviewDate { get; set; } = DateTime.UtcNow;
    public DateTime? LastReviewedAt { get; set; }
    public SrsCardState State { get; set; } = SrsCardState.New;
    public int Lapses { get; set; }
    public int LearningSteps { get; set; }
    public short MasteryScore { get; set; }
}
```

```csharp
// LingoPro.Domain/Entities/Grammar/GrammarMicroProgress.cs
// Source migration: 20260923_grammar_micro_progress.sql (Composite PK: user_id, stage)
namespace LingoPro.Domain.Entities.Grammar;

public class GrammarMicroProgress
{
    public Guid UserId { get; set; }
    public GrammarMicroStage Stage { get; set; } = GrammarMicroStage.A0;
    public int[] CompletedSteps { get; set; } = [];
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### 3.5 Nhóm Lộ Trình Học & Khảo Thí TOEIC (`user_roadmap`, `user_roadmap_steps`, `user_roadmap_assessments`, `user_toeic_question_history`)

```csharp
// LingoPro.Domain/Entities/Roadmap/UserRoadmap.cs
// Source migrations: 20260703, 20260704, 20260716_roadmap_multi_track.sql, 20260907_roadmap_toeic_track.sql
// Composite PK: (user_id, track)
namespace LingoPro.Domain.Entities.Roadmap;

public class UserRoadmap
{
    public Guid UserId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public string RoadmapVersion { get; set; } = "roadmap-v1";
    public RoadmapLevelId LevelId { get; set; } = RoadmapLevelId.A0;
    public string? CurrentUnitId { get; set; }
    public JsonDocument? Placement { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}
```

```csharp
// LingoPro.Domain/Entities/Roadmap/UserRoadmapStep.cs
// Source migration: 20260703_learning_roadmap.sql (Composite PK: user_id, step_id)
namespace LingoPro.Domain.Entities.Roadmap;

public class UserRoadmapStep
{
    public Guid UserId { get; set; }
    public string StepId { get; set; } = string.Empty;
    public RoadmapStepStatus Status { get; set; } = RoadmapStepStatus.Completed;
    public int? Score { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Roadmap/UserRoadmapAssessment.cs
// Source migrations: 20260906_roadmap_assessments.sql & 20261014_roadmap_vstep_vnu_tracks.sql
namespace LingoPro.Domain.Entities.Roadmap;

public class UserRoadmapAssessment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public RoadmapTrackType Track { get; set; } = RoadmapTrackType.Cefr;
    public RoadmapAssessmentTier Tier { get; set; } = RoadmapAssessmentTier.MiniQuiz;
    public string TargetId { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool Passed { get; set; }
    public JsonDocument Details { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Exam/UserToeicQuestionHistory.cs
// Source migration: 20260911_toeic_question_history.sql (Composite PK: user_id, question_id)
namespace LingoPro.Domain.Entities.Exam;

public class UserToeicQuestionHistory
{
    public Guid UserId { get; set; }
    public string QuestionId { get; set; } = string.Empty;
    public ToeicPart Part { get; set; }
    public DateTime LastAnsweredAt { get; set; } = DateTime.UtcNow;
    public bool IsCorrect { get; set; }
    public int AttemptCount { get; set; } = 1;
    public string SelectedOption { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### 3.6 Nhóm Luyện Đọc & Thư Viện Bài Đọc (`daily_reading_exercises`, `daily_reading_completions`, `reading_articles`, `user_reading_library_progress`)

```csharp
// LingoPro.Domain/Entities/Reading/DailyReadingExercise.cs
// Source migration: 20260811_daily_reading_exercises.sql
namespace LingoPro.Domain.Entities.Reading;

public class DailyReadingExercise
{
    public Guid Id { get; set; }
    public Guid? ClassroomId { get; set; }
    public Guid? TargetUserId { get; set; }
    public DateOnly ExerciseDate { get; set; }
    public DateOnly SourceDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Passage { get; set; } = string.Empty;
    public string PassagePlain { get; set; } = string.Empty;
    public CertLevel Level { get; set; } = CertLevel.A2;
    public JsonDocument Questions { get; set; } = null!;
    public JsonDocument Cloze { get; set; } = null!;
    public JsonDocument SourceWords { get; set; } = null!;
    public string[] UsedWords { get; set; } = [];
    public double Coverage { get; set; }
    public JsonDocument? BonusWords { get; set; }
    public DailyReadingStatus Status { get; set; } = DailyReadingStatus.Ready;
    public string? ErrorMessage { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public JsonDocument? GenerationMeta { get; set; }
}
```

```csharp
// LingoPro.Domain/Entities/Reading/ReadingArticle.cs
// Source migration: 20261015_reading_library_articles.sql
namespace LingoPro.Domain.Entities.Reading;

public class ReadingArticle
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    // Maps to column 'cefr_level' in public.reading_articles
    public CertLevel CertLevel { get; set; } = CertLevel.A1;
    public string ThemeId { get; set; } = string.Empty;
    public string Passage { get; set; } = string.Empty;
    public string PassagePlain { get; set; } = string.Empty;
    public int WordCount { get; set; }
    public int EstimatedReadMinutes { get; set; } = 1;
    public string? Translation { get; set; }
    public string? Summary { get; set; }
    public JsonDocument Cloze { get; set; } = null!;
    public JsonDocument Questions { get; set; } = null!;
    public JsonDocument VocabularyHighlights { get; set; } = null!;
    public string? AudioUrl { get; set; }
    public JsonDocument? PodcastMeta { get; set; }
    public JsonDocument? MindmapData { get; set; }
    public ReadingArticleSourceType SourceType { get; set; } = ReadingArticleSourceType.Custom;
    public string? SourceId { get; set; }
    public JsonDocument? SourceMetadata { get; set; }
    public ReadingArticleStatus Status { get; set; } = ReadingArticleStatus.Published;
    public double DifficultyScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Reading/UserReadingLibraryProgress.cs
// Source migration: 20261015_reading_library_articles.sql
namespace LingoPro.Domain.Entities.Reading;

public class UserReadingLibraryProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ArticleId { get; set; }
    public UserReadingProgressStatus Status { get; set; } = UserReadingProgressStatus.InProgress;
    public bool IsBookmarked { get; set; }
    public int ReadCount { get; set; }
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
    public int ReadingTimeSeconds { get; set; }
    public int McqScore { get; set; }
    public int McqTotal { get; set; }
    public int ClozeScore { get; set; }
    public int ClozeTotal { get; set; }
    public string? UserNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### 3.7 Nhóm Foundation Curriculum & Gap Map (`foundation_lexical_concepts`, `foundation_representations`, `learner_lexical_evidence`, `learner_lexical_state`)

```csharp
// LingoPro.Domain/Entities/Foundation/FoundationLexicalConcept.cs
// Source migration: 20261009_foundation_curriculum_gap_map.sql
namespace LingoPro.Domain.Entities.Foundation;

public class FoundationLexicalConcept
{
    // VARCHAR(32) primary key, e.g., 'CON-G6-001'
    public string Id { get; set; } = string.Empty;
    public string Lemma { get; set; } = string.Empty;
    public string Pos { get; set; } = string.Empty;
    public string Ipa { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string Cluster { get; set; } = string.Empty;
    public int GenerativePower { get; set; } = 50;
    public int Stage { get; set; }
    public JsonDocument TargetChunks { get; set; } = null!;
    public JsonDocument ContrastConcepts { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Foundation/LearnerLexicalState.cs
// Source migration: 20261009_foundation_curriculum_gap_map.sql
namespace LingoPro.Domain.Entities.Foundation;

public class LearnerLexicalState
{
    public Guid Id { get; set; }
    public Guid LearnerId { get; set; }
    public string ConceptId { get; set; } = string.Empty;
    public LexicalStatusBucket StatusBucket { get; set; } = LexicalStatusBucket.Uncertain;
    public string ActiveGap { get; set; } = "UNKNOWN_CONCEPT_OR_FORM";
    public bool SoundRecognition { get; set; }
    public bool TextRecognition { get; set; }
    public bool MeaningRecall { get; set; }
    public bool FormRecall { get; set; }
    public bool ChunkUse { get; set; }
    public bool GenerativeUse { get; set; }
    public bool RetentionStable { get; set; }
    public decimal UncertaintyScore { get; set; } = 1.00m;
    public LexicalSupportLevel LastSupportLevel { get; set; } = LexicalSupportLevel.Independent;
    public int? LastLatencyMs { get; set; }
    public int ConsecutiveIndependentPasses { get; set; }
    public DateTime? LastProbedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### 3.8 Nhóm Thanh Toán, Gói Nhóm, Thử Thách & Giới Thiệu (`orders`, `groups`, `challenges`, `referral_campaigns`, `reward_transactions`, `payout_requests`, `pilot_leads`)

```csharp
// LingoPro.Domain/Entities/Billing/Order.cs
// Source migrations: 20260531_billing_system.sql, 20260617_group_plan.sql, 20260914_challenge_campaigns.sql
namespace LingoPro.Domain.Entities.Billing;

public class Order
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public SubscriptionPlanType Plan { get; set; } = SubscriptionPlanType.Pro;
    public OrderKind OrderKind { get; set; } = OrderKind.Individual;
    public int Seats { get; set; } = 1;
    public int Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public PaymentMethodType? PaymentMethod { get; set; }
    public string? PaymentRef { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? Note { get; set; }
    public string? CouponCode { get; set; }
    public int PeriodMonths { get; set; } = 1;
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public Guid? ProcessedBy { get; set; }
}
```

```csharp
// LingoPro.Domain/Entities/Gamification/Challenge.cs
// Source migrations: 20260914_challenge_campaigns.sql & 20260914_challenge_model_c.sql
namespace LingoPro.Domain.Entities.Gamification;

public class Challenge
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationDays { get; set; }
    public int DepositAmount { get; set; }
    public int RefundPct { get; set; } = 100;
    public int RefundCashAmount { get; set; } = 200000;
    public int BonusProDays { get; set; }
    public int StreakFreezePrice { get; set; } = 50000;
    public int MaxStreakFreezes { get; set; } = 3;
    public JsonDocument DailyCriteria { get; set; } = null!;
    public DateTime RegistrationOpensAt { get; set; }
    public DateTime RegistrationClosesAt { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public int? MaxParticipants { get; set; }
    public ChallengeStatus Status { get; set; } = ChallengeStatus.Draft;
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

```csharp
// LingoPro.Domain/Entities/Referral/RewardTransaction.cs
// Source migration: 20260918_referral_system.sql
namespace LingoPro.Domain.Entities.Referral;

public class RewardTransaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? ReferralLogId { get; set; }
    public Guid? OrderId { get; set; }
    public RewardTransactionType RewardType { get; set; }
    public int ProDays { get; set; }
    public int Amount { get; set; }
    public RewardTransactionStatus Status { get; set; } = RewardTransactionStatus.Available;
    public DateTime AvailableAt { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

---

## 4. Cấu Hình `LingoProDbContext` & Fluent API Value Converters

Mỗi bảng có 1 file `IEntityTypeConfiguration<T>` riêng biệt trong `LingoPro.Infrastructure/Persistence/Configurations/` để ánh xạ chuẩn xác các giá trị Enum C# (`CertLevel`, `ReadingArticleSourceType`, ...) sang đúng chuỗi/số trong `supabase/migrations/`:

```csharp
// LingoPro.Infrastructure/Persistence/Configurations/ReadingArticleConfiguration.cs
namespace LingoPro.Infrastructure.Persistence.Configurations;

/// <summary>
/// Configures EF Core mapping for the public.reading_articles table.
/// </summary>
public class ReadingArticleConfiguration : IEntityTypeConfiguration<ReadingArticle>
{
    public void Configure(EntityTypeBuilder<ReadingArticle> builder)
    {
        builder.ToTable("reading_articles", "public");
        builder.HasKey(x => x.Id);

        // Map CertLevel enum to 'A1', 'A2', 'B1', 'B2', 'C1', 'C2' in column 'cefr_level'
        builder.Property(x => x.CertLevel)
            .HasColumnName("cefr_level")
            .HasConversion<string>()
            .HasMaxLength(8);

        // Map ReadingArticleSourceType enum to lowercase string ('vstep', 'toeic', 'voa', 'race', 'openstax', 'custom')
        builder.Property(x => x.SourceType)
            .HasColumnName("source_type")
            .HasConversion(
                v => v.ToString().ToLowerInvariant(),
                v => Enum.Parse<ReadingArticleSourceType>(v, true));

        // Map ReadingArticleStatus enum to lowercase string ('draft', 'published', 'archived')
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion(
                v => v.ToString().ToLowerInvariant(),
                v => Enum.Parse<ReadingArticleStatus>(v, true));
    }
}
```
