# 00. TÓM TẮT ĐIỀU HÀNH & CHIẾN LƯỢC TỔNG THỂ
## (Executive Summary & Strategic Overview)
### Dự án: Hệ Thống Giới Thiệu & Tiếp Thị Liên Kết (Referral & Affiliate Program) — LingoPro
**Ngày ban hành:** 18/09/2026  
**Phiên bản:** 1.0.0 (Production-Ready Technical & Business Proposal)  
**Tác giả:** Worker 1 — Technical & Business Specification Lead  
**Vị trí tài liệu:** `docs/proposals/referral-system/00_EXECUTIVE_SUMMARY.md`

---

## 1. Bối Cảnh Chiến Lược & Tầm Nhìn (Strategic Vision)

Trong bối cảnh thị trường EdTech học tiếng Anh tại Việt Nam năm 2026 đang cạnh tranh gay gắt, chi phí thu hút khách hàng mới qua các kênh quảng cáo trả phí truyền thống (Paid Ads qua Meta Ads, Google Search, TikTok Ads) đã leo thang lên mức **150.000đ – 350.000đ cho mỗi khách hàng trả phí**. Chi phí CAC cao làm xói mòn nghiêm trọng biên lợi nhuận của các sản phẩm subscription có mức giá tiếp cận đại chúng như LingoPro (79.000đ/tháng đến 899.000đ/năm).

LingoPro sở hữu nền tảng công nghệ học tập vượt trội:
- Thuật toán lặp lại ngắt quãng **FSRS v5** (Free Spaced Repetition Scheduler).
- Bộ công cụ AI phân tích ngữ cảnh từ vựng chuyên sâu (Gemini 2.5 Flash).
- Thư viện 200+ Video tương tác song ngữ đồng bộ thời gian thực.
- Hệ thống khảo thí TOEIC ETS 990 và VSTEP B1–C1 chuẩn máy tính.

Chính vì vậy, **lực đẩy tăng trưởng bền vững nhất của LingoPro phải đến từ chính cộng đồng học viên hài lòng (Product-Led Growth & Word-of-Mouth)**. Đề án xây dựng **Hệ Thống Giới Thiệu & Tiếp Thị Liên Kết (LingoPro Referral & Affiliate System)** được thiết kế nhằm chuyển hóa sự yêu thích sản phẩm của học viên thành một động cơ tăng trưởng tự thân (Viral Growth Engine), giảm triệt để sự phụ thuộc vào Paid Ads và kiến tạo dòng doanh thu ổn định, có khả năng mở rộng quy mô lớn.

---

## 2. Mục Tiêu Cốt Lõi (Core Objectives & OKRs)

Hệ thống đặt ra 4 mục tiêu kinh doanh và công nghệ định lượng đo lường được:

| Chỉ số / Mục tiêu | Hiện trạng (Baseline) | Mục tiêu Referral (Target) | Ý nghĩa chiến lược |
| :--- | :---: | :---: | :--- |
| **Hệ số Lan truyền (K-factor)** | 0.05 – 0.08 (tự nhiên) | **0.35 – 0.60** | Cứ 100 học viên tích cực sẽ kéo thêm 35 – 60 người dùng mới mà không tốn chi phí Paid Media. |
| **Chi phí Thu hút Khách hàng (Blended CAC)** | 220.000đ / khách trả phí | **< 65.000đ – 85.000đ** | **Cắt giảm 60% – 72% CAC**, giải phóng ngân sách mở rộng sản phẩm. |
| **Tỷ lệ Chuyển đổi Dùng thử sang Trả phí (Trial-to-Paid CR)** | 3.5% (Organic) | **8.5% – 14.0%** | Người dùng được bạn bè giới thiệu và hoàn thành mốc học thử có độ tin cậy và gắn kết cao gấp 3 lần. |
| **Tỷ trọng Doanh thu từ Giới thiệu (% Referral ARR)** | < 3% (tự phát) | **25% – 35% ARR** | Trở thành một trong hai trụ cột doanh thu lớn nhất của LingoPro sau 6 tháng vận hành. |

---

## 3. Tổng Quan Kiến Trúc Giải Pháp (Architecture Summary: R1 - R5)

Đề án được xây dựng toàn diện qua 5 trụ cột tương ứng từ R1 đến R5:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            LINGOPRO REFERRAL & AFFILIATE ENGINE                              │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ R1. REWARD POLICY            │ R2. UNIT ECONOMICS           │ R3. ANTI-FRAUD ENGINE         │
│ Mô hình Thưởng Hybrid 2 Tầng:│ Biên lợi nhuận ròng an toàn: │ 5 Tầng Phòng Ngự Chuyên Sâu:  │
│ - Tầng 1: Pro VIP Days       │ - Pro 1Y (599k): Net 77.2%   │ - Device Fingerprint & IP     │
│   (Kích hoạt theo Streak/Từ) │ - Prem 1Y (899k): Net 77.6%  │ - Holding Period (7-14 ngày)  │
│ - Tầng 2: Hoa hồng tiền mặt  │ - Payback: < 0.8 tháng       │ - Rate-limit & Daily Cap      │
│   (15-20% khi bạn mua gói)   │ - Stress-test 100% pass safe │ - Risk Scoring 0-100 & Review │
├──────────────────────────────┴──────────────────────────────┴───────────────────────────────┤
│ R4. TECHNICAL MINIMALIST UX/UI                                                              │
│ - Referral Hub (/referral) quản lý minh bạch: Bạn bè, Mốc thưởng, Rút tiền VietQR           │
│ - Universal Link & Cookie Attribution 30 ngày (Bảo toàn 100% qua Google OAuth PKCE)         │
│ - Dynamic Social OG Image (/invite/[code]/opengraph-image.tsx) cá nhân hóa cho từng học viên│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ R5. ROBUST TECHNICAL ARCHITECTURE & DATABASE                                                │
│ - 5 Bảng cốt lõi Supabase PostgreSQL: campaigns, links, logs, reward_transactions, payouts  │
│ - Webhook Event Idempotency & Postgres Atomic Locking (FOR UPDATE) chống Race Condition     │
│ - Row Level Security (RLS) bảo vệ dữ liệu tài chính tuyệt đối                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### R1. Chính Sách Thưởng Kép (Two-Sided Hybrid Reward Structure)
- **Tầng 1 (Free-to-Trial / Engagement)**: Học viên giới thiệu (Referrer) và Bạn bè (Referee) đều nhận **7 ngày học Pro VIP miễn phí** khi bạn bè hoàn thành **Điều kiện Kích hoạt (Activation Event)**: Duy trì Streak học tập $\ge 3$ ngày VÀ tích lũy $\ge 30$ từ vựng mới.
- **Tầng 2 (Monetization / Affiliate Commission)**: Người giới thiệu nhận **hoa hồng tiền mặt 15% – 20%** (theo Kịch bản Cân bằng) hoặc nâng hạn mức khi bạn bè thanh toán bất kỳ gói học nào (Pro/Premium từ 1 tháng đến 1 năm).

### R2. Hiệu Quả Kinh Tế Đơn Vị & Lợi Nhuận (Unit Economics & ROI)
Mô hình tài chính được giải toán chính xác dựa trên bảng giá thực tế của LingoPro:
- Trừ toàn bộ hoa hồng tiền mặt (15-20%), phí cổng thanh toán tự động (1.5% qua VietQR/PayOS/SeAPay), và chi phí hạ tầng Server/AI LLM/TTS (5.000đ – 15.000đ/active user/tháng).
- Biên lợi nhuận ròng sau tất cả chi phí đạt **74% – 78%** trên các gói dài hạn (6 tháng – 1 năm).
- Thời gian hoàn vốn (Payback Period) đạt ngay tức thì tại thời điểm phát sinh thanh toán (0 tháng) do tiền mặt thu trước 100%.

### R3. Phòng Tuyến Chống Gian Lận Đa Tầng (Anti-Fraud Defense-in-Depth)
Xử lý triệt để 5 vector tấn công: Tự tạo nick ảo (Self-referral), Bot cày điểm giả lập (Fake activation), Gian lận nạp rồi hoàn tiền (Refund/Chargeback abuse), Spam từ khóa thương hiệu (Brand hijacking) và Giao dịch vòng tròn (Collusion fraud). Kết hợp:
- Dấu vân tay thiết bị (Device Fingerprinting), IP Subnet Velocity Limit ($\le 3$ tài khoản/IP subnet/24h).
- Thời gian giam tiền bảo đảm (Holding Period 7–14 ngày) trước khi hoa hồng được chuyển sang trạng thái khả dụng.
- Ngưỡng rút tiền tối thiểu 100.000đ và đối soát số tài khoản ngân hàng chính chủ.

### R4. Trải Nghiệm Học Viên & Game Hóa Tinh Gọn (UX/UI & Gamification)
- Giao diện trung tâm `/referral` thiết kế theo chuẩn **Technical Minimalist**: bo góc dứt khoát `rounded-md` (tối đa 6px), icon Lucide nét thanh mảnh, tích hợp trực tiếp trên Sidebar và Mobile Drawer.
- Trang tiếp nhận lời mời `/invite/[code]` đi kèm ảnh động OpenGraph cá nhân hóa theo thời gian thực (ví dụ: *"Phong tặng bạn 7 ngày học Pro VIP"*).
- Hệ thống mốc thưởng thăng hạng (Bronze $\to$ Silver $\to$ Gold $\to$ Diamond Ambassador) tạo động lực lan tỏa liên tục.

### R5. Hạ Tầng Kỹ Thuật & Tích Hợp Hệ Thống (Technical Specification & DDL)
- 5 bảng cơ sở dữ liệu mở rộng chuẩn hóa: `referral_campaigns`, `referral_links`, `referral_logs`, `reward_transactions`, `payout_requests`.
- Bộ Stored Procedures PostgreSQL nguyên tử (`fn_process_referral_reward`, `fn_evaluate_referral_activation`, `fn_request_payout`) với cơ chế Row-level Lock (`FOR UPDATE`) triệt tiêu race condition.
- API endpoints Next.js 16 App Router tuân thủ nghiêm ngặt bảo mật phân quyền `service_role` và Supabase RLS.

---

## 4. Lộ Trình Triển Khai & Các Giai Đoạn Ra Mắt (Roll-out Phases)

Dự án được chia thành 3 giai đoạn cuốn chiếu (Iterative Milestones) nhằm kiểm soát rủi ro và tối ưu hóa hiệu quả:

```
2026 Q4                      2026 Q4 - 2027 Q1            2027 Q1+
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│ PHASE 1: MVP CORE LAUNCH │ │ PHASE 2: GAMIFICATION    │ │ PHASE 3: AFFILIATE PRO   │
│ (Tuần 1 - 3)             │ │ (Tuần 4 - 6)             │ │ (Tuần 7 - 10)            │
├──────────────────────────┤ ├──────────────────────────┤ ├──────────────────────────┤
│ - DB Schema & Migrations │ │ - Milestone Tiers & XP   │ │ - Custom Ambassador Portal│
│ - Attribution & Cookie   │ │ - Leaderboard hàng tháng │ │ - Tier hoa hồng 25-30%   │
│ - Tầng 1: Pro VIP Days   │ │ - Dynamic OG Image v2    │ │ - API tích hợp KOC/KOL   │
│ - Tầng 2: Hoa hồng cơ bản│ │ - Push Notifications     │ │ - Xuất hóa đơn & Thuế tự │
│ - Trung tâm /referral    │ │ - Zalo/Messenger Share   │ │   động theo quy định VN  │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

### Giai Đoạn 1: MVP Core Launch (Tuần 1 đến Tuần 3)
- **Mục tiêu**: Đưa vào vận hành luồng cơ bản an toàn 100%, ghi nhận chính xác quan hệ Người mời – Người được mời.
- **Hạng mục**:
  1. Triển khai migration `schema.sql` lên Supabase staging và production.
  2. Bắt attribution cookie `lingopro_ref` tại `ClientBoot.tsx` và API register/OAuth.
  3. Hoàn thiện API `/api/referral/hub`, `/api/referral/link`, `/api/referral/evaluate-activation`.
  4. Móc webhook kích hoạt hoa hồng tại `confirm_paid_order` / `orders.status = 'paid'`.
  5. Ra mắt trang giao diện `/referral` tinh giản và trang nhận lời mời `/invite/[code]`.
  6. Thử nghiệm nội bộ (Alpha Test) với 50 học viên tích cực.

### Giai Đoạn 2: Gamification & Engagement Engine (Tuần 4 đến Tuần 6)
- **Mục tiêu**: Đẩy mạnh hệ số lan truyền K-factor từ 0.2 lên 0.45 thông qua cơ chế mốc thưởng và mạng xã hội.
- **Hạng mục**:
  1. Tích hợp Dynamic OG Image Serverless Edge (`/invite/[code]/opengraph-image.tsx`).
  2. Triển khai hệ thống mốc thưởng Milestone (Thưởng thêm 30 ngày Pro khi mời 3 bạn, Huy hiệu Đại sứ khi mời 10 bạn).
  3. Bảng xếp hạng Top Referrers hàng tháng kèm phần thưởng hiện vật hoặc tiền mặt.
  4. Tự động gửi thông báo đẩy (FCM Push / In-app notification) khi bạn bè đạt mốc kích hoạt hoặc nâng cấp gói.

### Giai Đoạn 3: Affiliate Pro & KOL Partnership Network (Tuần 7 đến Tuần 10)
- **Mục tiêu**: Mở rộng mạng lưới Đối tác Tiếp thị chuyên nghiệp (Giáo viên tiếng Anh, TikTok Creators, KOCs, Admin hội nhóm TOEIC/IELTS).
- **Hạng mục**:
  1. Cho phép tạo mã tùy chỉnh (Custom Slugs: `lingopro.online/r/thayphong`, `lingopro.online/r/ieltsgenz`).
  2. Cổng thông tin riêng cho Đại sứ (Affiliate Partner Portal) với báo cáo chi tiết tỷ lệ nhấp chuột (CTR), tỷ lệ chuyển đổi (CR) và doanh thu phát sinh theo thời gian thực.
  3. Cơ chế nâng hạn mức hoa hồng phân tầng (Tiered Commission) lên 20% – 25% cho các đại sứ đạt doanh số lớn (> 10 triệu VNĐ/tháng).
  4. Hỗ trợ đối soát và khấu trừ thuế TNCN tự động theo quy định của pháp luật Việt Nam.

---

## 5. Bảng Chỉ Số Đo Lường Hiệu Quả (KPIs & Health Metrics Dashboard)

Hệ thống sẽ được giám sát chặt chẽ thông qua các chỉ số cốt lõi sau:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        REFERRAL HEALTH & MONITORING METRICS                            │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────┤
│ Nhóm Chỉ số                  │ Công thức Đo lường           │ Ngưỡng Cảnh báo/Mục tiêu │
├──────────────────────────────┼──────────────────────────────┼──────────────────────────┤
│ 1. Invitation Rate           │ (Users chia sẻ link) / (DAU) │ Mục tiêu: >= 18%         │
│ 2. Click-to-Signup CR        │ (Số lượt đăng ký) / (Clicks) │ Mục tiêu: >= 25%         │
│ 3. Activation Rate           │ (Referees kích hoạt) / (Reg) │ Mục tiêu: >= 40%         │
│ 4. Paid Conversion Rate      │ (Referees mua gói) / (Active)│ Mục tiêu: 10% - 15%      │
│ 5. Viral Coefficient (K)     │ Invites/user * Conversion CR │ Mục tiêu: >= 0.40        │
│ 6. Fraud Flagged Ratio       │ (Giao dịch nghi vấn) / (Tổng)│ Ngưỡng an toàn: < 2.0%   │
│ 7. Net Profit Contribution   │ Lợi nhuận gộp từ Referral    │ Mục tiêu: > 70% doanh thu│
└──────────────────────────────┴──────────────────────────────┴──────────────────────────┘
```

---

## 6. Kết Luận

Tài liệu này cùng toàn bộ gói đặc tả kỹ thuật đi kèm (`01_REWARD_POLICY.md` đến `05_TECHNICAL_SPEC.md` và `schema.sql`) cung cấp một bản thiết kế toàn diện, có cơ sở toán học vững chắc và khả thi 100% trên nền tảng công nghệ hiện tại của LingoPro. 

Khi được đưa vào vận hành, chương trình sẽ là bệ phóng đưa LingoPro tăng trưởng người dùng thần tốc, hạ thấp chi phí thu hút khách hàng về mức tối ưu và thiết lập lợi thế cạnh tranh bền vững tại thị trường EdTech Việt Nam.
