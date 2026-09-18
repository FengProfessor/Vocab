# 05. ĐẶC TẢ KỸ THUẬT HỆ THỐNG & TÍCH HỢP (R5)
## (System Architecture, API Endpoints, Webhook Integration & Concurrency Control)
### Dự án: Hệ Thống Giới Thiệu & Tiếp Thị Liên Kết (Referral & Affiliate Program) — LingoPro
**Ngày ban hành:** 18/09/2026  
**Phiên bản:** 1.0.0  
**Tác giả:** Worker 1 — Technical & Business Specification Lead  
**Vị trí tài liệu:** `docs/proposals/referral-system/05_TECHNICAL_SPEC.md`

---

## 1. Kiến Trúc Tổng Thể & Điểm Tích Hợp (System Architecture Overview)

Hệ thống Referral & Affiliate vận hành trên ngăn xếp công nghệ hiện tại của LingoPro:
- **Client & Routing**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui.
- **Backend & Database**: Supabase PostgreSQL, Edge Functions, Row Level Security (RLS), Stored Procedures (`SECURITY DEFINER`).
- **Billing & Webhooks**: Tích hợp trực tiếp vào luồng thanh toán tự động VietQR (`confirm_paid_order`) qua các cổng SePay / PayOS.
- **Attribution & Cookie**: First-party cookie `lingopro_ref` (30 ngày) kết hợp `sessionStorage` duy trì nguyên vẹn qua chu trình PKCE Google OAuth.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             SƠ ĐỒ TỔNG THỂ KIẾN TRÚC KỸ THUẬT                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ CLIENT (Next.js 16 App Router)                                                              │
│ - Universal Link Capture: ClientBoot.tsx -> captureReferralCode() -> Cookie lingopro_ref    │
│ - Referral Hub: /referral (Dashboard, Copy Link, Progress, Payout Modal)                    │
│ - Landing Page: /invite/[code] + Dynamic OG Image /invite/[code]/opengraph-image.tsx        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ API ROUTER LAYER (Edge & Node.js Runtime)                                                   │
│ - GET  /api/referral/hub                  (Lấy số liệu tổng quan & số dư ví hoa hồng)       │
│ - POST /api/referral/link                 (Sinh / cập nhật mã giới thiệu)                   │
│ - POST /api/referral/resolve              (Tra cứu an toàn mã invite qua Security Definer)  │
│ - POST /api/referral/claim                (Ghi nhận attribution khi đăng ký)                │
│ - POST /api/referral/evaluate-activation  (Đánh giá kích hoạt: Dwell 24h + Monthly Cap 15)  │
│ - POST /api/referral/payout               (Rút tiền: Row Lock + Cap 2M/24h + Bank Dedup)    │
│ - Webhook Hook: /api/billing/webhook      (Tự động tính hoa hồng Net Paid, chống replay)    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ DATABASE LAYER (Supabase PostgreSQL with Hardened RLS & PL/pgSQL RPCs)                      │
│ - Tables: referral_campaigns, referral_links, referral_logs, reward_transactions, payouts   │
│ - RPC: fn_resolve_referral_code()         (Bảo mật lookup mã invite, loại bỏ table dump)    │
│ - RPC: fn_evaluate_referral_activation()  (COALESCE logic + Dwell time 24h + Monthly Cap 15)│
│ - RPC: fn_process_referral_reward()       (Tính hoa hồng Net Paid, kiểm tra fraud_flagged)  │
│ - RPC: fn_clear_matured_rewards()         (Thăng hạng tự động hoa hồng hết holding period)  │
│ - RPC: fn_request_payout()                (Lock FOR UPDATE + Giới hạn 2M + Ghi nợ Ledger)   │
│ - Trigger: trg_order_refund_clawback      (Clawback khi refunded/cancelled + Hủy pending)   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Đặc Tả Chi Tiết 5 Bảng Cơ Sở Dữ Liệu (Database Schema Specification)

### 2.1. Bảng `referral_campaigns` (Chiến dịch & Cấu hình thưởng)
Lưu trữ các chính sách thưởng, quy định mốc kích hoạt và tỷ lệ hoa hồng theo từng thời kỳ:

```sql
CREATE TABLE public.referral_campaigns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,               -- e.g. 'standard-2026', 'summer-rush'
  name                  text NOT NULL,                      -- Tên chiến dịch hiển thị
  referee_reward_days   integer NOT NULL DEFAULT 7,         -- Số ngày Pro tặng bạn mới (Tầng 1)
  referrer_reward_days  integer NOT NULL DEFAULT 7,         -- Số ngày Pro tặng người mời (Tầng 1)
  commission_pct        integer NOT NULL DEFAULT 15,        -- % hoa hồng tiền mặt cơ bản (Tầng 2)
  ambassador_comm_pct   integer NOT NULL DEFAULT 20,        -- % hoa hồng cho hạng Gold/Ambassador
  holding_period_days   integer NOT NULL DEFAULT 7,         -- Số ngày giam tiền chống refund
  min_payout_amount     integer NOT NULL DEFAULT 100000,    -- Ngưỡng rút tiền tối thiểu (100k VNĐ)
  monthly_ref_cap       integer NOT NULL DEFAULT 15,        -- Giới hạn số lượt nhận Pro Tầng 1/tháng
  activation_criteria   jsonb NOT NULL DEFAULT '{"min_streak": 3, "min_words": 30}'::jsonb,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);
```

### 2.2. Bảng `referral_links` (Mã giới thiệu & Liên kết học viên)
Mỗi học viên có 1 mã giới thiệu chính thức:

```sql
CREATE TABLE public.referral_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code         text UNIQUE NOT NULL,               -- Mã viết hoa không dấu (e.g. PHONGVIP)
  custom_slug           text UNIQUE,                        -- e.g. 'thayphong' -> lingopro.online/r/thayphong
  clicks_count          integer NOT NULL DEFAULT 0,         -- Số lượt nhấp link
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_referral_links_user UNIQUE (user_id)
);
CREATE INDEX idx_referral_links_code ON public.referral_links (referral_code);
```

### 2.3. Bảng `referral_logs` (Quan hệ giới thiệu & Phễu chuyển đổi)
Theo dõi hành trình từ khi đăng ký, kích hoạt dùng thử đến khi mua gói:

```sql
CREATE TABLE public.referral_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referee_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id           uuid REFERENCES public.referral_campaigns(id) ON DELETE SET NULL,
  referral_code         text NOT NULL,
  status                text NOT NULL DEFAULT 'registered' 
    CHECK (status IN ('registered', 'activated', 'converted', 'fraud_flagged')),
  ip_address            text,
  ip_subnet             text,                               -- IPv4 /24 hoặc IPv6 /48
  device_fingerprint    text,                               -- Canvas + Audio + WebGL hash
  risk_score            integer NOT NULL DEFAULT 0,         -- Điểm rủi ro từ 0 đến 100
  flagged_reason        text,
  activated_at          timestamptz,                        -- Thời điểm đạt mốc Streak/Từ
  converted_at          timestamptz,                        -- Thời điểm thanh toán đơn hàng đầu tiên
  first_order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_referral_logs_referee UNIQUE (referee_id)   -- 1 học viên chỉ có tối đa 1 người mời
);
CREATE INDEX idx_referral_logs_referrer ON public.referral_logs (referrer_id);
CREATE INDEX idx_referral_logs_status ON public.referral_logs (status);
```

### 2.4. Bảng `reward_transactions` (Sổ cái biến động phần thưởng & hoa hồng)
Ghi nhận toàn bộ ngày Pro VIP và tiền hoa hồng (Hỗ trợ mô hình Sổ cái kép - Double-Entry Ledger):

```sql
CREATE TABLE public.reward_transactions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_log_id       uuid REFERENCES public.referral_logs(id) ON DELETE SET NULL,
  order_id              uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_type           text NOT NULL CHECK (reward_type IN ('pro_days', 'cash_commission', 'affiliate_cash', 'milestone_bonus', 'payout_debit', 'clawback_debt')),
  pro_days              integer NOT NULL DEFAULT 0 CHECK (pro_days >= 0),
  amount                integer NOT NULL DEFAULT 0,         -- Hỗ trợ số âm cho bút toán ghi nợ payout_debit và clawback
  status                text NOT NULL DEFAULT 'available'
    CHECK (status IN ('pending_clearance', 'available', 'deducted', 'withdrawn', 'cancelled', 'clawback')),
  available_at          timestamptz NOT NULL DEFAULT now(), -- Mốc mở khóa sau Holding Period
  note                  text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reward_tx_user_status ON public.reward_transactions (user_id, status);
CREATE INDEX idx_reward_tx_available ON public.reward_transactions (status, available_at);

-- Unique Index đảm bảo Idempotency tuyệt đối: Không bao giờ chi trả hoa hồng 2 lần cho 1 đơn hàng
CREATE UNIQUE INDEX idx_unique_cash_reward_order 
  ON public.reward_transactions (order_id, user_id) 
  WHERE reward_type IN ('affiliate_cash', 'cash_commission');
```

### 2.5. Bảng `payout_requests` (Yêu cầu rút tiền hoa hồng)
Quản lý yêu cầu chuyển khoản hoa hồng về ngân hàng cá nhân (Bảo vệ RLS & Anti-Double-Spend):

```sql
CREATE TABLE public.payout_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount                integer NOT NULL CHECK (amount >= 100000 AND amount <= 2000000), -- Tối thiểu 100k, tối đa 2M/lần
  bank_name             text NOT NULL,                      -- e.g. 'MBBank', 'Vietcombank'
  bank_account_number   text NOT NULL,
  bank_account_holder   text NOT NULL,                      -- Tên viết hoa không dấu
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note            text,
  processed_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payout_requests_user ON public.payout_requests (user_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests (status);
CREATE INDEX idx_payout_requests_bank_acc ON public.payout_requests (bank_account_number);
```

---

## 3. Đặc Tả Danh Sách API Endpoints (Next.js 16 App Router)

### 3.1. `GET /api/referral/hub`
- **Mô tả**: Trả về dữ liệu toàn diện hiển thị trên màn hình `/referral` của học viên đang đăng nhập.
- **Xác thực**: Bắt buộc (Bearer JWT token qua header `Authorization`).
- **Request**: Không có body.
- **Response `200 OK`**:
```json
{
  "referralCode": "PHONGVIP88",
  "customSlug": "thayphong",
  "shareUrl": "https://lingopro.online/invite/PHONGVIP88",
  "metrics": {
    "totalInvited": 14,
    "totalActivated": 9,
    "totalConverted": 3,
    "proDaysEarned": 63,
    "availableBalance": 269550,
    "pendingBalance": 89850,
    "totalWithdrawn": 500000
  },
  "tier": {
    "currentRank": "silver",
    "currentRankName": "Đại Sứ Bạc",
    "nextRank": "gold",
    "activatedForNextRank": 10,
    "progressPct": 90,
    "targetRemaining": 1
  },
  "friends": [
    {
      "id": "uuid-1",
      "name": "Nguyễn Minh Anh",
      "registeredAt": "2026-09-16T08:30:00Z",
      "status": "activated",
      "hasPurchased": true,
      "proDaysGranted": 7
    }
  ],
  "payoutHistory": [
    {
      "id": "payout-uuid-1",
      "amount": 500000,
      "status": "completed",
      "bankName": "MBBank",
      "accountNumber": "0369888***",
      "createdAt": "2026-09-10T14:20:00Z"
    }
  ]
}
```

---

### 3.2. `POST /api/referral/link`
- **Mô tả**: Sinh mã giới thiệu ngẫu nhiên hoặc đăng ký Custom Slug (`lingopro.online/r/thayphong`).
- **Xác thực**: Bắt buộc (`auth.uid()`).
- **Request Body**:
```json
{
  "customSlug": "thayphong" // (Optional, 4-20 chars alphanumeric)
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "referralCode": "PHONGVIP88",
  "customSlug": "thayphong",
  "shareUrl": "https://lingopro.online/invite/PHONGVIP88"
}
```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Custom slug chỉ được chứa chữ cái và số (4-20 ký tự)"}`
  - `409 Conflict`: `{"error": "Tên liên kết này đã được sử dụng bởi người khác"}`

---

### 3.3. `POST /api/referral/claim`
- **Mô tả**: Ghi nhận mã giới thiệu khi người dùng mới tạo tài khoản hoặc đăng nhập lần đầu bằng Google OAuth.
- **Xác thực**: Bắt buộc (Tài khoản vừa tạo).
- **Request Body**:
```json
{
  "referralCode": "PHONGVIP88",
  "deviceFingerprint": "canvas_audio_hash_xyz...",
  "screenResolution": "1920x1080"
}
```
- **Xử lý Logic**:
  1. Kiểm tra mã tồn tại trong `referral_links`.
  2. Ngăn chặn Self-Referral: `referrer.id !== auth.uid()`.
  3. Kiểm tra tính duy nhất: Người dùng chưa từng được gắn referral (`referee_id` chưa có trong `referral_logs`).
  4. Đánh giá sơ bộ điểm rủi ro `risk_score` (kiểm tra device collision và subnet IP velocity).
  5. Chèn bản ghi vào `referral_logs` với `status = 'registered'`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "referrerName": "Nguyễn Phong",
  "rewardDaysPreview": 7
}
```

---

### 3.4. `POST /api/referral/evaluate-activation`
- **Mô tả**: Đánh giá điều kiện kích hoạt Tầng 1 (Streak $\ge 3$ ngày HOẶC từ vựng $\ge 30$) cho tài khoản hiện tại. Được gọi ngầm sau khi học viên hoàn thành một phiên học (FSRS review, quiz hoặc bài đọc).
- **Xác thực**: Bắt buộc (`auth.uid()`).
- **Xử lý Logic**:
  - Gọi Stored Procedure PostgreSQL `fn_evaluate_referral_activation(auth.uid())`.
  - **Khắc phục lỗi Three-Valued Logic**: Sử dụng scalar subquery kết hợp `COALESCE` trên `user_gamification.current_streak` và `srs_progress`, bảo đảm nếu tài khoản chưa có bản ghi gamification thì giá trị streak luôn là `0` (không bao giờ bị `NULL` đánh lừa điều kiện `IF`).
  - **Kiểm tra Dwell-Time chống Bot**: 
    + Tài khoản người được mời bắt buộc phải có tuổi đời $\ge 24$ giờ HOẶC có hoạt động học tập trên ít nhất 2 ngày lịch riêng biệt (`srs_progress` across $\ge 2$ distinct calendar dates).
    + Nếu tiêu chí từ vựng đạt được qua SRS, kiểm tra độ trôi thời gian `max(created_at) - min(created_at) >= interval '60 seconds'`. Nếu $< 60$ giây, hệ thống tự động chuyển `status = 'fraud_flagged'` và từ chối kích hoạt.
  - **Khống chế trần thưởng tháng (Monthly Referrer Cap)**:
    + Truy vấn số lượt nhận thưởng Pro VIP của Người mời trong tháng hiện tại từ `reward_transactions`.
    + Nếu đã đạt trần `monthly_ref_cap` (mặc định 15 lượt/tháng), hệ thống kích hoạt quà cho Bạn mới nhưng **không cấp thêm ngày Pro cho Người mời**, ghi nhận giao dịch `cancelled` với lý do đạt trần tháng.
  - **Bảo toàn hạng Premium (Tier Rank Preservation)**: Nếu người nhận đang có hạn `premium`, hệ thống giữ nguyên gói `premium` và cộng thêm 7 ngày vào `plan_expires_at`, ghi đúng `new_plan = 'premium'` vào `subscription_history`.
- **Response `200 OK`**:
```json
{
  "activated": true,
  "proDaysAwarded": 7,
  "referrerCapReached": false,
  "newPlanExpiresAt": "2026-09-25T14:00:00Z"
}
```

---

### 3.5. `POST /api/referral/payout`
- **Mô tả**: Học viên tạo yêu cầu rút tiền hoa hồng khả dụng về tài khoản ngân hàng.
- **Xác thực**: Bắt buộc (`auth.uid()`).
- **Request Body**:
```json
{
  "amount": 200000,
  "bankName": "MBBank",
  "bankAccountNumber": "0369888999",
  "bankAccountHolder": "NGUYEN HOANG PHONG"
}
```
- **Xử lý Logic (Được bảo vệ bởi RPC `fn_request_payout` với quyền `SECURITY DEFINER`)**:
  1. **Kiểm tra tham số đầu vào**: `amount >= 100000` (ngưỡng tối thiểu) và `amount <= 2000000` (trần tối đa cho mỗi lệnh rút).
  2. **Khóa hàng nguyên tử (Row-Level Locking)**: Thực thi `PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;` nhằm tuần tự hóa mọi yêu cầu đồng thời, triệt tiêu 100% nguy cơ tấn công Double-Spending Race Condition.
  3. **Khống chế hạn mức rút tiền 24 giờ**: Tính tổng các lệnh rút tiền trong vòng 24 giờ qua (`status IN ('pending', 'approved', 'completed')`). Nếu tổng tiền đã rút cộng thêm khoản yêu cầu mới $> 2.000.000đ$, hệ thống ném ngoại lệ `P0005: Vượt quá hạn mức 2.000.000 VNĐ / 24h`.
  4. **Chống trùng lặp số tài khoản ngân hàng (Anti-Sybil KYC)**: Kiểm tra xem `bank_account_number` đã được sử dụng bởi bất kỳ `user_id` nào khác trên hệ thống hay chưa. Nếu đã tồn tại ở tài khoản khác, từ chối với mã lỗi `P0006` và yêu cầu xác thực KYC.
  5. **Tự động thăng hạng hoa hồng đến hạn (Auto-Mature Clearance)**: Tự động chuyển đổi các khoản hoa hồng có `status = 'pending_clearance'` và `available_at <= now()` sang `status = 'available'`.
  6. **Tính số dư ròng theo Sổ Cái Kép (Double-Entry Ledger Balance)**:
     $$\text{Số Dư Khả Dụng} = \sum \text{reward\_transactions.amount} \quad (\text{với status } \in \{'available', 'deducted'\} \text{ và available\_at} \le \text{now()})$$
     Nếu số dư khả dụng $< \text{p\_amount}$, hệ thống ném ngoại lệ `P0003: Số dư không đủ`.
  7. **Chèn yêu cầu rút tiền**: Tạo bản ghi trong `payout_requests` với `status = 'pending'`.
  8. **Ghi nợ tức thì vào sổ cái (Atomic Debit Entry)**: Chèn ngay một bản ghi ghi nợ vào `reward_transactions` với `reward_type = 'payout_debit'`, `amount = -p_amount`, `status = 'deducted'`. Điều này đảm bảo số dư khả dụng bị trừ ngay lập tức tại giây thứ 0, không thể bị tái sử dụng.
- **Response `200 OK`**:
```json
{
  "success": true,
  "requestId": "payout-uuid-xyz",
  "amount": 200000,
  "remainingAvailableBalance": 69550,
  "message": "Yêu cầu rút tiền đã được tiếp nhận và xử lý thành công trong hàng đợi."
}
```

---

### 3.6. Quản Trị Viên: `GET /api/admin/referral/payouts` & `POST /api/admin/referral/payouts/[id]/approve`
- **Mô tả**: Dành riêng cho Admin đối soát và phê duyệt chuyển khoản VietQR tự động.
- **Xác thực**: Quyền Admin (`callerProfile.role === 'admin' || getAdminEmails().includes(email)`).
- **Endpoint Approve Body**:
```json
{
  "paymentRef": "NAPAS247_TX_987654321",
  "adminNote": "Đã chuyển khoản thành công qua VietQR"
}
```
- **Hành động Phê duyệt**: Chuyển `payout_requests.status = 'completed'`, ghi nhận `processed_at = now()` và lưu mã tham chiếu giao dịch Napas 247. Bút toán ghi nợ `payout_debit` trong sổ cái được giữ nguyên.
- **Hành động Từ chối (Reject)**: Nếu Admin từ chối lệnh rút tiền, chuyển `payout_requests.status = 'rejected'`, đồng thời cập nhật bản ghi ghi nợ `payout_debit` tương ứng sang `status = 'cancelled'` để hoàn trả lại số dư khả dụng cho học viên.

---

## 4. Tích Hợp Webhook Thanh Toán (`confirm_paid_order`)

Hoa hồng Tầng 2 được kết nối trực tiếp vào sự kiện thanh toán thành công của đơn hàng.

### 4.1. Cơ Chế Móc (Hooking Point) & Kiểm Tra Gian Lận
Tại file `src/app/api/billing/webhook/route.ts`, ngay sau khi hàm PostgreSQL RPC `confirm_paid_order` thực thi thành công:

```typescript
// src/app/api/billing/webhook/route.ts
if (confirmResult.success && order.amount > 0) {
  try {
    // Kích hoạt tính toán hoa hồng Referral / Affiliate an toàn
    const { data: refResult, error: refError } = await supabase.rpc(
      'fn_process_referral_reward',
      {
        p_order_id: order.id,
        p_referee_id: order.user_id,
        p_order_amount: order.amount, // Tính trên Net Paid Amount sau coupon
      }
    );
    if (refError) {
      console.error('[ReferralWebhook] Error processing commission:', refError);
    } else if (refResult?.reward_awarded) {
      console.info(`[ReferralWebhook] Awarded ${refResult.commission_amount} VND to referrer ${refResult.referrer_id}`);
    } else {
      console.info(`[ReferralWebhook] Referral skipped: ${refResult?.status} (${refResult?.reason || 'no action'})`);
    }
  } catch (err) {
    console.error('[ReferralWebhook] Unexpected error:', err);
  }
}
```

### 4.2. Đảm Bảo Tính Bất Khả Trùng Lặp (Idempotency) & Chống Gian Lận
1. **Kiểm tra cờ gian lận (Fraud Flag Guard)**: RPC `fn_process_referral_reward` kiểm tra nếu `referral_logs.status = 'fraud_flagged'`, lập tức từ chối chi trả hoa hồng và không chuyển trạng thái sang `converted`.
2. **Khóa Idempotency Cấp Cơ Sở Dữ Liệu**:
   - Chỉ mục duy nhất `idx_unique_cash_reward_order` trên `(order_id, user_id)` chặn đứng hoàn toàn việc chèn trùng lặp ngay cả khi có 2 webhook retries gửi song song từ SePay/PayOS.
   - RPC kiểm tra `IF EXISTS` trước khi chèn, trả về `duplicate_order_ignored` an toàn.
3. **Trigger Thu Hồi & Hủy Rút Tiền Tự Động (Clawback & TOCTOU Resolution)**:
   - Trigger `trg_order_refund_clawback` kích hoạt khi đơn hàng đổi trạng thái sang `status IN ('refunded', 'cancelled')`.
   - Cập nhật toàn bộ hoa hồng liên quan sang `status = 'clawback'`.
   - **Tự động hủy các lệnh rút tiền đang pending**: Chuyển các yêu cầu trong `payout_requests` có `status = 'pending'` của người giới thiệu sang `status = 'rejected'`, ngăn chặn triệt để lỗ hổng kẻ gian mua hàng nhận hoa hồng, bấm rút tiền rồi yêu cầu hoàn tiền đơn hàng.

---

## 5. Chính Sách Bảo Mật CSDL (Row Level Security - RLS)

Tuân thủ nghiêm ngặt nguyên tắc **Zero Trust & Non-recursive self-scoped policies**:

1. **Bảng `referral_links`**:
   - `SELECT`: Cho phép `auth.uid() = user_id` (học viên xem liên kết của chính mình).
   - **Loại bỏ hoàn toàn lỗ hổng Table Dump (`USING (true)`)**: Khách vãng lai không được phép quét bảng để thu thập dữ liệu người dùng. Việc phân giải mã giới thiệu công khai cho Landing Page `/invite/[code]` được thực hiện độc quyền qua Stored Procedure `fn_resolve_referral_code(p_code)` (`SECURITY DEFINER`).
   - `INSERT / UPDATE`: Chỉ cho phép `auth.uid() = user_id`.
2. **Bảng `referral_logs`**:
   - `SELECT`: Cho phép `auth.uid() = referrer_id` (Người mời xem danh sách bạn bè đã mời).
   - `INSERT / UPDATE / DELETE`: Bị `REVOKE` toàn bộ khỏi role `anon` và `authenticated`. Mọi thao tác ghi nhận quan hệ và cập nhật trạng thái bắt buộc thực thi qua `service_role` trong API route hoặc Stored Procedure.
3. **Bảng `reward_transactions`**:
   - `SELECT`: Cho phép `auth.uid() = user_id` (xem lịch sử ví hoa hồng của chính mình).
   - `INSERT / UPDATE / DELETE`: Bị `REVOKE` toàn bộ khỏi Client SDK. Mọi biến động số dư phải do Stored Procedures (`fn_process_referral_reward`, `fn_request_payout`, `fn_evaluate_referral_activation`) thực thi.
4. **Bảng `payout_requests`**:
   - `SELECT`: Cho phép `auth.uid() = user_id` (học viên chỉ xem được yêu cầu rút tiền của chính mình).
   - **Cấm Client INSERT trực tiếp**: Thu hồi hoàn toàn quyền `INSERT, UPDATE, DELETE` khỏi role `anon` và `authenticated`. Mọi yêu cầu rút tiền bắt buộc phải khởi tạo qua Stored Procedure `fn_request_payout()`, bảo đảm 100% yêu cầu đều được kiểm tra số dư và áp dụng khóa chống gian lận.
