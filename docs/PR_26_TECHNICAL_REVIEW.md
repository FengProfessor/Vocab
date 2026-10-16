# BÁO CÁO ĐÁNH GIÁ KỸ THUẬT (TECHNICAL REVIEW REPORT)
**Đối tượng:** Pull Request [#26 - add  srs](https://github.com/FengProfessor/Vocab/pull/26)  
**Nhánh nguồn:** `srs-additional` $\rightarrow$ **Nhánh đích:** `main`  
**Mục tiêu rà soát:** Tính toàn vẹn kiến trúc, mức độ tương thích giữa tài liệu đặc tả (SRS) và mã nguồn thực thi (Codebase Execution & Route Handlers), tính nhất quán Single Source of Truth (SSOT).

---

## 1. TỔNG QUAN ĐÁNH GIÁ

Bộ tài liệu Use Case Specification được bổ sung tại thư mục `agent/docs/` (gồm 9 tệp tin Markdown, 1.156 dòng) có chất lượng chuyên môn cao, nắm bắt chính xác các nguyên lý cốt lõi của hệ thống LingoPro:
* Kiến trúc xác thực bảo mật BFF (Backend-for-Frontend) với HttpOnly Cookie.
* Thuật toán ngắt quãng FSRS (Free Spaced Repetition Scheduler).
* Cơ chế liên thông tín chỉ đa lộ trình (Multi-track Credit Pipeline).
* Chiến lược bảo vệ đề thi Active Cyber Defense (chống cào dữ liệu, giải thích on-demand).
* Cơ chế đối soát chữ ký số Webhook HMAC-SHA256 Idempotent cho cổng VietQR.
* Chuẩn hóa múi giờ xử lý Streak (`Asia/Ho_Chi_Minh`).

Tuy nhiên, trong quá trình đối soát chi tiết với các file thực thi trong `src/app/api/` và `src/lib/`, phát hiện một số điểm **lệch danh pháp (Naming Discrepancy)** và **ước lệ hóa luồng xử lý**. Cần chuẩn hóa các điểm này để tài liệu phản ánh chính xác 100% hiện trạng hệ thống trước khi sáp nhập (merge) vào nhánh `main`.

---

## 2. BẢNG ĐỐI CHIẾU ENDPOINT & KIẾN TRÚC THỰC TẾ

| Mã SRS | Tên phân hệ | Endpoint trong tài liệu | Endpoint / Triển khai thực tế | Trạng thái |
|---|---|---|---|:---:|
| **SRS_03** | Roadmap Journey | `POST /api/roadmap/enroll` | `POST /api/roadmap/placement` | ⚠️ Cần sửa |
| **SRS_03** | Roadmap Journey | `POST /api/roadmap/step-complete` | `POST /api/roadmap/progress` | ⚠️ Cần sửa |
| **SRS_04** | TOEIC Exam | `GET /api/toeic?testId=...` | `GET /api/toeic/test?id=...` | ⚠️ Cần sửa |
| **SRS_04** | TOEIC Exam | `GET /api/listening/stream` | `GET /api/toeic/media/proxy?src=...` | ⚠️ Cần sửa |
| **SRS_04** | TOEIC Exam | `POST /api/listening/dictation-check` | *Xử lý Client-side* (`listening-utils.ts`) | ⚠️ Cần sửa |
| **SRS_04** | TOEIC Exam | *(Chưa liệt kê)* | `POST /api/toeic/explain` | ➕ Cần bổ sung |
| **SRS_05** | AI Coaching | `POST /api/speaking` | `POST /api/dictionary/ai-speaking`<br/>`POST /api/speaking/upload-audio` | ⚠️ Cần sửa |
| **SRS_05** | AI Coaching | `POST /api/ai-router` (Chữa bài/Golden) | `POST /api/dictionary/ai-sentence` | ⚠️ Cần sửa |
| **SRS_06** | Teacher Classroom | `POST /api/classrooms`<br/>`DELETE /api/classrooms` | *Supabase Client RLS / Proxy*<br/>(`/api/auth/data/classrooms`) | ⚠️ Cần làm rõ |
| **SRS_06** | Teacher Classroom | `POST /api/teacher/assignments` | `POST /api/teacher/assign-drill` | ⚠️ Cần sửa |
| **SRS_06** | Teacher Classroom | `GET /api/teacher/classrooms/[id]/students` | `GET /api/teacher/student-detail`<br/>`GET /api/classrooms/[id]/leaderboard` | ⚠️ Cần sửa |
| **SRS_07** | Billing | `POST /api/billing/order`<br/>`GET /api/billing/order-status` | `POST /api/billing/orders`<br/>`GET /api/billing/orders` (REST plural) | ⚠️ Cần sửa |
| **SRS_08** | Gamification | `/api/challenge/join`<br/>`/api/challenge/log`<br/>`/api/challenge/leaderboard` | `/api/challenges/[id]/join`<br/>`/api/challenges/[id]/progress`<br/>`/api/challenges/[id]/participants` | ⚠️ Cần sửa |

---

## 3. CHI TIẾT CÁC ĐIỂM CẦN ĐIỀU CHỈNH THEO TỪNG FILE

### 3.1. `agent/docs/SRS_03_ROADMAP_JOURNEY.md` (UC-ROADMAP-03)
1. **Endpoint Ghi danh (Enrollment):**
   * *Hiện tại trong SRS:* `POST /api/roadmap/enroll`
   * *Thực tế codebase:* Tuyến `src/app/api/roadmap/placement/route.ts` xử lý cả 2 trường hợp:
     * Nộp bài test xếp lớp: `{ track: 'cefr', answers: Record<string, string> }`
     * Tự chọn cấp xuất phát: `{ track: 'thpt' | 'toeic' | 'cefr', selfSelect: string }`
   * *Yêu cầu:* Cập nhật bảng API và Sơ đồ tuần tự (Sequence Diagram) từ `/api/roadmap/enroll` thành `/api/roadmap/placement`.

2. **Endpoint Hoàn thành trạm (Step Completion):**
   * *Hiện tại trong SRS:* `POST /api/roadmap/step-complete`
   * *Thực tế codebase:* Tuyến `src/app/api/roadmap/progress/route.ts` tiếp nhận payload `{ stepId: string, score?: number }`, thực hiện kiểm tra `score >= 80` đối với checkpoint và cập nhật `user_roadmap_steps`.
   * *Yêu cầu:* Thay thế thành `POST /api/roadmap/progress`.

---

### 3.2. `agent/docs/SRS_04_TOEIC_LISTENING_EXAM.md` (UC-TOEIC-04)
1. **Endpoint Tải đề thi:**
   * *Hiện tại trong SRS:* `GET /api/toeic?testId=...`
   * *Thực tế codebase:* Tuyến xử lý là `src/app/api/toeic/test/route.ts` (`GET /api/toeic/test?id=...`).
2. **Audio Streaming Media Proxy:**
   * *Hiện tại trong SRS:* `GET /api/listening/stream?id=...&token=...`
   * *Thực tế codebase:* Tuyến proxy bảo vệ bản quyền audio nằm tại `src/app/api/toeic/media/proxy/route.ts` (`GET /api/toeic/media/proxy?src=...`).
3. **Phân định cơ chế Dictation Check:**
   * *Hiện tại trong SRS:* Liệt kê `POST /api/listening/dictation-check`.
   * *Thực tế codebase:* Hoạt động so khớp ký tự, chuẩn hóa chuỗi và tính toán sai khác (Diff Matcher) được thực thi hoàn toàn tại Client (`src/lib/listening-utils.ts`), không phát sinh request chấm điểm về server. Kết quả chỉ được đồng bộ qua lịch sử học tập.
4. **Bổ sung API giải thích chi tiết:**
   * Bổ sung `POST /api/toeic/explain` vào bảng danh mục API (phục vụ hiển thị giải thích bẫy đề thi theo phương thức On-Demand nhằm chống trích xuất dữ liệu hàng loạt).

---

### 3.3. `agent/docs/SRS_05_AI_COACHING_SKILLS.md` (UC-AI-05)
1. **Đặc tả AI Speaking Coach:**
   * *Hiện tại trong SRS:* `POST /api/speaking`
   * *Thực tế codebase:* API đánh giá ngữ âm đang hoạt động tại `src/app/api/dictionary/ai-speaking/route.ts` (`POST /api/dictionary/ai-speaking`). Riêng việc upload file ghi âm phụ thuộc vào `src/app/api/speaking/upload-audio/route.ts`.
2. **Đặc tả AI Writing & Golden Sentences:**
   * *Hiện tại trong SRS:* `POST /api/ai-router`
   * *Thực tế codebase:* Module sinh "Câu văn vàng" (Golden Sentences) và sửa bài viết được tích hợp tại `src/app/api/dictionary/ai-sentence/route.ts` (`POST /api/dictionary/ai-sentence`), sử dụng hàm `matchGoldenSentence` (`src/lib/ai-sentence-golden.ts`). Tuyến `/api/ai-router` hiện chỉ đóng vai trò thống kê (`/api/ai-router/stats`).

---

### 3.4. `agent/docs/SRS_06_TEACHER_CLASSROOM.md` (UC-TEACH-06)
1. **Cơ chế CRUD Lớp học:**
   * *Hiện tại trong SRS:* `POST /api/classrooms` và `DELETE /api/classrooms`.
   * *Thực tế codebase:* Chưa có dedicated API route `/api/classrooms/route.ts`. Hoạt động tạo/xóa lớp của giáo viên hiện được điều hướng qua Supabase Client trực tiếp (áp dụng Row-Level Security) hoặc Data Proxy `/api/auth/data/classrooms`.
2. **Giao bài tập & Xem chi tiết:**
   * *Giao bài:* Cập nhật từ `POST /api/teacher/assignments` thành `POST /api/teacher/assign-drill`.
   * *Thống kê học sinh:* Cập nhật từ `GET /api/teacher/classrooms/[id]/students` thành `GET /api/teacher/student-detail` và `GET /api/classrooms/[id]/leaderboard`.

---

### 3.5. `agent/docs/SRS_07_BILLING_SUBSCRIPTION.md` (UC-BILL-07)
1. **Chuẩn hóa danh pháp RESTful:**
   * *Hiện tại trong SRS:* `POST /api/billing/order` và `GET /api/billing/order-status`.
   * *Thực tế codebase:* Tuân thủ chuẩn số nhiều:
     * Tạo đơn và lấy danh sách: `POST /api/billing/orders` và `GET /api/billing/orders`.
     * Xác thực thanh toán dự phòng: `POST /api/billing/orders/[id]/confirm`.

---

### 3.6. `agent/docs/SRS_08_GAMIFICATION_CHALLENGES.md` (UC-GAME-08)
1. **Chuẩn hóa API Thử thách (Challenges):**
   * *Hiện tại trong SRS:* `/api/challenge/join`, `/api/challenge/log`, `/api/challenge/leaderboard`.
   * *Thực tế codebase:*
     * Tham gia thử thách: `POST /api/challenges/[id]/join`
     * Cập nhật tiến độ: `POST /api/challenges/[id]/progress`
     * Danh sách bảng xếp hạng: `GET /api/challenges/[id]/participants`
     * Danh sách sự kiện: `GET /api/challenges`
2. **Cơ chế ghi nhận Streak & XP trong Database:**
   * *Hiện tại trong SRS:* Mô tả câu lệnh `UPDATE profiles SET streak_count = ..., xp = ...`.
   * *Thực tế codebase:* Thao tác cộng điểm kinh nghiệm và xác nhận chuỗi ngày được đóng gói qua Supabase Stored Procedure (RPC) `award_xp`, kết hợp hàm tính chuỗi hồi quy `consecutiveStudyStreak` trên dữ liệu `dailyActivity` nhằm ngăn chặn race condition và gian lận từ phía client.

---

## 4. QUY CHUẨN COMMIT & QUẢN TRỊ MÃ NGUỒN

* **Tiêu đề PR & Commit Message:**
  * Tiêu đề hiện tại: `"add  srs"` (thừa khoảng trắng, chưa tuân thủ quy ước).
  * Tiêu đề đề xuất cập nhật theo chuẩn Conventional Commits:
    `docs(srs): add comprehensive use case and SRS specifications for core modules`

---

## 5. KẾT LUẬN & ĐỀ XUẤT HÀNH ĐỘNG

1. **Đánh giá chung:** PR đáp ứng tốt mục tiêu tài liệu hóa hệ thống, nội dung mạch lạc, sơ đồ trực quan.
2. **Yêu cầu:** Đề nghị cập nhật lại các endpoint và luồng thực thi theo danh sách tại **Mục 2 và Mục 3**.
3. **Phê duyệt:** Sẵn sàng merge vào `main` ngay sau khi các điểm kỹ thuật trên được hiệu chỉnh đồng bộ.
