# LingoPro Degrading-Reward Challenge
# VẬN HÀNH TỰ ĐỘNG HÓA TOÀN DIỆN & QUY TRÌNH VẬN HÀNH CỘNG ĐỒNG
### Automated Operational Workflow & Zero-Touch Community Operations Blueprint
**Tài liệu mã số:** `DOC-CAMPAIGN-04` | **Phiên bản:** `1.0.0-PROD` | **Ngày hiệu lực:** `2026-09-14`  
**Chủ nhiệm thiết kế:** Systems Automation & Community Operations Architect  
**Mục tiêu vận hành:** Founder dành **< 15 phút/tuần** cho toàn bộ công tác kiểm soát, vận hành và chi trả thưởng.

---

## MỤC LỤC

1. [TỔNG QUAN CHIẾN LƯỢC & NGUYÊN TẮC "ZERO-TOUCH"](#1-tổng-quan-chiến-lược--nguyên-tắc-zero-touch)
2. [SƠ ĐỒ KIẾN TRÚC HỆ THỐNG ĐẦU-CUỐI (END-TO-END SYSTEM ARCHITECTURE)](#2-sơ-đồ-kiến-trúc-hệ-thống-đầu-cuối-end-to-end-system-architecture)
3. [THANH TOÁN TỰ ĐỘNG & ONBOARDING TỨC THÌ (INSTANT ONBOARDING ENGINE)](#3-thanh-toán-tự-động--onboarding-tức-thì-instant-onboarding-engine)
   - 3.1. Luồng xử lý VietQR & Webhook SePay (Idempotent Payment Pipeline)
   - 3.2. Hệ thống tin nhắn giao dịch đa kênh (Zalo ZNS -> Email Resend -> SMS)
   - 3.3. Cấp phát Dynamic Magic Link & Link mời Zalo VIP/Discord dùng 1 lần
4. [CHALLENGE ENGINE & HỆ THỐNG CRON QUÉT ĐIỂM DANH HÀNG NGÀY](#4-challenge-engine--hệ-thống-cron-quét-điểm-danh-hàng-ngày)
   - 4.1. Bộ tiêu chuẩn định lượng "Completed Day" (Pedagogic Daily Criteria)
   - 4.2. Lịch trình 4 tầng Cron tự động (08:00 -> 20:00 -> 22:30 -> 00:01)
   - 4.3. Degrading Reward Engine & Máy trạng thái suy giảm phần thưởng
5. [TỰ ĐỘNG HÓA CỘNG ĐỒNG (COMMUNITY AUTOMATION: ZALO VIP & DISCORD)](#5-tự-động-hóa-cộng-đồng-community-automation-zalo-vip--discord)
   - 5.1. Kịch bản Bot & Bộ kích hoạt sự kiện thời gian thực (Triggers)
   - 5.2. Bảng xếp hạng trực quan: "Safe Zone" vs "Danger Zone"
   - 5.3. Cơ chế cứu vớt "Phút 89" & Nudge đồng đội (Peer Accountability)
6. [TỰ ĐỘNG HÓA TRẢ THƯỞNG CUỐI KỲ & GIA HẠN GÓI PRO (END-OF-COHORT PAYOUT)](#6-tự-động-hóa-trả-thưởng-cuối-kỳ--gia-hạn-gói-pro-end-of-cohort-payout)
   - 6.1. Quy trình Batch Payout: SePay Payout API & 1-Click VietQR CSV
   - 6.2. Atomic Update gói Pro trên Supabase Database
   - 6.3. Hệ thống tạo Chứng chỉ Tốt nghiệp Động & Huy hiệu "Survivor"
7. [DASHBOARD QUẢN TRỊ NGOẠI LỆ & BỘ MACRO XỬ LÝ SỰ CỐ (EXCEPTION HANDLING)](#7-dashboard-quản-trị-ngoại-lệ--bộ-macro-xử-lý-sự-cố-exception-handling)
   - 7.1. Bot cảnh báo ngoại lệ Telegram cho Founder (@LingoProOpsBot)
   - 7.2. Bộ Macro mẫu phản hồi nhanh cho 5 kịch bản ngoại lệ
8. [QUY TRÌNH 15 PHÚT/TUẦN DÀNH CHO FOUNDER (WEEKLY SOP RUNBOOK)](#8-quy-trình-15-phúttuần-dành-cho-founder-weekly-sop-runbook)
9. [THIẾT KẾ CƠ SỞ DỮ LIỆU & CODE TRIỂN KHAI THỰC TẾ (CODE ARTIFACTS)](#9-thiết-kế-cơ-sở-dữ-liệu--code-triển-khai-thực-tế-code-artifacts)

---

## 1. TỔNG QUAN CHIẾN LƯỢC & NGUYÊN TẮC "ZERO-TOUCH"

### 1.1. Bối cảnh & Cơ chế Thử thách Thuyên giảm Phần thưởng (Degrading Reward Challenge)
LingoPro triển khai mô hình thử thách kỷ luật học tập tiếng Anh với cơ chế tâm lý **Loss Aversion (Tâm lý ghét mất mát)** mang tính đột phá trên thị trường EdTech Việt Nam:
- **Tier 1 (Thử thách 3 tháng - Phí cam kết 300.000 VNĐ):**
  - **Phần thưởng tối đa (0 lần miss):** Hoàn lại **100.000 VNĐ tiền mặt** + Tặng thêm **6 tháng Pro** (Tổng Pro sở hữu = 3 tháng ban đầu + 6 tháng thưởng = 9 tháng Pro).
  - **Mỗi lần miss tiêu chuẩn ngày:** Bị trừ **33.333 VNĐ tiền thưởng mặt** và **1 tháng Pro thưởng**.
  - **Mức sàn bảo hiểm (Floor - từ 3 lần miss trở lên):** Nhận **0 VNĐ tiền mặt** + Giữ nguyên **3 tháng Pro** theo đúng gói học viên đã thanh toán. Không bao giờ bị trừ xuống dưới 3 tháng Pro.
- **Tier 2 (Thử thách 6 tháng - Phí cam kết 500.000 VNĐ):**
  - **Phần thưởng tối đa (0 lần miss):** Hoàn lại **200.000 VNĐ tiền mặt** + Tặng thêm **12 tháng Pro** (Tổng Pro sở hữu = 6 tháng ban đầu + 12 tháng thưởng = 18 tháng Pro).
  - **Mỗi lần miss tiêu chuẩn ngày:** Bị trừ **33.333 VNĐ tiền thưởng mặt** và **1 tháng Pro thưởng**.
  - **Mức sàn bảo hiểm (Floor - từ 6 lần miss trở lên):** Nhận **0 VNĐ tiền mặt** + Giữ nguyên **6 tháng Pro** gốc.

### 1.2. Triết lý Vận hành "Zero-Touch" (< 15 phút/tuần)
Để một solo-founder hoặc đội ngũ tinh gọn có thể vận hành các cohort từ 100 đến 1.000 học viên mà không bị quá tải:
1. **Idempotent Automation (Tự động hóa bất biến):** Mọi sự kiện từ thanh toán, kích hoạt tài khoản, điểm danh, trừ phạt đến gia hạn thuê bao đều được điều khiển bởi state-machine và webhook, có khả năng tự phục hồi (self-healing), thử lại khi lỗi và loại trừ trùng lặp (deduplication).
2. **Management by Exception (Quản trị theo ngoại lệ):** Hệ thống hoạt động hoàn toàn tự động ở trạng thái bình thường (Happy Path = 99.2% giao dịch). Founder chỉ nhận thông báo và can thiệp khi có **Ngoại lệ kỹ thuật** (sai số tiền, sai cú pháp chuyển khoản, yêu cầu đóng băng y tế khẩn cấp).
3. **Automated Social Peer Pressure (Áp lực đồng đẳng tự động):** Thay vì nhân viên CSKH phải đi giục giã từng học viên, bot cộng đồng tự động phân loại thành viên vào **Vùng An Toàn (Safe Zone)** và **Vùng Nguy Hiểm (Danger Zone)**, kích hoạt cơ chế đồng đội tự nhắc nhở nhau.

---

## 2. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG ĐẦU-CUỐI (END-TO-END SYSTEM ARCHITECTURE)

### 2.1. Sơ đồ dòng dữ liệu và trạng thái (System Dataflow Diagram)

```
+---------------------------------------------------------------------------------------------------+
|                                      NGƯỜI DÙNG / HỌC VIÊN                                        |
+---------------------------------------------------------------------------------------------------+
       |                                       ^                                       ^
       | 1. Điền Form & Chọn Tier              | 5. Nhận ZNS / Email                   | 9. Push Notif
       v                                       |    Welcome Pack + Link VIP            |    & Báo cáo
+-------------------+                          |                                       |
|  LANDING PAGE /   |                          |                                       |
| CHECKOUT (Next.js)|                          |                                       |
+-------------------+                          |                                       |
       | 2. Tạo Order UUID                     |                                       |
       v                                       |                                       |
+-------------------+                          |                                       |
|  VIETQR (SePay)   |                          |                                       |
| STK MB 0949317036 |                          |                                       |
| Memo: LINGOPRO xxx|                          |                                       |
+-------------------+                          |                                       |
       | 3. Chuyển khoản                       |                                       |
       v                                       |                                       |
+-------------------+                          |                                       |
| MB BANK -> SEPAY  |                          |                                       |
+-------------------+                          |                                       |
       | 4. POST Webhook                       |                                       |
       v                                       |                                       |
+-------------------------------------------------------------+                        |
| API GATEWAY: /api/billing/webhook (Next.js Node.js Server) |                        |
| - Verify API Key / Token                                    |                        |
| - Match Regex `LINGOPRO [A-Fa-f0-9]{8}`                     |                        |
| - Verify Exact Amount (300.000 / 500.000)                   |                        |
| - Atomic DB Insert (payment_webhook_events)                 |                        |
+-------------------------------------------------------------+                        |
       |                                                                               |
       +-------------------------------+-------------------------------+               |
       | A. Cập nhật trạng thái Order  | B. Khởi tạo Challenge         | C. Gửi Tin    |
       v                               v                               v               |
+-------------------+         +-----------------------+      +-----------------------+ |
|   public.orders   |         | challenge_participants|      | NOTIFICATION WORKER   | |
| status: 'paid'    |         | status: 'active'      |      | - Zalo ZNS Template   | |
| payment_ref: txId |         | remaining_cash: 100k  |      | - Resend Email API    | |
+-------------------+         | remaining_pro_mo: 6   |      | - Dynamic Magic Link  | |
                              | miss_count: 0         |      | - One-Time VIP Invite | |
                              +-----------------------+      +-----------------------+ |
                                          |                                            |
==========================================|============================================|=============
                            CHALLENGE ENGINE RUNTIME (DAILY CRONS)                     |
==========================================|============================================|=============
                                          v                                            |
                        +------------------------------------+                         |
                        |      CHALLENGE CRON SCHEDULER      |                         |
                        | (Upstash QStash / Vercel Cron UTC) |                         |
                        +------------------------------------+                         |
                                          |                                            |
         +--------------------------------+--------------------------------+           |
         | 08:00 AM VN                    | 20:00 PM VN                    | 22:30 PM  | 00:01 AM VN
         v                                v                                v           v
+------------------+             +------------------+             +-------------+ +-----------------+
| MORNING KICKOFF  |             | GENTLE REMINDER  |             | COUNTDOWN   | | PENALTY TALLY   |
| - Push Notif App |             | - Push + Zalo ZNS|             | - SMS Urgent| | - Atomic DB Deduct|
| - Discord / Zalo |             | - Filter:        |             | - "Mất 33k  | | - miss_count += 1|
|   Quote + Target |             |   criteria_met=F |             |    sau 90p!"| | - cash -= 33.3k |
+------------------+             +------------------+             +-------------+ | - pro_mo -= 1   |
                                                                                  | - Sync Leaderbd |
                                                                                  +-----------------+
                                                                                           |
                                                                                           v
                                                                                  +-----------------+
                                                                                  | END OF COHORT   |
                                                                                  | - SePay Payout  |
                                                                                  | - Pro Extension |
                                                                                  | - Survivor Cert |
                                                                                  +-----------------+
```

---

## 3. THANH TOÁN TỰ ĐỘNG & ONBOARDING TỨC THÌ (INSTANT ONBOARDING ENGINE)

### 3.1. Luồng xử lý VietQR & Webhook SePay (Idempotent Payment Pipeline)
Toàn bộ quá trình đối soát dòng tiền diễn ra theo thời gian thực (dưới 2 giây kể từ khi học viên chuyển khoản thành công):

1. **Hiển thị VietQR Động:**
   - Khi học viên bấm đăng ký gói Thử thách trên giao diện web (`/challenge/register`), frontend gọi `POST /api/challenges/orders` để tạo một bản ghi `orders` với `order_kind = 'challenge'`.
   - Hệ thống sinh mã tham chiếu chuyển khoản chuẩn mực: `LINGOPRO <8 ký tự HEX đầu của Order ID>` (Ví dụ: `LINGOPRO A1B2C3D4`).
   - Tạo mã VietQR trực quan thông qua link ảnh chuẩn Napas:
     `https://img.vietqr.io/image/MB-0949317036-compact2.png?amount=300000&addInfo=LINGOPRO%20A1B2C3D4&accountName=LINGOPRO`
2. **Bắt & Khử trùng lặp Webhook (Deduplication & Idempotency):**
   - SePay bắt biến động số dư tài khoản MB Bank và bắn HTTP POST tới:
     `https://lingopro.online/api/billing/webhook`
   - Xác thực chữ ký / API Key qua header `Authorization: Apikey <WEBHOOK_SECRET>`.
   - Bóc tách nội dung giao dịch bằng Regex:
     `const match = desc.match(/LINGOPRO[\s._-]*([A-Fa-f0-9]{8})/i);`
   - Khóa bản ghi sự kiện `payment_webhook_events` theo `event_key = payref:<referenceCode>` hoặc SHA-256 hash của giao dịch. Nếu trạng thái sự kiện đã là `processed`, trả về HTTP 200 ngay lập tức mà không thực hiện lại logic nghiệp vụ.
3. **Đối soát số tiền nghiêm ngặt (Strict Amount Verification):**
   - Hệ thống kiểm tra số tiền thực nhận (`txAmount`) với số tiền của đơn hàng (`orderAmount`):
     - Đối với Tier 1: Chính xác `300.000 VNĐ`.
     - Đối với Tier 2: Chính xác `500.000 VNĐ`.
   - Nếu số tiền chênh lệch (dù chỉ 1.000 VNĐ do học viên tự ý nhập sai): Đánh dấu sự kiện `status = 'ignored'`, log lỗi `amount_mismatch`, đồng thời đẩy ngay một cảnh báo khẩn cấp lên kênh Telegram của Founder.

### 3.2. Hệ thống tin nhắn giao dịch đa kênh (Zalo ZNS -> Email Resend -> SMS)
Ngay khi giao dịch được xác thực tự động, hệ thống khởi động quy trình gửi tin nhắn chào mừng (Welcome Pack) tự động theo mô hình thác đổ (Cascade Delivery):

```
+---------------------------------------------------------------------------------+
|                       CASCADE TRANSACTIONAL MESSAGING                           |
+---------------------------------------------------------------------------------+
               |
               v
  [1. Ưu tiên: Zalo ZNS (Zalo Notification Service)] -> Tỷ lệ đọc 95%, chi phí ~300đ/tin
               |
               +---> Nếu thất bại / Không có số Zalo (Error code != 0)
               v
  [2. Bổ trợ: Email HTML động qua Resend API] -> Miễn phí/Cực rẻ, gửi tài liệu chi tiết
               |
               +---> Nếu sự kiện là Cảnh báo Khẩn cấp 22:30 (Mất tiền sau 90p)
               v
  [3. Khẩn cấp: SMS Brandname / eSMS API] -> Đảm bảo 100% chạm đến học viên
```

#### Bảng thông số mẫu tin nhắn (Template Specifications):

| Kênh | Loại tin | Chi phí ước tính | Thời gian kích hoạt | Mục tiêu truyền tải |
| :--- | :--- | :--- | :--- | :--- |
| **Zalo ZNS** | Xác nhận kích hoạt & Giao Link VIP | ~300 VNĐ | Ngay sau khi Webhook xác nhận (< 5s) | Thông báo kích hoạt thành công, số tiền cam kết, link Zalo VIP dùng 1 lần. |
| **Resend Email** | Bộ Welcome Pack & Cẩm nang Kỷ luật | ~0 VNĐ (gói free) | Ngay sau khi thanh toán (< 10s) | Gửi thể lệ chi tiết, link Web App, lộ trình 90/180 ngày, file PDF quy tắc thử thách. |
| **Push Notification** | Thông báo đẩy trên trình duyệt/PWA | 0 VNĐ | Theo lịch cron (08:00, 20:00, 22:30) | Nhắc nhở học tập trực tiếp trên màn hình khóa điện thoại/máy tính. |
| **SpeedSMS / eSMS** | Cảnh báo mất tiền sát giờ (Urgent) | ~500 VNĐ | 22:30 hàng ngày (chỉ cho ai chưa học) | Đánh thức người dùng trước khi hệ thống chốt sổ trừ tiền lúc 23:59:59. |

#### Nội dung mẫu tin nhắn Zalo ZNS (ZNS Template Copy):
```text
[LingoPro] XÁC NHẬN THAM GIA THỬ THÁCH THÀNH CÔNG!
Kính chào {customer_name},
LingoPro đã nhận thành công khoản ký quỹ cam kết {amount} VNĐ cho Thử thách {challenge_tier}.

* Thông tin thử thách của bạn:
- Mã học viên: {participant_code}
- Ngày bắt đầu tính streak: {start_date}
- Phần thưởng tối đa chờ bạn: {max_cash_reward} VNĐ tiền mặt + {bonus_pro_months} tháng Pro.
- Luật suy giảm: Mỗi ngày quên học trước 23:59 sẽ bị trừ 33.333 VNĐ tiền thưởng.

👉 Nhấn vào đây để vào nhóm Zalo VIP dành riêng cho Cohort của bạn (Link dùng 1 lần, hết hạn sau 24h):
{one_time_zalo_invite_link}

👉 Truy cập Dashboard theo dõi Streak & Tiền thưởng cá nhân:
{personal_tracking_link}

Chúc bạn kiên cường giữ trọn vẹn phần thưởng 100%!
```

### 3.3. Cấp phát Dynamic Magic Link & Link mời Zalo VIP/Discord dùng 1 lần
Để ngăn chặn tình trạng học viên phát tán link nhóm VIP ra ngoài cho người không đóng tiền:
1. **Dynamic Magic Link (`/challenge/dashboard?token=...`):**
   - Tạo token ký điện tử JWT (HMAC-SHA256) chứa `participant_id`, `user_id`, thời hạn 90 ngày.
   - Khi bấm vào link từ tin nhắn Zalo/Email, học viên được tự động đăng nhập thẳng vào trang Dashboard cá nhân mà không cần nhớ mật khẩu.
2. **Single-Use Invite Gatekeeper (Cổng kiểm soát thành viên Zalo/Discord):**
   - **Với Discord:** Sử dụng Discord API (`POST /channels/{id}/invites`) tạo invite link với tham số `max_uses: 1, max_age: 86400` (hết hạn sau 24 giờ và chỉ dùng đúng 1 lần cho 1 tài khoản).
   - **Với Zalo Group:** 
     - Nhóm Zalo để chế độ: **"Phê duyệt thành viên mới bởi Trưởng nhóm"**.
     - Khi học viên bấm tham gia nhóm, hệ thống yêu cầu học viên nhập câu hỏi bảo mật: *"Nhập số điện thoại hoặc mã học viên LingoPro của bạn"*.
     - Bot Zalo kiểm tra câu trả lời khớp với bảng `challenge_participants` có `status = 'active'` -> Tự động duyệt vào nhóm ngay lập tức (Zero-touch cho admin).

---

## 4. CHALLENGE ENGINE & HỆ THỐNG CRON QUÉT ĐIỂM DANH HÀNG NGÀY

### 4.1. Bộ tiêu chuẩn định lượng "Completed Day" (Pedagogic Daily Criteria)
Để đảm bảo tính công bằng và giá trị học tập thực chất, một ngày học chỉ được tính là **Hợp lệ (Criteria Met = True)** khi học viên hoàn thành ít nhất **MỘT TRONG CÁC** điều kiện học thuật sau đây trước **23:59:59 (Giờ Việt Nam - UTC+7)**:

```
+---------------------------------------------------------------------------------------+
|                    TIÊU CHÍ HOÀN THÀNH NGÀY HỌC (COMPLETED DAY)                       |
+---------------------------------------------------------------------------------------+
| [Điều kiện A] Hoàn thành tối thiểu 15 lượt ôn tập Spaced Repetition (SRS Flashcards)  |
|                                         HOẶC                                          |
| [Điều kiện B] Hoàn thành 01 bài Luyện nghe Video (Video Listening Comprehension)     |
|                                         HOẶC                                          |
| [Điều kiện C] Hoàn thành 01 bài Luyện đọc hiểu AI cá nhân hóa (Daily Reading Lesson)  |
|                                         HOẶC                                          |
| [Điều kiện D] Hoàn thành 01 Mini-test TOEIC/VSTEP (tối thiểu 10 câu hỏi)              |
+---------------------------------------------------------------------------------------+
```

*Nguyên tắc kỹ thuật:* 
- Mọi mốc thời gian đều được chuẩn hóa theo múi giờ `Asia/Ho_Chi_Minh` (UTC+7).
- Căn cứ dữ liệu: Dựa trên timestamp thực tế được ghi nhận tại server (`srs_progress.last_reviewed_at`, `quiz_results.completed_at`, `user_toeic_question_history.attempted_at`), chống hoàn toàn hành vi gian lận sửa đổi giờ trên thiết bị client.

### 4.2. Lịch trình 4 tầng Cron tự động (Automated Cron Schedule)

Hệ thống thiết lập 4 nhịp cron chính xác hàng ngày (sử dụng Vercel Cron kết hợp Upstash QStash cho tính chịu lỗi cao):

| Giờ VN (UTC+7) | Giờ Server (UTC) | Tên Tiến Trình | Mục Tiêu & Hành Động Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **08:00:00** | `01:00:00` | **Morning Kickoff** | - Gửi Push Notification chào buổi sáng.<br>- Bot Discord/Zalo đăng mục tiêu từ vựng trong ngày & câu trích dẫn truyền động lực.<br>- Reset biến đếm ngày mới trên UI. |
| **20:00:00** | `13:00:00` | **Gentle Reminder** | - Quét CSDL tìm các học viên có `criteria_met = false` trong ngày.<br>- Gửi Push Notification nhẹ nhàng: *"Hôm nay bạn chưa học từ nào! Dành 5 phút hoàn thành trước khi đi ngủ nhé."* |
| **22:30:00** | `15:30:00` | **Urgent Countdown** | - Quét khẩn cấp học viên vẫn chưa hoàn thành (`criteria_met = false`).<br>- Gửi Push Notification đỏ rực + SMS/ZNS cảnh báo mất tiền: *"CẢNH BÁO: Bạn sắp mất 33.333đ sau 90 phút nữa! Vào LingoPro học ngay."*<br>- Bot Zalo ghim danh sách "Vùng Nguy Hiểm". |
| **00:01:00** | `17:01:00` | **Penalty Tally & Deduct** | - **Chốt sổ ngày học:** Khóa sổ ngày hôm trước.<br>- Atomic transaction: Tăng `miss_count += 1`, trừ `33.333đ` quỹ thưởng mặt, trừ `1 tháng` Pro thưởng cho người vi phạm.<br>- Cập nhật bảng xếp hạng và gửi thông báo kết quả. |

### 4.3. Degrading Reward Engine & Máy trạng thái suy giảm phần thưởng

#### Thuật toán tính toán phần thưởng (Calculation Engine Formula):

Đối với mỗi học viên $i$ tại ngày kết toán $T$:
- Gọi $M_i$ là tổng số lần miss học tính từ ngày bắt đầu đến hiện tại (`miss_count`).
- **Tier 1 (Ký quỹ 300k - Tối đa 3 lần phạt):**
  $$\text{Cash Reward}_i = \max\left(0, 100.000 - M_i \times 33.333\right) \text{ VNĐ}$$
  $$\text{Pro Months Bonus}_i = \max\left(0, 6 - M_i \times 1\right) \text{ Tháng}$$
  $$\text{Total Pro Earned}_i = 3 + \text{Pro Months Bonus}_i \text{ (Tháng)}$$
  *(Nếu $M_i \ge 3$: Học viên chạm sàn - Nhận 0đ tiền mặt + 3 tháng Pro cơ bản).*

- **Tier 2 (Ký quỹ 500k - Tối đa 6 lần phạt):**
  $$\text{Cash Reward}_i = \max\left(0, 200.000 - M_i \times 33.333\right) \text{ VNĐ}$$
  $$\text{Pro Months Bonus}_i = \max\left(0, 12 - M_i \times 1\right) \text{ Tháng}$$
  $$\text{Total Pro Earned}_i = 6 + \text{Pro Months Bonus}_i \text{ (Tháng)}$$
  *(Nếu $M_i \ge 6$: Học viên chạm sàn - Nhận 0đ tiền mặt + 6 tháng Pro cơ bản).*

#### Máy trạng thái học viên (Participant State Machine):

```
       +--------------+
       |   PENDING    | (Chờ thanh toán đơn hàng)
       +--------------+
              |
              | [Webhook SePay Paid Thành Công]
              v
       +--------------+
       |    ACTIVE    | <------------------------------------+
       +--------------+                                      |
              |                                              |
              +-----------------------+                      |
              |                       |                      |
    [Miss < Max Allowance]  [Miss >= Max Allowance]          | [Mua Streak Freeze / Phục hồi]
              |                       |                      |
              v                       v                      |
       +--------------+       +---------------+              |
       | AT_RISK /    |       | FLOOR_REACHED |              |
       | PENALIZED    |       | (Chạm sàn     | -------------+
       | (-33.3k, -1M)|       |  0đ + Pro Gốc)|
       +--------------+       +---------------+
              |                       |
              +-----------+-----------+
                          |
                          | [Đến ngày ends_at của Challenge]
                          v
                  +---------------+
                  |   COMPLETED   | (Chốt danh sách nhận giải)
                  +---------------+
                          |
                          | [Batch Payout & Update Supabase]
                          v
                  +---------------+
                  |   REFUNDED    | (Hoàn tiền mặt & cấp chứng chỉ)
                  +---------------+
```

---

## 5. TỰ ĐỘNG HÓA CỘNG ĐỒNG (COMMUNITY AUTOMATION: ZALO VIP & DISCORD)

Cộng đồng không cần người trực 24/7. Toàn bộ sinh khí, sự ganh đua và động lực được duy trì bởi **LingoPro Bot** thông qua Webhooks và Crons.

### 5.1. Kịch bản Bot & Bộ kích hoạt sự kiện thời gian thực (Bot Triggers)

| Thời điểm kích hoạt | Tên kịch bản | Nội dung Bot tự động đăng vào Nhóm VIP | Hiệu ứng tâm lý |
| :--- | :--- | :--- | :--- |
| **08:15 Sáng** | *Morning Spark & Word of the Day* | `☀️ CHÀO BUỔI SÁNG CẢ LỚP! Hôm nay là Ngày 14/90. Đã có 12 bạn dậy sớm hoàn thành bài học trước 8h sáng! Từ vựng vàng hôm nay: 'RESILIENCE' (Sự kiên cường). Ai chưa học hãy bấm vào app hoàn thành ngay 15 từ đầu tiên nhé!` | Khởi động năng lượng, kích thích FOMO buổi sáng. |
| **20:30 Tối** | *Leaderboard Flash: Phân định vùng an toàn* | `📊 BẢNG TIN 20H30: ĐÃ CÓ 78% THÀNH VIÊN VÀO VÙNG AN TOÀN! Còn 22 bạn đang ở VÙNG BÁO ĐỘNG ĐỎ. Bạn còn 3h30 phút để bảo vệ 33.333 VNĐ của mình. Đừng để rơi tiền!` | Tạo áp lực thời gian vừa phải (Mild Urgency). |
| **Realtime** | *Streak Saving Flash (Phút 89)* | `⚡ PHÚT 89 NGOẠN MỤC: Chúc mừng bạn Hoàng Nam (@namhoang) vừa hoàn thành 15 từ SRS lúc 23:42! Nam đã chính thức thoát khỏi Vùng Nguy Hiểm và bảo toàn trọn vẹn 100k thưởng! Cố lên cả nhà ơi!` | Kích thích dopamine cộng đồng, tạo động lực làm theo. |
| **22:45 Đêm** | *Danger Zone Red Alert* | `🚨 CÒN 75 PHÚT NỮA LÀ CHỐT SỔ! Danh sách các chiến binh đang ngấp nghé bờ vực bị trừ tiền: @Hương Giang, @Tuấn Anh, @Minh Đức... Mở app học 5 phút ngay, đừng để mất 33k oan uổng!` | Áp lực mất mát cực độ (Loss Aversion cực đại). |

### 5.2. Bảng xếp hạng trực quan: "Safe Zone" vs "Danger Zone"
Mỗi tối lúc 21:00, bot tự động chụp hoặc xuất văn bản danh sách chia làm 2 cột rõ rệt:

```
=====================================================
🏆 BẢNG THEO DÕI THỬ THÁCH LINGOPRO COHORT #01 🏆
Cập nhật lúc: 21:00:00 (Cách giờ chốt sổ 3 tiếng)
=====================================================

🟢 VÙNG AN TOÀN (SAFE ZONE - BẢO TOÀN THƯỞNG 100%):
[#1] Lê Thu Trang     — 32 từ SRS + 1 Reading  (Đã xong lúc 07:15)
[#2] Nguyễn Văn Hùng  — 18 từ SRS              (Đã xong lúc 11:30)
[#3] Trần Bảo Ngọc    — 15 từ SRS + 1 Video    (Đã xong lúc 19:40)
... (và 76 học viên khác đã an toàn)

🔴 VÙNG BÁO ĐỘNG ĐỎ (DANGER ZONE - NGUY CƠ MẤT 33.3K ĐÊM NAY):
[⚠️] Đặng Tuấn Kiệt   — 0/15 từ  (Còn 2h59p để cứu tiền)
[⚠️] Phạm Quỳnh Chi   — 4/15 từ  (Thiếu 11 từ nữa!)
[⚠️] Vũ Hoàng Long    — 0/15 từ  (Đã miss 1 lần, hôm nay miss là mất tiếp 33k!)

👉 Mở app học ngay: https://lingopro.online/challenge/dashboard
=====================================================
```

### 5.3. Cơ chế cứu vớt "Phút 89" & Nudge đồng đội (Peer Accountability)
- **Hệ thống Bạn cùng bàn (Buddy System Automation):** Khi đăng ký, học viên có thể ghép cặp hoặc hệ thống tự động gán ngẫu nhiên 2 học viên làm "Accountability Partners".
- Nếu Học viên A đã hoàn thành lúc 20:00 mà Học viên B vẫn ở Vùng Nguy Hiểm lúc 21:30, bot tự động gửi tin nhắn riêng cho A:
  *`"Học viên B cùng bàn với bạn sắp bị trừ 33.3k đêm nay! Hãy bấm nút 'Nhắc bạn' để gửi 1 tiếng chuông đánh thức bạn ấy nhé!"`*
- Khi A bấm nhắc, bot tự động tag B trong nhóm: *"@B ơi, bạn học @A đang réo bạn vào học kìa, đừng để mất tiền!"* -> Tạo tính kết nối cộng đồng cực cao mà founder không cần can thiệp.

---

## 6. TỰ ĐỘNG HÓA TRẢ THƯỞNG CUỐI KỲ & GIA HẠN GÓI PRO (END-OF-COHORT PAYOUT)

Khi thử thách kết thúc (sau 90 ngày hoặc 180 ngày), toàn bộ thủ tục hậu cần kết thúc khóa được tự động hóa 100%.

### 6.1. Quy trình Batch Payout: SePay Payout API & 1-Click VietQR CSV

#### Phương án 1: Tự động hoàn toàn qua SePay Payout API (Zero-Touch tuyệt đối)
- Khi tiến trình cron `completeChallenge` kích hoạt vào ngày kết thúc:
  1. Hệ thống lọc tất cả học viên có `status = 'completed'` và `remaining_cash_reward > 0`.
  2. Lấy thông tin tài khoản ngân hàng của học viên (đã thu thập an toàn ở bước Onboarding trong bảng `challenge_participants`: `bank_bin`, `bank_account_number`, `bank_account_name`).
  3. Gọi SePay Payout API (hoặc cổng chi hộ Napas 24/7) theo lệnh từng đợt (Batch POST):
     ```json
     {
       "payout_batch_id": "PAYOUT_COHORT_01_2026",
       "transfers": [
         {
           "bank_code": "970422",
           "account_number": "0949317036",
           "account_name": "NGUYEN VAN A",
           "amount": 100000,
           "description": "LINGOPRO THUONG THU THACH COHORT 01"
         }
       ]
     }
     ```
  4. Webhook SePay Payout trả về kết quả thành công -> Cập nhật `challenge_participants.status = 'refunded'`, lưu `refunded_at = now()`.

#### Phương án 2: 1-Click VietQR CSV Export (Bảo mật tối đa, Founder duyệt 1 phút)
Nếu Founder muốn trực tiếp kiểm soát dòng tiền xuất ra từ tài khoản công ty:
1. Hệ thống tự động kết xuất file `payout_cohort_01.csv` đạt chuẩn định dạng chuyển tiền lô của MB Bank / Techcombank / Vietcombank.
2. File CSV gồm các cột chuẩn:
   `STT | Số Tài Khoản | Tên Chủ Tài Khoản | Mã Ngân Hàng (BIN) | Số Tiền | Nội Dung Chuyển Khoản`
3. Founder chỉ cần đăng nhập Internet Banking doanh nghiệp, tải file CSV lên, quét khuôn mặt OTP 1 lần -> Hàng trăm học viên nhận tiền ngay trong 30 giây.

### 6.2. Atomic Update gói Pro trên Supabase Database
Đồng thời với việc chi trả tiền mặt, hệ thống tự động tính toán thời hạn gia hạn gói Pro:
- Công thức cộng dồn an toàn (Stackable Pro Extension):
  - Nếu tài khoản đang có hạn Pro đến `2026-12-31`, và được thưởng thêm `6 tháng Pro` (180 ngày):
    `new_plan_expires_at = current_plan_expires_at + INTERVAL '180 days'`
  - Đảm bảo học viên không bị mất bất kỳ ngày Pro nào đã có từ trước.

### 6.3. Hệ thống tạo Chứng chỉ Tốt nghiệp Động & Huy hiệu "Survivor"
1. **Dynamic Digital Certificate:**
   - Hệ thống render chứng chỉ động qua Next.js OpenGraph Image Engine (`/api/challenge/certificate/[participantId]`) thành file ảnh PNG chuẩn 4K.
   - Nội dung chứng chỉ: Họ tên học viên, Số ngày kỷ luật hoàn thành liên tục (ví dụ: 90/90 Days), Tỷ lệ hoàn thành (100%), Mã chứng chỉ độc bản bảo mật (`LINGO-SURVIVOR-2026-XXXX`).
   - Có nút bấm 1-click: **"Khoe lên Facebook / LinkedIn"** với link preview ảnh động, tạo vòng lặp lan tỏa tự nhiên (Viral Referral Loop).
2. **Huy hiệu "Survivor" độc quyền trong App:**
   - Cột `profiles.badges` được bổ sung huy hiệu kim loại đặc biệt: **"Iron Will Survivor - Cohort #01"**.
   - Profile học viên phát sáng viền vàng (Golden Glow Avatar Ring), khẳng định đẳng cấp trong cộng đồng học tập LingoPro.

---

## 7. DASHBOARD QUẢN TRỊ NGOẠI LỆ & BỘ MACRO XỬ LÝ SỰ CỐ (EXCEPTION HANDLING)

### 7.1. Bot cảnh báo ngoại lệ Telegram cho Founder (@LingoProOpsBot)
Founder không cần mở dashboard hàng ngày. Mọi sự cố cần con người quyết định sẽ được đẩy về Bot Telegram cá nhân:

```
🚨 [LINGOPRO OPS ALERT] - NGOẠI LỆ THANH TOÁN
--------------------------------------------
Thời gian: 2026-09-14 14:35:10 (VN)
Nội dung giao dịch: "NGUYEN VAN A CHUYEN KHOAN LINGOPRO 4A8B9C1D"
Số tiền thực nhận: 250,000 VNĐ
Số tiền đơn hàng yêu cầu: 300,000 VNĐ (Thiếu 50,000 VNĐ)
Order ID: 4a8b9c1d-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Khách hàng SĐT: 0912345678 - Email: nguyenvana@gmail.com

👉 Lựa chọn xử lý nhanh (1-Click Action):
[Duyệt ngoại lệ (Cho vào gói)]  |  [Tạo Link Thu Bù 50k]  |  [Hoàn trả tiền]
```

### 7.2. Bộ Macro mẫu phản hồi nhanh cho 5 kịch bản ngoại lệ

#### Kịch bản 1: Học viên chuyển thiếu tiền (Ví dụ chuyển 250k thay vì 300k)
```text
Chào bạn {tên_học_viên}, LingoPro đã nhận được giao dịch {số_tiền_đã_chuyển}đ của bạn. Tuy nhiên, phí tham gia Thử thách Tier 1 là 300.000đ (bạn đang chuyển thiếu {số_tiền_thiếu}đ). 
Bạn vui lòng chuyển nốt phần còn thiếu với cú pháp "{mã_đơn_bù}" qua mã QR sau để hệ thống tự động kích hoạt vé tham gia và bảo lưu phần thưởng nhé: {link_vietqr_bù}
```

#### Kịch bản 2: Quên ghi nội dung chuyển khoản / Sai mã Order
```text
Chào bạn, LingoPro ghi nhận một khoản chuyển {số_tiền}đ từ STK của bạn lúc {thời_gian} nhưng bị thiếu mã đơn hàng "LINGOPRO xxxxxxxx". 
Bạn vui lòng gửi ảnh chụp màn hình biên lai chuyển khoản vào đây để Admin đối soát và kích hoạt thủ công cho bạn trong 5 phút nhé!
```

#### Kịch bản 3: Yêu cầu đóng băng y tế / Bất khả kháng (Medical Freeze Policy)
*Quy tắc chuẩn:* Cho phép tối đa 03 ngày đóng băng nếu có giấy khám bệnh/sốt cao hoặc lịch công tác đột xuất hợp lệ (thông báo trước 23:00).
```text
Chào bạn {tên_học_viên}, LingoPro đã tiếp nhận yêu cầu xin đóng băng chuỗi học vì lý do y tế ngày {ngày_nghỉ} kèm chứng từ của bạn.
Hệ thống đã kích hoạt 'Medical Streak Freeze' miễn phí cho ngày hôm nay. Ngày này sẽ không tính vào miss_count và phần thưởng 100k của bạn vẫn được bảo toàn nguyên vẹn. Bạn giữ gìn sức khỏe và sớm quay lại học tập nhé!
```

#### Kịch bản 4: Chuyển khoản trễ giờ phút chót (Ngân hàng nghẽn mạng sau 23:59)
```text
Chào bạn, nếu bạn đã thực hiện bài học trước 23:59:59 nhưng do kết nối mạng chập chờn khiến hệ thống ghi nhận lúc 00:02, hệ thống sẽ tự động cấp một ân hạn kỹ thuật (Technical Grace Period) 15 phút. Dữ liệu của bạn đã được kiểm tra khớp log client và streak của bạn đã được khôi phục nguyên vẹn!
```

#### Kịch bản 5: Đòi hoàn lại tiền cọc khi mới tham gia được 3 ngày
```text
Chào bạn {tên_học_viên}, theo Thể lệ và Cam kết Kỷ luật bạn đã đồng ý khi đăng ký Thử thách, khoản ký quỹ 300.000đ là cam kết kỷ luật không hoàn lại giữa chừng dưới mọi hình thức để đảm bảo tính nghiêm túc cho toàn bộ Cohort. 
Dù bạn đã miss chuỗi, bạn vẫn sở hữu trọn vẹn 3 tháng tài khoản LingoPro Pro (trị giá 300.000đ) để tiếp tục học tập không giới hạn. Hãy tiếp tục kiên trì học mỗi ngày bạn nhé!
```

---

## 8. QUY TRÌNH 15 PHÚT/TUẦN DÀNH CHO FOUNDER (WEEKLY SOP RUNBOOK)

Founder chỉ cần thực hiện quy trình này đúng **1 lần duy nhất vào sáng Thứ Bảy hàng tuần** (Thời lượng ước tính: 10 - 15 phút):

```
+-----------------------------------------------------------------------------------+
|               WEEKLY 15-MINUTE FOUNDER MAINTENANCE CHECKLIST                      |
+-----------------------------------------------------------------------------------+

[Phút 00 - 03] KIỂM TRA BOT CẢNH BÁO TELEGRAM (@LingoProOpsBot)
  - Mở kênh Telegram Ops, lướt nhanh danh sách cảnh báo trong tuần.
  - Xác nhận: Có đơn hàng nào bị kẹt 'pending' do khách nhập sai cú pháp không?
  - Xử lý: Bấm nút inline button để duyệt nhanh hoặc gửi macro tương ứng.

[Phút 04 - 07] ĐỐI SOÁT SEPAY WEBHOOK VÀ LOG NGÂN HÀNG
  - Đăng nhập https://my.sepay.vn -> Xem mục "Giao dịch gần nhất".
  - So sánh tổng số dư thực tế tại MB Bank với tổng doanh thu hiển thị trên LingoPro Admin.
  - Đảm bảo tỷ lệ khớp lệnh thành công đạt >= 99%.

[Phút 08 - 11] RÀ SOÁT TÍNH TOÀN VẸN CỦA TIẾN TRÌNH CRON (CRON HEALTHCHECK)
  - Mở Vercel Cron Logs / Upstash QStash Console:
    * Kiểm tra route `/api/challenges/check-daily`: Trạng thái 200 OK liên tục 7 ngày qua.
    * Xác nhận không có hiện tượng timeout (giới hạn thời gian thực thi < 15 giây).

[Phút 12 - 14] ĐIỂM DANH TINH THẦN CỘNG ĐỒNG ZALO VIP / DISCORD
  - Mở nhóm Zalo VIP, thả 1 biểu tượng cảm xúc (Thả tim/Vỗ tay) vào bài đăng vinh danh của Bot.
  - Đăng 1 câu nhắn nhủ ngắn (Voice note hoặc text 1 câu): 
    "Chúc mừng 85 bạn vẫn đang giữ trọn vẹn 100k tiền thưởng! Tuần mới kiên cường nhé cả nhà!"

[Phút 15] KẾT THÚC VẬN HÀNH TUẦN. TẬP TRUNG 100% VÀO PHÁT TRIỂN SẢN PHẨM & MARKETING.
```

---

## 9. THIẾT KẾ CƠ SỞ DỮ LIỆU & CODE TRIỂN KHAI THỰC TẾ (CODE ARTIFACTS)

### 9.1. PostgreSQL Schema Migration (Áp dụng cho Supabase)
Bổ sung cấu trúc dữ liệu cho cơ chế suy giảm phần thưởng (Degrading Reward Model) và kiểm soát hoàn tiền:

```sql
-- Migration: 20260914_degrading_reward_challenge_ops.sql

-- 1. Bổ sung các cột tính toán suy giảm cho bảng challenges
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS tier_level int DEFAULT 1 CHECK (tier_level IN (1, 2)),
  ADD COLUMN IF NOT EXISTS max_miss_allowed int DEFAULT 3,
  ADD COLUMN IF NOT EXISTS penalty_cash_per_miss int DEFAULT 33333,
  ADD COLUMN IF NOT EXISTS penalty_pro_months_per_miss int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS floor_pro_months int DEFAULT 3,
  ADD COLUMN IF NOT EXISTS initial_cash_reward int DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS initial_bonus_pro_months int DEFAULT 6;

-- 2. Cập nhật bảng challenge_participants để theo dõi suy giảm thời gian thực
ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS miss_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_cash_reward int DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS current_bonus_pro_months int DEFAULT 6,
  ADD COLUMN IF NOT EXISTS is_floor_reached boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_account_name text,
  ADD COLUMN IF NOT EXISTS magic_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS certificate_url text;

-- 3. Tạo index tăng tốc độ quét Cron đêm
CREATE INDEX IF NOT EXISTS idx_participants_active_scan 
  ON public.challenge_participants(challenge_id, status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_daily_log_date_lookup 
  ON public.challenge_daily_log(challenge_id, log_date, criteria_met);
```

### 9.2. Serverless Cron Handler Chốt Sổ & Trừ Tiền Atomic (`/api/challenges/cron/midnight-tally`)

```typescript
// src/app/api/challenges/cron/midnight-tally/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { dateKeyInTimeZone, APP_TIMEZONE } from '@/lib/gamification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    // Lấy ngày hôm qua theo giờ Việt Nam
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = dateKeyInTimeZone(yesterday, APP_TIMEZONE);

    // Lấy tất cả các Thử thách đang active
    const { data: activeChallenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active');

    const summary = { processed: 0, passed: 0, penalized: 0, floor_reached: 0 };

    for (const chal of activeChallenges || []) {
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', chal.id)
        .eq('status', 'active');

      for (const p of participants || []) {
        summary.processed++;

        // Kiểm tra xem ngày hôm qua học viên đã đạt tiêu chuẩn chưa
        const { data: log } = await supabase
          .from('challenge_daily_log')
          .select('criteria_met')
          .eq('participant_id', p.id)
          .eq('log_date', dateKey)
          .maybeSingle();

        const met = log?.criteria_met === true;

        if (met) {
          summary.passed++;
          // Tăng streak
          await supabase.from('challenge_participants').update({
            current_streak: (p.current_streak || 0) + 1,
            longest_streak: Math.max(p.longest_streak || 0, (p.current_streak || 0) + 1),
            total_active_days: (p.total_active_days || 0) + 1
          }).eq('id', p.id);
        } else {
          // BỊ MISS: Kích hoạt Degrading Reward Engine
          summary.penalized++;
          const newMissCount = (p.miss_count || 0) + 1;
          const maxMiss = chal.max_miss_allowed || 3;
          const isFloor = newMissCount >= maxMiss;

          // Tính toán trừ tiền và trừ tháng Pro
          const newCashReward = isFloor ? 0 : Math.max(0, (p.current_cash_reward || chal.initial_cash_reward) - chal.penalty_cash_per_miss);
          const newBonusMonths = isFloor ? 0 : Math.max(0, (p.current_bonus_pro_months || chal.initial_bonus_pro_months) - chal.penalty_pro_months_per_miss);

          await supabase.from('challenge_participants').update({
            miss_count: newMissCount,
            current_cash_reward: newCashReward,
            current_bonus_pro_months: newBonusMonths,
            is_floor_reached: isFloor,
            current_streak: 0, // Gãy streak
            failed_reason: `Missed criteria on ${dateKey}`
          }).eq('id', p.id);

          if (isFloor) {
            summary.floor_reached++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, dateKey, summary });
  } catch (error: any) {
    console.error('[MidnightTally] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### 9.3. Hàm gửi cảnh báo Telegram cho Ngoại lệ (`src/lib/ops-telegram.ts`)

```typescript
// src/lib/ops-telegram.ts
export async function sendOpsAlert(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_OPS_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OPS_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('[OpsAlert] Telegram credentials not configured.');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (err) {
    console.error('[OpsAlert] Failed to send Telegram alert:', err);
    return false;
  }
}
```

---

## 10. ĐỘ TIN CẬY HỆ THỐNG, DỰ PHÒNG THẢM HỌA & KẾ HOẠCH BẢO VỆ DÒNG TIỀN

1. **Bảo vệ tài khoản ngân hàng & Hạn mức chi:**
   - Số tài khoản nhận tiền (Incoming Account: MB 0949317036) là tài khoản thanh toán chuyên dụng, **hoàn toàn tách biệt** với tài khoản chi trả thưởng (Payout Account).
   - Tài khoản Payout chỉ được nạp đúng số tiền tương ứng với quỹ thưởng thực tế sau khi đã trừ toàn bộ các khoản phạt lúc kết thúc khóa.
2. **Kế hoạch dự phòng khi Ngân hàng bảo trì (Bank Maintenance Fallback):**
   - Nếu cổng ngân hàng bảo trì lúc 23:00 - 02:00, SePay lưu hàng đợi webhook (Queue Retry) tối đa 24 giờ.
   - Khi có kết nối lại, webhook bắn bù tự động, hệ thống đối soát theo `transaction_date` thực tế trên sao kê ngân hàng thay vì thời điểm nhận webhook.
3. **Bảo toàn dữ liệu học viên (Data Durability):**
   - Toàn bộ bảng dữ liệu `challenge_participants`, `challenge_daily_log` và `payment_webhook_events` được kích hoạt Supabase Point-in-Time Recovery (PITR) với tần suất backup liên tục, đảm bảo không bao giờ mất log điểm danh của bất kỳ học viên nào.

---
*Tài liệu được phê duyệt cho triển khai thực tế chiến dịch LingoPro Degrading-Reward Challenge.*
