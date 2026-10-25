---
name: architect
description: >-
  Bộ quy chuẩn Kiến trúc Hệ thống (.NET 10 Clean Architecture, Hybrid SSR SEO/Auth + React 19 SPA dùng Ant Design v5, Supabase BFF,
  Phased Selective Multi-Level Cache Local + Redis, JWT 15m/30d, Teacher RBAC, NUnit Business Testing) và Tiêu chuẩn
  Lập trình bắt buộc (SOLID, 1 File = 1 Class, 100% English Code Comments, Business Enums như CertLevel từ supabase/migrations) cho dự án LingoPro.
---

# LingoPro System Architect Skill

Skill này định nghĩa các nguyên tắc kiến trúc cốt lõi và quy chuẩn viết code bắt buộc khi thiết kế, khởi tạo hoặc chỉnh sửa mã nguồn cho nền tảng **LingoPro** (**.NET 10 Clean Architecture Monolith + Server-Side Rendered SEO/Auth + React 19 SPA với Ant Design (`antd` v5) + Supabase PostgreSQL**).

---

## 1. Các Quy Tắc Kiến Trúc & Lập Trình Bất Di Bất Dịch (Core Mandates)

### 1.1 Tuân Thủ Triệt Để Nguyên Lý SOLID
1. **S — Single Responsibility Principle (SRP)**:
   * Mỗi class chỉ đảm nhận **duy nhất một trách nhiệm** và chỉ có một lý do để thay đổi.
   * Sử dụng CQRS (MediatR): mỗi Use Case tách biệt thành `Command`/`Query` riêng, `Handler` chỉ điều phối đúng một nghiệp vụ, `Validator` chỉ kiểm tra tính hợp lệ đầu vào.
2. **O — Open/Closed Principle (OCP)**:
   * Mở rộng hành vi mới (bật tầng Cache Local + Redis ở Giai đoạn 2, thêm cổng thanh toán, thêm nhà cung cấp AI: Gemini/Groq/Zhipu, thêm loại đề thi VSTEP/TOEIC/THPT) thông qua **Strategy / Decorator Pattern** hoặc **MediatR Pipeline Behavior** (`IPipelineBehavior<,>`) mà không sửa đổi logic lõi đã ổn định.
3. **L — Liskov Substitution Principle (LSP)**:
   * Các lớp kế thừa (`BaseEntity`, `BaseAuditableEntity`) hoặc thực thi interface (`ICacheService`: `NoOpCacheService` $\leftrightarrow$ `HybridMultiLevelCacheService`, `IAiProvider`, `IPaymentGateway`, `IStorageService`) phải thay thế hoàn toàn được lớp cơ sở/interface mà không làm sai lệch hành vi hệ thống.
4. **I — Interface Segregation Principle (ISP)**:
   * Không tạo "Fat Interface". Tách nhỏ các interface theo đúng ngữ cảnh sử dụng tại tầng Application (`ICurrentUserService`, `ICacheService`, `ICacheableQuery`, `ICacheInvalidatorCommand`, `IJwtTokenService`, `ISupabaseAuthService`, `ISupabaseStorageService`, `IAiSpeechToTextService`, `IAiTextGenerationService`).
5. **D — Dependency Inversion Principle (DIP)**:
   * Tầng cấp cao (`Domain`, `Application`) tuyệt đối không phụ thuộc vào tầng cấp thấp (`Infrastructure`, `EF Core`, `StackExchange.Redis`, `Supabase SDK`). Mọi giao tiếp ngoại vi đều phải đi qua Abstraction (Interface) đặt tại `Domain` hoặc `Application`.

---

### 1.2 Quy Tắc "1 File = 1 Class / Type" & 100% Comment Trong Code Bằng Tiếng Anh
* **Mỗi file mã nguồn (`.cs`, `.ts`, `.tsx`) chỉ được phép chứa duy nhất 1 class, record, interface, enum hoặc component chính.**
* **Tên file bắt buộc phải trùng khớp 100% với tên class/type bên trong** (PascalCase).
* **100% Comment trong Code bằng Tiếng Anh**: Toàn bộ XML documentation comments (`/// <summary>`), JSDoc (`/** ... */`) và inline comments (`// ...`) bên trong mọi file code bắt buộc viết bằng **tiếng Anh** rõ ràng, chuẩn mực.
* **Cấm gộp chung nhiều class trong 1 file**:
  * **Trong CQRS (.NET 10)**: Tách riêng `Command.cs`, `CommandHandler.cs`, `CommandValidator.cs` và `ResponseDto.cs` thành 4 file độc lập.
  * **Trong Domain Entities & EF Core**: Mỗi Entity là 1 file `.cs` riêng (`Word.cs`, `SrsProgress.cs`), mỗi `IEntityTypeConfiguration<T>` là 1 file riêng (`WordConfiguration.cs`, `SrsProgressConfiguration.cs`).
  * **Trong Enum**: Mỗi Enum được đặt trong 1 file `.cs` riêng biệt tại `LingoPro.Domain/Enums/<Category>/<EnumName>.cs`.
  * **Trong Unit Tests (NUnit)**: Mỗi bộ test cho 1 Class/Handler được đặt trong 1 file `<ClassName>Tests.cs` riêng biệt.

---

### 1.3 Định Nghĩa Đầy Đủ Enum Cho Tất Cả Các Type Của Business (Đồng Bộ Từ `supabase/migrations`)
* **Cấm sử dụng Magic Strings hoặc số nguyên rời rạc (`"student"`, `"pro"`, `"pending"`, `"A1"`, `"cefr"`)** trong logic nghiệp vụ, Entity hoặc DTO.
* **Mọi phân loại, trạng thái, cấp độ chứng chỉ (`CertLevel`: `A0`, `A1`, `A2`, `B1`, `B2`, `C1`, `C2`) và loại hình nghiệp vụ** trích xuất từ `supabase/schema.sql` và `supabase/migrations/*.sql` đều phải được định nghĩa thành **Enum chuẩn hóa** tại `LingoPro.Domain/Enums/` (và đồng bộ sang TypeScript tại `src/frontend/src/types/enums/`).

#### Danh mục các Business Enums chuẩn hóa từ `supabase/migrations`:
| Phân hệ (Domain) | Các Business Enum bắt buộc (1 Enum = 1 File `.cs`) |
|---|---|
| **Auth & Account** | `UserRole` (`Student`, `Teacher`, `Admin`), `AuthProviderType` (`Email`, `Google`), `AccountStatus` (`Active`, `Suspended`, `Banned`) |
| **Certification & Levels** | `CertLevel` (`A0`, `A1`, `A2`, `B1`, `B2`, `C1`, `C2`), `RoadmapLevelId` (`A0`, `A1`, `A2`, `B1`, `B2`, `Lop10`, `Lop11`, `Lop12`, `Toeic450`, `Toeic650`, `Toeic800`), `GrammarLevel` (`A0`, `A1`, `A2`, `B1`, `B2`, `Beginner`, `Intermediate`, `Advanced`), `GrammarMicroStage` (`A0`, `A1`) |
| **Vocab, FSRS & Packs** | `SrsCardState` (`New = 0`, `Learning = 1`, `Review = 2`, `Relearning = 3`), `SrsReviewQuality` (`Again = 0`, `Hard = 3`, `Good = 4`, `Easy = 5`), `SrsAlgorithmVersion` (`Sm2`, `TsFsrs`), `PartOfSpeechType` (`Noun`, `Verb`, `Adjective`, `Adverb`, `Pronoun`, `Preposition`, `Conjunction`, `Interjection`, `PhrasalVerb`, `Idiom`), `VocabPackStatus` (`NotStarted`, `InProgress`, `Completed`), `QuizType` (`Vocabulary`, `Grammar`) |
| **Roadmap & Exams** | `RoadmapTrackType` (`Cefr`, `Thpt`, `Toeic`, `Vstep`, `VnuBac3`), `RoadmapStepStatus` (`InProgress`, `Completed`), `RoadmapAssessmentTier` (`MiniQuiz`, `Checkpoint`, `ExitExam`), `ToeicPart` (`Part1 = 1` .. `Part7 = 7`) |
| **Reading & Library** | `DailyReadingStatus` (`Generating`, `Ready`, `Failed`, `Archived`), `ReadingArticleSourceType` (`Vstep`, `Toeic`, `Voa`, `Race`, `OpenStax`, `Custom`), `ReadingArticleStatus` (`Draft`, `Published`, `Archived`), `UserReadingProgressStatus` (`InProgress`, `Completed`, `Bookmarked`) |
| **Foundation Curriculum (Grade 6)** | `FoundationModalityType` (`Text`, `Audio`, `Visual`, `SyntacticFrame`), `FoundationClarityRating` (`V0`, `V1`, `V2`, `V3`), `LexicalEvidenceSource` (`Learner`, `Teacher`, `System`), `LexicalSupportLevel` (`Independent`, `Modelled`, `Prompted`, `NotYet`), `LexicalStatusBucket` (`Solid`, `Partial`, `Unknown`, `Uncertain`, `Recheck`) |
| **Grammar System** | `GrammarExerciseType` (`MultipleChoice`, `FillBlank`, `ErrorCorrection`), `GrammarLessonSource` (`MaiLanHuongPdf`, `WebScrape`, `Ai`), `GrammarDifficultyLevel` (`Easy = 1`, `Medium = 2`, `Hard = 3`) |
| **Billing, Orders & Groups** | `SubscriptionPlanType` (`Free`, `Pro`, `Premium`, `School`), `OrderKind` (`Individual`, `Group`, `Challenge`), `PaymentMethodType` (`VnPay`, `MoMo`, `BankTransfer`, `Manual`), `OrderStatus` (`Pending`, `Paid`, `Failed`, `Refunded`, `Expired`), `CurrencyType` (`Vnd`, `Usd`), `SubscriptionChangeReason` (`Upgrade`, `Downgrade`, `Expired`, `AdminManual`, `Payment`), `StudyGroupStatus` (`Active`, `Expired`, `Cancelled`) |
| **Challenges & Gamification** | `ChallengeStatus` (`Draft`, `Open`, `Active`, `Completed`, `Cancelled`), `ChallengeParticipantStatus` (`Pending`, `Active`, `Failed`, `Completed`, `Refunded`), `ChallengeRewardChoice` (`Cash`, `Pro`) |
| **Referral, Affiliate & Leads** | `ReferralLogStatus` (`Registered`, `Activated`, `Converted`, `FraudFlagged`), `RewardTransactionType` (`ProDays`, `CashCommission`, `AffiliateCash`, `MilestoneBonus`, `PayoutDebit`, `ClawbackDebt`), `RewardTransactionStatus` (`PendingClearance`, `Available`, `Deducted`, `Withdrawn`, `Cancelled`, `Clawback`), `PayoutRequestStatus` (`Pending`, `Approved`, `Rejected`, `Completed`), `PilotLeadStatus` (`New`, `Contacted`, `Qualified`, `Won`, `Lost`) |

---

### 1.4 Chuẩn Hóa Phản Hồi `ApiResponse<T>` Có `StatusCode` & Message Tiếng Anh
* Toàn bộ API trả về `ApiResponse<T>` duy nhất, bắt buộc có trường **`StatusCode`** (mã trạng thái HTTP số nguyên: `200`, `201`, `400`, `401`, `403`, `404`, `429`, `500`), `Success`, `Message` (100% tiếng Anh), `Data`, `ErrorCode`, `Errors`, `Timestamp`.

---

### 1.5 Kiến Trúc Cache 2 Giai Đoạn Có Chọn Lọc (Selective Multi-Level Caching: L1 Local + L2 Redis)
* **Giai đoạn 1 (Hiện tại — Chưa bật Cache)**: Hệ thống đăng ký `NoOpCacheService` cho `ICacheService`. Mọi truy vấn chạy trực tiếp vào Database nhưng bộ khung `ICacheService`, `ICacheableQuery` và `CachingBehavior<TRequest, TResponse>` đã được viết sẵn sàng 100%.
* **Giai đoạn 2 (Bật đồng thời L1 Local `IMemoryCache` + L2 `Redis`)**: Chuyển cấu hình `Caching:Mode = "Hybrid"` để kích hoạt `HybridMultiLevelCacheService` (kết hợp cả Local Memory Cache L1 tốc độ nano-giây và Redis Distributed Cache L2) mà không phải sửa bất kỳ dòng code Business Handler nào.
* **Nguyên tắc Cache Có Chọn Lọc (Selective Opt-In Caching)**:
  * `CachingBehavior<TRequest, TResponse>` **chỉ áp dụng cho các Query thực thi tường minh `ICacheableQuery`** (`where TRequest : ICacheableQuery`).
  * **TUYỆT ĐỐI KHÔNG CACHE**: Hồ sơ cá nhân & quyền hạn (`profiles`), hàng đợi ôn tập FSRS đến hạn & lịch sử học (`srs_progress`, `srs_review_events`, `user_toeic_question_history`), tiến độ lộ trình cá nhân (`user_roadmap`), giao dịch thanh toán/mã giảm giá/hoa hồng (`orders`, `coupons`, `reward_transactions`), bộ đếm quota AI (`ai_daily_usage`), và dữ liệu theo dõi lớp học thời gian thực của Giáo viên (`student_daily_stats`, `quiz_results`).
  * **CHỈ CACHE (ở Giai đoạn 2)**: Dữ liệu danh mục tĩnh dùng chung có tần suất đọc cao: Từ điển toàn cục (`global_dictionary`), 62 chủ đề & lý thuyết ngữ pháp (`grammar_topics`, `grammar_lessons`), kho bài đọc CEFR đã xuất bản (`reading_articles`), khung chương trình chuẩn và dữ liệu SEO trang chủ.

---

### 1.6 Kiến Trúc Hybrid SSR (Trang Chủ SEO + Server-Side Login), React SPA (Ant Design v5), JWT (15m / 30d) & Phân Quyền Giáo Viên (`RequireTeacher`)
* **Trang Chủ & Public Pages (`GET /`, `/landing`, `/pricing`)**: Render trực tiếp **Server-Side (SSR)** trên `.NET 10` (Razor Pages / MVC Views) tối ưu tuyệt đối cho **SEO** (Meta tags, OpenGraph, JSON-LD, Sitemap, < 200ms FCP).
* **Luồng Đăng Nhập Server-Side (`GET /auth/login`, `POST /auth/login`, `/auth/callback/google`)**:
  * Giao diện đăng nhập được render Server-Side và gửi form trực tiếp lên Server `.NET 10`.
  * Sau khi xác thực thành công trên Server, Backend khởi tạo phiên và chuyển hướng (redirect) người dùng sang ứng dụng **React SPA (`/app/...`)** kèm theo thông tin đăng nhập đã xác thực.
* **Giao Diện Frontend React 19 SPA Sử Dụng Ant Design (`antd` v5)**:
  * Toàn bộ không gian học tập, quản lý lớp học của Giáo viên và Admin CRM trong **React SPA (`fe`)** sử dụng hệ thống UI Component của **Ant Design (`antd` v5)** kết hợp **`@ant-design/icons`** (`Layout`, `Menu`, `Card`, `Table`, `Form`, `Modal`, `Drawer`, `Tabs`, `Steps`, `Progress`, `Tag`, `Statistic`, `App.useApp()`).
  * Cấu hình Design Tokens đồng nhất (màu chủ đạo, bo góc, typography, chế độ Sáng/Tối và ngôn ngữ `viVN`) thông qua `<ConfigProvider theme={lingoProTheme}>` tại `AppProviders.tsx`.
* **Cấu hình thời hạn JWT**:
  * **Access Token**: Hết hạn sau **15 phút** (`AccessTokenExpirationMinutes = 15`).
  * **Refresh Token**: Hết hạn sau **30 ngày** (`RefreshTokenExpirationDays = 30`), hỗ trợ cơ chế Refresh Token Rotation an toàn.
* **Phân Quyền Chức Năng Dành Riêng Cho Giáo Viên (`[Authorize(Policy = "RequireTeacher")]`)**:
  * Tất cả các nghiệp vụ quản lý lớp học (`classrooms`), duyệt/xóa học sinh (`enrollments`), xem báo cáo chuyên cần VMS/LCS (`student_daily_stats`, `quiz_results`), tạo/sửa/xóa từ vựng/bài tập ngữ pháp/bài đọc hàng ngày của lớp (`words`, `grammar_exercises`, `daily_reading_exercises`), biên tập bài giảng ngữ pháp (`grammar_topics`, `grammar_lessons`) và ghi nhận đánh giá phát âm giáo viên (`learner_lexical_evidence` với `evidence_source = 'TEACHER'`) đều bắt buộc gắn `[Authorize(Policy = "RequireTeacher")]` và kiểm tra quyền sở hữu tài nguyên.

---

### 1.7 Kiểm Thử Nghiệp Vụ (Business Unit Testing) Với NUnit
* Bắt buộc viết Unit Test cho toàn bộ **Domain Business Logic** (thuật toán FSRS v5, Entities, Value Objects) và **Application Use Cases** (MediatR Command/Query Handlers, Validators) bằng framework **NUnit** (`[TestFixture]`, `[Test]`, `[TestCase]`, `Assert.That`) kết hợp `NSubstitute`.

---

## 2. Danh Mục Tài Liệu Kiến Trúc Chi Tiết

1. [README.md](./README.md) — Tổng quan kiến trúc Monolith .NET 10 (SSR SEO/Login + React 19 SPA với Ant Design + Supabase BFF).
2. [01_CLEAN_ARCHITECTURE_DOTNET10.md](./01_CLEAN_ARCHITECTURE_DOTNET10.md) — Phân tầng Clean Architecture, SOLID, 1 File = 1 Class, 100% English Code Comments, Phased Selective Multi-Level Caching (`NoOpCacheService` $\rightarrow$ `HybridMultiLevelCacheService` L1 Local + L2 Redis), NUnit Business Testing và `ApiResponse<T>` có `StatusCode`.
3. [02_AUTHENTICATION_SUPABASE_INTEGRATION.md](./02_AUTHENTICATION_SUPABASE_INTEGRATION.md) — Luồng Server-Side Login chuyển tiếp sang React SPA, cấu hình JWT (Access Token 15 phút, Refresh Token 30 ngày), phân quyền `RequireTeacher` chi tiết, Google SSO & Account Linking.
4. [03_DATABASE_EFCORE_POSTGRESQL.md](./03_DATABASE_EFCORE_POSTGRESQL.md) — Thiết kế toàn bộ Entities & Business Enums (`CertLevel`, ...) ánh xạ trực tiếp từ `supabase/schema.sql` và `supabase/migrations/` với EF Core 10.
5. [04_FRONTEND_REACT_ARCHITECTURE.md](./04_FRONTEND_REACT_ARCHITECTURE.md) — Kiến trúc Hybrid: Server-Side Rendered Landing/SEO + Login bàn giao phiên sang React 19 SPA sử dụng **Ant Design (`antd` v5)**, đồng bộ Business Enums (`CertLevel`) và `ApiResponse<T>`.
6. [05_MODULE_MAPPING_SRS.md](./05_MODULE_MAPPING_SRS.md) — Bản đồ ánh xạ 15 phân hệ SRS (`SRS_01` $\rightarrow$ `SRS_15`) vào các tầng Clean Architecture, phân quyền `RequireTeacher`, phân loại Selective Cache và NUnit Test Suites.
7. [06_REVIEW_AND_UI_DIRECTION.md](./06_REVIEW_AND_UI_DIRECTION.md) — Đánh giá tổng hợp PR #26 → PR #35 và chốt định hướng giữ 100% UI Next.js (`src/`) + tập trung hoàn thiện Core Backend `.NET 10` (`back-end/`).

---

## 3. Quy Tắc Bổ Sung Ngữ Cảnh Khi Thiếu Thông Tin (Context Lookup Protocol)

Khi thực hiện bất kỳ task nào trên dự án LingoPro mà thiếu thông tin ngữ cảnh về tiến độ, kiến trúc thực tế hoặc độ lệch giữa tài liệu ban đầu và code hiện tại, **luôn đọc bộ tài liệu tổng hợp tại thư mục gốc `/agent` trước**:
- [`../README.md`](../README.md): Bản đồ dẫn đường & bảng tra cứu nhanh theo tình huống.
- [`../01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md`](../01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md): Tổng quan dự án, cấu trúc Monorepo và kiến trúc thực tế của `back-end/` (.NET 10).
- [`../02_IMPLEMENTATION_PROGRESS_REPORT.md`](../02_IMPLEMENTATION_PROGRESS_REPORT.md): Báo cáo tiến độ chi tiết PR #26 → PR #35, trạng thái 15 phân hệ, 568 NUnit tests và 80 điểm `KnownDeviation`.
- [`../03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md`](../03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md): Phân tích hiện trạng 24 file trong `/agent` và 5 điểm cập nhật kiến trúc trong code thực tế (Supabase JWKS Auth, `AuthorizationBehavior`, `SnakeCaseEnumConverter`, tách `UserGamification`, và giữ UI `src/`).


