# Tổng hợp Tài liệu Đặc tả Ca sử dụng (Use Case & SRS) - Hệ thống LingoPro

Thư mục này chứa toàn bộ các tài liệu đặc tả chức năng theo cấu trúc chuẩn **Use Case Specification** cho từng phân hệ trong hệ thống **LingoPro (Vocab)**. 

Mỗi tài liệu được chuẩn hóa bao gồm các mục:
1. **Thông tin chung**: Actor / Role thực hiện, Tiền điều kiện (Pre-conditions), Hậu điều kiện (Post-conditions).
2. **Danh sách API liên quan**: Phương thức (Method), Endpoint URL, Chức năng và Quyền hạn truy cập.
3. **Kịch bản chính (Main Flow - Step-by-Step)**: Mô tả chi tiết từng bước tương tác giữa Người dùng (Actor), Giao diện (Frontend), Xử lý máy chủ (Backend/AI) và Cơ sở dữ liệu (Supabase DB).
4. **Kịch bản ngoại lệ (Alternative & Exception Flows)**: Dự phòng lỗi mạng, sai quyền hạn, hết lượt quota, chống gian lận, fallback an toàn.

---

### Danh mục các tài liệu Use Case chi tiết:

| STT | Mã Use Case | Tên tính năng | Actor / Role | Tệp đặc tả |
|:---:|---|---|---|---|
| 01 | **UC-AUTH-01** | **Xác thực & Quản lý Phiên**<br/>(Đăng nhập Email/Pass, OAuth Google, HttpOnly Cookie BFF, Offline-First Session) | `Guest`, `User` | [SRS_01_AUTH_SESSION.md](./SRS_01_AUTH_SESSION.md) |
| 02 | **UC-VOCAB-02** | **Học Từ Vựng & Thuật toán Lặp lại FSRS**<br/>(Flashcard đa phương thức, Thuật toán FSRS tính chu kỳ ôn tập, Hàng đợi Review) | `Student` | [SRS_02_VOCAB_SRS_FSRS.md](./SRS_02_VOCAB_SRS_FSRS.md) |
| 03 | **UC-ROADMAP-03** | **Lộ trình Học theo Khóa (Journey Tracks)**<br/>(Placement Test xếp lớp, Đa khóa CEFR/TOEIC/THPT, Mở khóa trạm Unit) | `Student` | [SRS_03_ROADMAP_JOURNEY.md](./SRS_03_ROADMAP_JOURNEY.md) |
| 04 | **UC-TOEIC-04** | **Sát Thủ TOEIC Listening & Thi Thử Full Test**<br/>(Nghe chép chính tả Part 1-4, Barem điểm 495, Bấm giờ 120 phút, Chống cào đề) | `Student` | [SRS_04_TOEIC_LISTENING_EXAM.md](./SRS_04_TOEIC_LISTENING_EXAM.md) |
| 05 | **UC-AI-05** | **AI Coaching Luyện Nói & Viết**<br/>(Chấm phát âm bằng giọng nói, Chữa bài luận, Đề xuất Golden Sentences, Quản lý Quota) | `Student` | [SRS_05_AI_COACHING_SKILLS.md](./SRS_05_AI_COACHING_SKILLS.md) |
| 06 | **UC-TEACH-06** | **Quản lý Lớp học & Cổng Giáo viên (B2B)**<br/>(Tạo lớp, Cấp mã Invite Code, Giao bài tập về nhà theo Deadline, Bảng điểm) | `Teacher`, `Student` | [SRS_06_TEACHER_CLASSROOM.md](./SRS_06_TEACHER_CLASSROOM.md) |
| 07 | **UC-BILL-07** | **Thanh toán & Nâng cấp Gói VIP**<br/>(Tạo mã VietQR tự động, Xác thực Webhook chữ ký số an toàn Idempotent, Mở khóa Pro) | `User`, `Payment Gateway` | [SRS_07_BILLING_SUBSCRIPTION.md](./SRS_07_BILLING_SUBSCRIPTION.md) |
| 08 | **UC-GAME-08** | **Trò chơi hóa, Chuỗi ngày học & Thử thách**<br/>(Chuỗi ngày Streak ngọn lửa, Điểm kinh nghiệm XP, Thử thách học tập, Bảng xếp hạng) | `Student` | [SRS_08_GAMIFICATION_CHALLENGES.md](./SRS_08_GAMIFICATION_CHALLENGES.md) |

---
*Tài liệu được sinh và chuẩn hóa trực tiếp theo cấu trúc mã nguồn, API route handlers và cơ sở dữ liệu thực tế của dự án.*
