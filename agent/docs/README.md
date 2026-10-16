# Tổng hợp Tài liệu Đặc tả Ca sử dụng (Use Case & SRS) - Toàn bộ Hệ thống LingoPro

Thư mục này chứa toàn bộ **15 tài liệu đặc tả chức năng (SRS)** theo cấu trúc chuẩn **Use Case Specification**, bao phủ **100% các phân hệ tính năng đang chạy trong dự án (`src/app/` & `src/app/api/`)**.

Mỗi tài liệu được chuẩn hóa bao gồm các mục:
1. **Thông tin chung**: Actor / Role thực hiện, Mô tả tóm tắt, Tiền điều kiện (Pre-conditions), Hậu điều kiện (Post-conditions).
2. **Danh sách API liên quan**: Phương thức (Method), Endpoint URL thực tế trong `src/app/api/`, Chức năng và Quyền hạn truy cập.
3. **Kịch bản chính (Main Flow - Step-by-Step) & Sơ đồ Luồng hoạt động**: Sơ đồ Flowchart & Sequence Diagram (Mermaid) cùng mô tả chi tiết từng bước tương tác giữa Người dùng (Actor), Giao diện (Frontend), Xử lý máy chủ (Backend/AI/Lib) và Cơ sở dữ liệu (Supabase DB).
4. **Kịch bản ngoại lệ (Alternative & Exception Flows)**: Dự phòng lỗi mạng, sai quyền hạn, hết lượt quota, chống gian lận, fallback an toàn.
5. **Điểm hạn chế, Rủi ro & Nút thắt trong Luồng hiện tại (Current Limitations & Architectural Bottlenecks)**: Phân tích trực tiếp từ mã nguồn thực tế các lỗ hổng bảo mật, lỗi logic nghiệp vụ, điều kiện tranh chấp (Race Condition) và nút thắt hiệu năng trong từng phân hệ.

---

### Danh mục 15 tài liệu Use Case chi tiết trên toàn bộ dự án:

| STT | Mã Use Case | Tên tính năng / Phân hệ | Actor / Role | Tệp đặc tả |
|:---:|---|---|---|---|
| 01 | **UC-AUTH-01** | **Xác thực & Quản lý Phiên**<br/>(Đăng nhập Email/Pass, OAuth Google, Khôi phục mật khẩu, HttpOnly Cookie BFF, Offline-First Session) | `Guest`, `User` | [SRS_01_AUTH_SESSION.md](./SRS_01_AUTH_SESSION.md) |
| 02 | **UC-VOCAB-02** | **Học Từ Vựng & Thuật toán Lặp lại FSRS**<br/>(Flashcard đa phương thức, Thuật toán FSRS v5 `scheduleNext`, RPC `apply_srs_review` CAS, Đồng bộ đa lớp) | `Student` | [SRS_02_VOCAB_SRS_FSRS.md](./SRS_02_VOCAB_SRS_FSRS.md) |
| 03 | **UC-ROADMAP-03** | **Lộ trình Học theo Khóa (Journey Tracks)**<br/>(Placement Test `/api/roadmap/placement`, Đa khóa CEFR/TOEIC/THPT, Mở trạm `/api/roadmap/progress`) | `Student` | [SRS_03_ROADMAP_JOURNEY.md](./SRS_03_ROADMAP_JOURNEY.md) |
| 04 | **UC-TOEIC-04** | **Sát Thủ TOEIC Listening & Thi Thử Full Test**<br/>(Client-side Dictation Diff Matcher, Tải đề `/api/toeic/test`, Media Proxy, Giải thích On-Demand `/api/toeic/explain`) | `Student` | [SRS_04_TOEIC_LISTENING_EXAM.md](./SRS_04_TOEIC_LISTENING_EXAM.md) |
| 05 | **UC-AI-05** | **AI Coaching Luyện Nói & Phân tích Câu**<br/>(Hội thoại AI `/api/dictionary/ai-speaking`, Upload ghi âm, Phân tích câu & Golden Sentences `/api/dictionary/ai-sentence`) | `Student` | [SRS_05_AI_COACHING_SKILLS.md](./SRS_05_AI_COACHING_SKILLS.md) |
| 06 | **UC-TEACH-06** | **Quản lý Lớp học & Cổng Giáo viên (B2B)**<br/>(CRUD lớp qua Supabase RLS / Data Proxy, Mã mời `/api/classrooms/join`, Giao bài `/api/teacher/assign-drill`, Thống kê học viên) | `Teacher`, `Student` | [SRS_06_TEACHER_CLASSROOM.md](./SRS_06_TEACHER_CLASSROOM.md) |
| 07 | **UC-BILL-07** | **Thanh toán & Nâng cấp Gói VIP**<br/>(Tạo & tra cứu đơn RESTful `/api/billing/orders`, Xác thực `/api/billing/orders/[id]/confirm`, Webhook HMAC-SHA256 Idempotent) | `User`, `Payment Gateway`, `Admin` | [SRS_07_BILLING_SUBSCRIPTION.md](./SRS_07_BILLING_SUBSCRIPTION.md) |
| 08 | **UC-GAME-08** | **Trò chơi hóa, Chuỗi ngày học & Thử thách**<br/>(RPC `award_xp`, Chuỗi ngày `consecutiveStudyStreak` chuẩn GMT+7, Thử thách `/api/challenges/[id]/*`) | `Student`, `Cron System` | [SRS_08_GAMIFICATION_CHALLENGES.md](./SRS_08_GAMIFICATION_CHALLENGES.md) |
| 09 | **UC-GRAM-09** | **Hệ thống Học & Ôn tập Ngữ pháp Thông minh**<br/>(Lý thuyết & Bài tập 3 dạng `/api/grammar/*`, Sinh bài tập AI cho lớp, Tính chu kỳ FSRS `/api/grammar/progress` & Liên thông Journey) | `Student`, `Teacher` | [SRS_09_GRAMMAR_SYSTEM.md](./SRS_09_GRAMMAR_SYSTEM.md) |
| 10 | **UC-DICT-10** | **Từ điển Thông minh, Quét ảnh OCR & Sơ đồ Tư duy Mindmap**<br/>(Tra từ ngữ cảnh `/api/dictionary/smart-lookup`, Quét ảnh sách Groq Vision `/api/import/ocr`, Mindmap `/api/mindmap/*`, Extension Token) | `Student`, `Teacher`, `Extension` | [SRS_10_DICTIONARY_OCR_MINDMAP.md](./SRS_10_DICTIONARY_OCR_MINDMAP.md) |
| 11 | **UC-READ-11** | **Luyện Đọc Hàng ngày Cá nhân hóa, Thư viện Đọc & CodeMix**<br/>(Sinh bài đọc từ sổ từ `/api/practice/daily-reading/*`, Tra nghĩa tại chỗ `/api/library/gloss`, Đoạn văn Gói từ & CodeMix) | `Student` | [SRS_11_READING_PRACTICE_LIBRARY.md](./SRS_11_READING_PRACTICE_LIBRARY.md) |
| 12 | **UC-EXAM-12** | **Hệ thống Khảo thí Chuẩn hóa: VSTEP, VNU Bậc 3 & THPT**<br/>(Luyện đề chống trùng `/api/vstep/test`, `/api/vnu-bac-3/test`, Chấm điểm Barem B1–C1, AI chấm Writing Rubric 4 tiêu chí, Chống cào đề) | `Student` | [SRS_12_VSTEP_VNU_THPT_EXAMS.md](./SRS_12_VSTEP_VNU_THPT_EXAMS.md) |
| 13 | **UC-SPEAK-13** | **Lộ trình Giao tiếp, Ngữ âm Nền tảng IPA & Thăm dò Chẩn đoán**<br/>(Bảng 44 âm IPA, Speaking Foundation Stage 0–3, Speaking Curriculum Phase 1–3, Thăm dò thích ứng `/api/foundation/diagnostic-probe`) | `Student`, `Teacher` | [SRS_13_SPEAKING_CURRICULUM_FOUNDATION.md](./SRS_13_SPEAKING_CURRICULUM_FOUNDATION.md) |
| 14 | **UC-SOCIAL-14** | **Hệ thống Giới thiệu Đại sứ 5-Tier, Nhóm Học tập Pro & Phòng Tự học**<br/>(Referral Hub & Rút hoa hồng `/api/referral/*`, Chia sẻ ghế Pro `/api/groups/*`, Phòng tự học trực tuyến `/api/hub/presence`) | `User`, `Referrer`, `Group Owner` | [SRS_14_REFERRAL_GROUPS_HUB.md](./SRS_14_REFERRAL_GROUPS_HUB.md) |
| 15 | **UC-ADMIN-15** | **Quản trị Admin CRM, Chiến dịch Marketing & Tác vụ Tự động Cron**<br/>(Phân tích vòng đời khách hàng đa kỹ năng `/api/admin/crm`, Lead Magnet `/api/lead-magnet/*`, FCM Push & Cron `/api/cron/*`) | `Admin`, `Guest`, `Cron Scheduler` | [SRS_15_ADMIN_CRM_CAMPAIGNS_CRON.md](./SRS_15_ADMIN_CRM_CAMPAIGNS_CRON.md) |

---

### Tổng hợp các Điểm hạn chế, Rủi ro Bảo mật & Nút thắt Kiến trúc Trọng yếu Toàn hệ thống

1. **Lỗ hổng Bảo mật, Leo thang Đặc quyền & Chống gian lận (Security, Privilege Escalation & Anti-Cheat Flaws):**
   * **Học sinh lợi dụng lớp ẩn `__personal__` để Hạ quyền Admin xuống `'student'`, Đổi tên và Nghe lén dữ liệu học tập bất kỳ ai (`UC-TEACH-06`):** `POST /api/teacher/students/add` và `GET /api/teacher/student-detail` không kiểm tra `callerProfile.role === 'teacher'` và không chặn `classroom.name === '__personal__'`. Do mọi học sinh đều là `teacher_id` của lớp `__personal__` của chính mình, bất kỳ học sinh nào cũng có thể gọi `/api/teacher/students/add` để ghi đè `role: 'student'` lên tài khoản `admin`, đổi `full_name` của nạn nhân và gọi `/api/teacher/student-detail` để đọc toàn bộ lịch sử học tập và từ vựng riêng tư của nạn nhân.
   * **Mã giảm giá cứng `'WLU'` nâng cấp miễn phí 100% gói Pro/Premium 12 tháng (`UC-BILL-07`):** Hardcode trong `src/lib/billing.ts` (dòng 70, 318–331, 356–369) và `/api/billing/coupons/validate` bỏ qua kiểm tra bảng `coupons` và tự kích hoạt 1 năm VIP miễn phí không qua cổng thanh toán.
   * **Lộ công khai Endpoint Test `POST /api/test/push-due` làm sai lệch dữ liệu `srs_progress` thật & Lộ `GET /api/ai-router/stats` (`UC-ADMIN-15`, `UC-AI-05`):** `/api/test/push-due` thiếu chốt chặn `ALLOW_TEST_ROUTES` và quyền Admin, cho phép user bất kỳ ghi đè `next_review_date` trong `srs_progress`.
   * **Open Redirect & Bỏ qua chặn `.svg` trong `GET /api/image-proxy` (`UC-DICT-10`):** Các URL thuộc `directHosts` (`*.r2.dev`, `*.supabase.co`, ...) được `302 Redirect` ở dòng 159 trước khi gọi `assertSafeImageUrl(url)` ở dòng 170.
   * **Backdoor công khai `?unban=1` và Lộ toàn bộ 200 đáp án qua `POST /api/toeic/submit` (`UC-TOEIC-04` & `UC-EXAM-12`):** Tham số `?unban=1` trên các route `/api/toeic/*`, `/api/vstep/*`, `/api/vnu-bac-3/*` cho phép bot tự gỡ cờ chặn; `POST /api/toeic/submit` không kiểm tra `sessionToken` và trả về toàn bộ 200 câu kèm đáp án đúng + lời giải; `POST /api/vnu-bac-3/submit` bỏ qua kiểm tra HMAC nếu không truyền `sessionToken`.
   * **Thiếu kiểm tra Đăng nhập (Auth) và Rate Limit trên API chấm viết AI (`UC-EXAM-12`):** `POST /api/vstep/writing-eval` và `POST /api/vnu-bac-3/writing-eval` cho phép gọi nặc danh không giới hạn.
   * **Thiếu chặn quyền Pro trên các khóa `toeic` / `thpt` và Lộ đáp án/Cày XP vô hạn ở Roadmap & Listening (`UC-ROADMAP-03`, `UC-TOEIC-04`):** `checkRoadmapLevelAccess` chỉ chặn khi `track === 'cefr'`; `GET /api/roadmap/checkpoint` lộ sẵn đáp án đúng trong JSON; `POST /api/roadmap/progress` và `POST /api/listening/complete` cho phép gọi lặp lại để cày XP vô hạn.
2. **Lỗi Logic Nghiệp vụ Nghiêm trọng (Critical Business Logic Bugs):**
   * **Nhiễm bẩn từ vựng cá nhân sang toàn bộ Lớp học của Giáo viên & Bỏ sót chiều Lớp $\rightarrow$ Cá nhân (`UC-VOCAB-02`):** Hàm `mirrorSrsProgress` (`src/app/api/words/srs/route.ts`, dòng 47–162) tự động chèn bất kỳ từ cá nhân nào học viên vừa ôn vào tất cả các lớp mà học viên đó tham gia với `added_by: classTeacherId`, nhưng lại không tự tạo từ trong `__personal__` khi học viên ôn từ của lớp học.
   * **Lỗi Kép làm gãy hoàn toàn thanh toán Thử thách (Challenge) & Cắt cụt thời hạn khi gia hạn sớm Nhóm (`UC-BILL-07`, `UC-GAME-08`, `UC-SOCIAL-14`):** RPC `confirm_paid_order` ném ngoại lệ `Unsupported order kind: challenge` và `POST /api/challenges/[id]/join` quên gán `order_id` vào `challenge_participants`; đồng thời khi gia hạn nhóm đang hoạt động, `confirm_paid_order` tính hạn mới từ `NOW()` thay vì cộng nối tiếp vào `expires_at` hiện hành.
   * **Chặn nhầm Admin tạo/sửa Thử thách (`UC-GAME-08`):** `POST /api/challenges` và `PATCH /api/challenges/[id]` kiểm tra cứng `role !== 'teacher'`, chặn cả `admin`.
   * **Mất tiến độ học Ngữ pháp do lưu tạm trên RAM & Bỏ sót liên thông Ngữ pháp sang khóa `toeic` (`UC-GRAM-09`, `UC-ROADMAP-03`):** Tiến độ bài ngữ pháp chưa có UUID và hàng đợi câu sai (`grammar:topic_progress`, `grammar:review_queue`) lưu trên `ttl-cache` nội bộ bị xóa sạch khi restart server; `creditGrammarLessonToRoadmap` ánh xạ nhầm `toeic` thành `cefr`.
   * **Thiếu endpoint `/api/speaking/stt-whisper` và trả về URL ghi âm giả `isMock: true` (`UC-AI-05`, `UC-SPEAK-13`):** `WhisperProvider` gọi tới `/api/speaking/stt-whisper` không tồn tại và rơi về `MOCK_FALLBACK_TRANSCRIPTS`; `/api/speaking/upload-audio` trả về HTTP 200 kèm URL giả khi lỗi Storage.
3. **Nút thắt Hiệu năng & Độ tin cậy (Performance & Reliability Bottlenecks):**
   * **6 vòng gọi mạng tuần tự và Timeout cứng 1500ms trên Upstash Redis trong `verifiedAppSession` (`UC-AUTH-01`):** Gây lỗi `503` hàng loạt khi mạng tới Redis biến động nhẹ, kèm vòng lặp spin-wait 20x100ms khi làm mới token đồng thời.
   * **Quét toàn bảng `auth.users` ($O(N)$) trong `POST /api/teacher/students/add` (`UC-TEACH-06`)**, **5 truy vấn DB tuần tự trên mỗi câu trả lời trong `recordLexicalEvidenceEvent` (`UC-SPEAK-13`)**, và **tiến trình con Python `notebooklm-cli` 240s dùng chung 1 Notebook toàn cục trong `/api/mindmap/nlm` (`UC-DICT-10`)**.
   * **Cronjob `/api/cron/email-due` không lưu `last_due_email_at` gây gửi trùng email & $5N+1$ truy vấn (`UC-ADMIN-15`)**, và **`/api/cron/check-expired` hạ cấp tuần tự từng dòng mà bỏ sót việc đóng các nhóm `groups` đã hết hạn**.

---
*Tài liệu được phân tích, vẽ sơ đồ và đặc tả trực tiếp từ toàn bộ mã nguồn đang chạy (`src/app/`, `src/app/api/`, `src/lib/`) của dự án.*
