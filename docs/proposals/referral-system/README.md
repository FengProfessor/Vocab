# TÀI LIỆU ĐẶC TẢ HỆ THỐNG GIỚI THIỆU & TIẾP THỊ LIÊN KẾT (LINGOPRO REFERRAL & AFFILIATE)
## Master Proposal, Business Modeling & Engineering Specification
**Phiên bản:** 1.0.0 (Production-Ready)  
**Ngày phát hành:** 18/09/2026  
**Thư mục lưu trữ:** `docs/proposals/referral-system/`  
**Dự án:** LingoPro Web Application (`web-app`)

---

## 1. Mục Lục Toàn Bộ Bộ Hồ Sơ (Master Table of Contents)

Bộ hồ sơ đề án gồm 8 tài liệu mô-đun hóa, bao phủ toàn diện từ chiến lược kinh doanh, mô hình tài chính, giải pháp an ninh, trải nghiệm người dùng đến kiến trúc kỹ thuật và mã nguồn CSDL:

| Tệp Tài Liệu | Tên Tài Liệu & Chủ Đề | Nội Dung Trọng Tâm |
| :--- | :--- | :--- |
| [`00_EXECUTIVE_SUMMARY.md`](./00_EXECUTIVE_SUMMARY.md) | **Tóm Tắt Điều Hành & Chiến Lược** | Tầm nhìn, OKRs, K-factor (0.35 - 0.6), cắt giảm 60-72% CAC, 3 giai đoạn triển khai. |
| [`01_REWARD_POLICY.md`](./01_REWARD_POLICY.md) | **Chính Sách & Cơ Cấu Thưởng (R1)** | Mô hình Hybrid 2 tầng (+7d Pro VIP & 15-20% tiền mặt), so sánh 3 kịch bản, ma trận trả thưởng cho từng gói cước (79k - 899k). |
| [`02_UNIT_ECONOMICS.md`](./02_UNIT_ECONOMICS.md) | **Phân Tích Kinh Tế Đơn Vị (R2)** | Bài toán tài chính dựa trên giá thực tế, CAC Paid Ads vs Referral, LTV 1Y-2Y, biên lãi ròng (65-78%), stress-test rủi ro cực đoan. |
| [`03_ANTI_FRAUD.md`](./03_ANTI_FRAUD.md) | **Phòng Chống Gian Lận (R3)** | 5 Vector tấn công, Device Fingerprint, IP Subnet Limit, Holding Period (7-14 ngày), Automated Risk Scoring Engine (0-100). |
| [`04_UX_UI_FLOW.md`](./04_UX_UI_FLOW.md) | **Thiết Kế Trải Nghiệm & UI (R4)** | User Journey, State Machine, Wireframe Technical Minimalist `/referral` & `/invite/[code]`, Dynamic OG Image, Gamification. |
| [`05_TECHNICAL_SPEC.md`](./05_TECHNICAL_SPEC.md) | **Đặc Tả Kỹ Thuật Hệ Thống (R5)** | Kiến trúc Next.js 16 + Supabase, đặc tả 6 API endpoints, Webhook hooking tại `confirm_paid_order`, concurrency lock. |
| [`schema.sql`](./schema.sql) | **Mã Nguồn CSDL PostgreSQL (DDL)** | DDL 5 bảng, RLS Policies, Indexes hiệu năng cao, Stored Procedures (`fn_process_referral_reward`, `fn_evaluate_referral_activation`, `fn_request_payout`). |
| [`README.md`](./README.md) | **Tài Liệu Hướng Dẫn & Checklist** | Bản đồ tài liệu, tổng quan kiến trúc, và checklist triển khai cho kỹ sư phần mềm. |

---

## 2. Cấu Trúc Thư Mục (Directory Structure)

```
docs/proposals/referral-system/
├── 00_EXECUTIVE_SUMMARY.md   # Tóm tắt điều hành, tầm nhìn & lộ trình
├── 01_REWARD_POLICY.md       # Chính sách thưởng Hybrid 2 tầng & ma trận gói cước
├── 02_UNIT_ECONOMICS.md       # Mô hình kinh tế đơn vị, CAC, LTV & stress-test
├── 03_ANTI_FRAUD.md           # 5 vector phòng chống gian lận & Risk Scoring
├── 04_UX_UI_FLOW.md           # Trải nghiệm học viên, Wireframe & Gamification
├── 05_TECHNICAL_SPEC.md       # Đặc tả API, Webhook integration & Concurrency
├── schema.sql                 # DDL PostgreSQL, RLS, Indexes & Stored Procedures
└── README.md                  # Hướng dẫn điều hành & Engineering Checklist
```

---

## 3. Bản Đồ Kiến Trúc Luồng Dữ Liệu (System Data Flow Map)

```
[Khách / Mạng xã hội]
       │
       ▼ Nhấp link: lingopro.online/invite/PHONGVIP88
[Trang Landing: /invite/[code]]  <── sinh ảnh từ ──  [/invite/[code]/opengraph-image.tsx]
       │
       │ Bắt cookie lingopro_ref=PHONGVIP88 (30 ngày)
       ▼
[Đăng Ký Tài Khoản: Google OAuth / Email]
       │
       │ Lưu attribution vào bảng referral_logs
       ▼
[Referee Học Tập: FSRS / Streak >= 3d / Words >= 30]
       │
       │ API: POST /api/referral/evaluate-activation
       ▼
[TẦNG 1: Tặng +7 Ngày Pro VIP cho cả Referrer & Referee] (Tự động cộng dồn vào plan_expires_at)
       │
       │ Referee nâng cấp gói trả phí (Pro / Premium)
       ▼
[Cổng Thanh Toán VietQR]  ─── Webhook ───>  [/api/billing/webhook]
                                                    │
                                                    │ Gọi RPC fn_process_referral_reward()
                                                    ▼
                                            [TẦNG 2: Hoa Hồng Tiền Mặt (15% - 20%)]
                                            Trạng thái: pending_clearance (7 - 14 ngày)
                                                    │
                                                    │ Hết thời gian giam tiền
                                                    ▼
                                            [Số Dư Khả Dụng (available)]
                                                    │
                                                    │ Yêu cầu rút tiền >= 100k
                                                    ▼
                                            [Chuyển Khoản VietQR 24/7 về Ngân Hàng]
```

---

## 4. Danh Sách Kiểm Tra Triển Khai Dành Cho Kỹ Sư (Engineering Deployment Checklist)

Nhóm kỹ thuật thực thi (Implementers & QA) cần bám sát bảng kiểm tra sau khi chuyển giao hồ sơ sang giai đoạn lập trình:

### Giai Đoạn A: Hạ Tầng Cơ Sở Dữ Liệu (Database Migrations)
- [ ] Chạy tệp `schema.sql` trên môi trường Staging của Supabase:
  - Tạo 5 bảng: `referral_campaigns`, `referral_links`, `referral_logs`, `reward_transactions`, `payout_requests`.
  - Khởi tạo RLS Policies trên cả 5 bảng, đảm bảo role `anon` và `authenticated` không thể tự ý cập nhật trái phép bảng tài chính.
  - Tạo trigger `trg_order_refund_clawback` trên bảng `orders` tự động thu hồi hoa hồng khi hoàn tiền.
  - Kiểm thử Stored Procedures: `fn_process_referral_reward`, `fn_evaluate_referral_activation`, `fn_request_payout`.

### Giai Đoạn B: Thu Thập & Bảo Toàn Attribution Client
- [ ] Cập nhật `src/lib/referral-tracker.ts`:
  - Hàm `captureReferralCode()` ghi nhận cookie `lingopro_ref` với thuộc tính `SameSite=Lax`, `Max-Age=2592000` (30 ngày).
- [ ] Nhúng lời gọi `captureReferralCode()` vào `src/components/ClientBoot.tsx`.
- [ ] Cập nhật `src/app/auth/page.tsx`:
  - Form submit gửi kèm `referralCode`.
  - Nút Google Sign-in lưu mã vào `sessionStorage`.
- [ ] Cập nhật `src/app/auth/callback/page.tsx`:
  - Đọc cookie hoặc `sessionStorage`, gọi API `/api/referral/claim` để gắn quan hệ Người mời ngay sau khi OAuth thành công.

### Giai Đoạn C: Tích Hợp Webhook & Cổng Thanh Toán
- [ ] Cập nhật `src/app/api/billing/webhook/route.ts`:
  - Sau khi `confirm_paid_order` thành công, gọi `supabase.rpc('fn_process_referral_reward', ...)`.
  - Đảm bảo tính bất khả trùng lặp (Idempotency) dựa trên `order_id`.

### Giai Đoạn D: Giao Diện Người Dùng & Điều Hướng
- [ ] Thêm mục điều hướng `Mời bạn nhận Pro` vào `src/lib/student-nav.ts` (`/referral`, icon `Gift`, badge `🎁 Tặng 7d`).
- [ ] Thêm Mini Callout Card ở chân Desktop Sidebar và Mobile Drawer tại `StudentShell.tsx`.
- [ ] Xây dựng trang trung tâm `/referral` (Hero banner, share widget, metric cards, progress bar, real-time table).
- [ ] Xây dựng landing page tiếp nhận `/invite/[code]` và edge dynamic OG image `/invite/[code]/opengraph-image.tsx`.
- [ ] Xây dựng modal rút tiền VietQR `PayoutRequestModal` kết nối endpoint `/api/referral/payout`.

### Giai Đoạn E: Kiểm Thử & Nghiệm Thu Nghiệp Vụ (QA & Verification)
- [ ] Chạy kiểm thử tự động `npm run typecheck` và `npm run build` vượt qua với 0 lỗi.
- [ ] Kiểm thử kịch bản Tầng 1: Referee hoàn thành Streak 3 ngày $\to$ Cả hai tài khoản được cộng chính xác +7 ngày vào `plan_expires_at`.
- [ ] Kiểm thử kịch bản Tầng 2: Referee thanh toán gói Pro 1 Năm (599.000đ) $\to$ Người mời nhận đúng 89.850đ ở trạng thái giam tiền 14 ngày.
- [ ] Kiểm thử kịch bản Chống gian lận: Tự mời bằng cùng một trình duyệt $\to$ Hệ thống chặn với lỗi `FRAUD_DEVICE_COLLISION`.
- [ ] Kiểm thử kịch bản Rút tiền: Rút khi số dư $< 100.000đ$ báo lỗi; rút khi đủ tiền tạo yêu cầu thành công và trừ số dư khả dụng tức thì.

---

## 5. Kết Luận & Chuyển Giao

Hồ sơ đề án này là tài liệu tham chiếu chính thức và duy nhất (Single Source of Truth) cho toàn bộ quy trình phát triển, vận hành và quản lý tài chính của Chương trình Giới thiệu & Tiếp thị Liên kết tại LingoPro. Mọi thắc mắc kỹ thuật hoặc đề xuất hiệu chỉnh chính sách cần được đối chiếu trực tiếp với các tài liệu thành phần trong thư mục này.
