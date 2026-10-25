# Phân Tích Hiện Trạng Các File Đang Có Trong Thư Mục `/agent`

Tài liệu này phân tích chi tiết toàn bộ **24 file hiện có** bên trong hai thư mục con `/agent/docs` (16 files) và `/agent/architect` (8 files), đánh giá vai trò của từng file và **chỉ rõ các điểm lệch (Architecture Drift)** giữa tài liệu thiết kế ban đầu (viết ngày 16–19/10) so với mã nguồn thực tế sau PR #31–#35 (ngày 20–25/10).

---

## 1. Phân Tích Thư Mục `/agent/docs` (16 Files — Đặc Tả Nghiệp Vụ & Audit Hệ Thống Gốc)

Thư mục `agent/docs/` được xây dựng trong giai đoạn khảo sát hệ thống (16/10 – 18/10/2026) bằng phương pháp **Reverse Engineering** trực tiếp từ mã nguồn sản phẩm đang chạy (`src/app/`, `src/app/api/`, `src/lib/` và `supabase/migrations/`).

### 1.1. Cấu Trúc Chuẩn Của Từng File `SRS_01` → `SRS_15`
Mọi file trong `agent/docs/` đều tuân theo khuôn mẫu 5 phần:
1. **Thông tin chung**: Actor/Role, Mô tả, Pre-conditions, Post-conditions.
2. **Danh sách API liên quan**: Method, Endpoint thực tế trong `src/app/api/`, quyền hạn.
3. **Kịch bản chính (Main Flow) & Sơ đồ Mermaid**: Flowchart & Sequence Diagram mô tả luồng tương tác chi tiết từ UI $\rightarrow$ API $\rightarrow$ Supabase DB.
4. **Kịch bản ngoại lệ (Exception Flows)**: Xử lý lỗi mạng, hết quota, fallback.
5. **Điểm hạn chế, Rủi ro bảo mật & Nút thắt kiến trúc (Limitations & Bottlenecks)**: Chỉ rõ đến từng số dòng code trong `src/` các lỗi bảo mật và lỗi logic nghiệp vụ.

### 1.2. Bảng Phân Tích Nội Dung 16 File Hiện Có Trong `/agent/docs`

| Tên File | Quy mô | Nội dung cốt lõi & Phát hiện quan trọng trong file | Đánh giá hiện trạng |
|---|---|---|---|
| **[`README.md`](./docs/README.md)** | ~12.8 KB | Bản đồ tổng hợp 15 Use Cases (`UC-AUTH-01` → `UC-ADMIN-15`) và tóm tắt **3 nhóm rủi ro nghiêm trọng nhất** của hệ thống cũ (Bảo mật/Leo thang đặc quyền, Lỗi logic nghiệp vụ, Nút thắt hiệu năng). | **Còn nguyên giá trị 100%** — Tài liệu tham chiếu gốc để hiểu toàn bộ nghiệp vụ LingoPro. |
| **[`SRS_01_AUTH_SESSION.md`](./docs/SRS_01_AUTH_SESSION.md)** | ~14.1 KB | Đặc tả đăng nhập Email/Google, cơ chế HttpOnly Cookie BFF, Offline-first session. Chỉ ra nút thắt `verifiedAppSession` gọi 6 vòng mạng tuần tự & timeout cứng 1500ms tới Upstash Redis gây lỗi 503. | **Chuẩn xác** — Đã được giải quyết ở `.NET 10` bằng xác thực chữ ký JWKS tại chỗ kết hợp `ApplyProfileClaimsAsync`. |
| **[`SRS_02_VOCAB_SRS_FSRS.md`](./docs/SRS_02_VOCAB_SRS_FSRS.md)** | ~18.7 KB | Đặc tả học từ vựng, thuật toán FSRS v5 (`scheduleNext`), RPC `apply_srs_review`. Phát hiện lỗi hàm `mirrorSrsProgress` làm nhiễm bẩn từ vựng cá nhân sang toàn bộ lớp học của giáo viên. | **Chuẩn xác** — Là cơ sở cho `FsrsEngine.cs` và bộ test `VOC-01`..`VOC-12` trong `back-end/tests/`. |
| **[`SRS_03_ROADMAP_JOURNEY.md`](./docs/SRS_03_ROADMAP_JOURNEY.md)** | ~16.5 KB | Đặc tả Placement Test và lộ trình đa khóa (`cefr`, `toeic`, `thpt`). Phát hiện lỗi `checkRoadmapLevelAccess` quên chặn quyền Pro ở khóa `toeic`/`thpt` và lộ đáp án ở `/api/roadmap/checkpoint`. | **Chuẩn xác** — Đã ánh xạ sang `Features/Roadmap` và `SubmitPlacementCommandHandlerTests`. |
| **[`SRS_04_TOEIC_LISTENING_EXAM.md`](./docs/SRS_04_TOEIC_LISTENING_EXAM.md)** | ~14.5 KB | Đặc tả luyện nghe Dictation và phòng thi TOEIC 200 câu. Phát hiện backdoor `?unban=1` và lỗi `/api/toeic/submit` trả về toàn bộ 200 đáp án mà không kiểm tra `sessionToken`. | **Chuẩn xác** — Đã ánh xạ sang `ExamScoringEngine` và `SubmitToeicExamCommand`. |
| **[`SRS_05_AI_COACHING_SKILLS.md`](./docs/SRS_05_AI_COACHING_SKILLS.md)** | ~18.8 KB | Đặc tả AI Speaking, phân tích câu (Sentence Kernel / Golden Sentences) và quota `ai_daily_usage`. Phát hiện thiếu endpoint `/api/speaking/stt-whisper` và lộ công khai `/api/ai-router/stats`. | **Chuẩn xác** — Đã ánh xạ sang `Features/AiCoaching` và `AiCoachingHandlerTests`. |
| **[`SRS_06_TEACHER_CLASSROOM.md`](./docs/SRS_06_TEACHER_CLASSROOM.md)** | ~17.3 KB | Đặc tả quản lý lớp học B2B, mã mời, giao bài (`assign-drill`), chỉ số VMS/LCS. **Phát hiện lỗ hổng P0**: Học sinh lợi dụng lớp `__personal__` của mình để gọi `/api/teacher/students/add` hạ quyền Admin xuống `'student'` và xem lén dữ liệu học tập của bất kỳ ai. | **Cực kỳ quan trọng** — Trong `.NET 10` đã chặn cứng bằng `[Authorize(Policy = "RequireTeacher")]` và kiểm tra `!classroom.IsPersonal`. |
| **[`SRS_07_BILLING_SUBSCRIPTION.md`](./docs/SRS_07_BILLING_SUBSCRIPTION.md)** | ~17.1 KB | Đặc tả tạo đơn hàng, kiểm tra coupon, webhook thanh toán HMAC-SHA256. **Phát hiện lỗ hổng P0**: Mã giảm giá cứng `'WLU'` trong `src/lib/billing.ts` cho phép nâng cấp miễn phí 1 năm VIP không qua DB. | **Cực kỳ quan trọng** — Trong `.NET 10` đã bỏ hoàn toàn backdoor `'WLU'`, chỉ xác thực qua bảng `coupons` trong DB. |
| **[`SRS_08_GAMIFICATION_CHALLENGES.md`](./docs/SRS_08_GAMIFICATION_CHALLENGES.md)** | ~17.9 KB | Đặc tả cộng XP (`award_xp`), tính chuỗi ngày học `Streak` (GMT+7), mua `Streak Freeze` và Challenge cam kết. Phát hiện lỗi kép làm gãy thanh toán đơn `challenge` trong RPC `confirm_paid_order`. | **Chuẩn xác** — Trong `.NET 10` đã hỗ trợ đầy đủ `OrderKind.Challenge` trong `ConfirmOrderPaidCommandHandler`. |
| **[`SRS_09_GRAMMAR_SYSTEM.md`](./docs/SRS_09_GRAMMAR_SYSTEM.md)** | ~15.5 KB | Đặc tả 62 chủ đề ngữ pháp, bài tập 3 dạng, ôn tập FSRS và liên thông Journey. Phát hiện lỗi lưu tiến độ tạm trên RAM (`ttl-cache`) gây mất dữ liệu khi restart server. | **Chuẩn xác** — Trong `.NET 10` lưu bền vững toàn bộ vào bảng `grammar_progress` và `grammar_results`. |
| **[`SRS_10_DICTIONARY_OCR_MINDMAP.md`](./docs/SRS_10_DICTIONARY_OCR_MINDMAP.md)** | ~16.9 KB | Đặc tả tra từ thông minh, quét ảnh OCR, Mindmap và Chrome Extension Token. Phát hiện lỗi Open Redirect trong `/api/image-proxy` và nghẽn tiến trình `notebooklm-cli` 240s. | **Chuẩn xác** — Đã ánh xạ sang `Features/Dictionary`. |
| **[`SRS_11_READING_PRACTICE_LIBRARY.md`](./docs/SRS_11_READING_PRACTICE_LIBRARY.md)** | ~16.6 KB | Đặc tả sinh bài đọc hàng ngày từ sổ từ vựng, thư viện 588 bài đọc CEFR (`A1`–`C2`), tra từ một chạm (Gloss) và CodeMix. | **Chuẩn xác** — Đã ánh xạ sang `Features/Reading`. |
| **[`SRS_12_VSTEP_VNU_THPT_EXAMS.md`](./docs/SRS_12_VSTEP_VNU_THPT_EXAMS.md)** | ~14.0 KB | Đặc tả khảo thí VSTEP, VNU Bậc 3 & THPT, chấm điểm Barem và AI chấm Writing. Phát hiện `/api/vstep/writing-eval` không kiểm tra đăng nhập và không giới hạn tần suất gọi (Rate Limit). | **Chuẩn xác** — Trong `.NET 10` đã bắt buộc `[Authorize]` và gắn `RateLimiting` trên `ExamsController`. |
| **[`SRS_13_SPEAKING_CURRICULUM_FOUNDATION.md`](./docs/SRS_13_SPEAKING_CURRICULUM_FOUNDATION.md)** | ~14.5 KB | Đặc tả bảng 44 âm IPA, Speaking Foundation và thuật toán thăm dò từ vựng thích ứng (`Diagnostic Probe`). Phát hiện 5 truy vấn DB tuần tự trên mỗi câu trả lời. | **Chuẩn xác** — Đã tối ưu hóa trong `RecordLexicalEvidenceCommandHandler` và `LexicalStateUpdater`. |
| **[`SRS_14_REFERRAL_GROUPS_HUB.md`](./docs/SRS_14_REFERRAL_GROUPS_HUB.md)** | ~15.6 KB | Đặc tả hệ thống Đại sứ 5 bậc (Referral), rút tiền hoa hồng, nhóm học tập Pro (`groups`) và phòng tự học (`room_presence`). Phát hiện lỗi gia hạn sớm nhóm làm cắt cụt thời hạn cũ. | **Chuẩn xác** — Trong `.NET 10` đã sửa cộng nối tiếp thời hạn nhóm (`baseDate = group.ExpiresAt > now ? group.ExpiresAt : now`). |
| **[`SRS_15_ADMIN_CRM_CAMPAIGNS_CRON.md`](./docs/SRS_15_ADMIN_CRM_CAMPAIGNS_CRON.md)** | ~15.7 KB | Đặc tả Admin CRM, Lead Magnet và các Cronjob (`/api/cron/email-due`, `/api/cron/check-expired`). Phát hiện lỗi lộ công khai `/api/test/push-due` và lỗi gửi trùng email nhắc học. | **Chuẩn xác** — Đã chuyển sang `AdminCrmController` (`[Authorize(Roles = "Admin")]`) và `SubscriptionAndReminderWorker`. |

---

## 2. Phân Tích Thư Mục `/agent/architect` (8 Files — Thiết Kế Kiến Trúc & Định Hướng Phối Hợp)

Thư mục `agent/architect/` chứa các tài liệu thiết kế kiến trúc hệ thống mới trên nền tảng `.NET 10` (viết ngày 18–19/10) và tài liệu đánh giá tổng hợp mới nhất (`06_REVIEW_AND_UI_DIRECTION.md`, cập nhật ngày 25/10).

### 2.1. Bảng Phân Tích Chi Tiết 8 File Trong `/agent/architect`

| Tên File | Ngày cập nhật | Nội dung chính | Hiện trạng so với Code thực tế (`back-end/` & `front-end/`) |
|---|---|---|---|
| **[`README.md`](./architect/README.md)** | 19/10/2026 | Tổng quan kiến trúc Monolith `.NET 10`, ma trận công nghệ, sơ đồ Hybrid SSR + React SPA, chiến lược Cache 2 giai đoạn và quy chuẩn SOLID. | **Đúng 85% về kiến trúc Backend**, nhưng phần mô tả SSR Login (`AuthSsrController` + JWT tự cấp 15m/30d) và định hướng UI React SPA đã thay đổi (xem mục 3 bên dưới). |
| **[`SKILL.md`](./architect/SKILL.md)** | 19/10/2026 | Định nghĩa bộ quy tắc lập trình bắt buộc: **SOLID**, **1 File = 1 Class**, **100% English Code Comments**, danh mục **Business Enums**, chuẩn `ApiResponse<T>` có `StatusCode`, Selective Cache và NUnit Testing. | **Kim chỉ nam về Coding Standards** — Toàn bộ 373 file `.cs` trong `back-end/` đang tuân thủ nghiêm ngặt file này. (Chỉ lưu ý phần mô tả SSR Login đã chuyển sang Supabase JWKS). |
| **[`01_CLEAN_ARCHITECTURE_DOTNET10.md`](./architect/01_CLEAN_ARCHITECTURE_DOTNET10.md)** | 19/10/2026 | Đặc tả chi tiết 4 tầng Clean Architecture (`Domain`, `Application`, `Infrastructure`, `WebApi`), cấu trúc thư mục, thiết kế `ICacheService` / `ICacheableQuery` / `CachingBehavior`, `ApiResponse<T>`, `ExceptionHandlingMiddleware` và mẫu NUnit Tests. | **Khớp ~90% với `back-end/`**. Một vài khác biệt nhỏ: thư mục gốc thực tế là `back-end/` (thay vì `src/backend/`), và tầng `Application` đã bổ sung thêm `AuthorizationBehavior.cs`. |
| **[`02_AUTHENTICATION_SUPABASE_INTEGRATION.md`](./architect/02_AUTHENTICATION_SUPABASE_INTEGRATION.md)** | 18/10/2026 | Đặc tả luồng đăng nhập Server-Side (`AuthSsrController.cs`, `Login.cshtml`), tự ký JWT nội bộ (`JwtTokenService.cs`, `JwtSettings.cs`, bảng `refresh_sessions`) và ma trận phân quyền `RequireTeacher`. | **ĐÃ LỖI THỜI PHẦN CƠ CHẾ TOKEN (Outdated after PR #31 & #32)**: Code thực tế đã xóa `AuthSsrController` & `JwtTokenService` để dùng trực tiếp **Supabase Auth + JWKS (`SupabaseSigningKeyProvider`)** và `AuthController` (`/api/v1/auth/*`). Phần ma trận phân quyền `RequireTeacher` trong file vẫn còn nguyên giá trị. |
| **[`03_DATABASE_EFCORE_POSTGRESQL.md`](./architect/03_DATABASE_EFCORE_POSTGRESQL.md)** | 19/10/2026 | Đặc tả đầy đủ code C# của các Business Enums và Domain Entities ánh xạ từ `supabase/migrations/` cùng cấu hình `LingoProDbContext`. | **Khớp ~90% và đã được nâng cấp thêm ở PR #34**: Trong code thực tế đã bổ sung `SnakeCaseEnumConverter<TEnum>`, tách bảng `UserGamification` riêng và tinh chỉnh tên một số Entity (`ClassroomEntity`, `StudyRoomPresence`, `GroupMember`) để khớp 100% với 77 file migrations. |
| **[`04_FRONTEND_REACT_ARCHITECTURE.md`](./architect/04_FRONTEND_REACT_ARCHITECTURE.md)** | 19/10/2026 | Đặc tả kiến trúc giao diện kết hợp SSR SEO (`HomeSeoController`) và ứng dụng React 19 SPA dùng Ant Design v5 (`front-end/`). | **Đã hiện thực hóa trong `front-end/` (399 files)**, nhưng theo quyết định mới nhất tại `06_REVIEW_AND_UI_DIRECTION.md`, dự án sẽ **giữ nguyên UI Next.js (`src/`)** cho học sinh và không phát triển tiếp `front-end/` (Ant Design) nữa. |
| **[`05_MODULE_MAPPING_SRS.md`](./architect/05_MODULE_MAPPING_SRS.md)** | 18/10/2026 | Bảng tham chiếu chéo (Cross-Reference) ánh xạ 15 SRS (`UC-AUTH-01` → `UC-ADMIN-15`) sang Entities, Enums, CQRS Commands/Queries, quyết định Cache (Có/Không) và NUnit Test Suites. | **Còn nguyên giá trị tra cứu** — Giúp định vị nhanh mỗi SRS nằm ở Feature nào trong `LingoPro.Application` và `LingoPro.Domain`. |
| **[`06_REVIEW_AND_UI_DIRECTION.md`](./architect/06_REVIEW_AND_UI_DIRECTION.md)** | 25/10/2026 | **Bản đánh giá tổng hợp PR #26 → PR #35 và chốt định hướng kiến trúc mới nhất**: Ghi nhận toàn bộ thành quả Backend & 532+ Unit Tests; quyết định **giữ 100% UI Next.js (`src/`)** và tập trung hoàn thiện Core Backend `.NET 10` (`back-end/`). | **NGUỒN SỰ THẬT MỚI NHẤT (Active Direction)** — Định hình rõ phân vai và hướng đi tiếp theo của dự án. |

---

## 3. Tổng Hợp 5 Điểm Lệch Giữa Tài Liệu Cũ (`architect/01` → `05`) Và Code Thực Tế Cần Lưu Ý

Khi đọc các tài liệu `agent/architect/01` đến `05`, bạn đọc cần nắm rõ **5 thay đổi tích cực đã diễn ra trong quá trình code (PR #31 → PR #35)** để không bị bỡ ngỡ:

1. **Thay đổi 1 — Xác thực chuyển từ "Tự ký JWT cục bộ" sang "Supabase JWKS chuẩn hóa" (PR #31, #32)**:
   - *Trong tài liệu `02`*: Dùng `JwtTokenService` tự ký JWT HMAC-SHA256 và `AuthSsrController` (`/auth/login` Razor View).
   - *Trong code thực tế (`back-end/`)*: Dùng `SupabaseAuthService` gọi GoTrue API, `AuthController` (`/api/v1/auth/*`), và xác thực token bằng `SupabaseSigningKeyProvider` + `SupabaseJwksRetriever` + `ApplyProfileClaimsAsync` trong `AuthenticationExtensions.cs`. Nhờ vậy, `.NET 10` và `src/` (Next.js) dùng chung phiên đăng nhập Supabase无缝 (seamless).
2. **Thay đổi 2 — Phân quyền kép ở cả Controller và MediatR Pipeline (PR #32)**:
   - *Trong tài liệu `01`, `02`*: Chỉ mô tả `[Authorize(Policy = "RequireTeacher")]` trên Controller.
   - *Trong code thực tế (`back-end/`)*: Bổ sung thêm `AuthorizationBehavior<TRequest, TResponse>` và custom `[Authorize]` attribute (`LingoPro.Application/Common/Security/AuthorizeAttribute.cs`) gắn trực tiếp lên từng `Command`/`Query` record, đảm bảo dù gọi Handler từ đâu (API, Worker, Test) cũng đều được kiểm tra quyền hạn (`Role` & `Plan`).
3. **Thay đổi 3 — Đồng bộ Schema 1-1 bằng `SnakeCaseEnumConverter` & Tách `UserGamification` (PR #34)**:
   - *Trong tài liệu `03`*: Các trường `TotalXp`, `CurrentStreak`, `LongestStreak` còn nằm chung trong `Profile`, và Enum dùng `.HasConversion<string>()`.
   - *Trong code thực tế (`back-end/`)*: Đã tách riêng thực thể `UserGamification` ánh xạ vào bảng `public.user_gamification`, và xây dựng `SnakeCaseEnumConverter<TEnum>` để tự động chuyển đổi giữa Enum C# (`PascalCase`) và giá trị chuỗi `snake_case` trong PostgreSQL (`in_progress`, `pending_clearance`, `vnu_bac_3`, ...).
4. **Thay đổi 4 — Đường dẫn thư mục vật lý trong Monorepo**:
   - *Trong tài liệu `01`, `04`*: Ghi đường dẫn ví dụ là `src/backend/` và `src/frontend/`.
   - *Trong code thực tế*: Đặt tại `/back-end/` và `/front-end/` ở thư mục gốc của repo để tách biệt hoàn toàn với ứng dụng Next.js hiện hữu nằm trong `/src/`.
5. **Thay đổi 5 — Định hướng Giao diện: Giữ 100% UI Next.js (`src/`) + Core Backend `.NET 10` (`back-end/`) (`06_REVIEW_AND_UI_DIRECTION.md`)**:
   - *Trong tài liệu `04`*: Định hướng thay thế giao diện bằng React 19 SPA + Ant Design v5 (`front-end/`) và các trang Razor `.cshtml`.
   - *Định hướng chốt tại `06`*: Giữ nguyên 100% giao diện học sinh/SEO giàu tính tương tác trong `src/` (Next.js), ngưng đầu tư thêm vào `front-end/` (Ant Design) và `.cshtml`, tập trung 100% nguồn lực hoàn thiện `back-end/` (.NET 10) để giải quyết nốt các `KnownDeviation` và nối dữ liệu/AI thật.
