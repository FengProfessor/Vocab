# Thư Mục Tài Liệu Hệ Thống & Kiến Trúc (`/agent`) — LingoPro Platform

Chào mừng bạn đến với thư mục `/agent` — trung tâm lưu trữ toàn bộ **tài liệu đặc tả nghiệp vụ (SRS)**, **thiết kế kiến trúc hệ thống (.NET 10 Clean Architecture)**, **báo cáo tiến độ hiện thực hóa** và **định hướng phối hợp phát triển** của dự án **LingoPro**.

---

## 1. Cấu Trúc Thư Mục `/agent`

```text
agent/
├── README.md                                      # [File hiện tại] Bản đồ dẫn đường & hướng dẫn đọc nhanh cho thành viên
├── 01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md        # Phân tích tổng quan dự án, cấu trúc Monorepo & kiến trúc thực tế
├── 02_IMPLEMENTATION_PROGRESS_REPORT.md           # Báo cáo chi tiết những gì đã thực hiện được (PR #26 -> PR #35) & trạng thái 15 module
├── 03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md        # Phân tích hiện trạng các file đang có trong /agent & đối chiếu độ lệch với code
│
├── architect/                                     # Bộ tài liệu Kiến trúc Hệ thống (.NET 10 Clean Architecture + React SPA)
│   ├── README.md                                  # Tổng quan kiến trúc Monolith Modernization ban đầu
│   ├── SKILL.md                                   # Quy chuẩn lập trình bắt buộc (SOLID, 1 File = 1 Class, English Comments, Enums)
│   ├── 01_CLEAN_ARCHITECTURE_DOTNET10.md          # Thiết kế phân tầng Clean Architecture 4 lớp, CQRS, Multi-Level Cache
│   ├── 02_AUTHENTICATION_SUPABASE_INTEGRATION.md  # Thiết kế xác thực & phân quyền (Lưu ý: Đã nâng cấp sang Supabase JWKS ở PR #31-#32)
│   ├── 03_DATABASE_EFCORE_POSTGRESQL.md           # Thiết kế tầng dữ liệu EF Core 10 & ánh xạ schema Supabase PostgreSQL
│   ├── 04_FRONTEND_REACT_ARCHITECTURE.md          # Thiết kế kiến trúc Frontend React 19 SPA (Ant Design v5) & SSR SEO
│   ├── 05_MODULE_MAPPING_SRS.md                   # Bản đồ ánh xạ 15 SRS vào các tầng Clean Architecture, Cache & NUnit Tests
│   └── 06_REVIEW_AND_UI_DIRECTION.md              # [MỚI NHẤT] Đánh giá tổng hợp PR #26-#35 & Chốt giữ UI Next.js (src/) + Backend .NET 10
│
└── docs/                                          # Bộ 15 tài liệu Đặc tả Ca sử dụng (SRS) & Audit hệ thống hiện hữu (src/)
    ├── README.md                                  # Tổng hợp 15 Use Cases & Danh mục các lỗ hổng bảo mật / nút thắt kiến trúc
    ├── SRS_01_AUTH_SESSION.md                     # UC-AUTH-01: Xác thực, Quản lý phiên, HttpOnly Cookie BFF & Offline-First
    ├── SRS_02_VOCAB_SRS_FSRS.md                   # UC-VOCAB-02: Học từ vựng & Thuật toán lặp lại ngắt quãng FSRS v5
    ├── SRS_03_ROADMAP_JOURNEY.md                  # UC-ROADMAP-03: Lộ trình học đa khóa (CEFR, TOEIC, THPT) & Placement Test
    ├── SRS_04_TOEIC_LISTENING_EXAM.md             # UC-TOEIC-04: Sát thủ TOEIC Listening (Dictation) & Thi thử Full Test 200 câu
    ├── SRS_05_AI_COACHING_SKILLS.md               # UC-AI-05: AI Coaching Luyện nói, Phân tích cấu trúc câu & Quota AI
    ├── SRS_06_TEACHER_CLASSROOM.md                # UC-TEACH-06: Quản lý lớp học, Giao bài & Cổng giáo viên (B2B VMS/LCS)
    ├── SRS_07_BILLING_SUBSCRIPTION.md             # UC-BILL-07: Thanh toán, Mã giảm giá, Gói VIP Pro/Premium & Webhook
    ├── SRS_08_GAMIFICATION_CHALLENGES.md          # UC-GAME-08: Gamification (XP, Streak GMT+7) & Chiến dịch Thử thách (Challenges)
    ├── SRS_09_GRAMMAR_SYSTEM.md                   # UC-GRAM-09: Hệ thống 62 chủ đề Ngữ pháp CEFR, Micro-Progress & FSRS
    ├── SRS_10_DICTIONARY_OCR_MINDMAP.md           # UC-DICT-10: Từ điển thông minh, Quét ảnh OCR & Sơ đồ tư duy Mindmap
    ├── SRS_11_READING_PRACTICE_LIBRARY.md         # UC-READ-11: Luyện đọc hàng ngày cá nhân hóa, Thư viện 588 bài đọc CEFR & CodeMix
    ├── SRS_12_VSTEP_VNU_THPT_EXAMS.md             # UC-EXAM-12: Khảo thí chuẩn hóa VSTEP, VNU Bậc 3 & THPT Quốc gia
    ├── SRS_13_SPEAKING_CURRICULUM_FOUNDATION.md   # UC-SPEAK-13: Ngữ âm IPA 44 âm, Speaking Foundation & Diagnostic Probe
    ├── SRS_14_REFERRAL_GROUPS_HUB.md              # UC-SOCIAL-14: Giới thiệu Đại sứ 5-Tier, Nhóm học tập Pro & Phòng tự học
    └── SRS_15_ADMIN_CRM_CAMPAIGNS_CRON.md         # UC-ADMIN-15: Quản trị Admin CRM, Lead Magnet & Tác vụ tự động Cron
```

---

## 2. Hướng Dẫn Thứ Tự Đọc Dành Cho Bạn Đọc (Onboarding Flow)

Để nắm bắt nhanh nhất toàn cảnh dự án mà không bị nhầm lẫn giữa thiết kế ban đầu và các bản cập nhật mới nhất, bạn nên đọc theo thứ tự sau:

1. **Bước 1 — Nắm toàn cảnh dự án & kiến trúc hiện tại**:
   - Đọc [`01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md`](./01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md) để hiểu cấu trúc 3 khối mã nguồn (`src/`, `back-end/`, `front-end/`) và cơ sở dữ liệu `supabase/`.
2. **Bước 2 — Xem kết quả đã triển khai & tiến độ từng phân hệ**:
   - Đọc [`02_IMPLEMENTATION_PROGRESS_REPORT.md`](./02_IMPLEMENTATION_PROGRESS_REPORT.md) để nắm rõ những gì đã xây dựng xong từ PR #26 đến PR #35 (373 file C# Backend, 568 bài test NUnit, 80 điểm `KnownDeviation`, 399 file React SPA).
3. **Bước 3 — Hiểu hiện trạng tài liệu trong `/agent` & các thay đổi kiến trúc**:
   - Đọc [`03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md`](./03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md) và [`architect/06_REVIEW_AND_UI_DIRECTION.md`](./architect/06_REVIEW_AND_UI_DIRECTION.md) để biết những điểm đã được cải tiến trong code so với tài liệu thiết kế ban đầu (`architect/01` → `05`), cũng như định hướng **giữ 100% UI Next.js (`src/`) kết hợp Core Backend `.NET 10` (`back-end/`)**.
4. **Bước 4 — Tra cứu sâu theo từng nghiệp vụ cụ thể**:
   - Khi cần xem quy tắc nghiệp vụ gốc và các lỗi/lỗ hổng của hệ thống cũ cần tránh: tra cứu [`docs/README.md`](./docs/README.md) và `docs/SRS_01` → `SRS_15`.
   - Khi cần xem quy chuẩn viết code `.NET 10`: tra cứu [`architect/SKILL.md`](./architect/SKILL.md) và [`architect/01_CLEAN_ARCHITECTURE_DOTNET10.md`](./architect/01_CLEAN_ARCHITECTURE_DOTNET10.md).

---

## 3. Quy Tắc Nạp Ngữ Cảnh Tự Động Khi Thiếu Thông Tin (Context Recovery Protocol Cho AI Agent & Developer)

Khi thực hiện nhiệm vụ ở các phiên làm việc tiếp theo mà bị thiếu thông tin về bối cảnh dự án, lịch sử triển khai, quy tắc nghiệp vụ hoặc kiến trúc kỹ thuật, **bắt buộc tra cứu đúng file trong `/agent` theo bảng ánh xạ dưới đây trước khi thực thi**:

| Tình huống / Thông tin bị thiếu | File cần đọc ngay để bổ sung Context |
|---|---|
| Chưa rõ cấu trúc thư mục dự án (`src/`, `back-end/`, `front-end/`, `supabase/`) hoặc kiến trúc `.NET 10` hiện tại | [`01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md`](./01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md) |
| Chưa rõ tính năng nào đã làm xong, tính năng nào đang stub/mock hoặc cần sửa `KnownDeviation` nào trong bộ 568 NUnit tests | [`02_IMPLEMENTATION_PROGRESS_REPORT.md`](./02_IMPLEMENTATION_PROGRESS_REPORT.md) |
| Thấy mâu thuẫn giữa tài liệu thiết kế cũ (`architect/01` → `05`) và code thực tế trong `back-end/` | [`03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md`](./03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md) (Mục 3: 5 điểm lệch kiến trúc) |
| Phân vân về định hướng UI (giữa Next.js `src/`, React Antd `front-end/` và Razor `.cshtml`) hoặc quy tắc merge nhánh | [`architect/06_REVIEW_AND_UI_DIRECTION.md`](./architect/06_REVIEW_AND_UI_DIRECTION.md) |
| Cần nắm quy chuẩn code bắt buộc khi tạo/sửa file trong `back-end/` (SOLID, `1 File = 1 Class`, 100% English comments, Enums, `ApiResponse<T>`) | [`architect/SKILL.md`](./architect/SKILL.md) & [`architect/01_CLEAN_ARCHITECTURE_DOTNET10.md`](./architect/01_CLEAN_ARCHITECTURE_DOTNET10.md) |
| Cần đối chiếu bảng/cột/enum PostgreSQL với `LingoProDbContext` và `supabase/migrations/` | [`architect/03_DATABASE_EFCORE_POSTGRESQL.md`](./architect/03_DATABASE_EFCORE_POSTGRESQL.md) & `back-end/src/LingoPro.Infrastructure/Persistence/LingoProDbContext.cs` |
| Cần hiểu chi tiết quy tắc nghiệp vụ gốc (FSRS, TOEIC/VSTEP Barem, Roadmap, Classroom, Billing, Gamification, Grammar...) hoặc các lỗ hổng bảo mật cũ cần tránh | [`docs/README.md`](./docs/README.md) & file [`docs/SRS_01` → `SRS_15`](./docs/) tương ứng |

