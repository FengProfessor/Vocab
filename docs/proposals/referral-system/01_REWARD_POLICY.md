# 01. CHÍNH SÁCH & CƠ CẤU THƯỞNG HYBRID (R1)
## (Reward Policy & Tiered Incentive Structure)
### Dự án: Hệ Thống Giới Thiệu & Tiếp Thị Liên Kết (Referral & Affiliate Program) — LingoPro
**Ngày ban hành:** 18/09/2026  
**Phiên bản:** 1.0.0  
**Tác giả:** Worker 1 — Technical & Business Specification Lead  
**Vị trí tài liệu:** `docs/proposals/referral-system/01_REWARD_POLICY.md`

---

## 1. Bản Chất Kiến Trúc Thưởng Kép (Two-Sided Hybrid Reward Framework)

Chương trình Giới thiệu & Tiếp thị Liên kết của LingoPro được xây dựng trên triết lý **"Hai bên cùng có lợi" (Two-sided Win-Win)**, kết hợp hài hòa giữa **Giá trị Trải nghiệm (In-App Utility)** và **Lợi ích Tài chính (Financial Incentive)**. 

Cơ chế này chia làm 2 tầng độc lập nhưng tương hỗ chặt chẽ:

```
                                  LUỒNG LAN TRUYỀN HYBRID 2 TẦNG
                                  
   NGƯỜI GIỚI THIỆU (REFERRER)                     NGƯỜI ĐƯỢC MỜI (REFEREE)
 ┌───────────────────────────────┐               ┌───────────────────────────────┐
 │ Học viên LingoPro hiện hữu    │               │ Bạn bè, người học mới         │
 └──────────────┬────────────────┘               └──────────────┬────────────────┘
                │ Chia sẻ link / mã invite                      │ Nhấp link, tạo tài khoản
                ▼                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ TẦNG 1: TRẢI NGHIỆM HỌC THỬ (FREE-TO-TRIAL ENGAGEMENT)                        │
 │ Điều kiện: Referee đạt Mốc Kích Hoạt (Streak >= 3 ngày HOẶC học >= 30 từ)     │
 ├───────────────────────────────┬───────────────────────────────────────────────┤
 │ 🎁 Nhận +7 Ngày Pro VIP       │ 🎁 Mở khóa +7 Ngày Pro VIP                    │
 │    (Cộng dồn vào hạn dùng)    │    (Trải nghiệm full AI, FSRS, Video & Thi)   │
 └───────────────────────────────┴───────────────────────────────────────────────┘
                │                                               │
                │ Sau khi học thử Pro, Referee nâng cấp gói trả phí (Pro/Premium)
                ▼                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │ TẦNG 2: HOA HỒNG DOANH THU (MONETIZATION & AFFILIATE COMMISSION)              │
 │ Điều kiện: Referee thanh toán thành công đơn hàng (orders.status = 'paid')    │
 ├───────────────────────────────┬───────────────────────────────────────────────┤
 │ 💰 Nhận 15% - 20% Tiền Mặt     │ 🏷️ Nhận chiết khấu chào mừng thêm 5% - 10%    │
 │    (Rút về VietQR ngân hàng)  │    kèm quà tặng giáo trình số hóa             │
 └───────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Chi Tiết Tầng 1: Thưởng Ngày Học Pro VIP (Engagement & Activation)

### 2.1. Mục Đích & Cơ Chế
- **Mục đích**: Loại bỏ rào cản tài chính ban đầu, khuyến khích học viên mới trải nghiệm trọn vẹn những tính năng cao cấp nhất của LingoPro (AI tra từ không giới hạn, FSRS v5 Spaced Repetition, phòng thi thử TOEIC/VSTEP).
- **Nguyên tắc cốt lõi**: **KHÔNG TẶNG THƯỞNG NGAY KHI VỪA ĐĂNG KÝ**. Quà tặng Pro VIP chỉ được kích hoạt khi Người được mời (Referee) chứng minh mình là một người học thực thụ thông qua **Sự Kiện Kích Hoạt (Activation Event)**.

### 2.2. Tiêu Chí Kích Hoạt (Activation Criteria)
Kế thừa trực tiếp cấu trúc dữ liệu đã được kiểm chứng tại `src/lib/pro-trial-milestone.ts`. Một tài khoản Referee được coi là kích hoạt thành công khi thỏa mãn **ít nhất 1 trong 3 điều kiện**:

1. **Điều kiện 1 (Streak Học Tập)**: Duy trì Streak học tập liên tục $\ge 3$ ngày (`user_gamification.current_streak >= 3`).
2. **Điều kiện 2 (Tích Lũy Từ Vựng)**: Đã học và ghi nhớ $\ge 30$ từ vựng trong hệ thống (`Math.max(srs_progress.count, words.added_by.count, personal_classroom_words) >= 30`).
3. **Điều kiện 3 (Hoàn Thành Bài Học Lộ Trình)**: Hoàn thành $\ge 1$ bài học trên Lộ trình học (`user_roadmap_steps.status = 'completed'` với điểm số $\ge 80\%$) HOẶC hoàn thành 1 bài luyện nghe video (`daily_reading_completions`).

### 2.3. Quy Tắc Cộng Dồn Hạn VIP (Additive Stacking Rule)
Tuân thủ nghiêm ngặt nguyên tắc của LingoPro (`confirm_paid_order` và `grantGroupEntitlement`):
- **Trường hợp tài khoản đang là Free hoặc đã hết hạn**:  
  `starts_at = now()`, `expires_at = now() + 7 days`.
- **Trường hợp tài khoản đang có hạn Pro còn hiệu lực (`plan_expires_at > now()`)**:  
  Thời hạn mới được nối tiếp cộng dồn: `starts_at = plan_expires_at`, `new_expires_at = plan_expires_at + 7 days`. Không bị ghi đè, không bị mất ngày cũ.
- **Trường hợp tài khoản đang có hạn Premium**:  
  Hệ thống bảo lưu gói `premium`, cộng thêm 7 ngày vào `plan_expires_at` để bảo vệ quyền lợi học viên (Tier Rank Preservation).
- Ghi nhận lịch sử vào bảng `subscription_history` với `reason = 'referral_activation_reward'`.

---

## 3. Chi Tiết Tầng 2: Hoa Hồng Tiền Mặt (Monetization & Affiliate)

### 3.1. Đối Tượng Áp Dụng
Khi Referee thực hiện giao dịch thanh toán thành công (`orders.status = 'paid'`) cho bất kỳ gói trả phí cá nhân hoặc gói nhóm nào trên LingoPro.

### 3.2. Cơ Sở Tính Hoa Hồng (Commission Base) & Quy Tắc Khống Chế Giảm Giá

#### 1. Nguyên Tắc Tính Trên Doanh Thu Thực Thu (Net Commission Rule)
Hoa hồng tiền mặt của Tiếp thị liên kết được tính toán nghiêm ngặt dựa trên **Số tiền thực thu (Net Paid Amount)** của đơn hàng (`orders.amount`), sau khi đã khấu trừ toàn bộ mã giảm giá coupon, điểm tích lũy hoặc khuyến mãi flash sale:
$$\text{Tiền Hoa Hồng} = \text{orders.amount} \times \text{Commission Rate (\%)} $$
- **Tuyệt đối không tính trên giá niêm yết (Gross/List Price)**: Nếu gói Pro 1 Năm có giá niêm yết 948.000đ, giá bán 599.000đ, khách hàng thanh toán 599.000đ thì hoa hồng 15% được tính trên 599.000đ ($= 89.850đ$), không bao giờ tính trên 948.000đ.

#### 2. Quy Tắc Khống Chế Hoa Hồng Cho Đơn Giảm Giá Sâu (Discount Coupon Cap Rule)
Nhằm bảo vệ an toàn ngân sách và giữ vững biên lợi nhuận ròng của doanh nghiệp:
- **Đơn hàng giảm giá sâu (> 30% discount hoặc voucher sinh viên)**: Khi khách hàng áp dụng coupon khuyến mãi có mức giảm $> 30\%$ so với giá bán chuẩn (ví dụ coupon giảm 40%), tỷ lệ hoa hồng tiền mặt của Người giới thiệu tự động được **áp trần tối đa ở mức 10%** (thay vì 15% - 20%).
- **Bảo vệ biên lợi nhuận ròng $\ge 15\%$**: Quy tắc này đảm bảo ngay cả trong kịch bản khách hàng dùng coupon giảm 40% kết hợp hoa hồng, biên lợi nhuận ròng sau chi phí COGS và cổng thanh toán của LingoPro vẫn **luôn đạt $\ge 15\%$**, không bao giờ xảy ra tình trạng biên lợi nhuận âm.

### 3.3. Quy Chế Trả Thưởng & Rút Tiền (Payout & Holding Rules)
1. **Thời gian giam tiền bảo đảm (Holding Period)**:
   - Các khoản hoa hồng phát sinh sẽ ở trạng thái `pending_clearance` trong **7 ngày** (đối với gói 1-3 tháng) và **14 ngày** (đối với gói 6-12 tháng).
   - Mục đích: Phòng chống các giao dịch gian lận nạp tiền để nhận hoa hồng rồi khiếu nại hoàn tiền (Chargeback/Refund abuse). Sau khi hết Holding Period, số dư tự động chuyển sang `available`.
2. **Hạn mức rút tiền tối thiểu (Minimum Payout Threshold)**:
   - Số dư khả dụng $\ge \mathbf{100.000đ}$.
   - Học viên tạo lệnh rút tiền tại màn hình `/referral`. Tiền được chuyển khoản trực tiếp qua VietQR (mạng lưới Napas 247) đến tài khoản ngân hàng chính chủ.

---

## 4. Phân Tích So Sánh 3 Kịch Bản Mức Thưởng (Scenario Analysis)

Để Ban Giám Đốc và Bộ phận Tài chính có góc nhìn đa chiều, chúng tôi xây dựng 3 kịch bản:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SO SÁNH 3 KỊCH BẢN CHÍNH SÁCH THƯỞNG                             │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ THÔNG SỐ                     │ 1. BẢO THỦ (CONSERVATIVE)    │ 2. CÂN BẰNG (BALANCED - CHỌN) │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ Ngày Pro VIP (Tầng 1)        │ 5 ngày Pro (Mỗi bên)         │ 7 ngày Pro (Mỗi bên)          │
│ Hoa hồng Affiliate (Tầng 2)  │ 10% cố định                  │ 15% (Cơ bản) -> 20% (Mốc cao) │
│ Mốc thưởng bổ sung           │ Không có                     │ Mời 3 bạn: +30d Pro; 10 bạn:  │
│                              │                              │ Ambassador Badge + 200k tiền  │
│ K-factor ước tính            │ 0.15 - 0.25                  │ 0.35 - 0.55                   │
│ Biên lợi nhuận ròng (1Y Pro) │ 83.2%                        │ 77.2%                         │
│ Rủi ro gian lận              │ Rất thấp                     │ Thấp (Kiểm soát tốt bằng R3)  │
│ Đánh giá phù hợp             │ Phù hợp khi nguồn vốn eo hẹp │ KHUYẾN NGHỊ: Cân bằng hoàn hảo│
├──────────────────────────────┴──────────────────────────────┴───────────────────────────────┤
│ 3. TĂNG TRƯỞNG ĐỘT PHÁ (AGGRESSIVE / HYPER-GROWTH)                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Ngày Pro VIP (Tầng 1)        │ 14 ngày Pro (Mỗi bên)                                        │
│ Hoa hồng Affiliate (Tầng 2)  │ 25% (Cơ bản) -> 30% (KOC/KOL)                                │
│ Mốc thưởng bổ sung           │ Thưởng thêm 100k cho mỗi 5 bạn kích hoạt (kể cả chưa mua gói)│
│ K-factor ước tính            │ 0.60 - 0.85                                                  │
│ Biên lợi nhuận ròng (1Y Pro) │ 62.5%                                                        │
│ Rủi ro gian lận              │ Cao (Dễ bị nông trại cày nick và script bot tấn công)        │
│ Đánh giá phù hợp             │ Phù hợp giai đoạn gọi vốn hoặc chiến dịch ngắn hạn (2 tuần)  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1. Luận Điểm Lựa Chọn Kịch Bản 2 (Cân Bằng - Balanced)
Chúng tôi **khuyến nghị áp dụng Kịch bản 2 (Cân bằng)** vì 4 lý do chiến lược:
1. **7 ngày Pro VIP là "Điểm rơi tâm lý" hoàn hảo**: 7 ngày đủ dài để học viên trải nghiệm thói quen học tập (Streak) và cảm nhận giá trị của FSRS v5 + Video song ngữ, nhưng đủ ngắn để tạo sự thôi thúc (Urgency) nâng cấp gói trả phí trước khi tài khoản bị giới hạn lại.
2. **Tỷ lệ hoa hồng 15% – 20% hấp dẫn vượt trội**: Trong thị trường EdTech Việt Nam, mức hoa hồng 15-20% cho sản phẩm số (Digital Subscriptions) là cực kỳ cạnh tranh so với các sàn thương mại điện tử (chỉ 3-8% cho Shopee/Lazada Affiliate).
3. **Biên lợi nhuận ròng được bảo vệ an toàn trên 75%**: Ngay cả sau khi trừ 15-20% hoa hồng, 1.5% cổng thanh toán và chi phí hạ tầng AI, LingoPro vẫn giữ lại hơn 75% doanh thu thuần.
4. **Hỗ trợ Gamification linh hoạt**: Cho phép áp dụng thêm mốc thưởng Milestone (Mời 3 bạn tặng 1 tháng Pro; Mời 10 bạn nhận thưởng 200.000đ) mà không làm thâm hụt ngân sách tiếp thị.

---

## 5. Ma Trận Trả Thưởng Chi Tiết Cho Từng Gói Cước LingoPro

Bảng tính toán số tiền hoa hồng thực chi cho Người giới thiệu (Referrer) dựa trên bảng giá thực tế từ `src/lib/billing.ts`:

### 5.1. Bảng Trả Thưởng Cho Gói Pro Cá Nhân
- Giá tháng cơ sở: **79.000đ**
- Giá năm cơ sở: **599.000đ**

| Gói Cước | Giá Bán Niêm Yết | Giảm Giá Kỳ Hạn | Số Tiền Khách Trả (`amount`) | Kịch Bản 1: Bảo Thủ (10%) | Kịch Bản 2: Cân Bằng (15%) [KHUYẾN NGHỊ] | Kịch Bản 2: Ambassador (20%) | Kịch Bản 3: Đột Phá (25%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Pro 1 Tháng** | 79.000đ | 0% | **79.000đ** | 7.900đ | **11.850đ** | 15.800đ | 19.750đ |
| **Pro 3 Tháng** | 237.000đ | 10% | **213.300đ** | 21.330đ | **31.995đ** | 42.660đ | 53.325đ |
| **Pro 6 Tháng** | 474.000đ | 20% | **379.200đ** | 37.920đ | **56.880đ** | 75.840đ | 94.800đ |
| **Pro 1 Năm (12M)**| 948.000đ | ~36.8% | **599.000đ** | 59.900đ | **89.850đ** | 119.800đ | 149.750đ |

### 5.2. Bảng Trả Thưởng Cho Gói Premium Cá Nhân
- Giá tháng cơ sở: **129.000đ**
- Giá năm cơ sở: **899.000đ**

| Gói Cước | Giá Bán Niêm Yết | Giảm Giá Kỳ Hạn | Số Tiền Khách Trả (`amount`) | Kịch Bản 1: Bảo Thủ (10%) | Kịch Bản 2: Cân Bằng (15%) [KHUYẾN NGHỊ] | Kịch Bản 2: Ambassador (20%) | Kịch Bản 3: Đột Phá (25%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Premium 1 Tháng** | 129.000đ | 0% | **129.000đ** | 12.900đ | **19.350đ** | 25.800đ | 32.250đ |
| **Premium 3 Tháng** | 387.000đ | 10% | **348.300đ** | 34.830đ | **52.245đ** | 69.660đ | 87.075đ |
| **Premium 6 Tháng** | 774.000đ | 20% | **619.200đ** | 61.920đ | **92.880đ** | 123.840đ | 154.800đ |
| **Premium 1 Năm (12M)**| 1.548.000đ | ~41.9% | **899.000đ** | 89.900đ | **134.850đ** | 179.800đ | 224.750đ |

### 5.3. Bảng Trả Thưởng Cho Gói Nhóm (Group Plan - Tùy Chọn Mở Rộng)
Khi một Referrer giới thiệu được một nhóm học sinh (ví dụ Trưởng nhóm hoặc Giáo viên mua gói nhóm từ 2 đến 5 ghế Pro):

| Cấu Hình Gói Nhóm | Đơn Giá Ghế/Tháng | Kỳ Hạn | Tổng Tiền Đơn Hàng (`amount`) | Hoa Hồng Cân Bằng (15%) | Hoa Hồng Ambassador (20%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Nhóm 3 Ghế - 3 Tháng** | 49.000đ | 3 Tháng (-10%) | **396.900đ** | 59.535đ | 79.380đ |
| **Nhóm 5 Ghế - 3 Tháng** | 39.000đ | 3 Tháng (-10%) | **526.500đ** | 78.975đ | 105.300đ |
| **Nhóm 5 Ghế - 1 Năm** | 39.000đ | 1 Năm (~36.8%) | **1.478.500đ** | 221.775đ | 295.700đ |

---

## 6. Chính Sách Mốc Thưởng & Thăng Hạng Gamification (Milestone Ladder)

Nhằm duy trì động lực giới thiệu liên tục (thay vì học viên chỉ mời 1 người rồi dừng lại), hệ thống triển khai thang bậc thành tích **LingoPro Referral Ranks**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             LINGOPRO REFERRAL MILESTONE LADDER                              │
├───────────────┬──────────────────┬─────────────────────────────┬────────────────────────────┤
│ Thứ Hạng      │ Số Bạn Kích Hoạt │ Phần Thưởng Ngày Học Pro    │ Quyền Lợi Hoa Hồng Tiền Mặt│
├───────────────┼──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 🥉 BRONZE     │ 1 Bạn            │ +7 Ngày Pro VIP             │ 15% Hoa hồng cơ sở         │
├───────────────┼──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 🥈 SILVER     │ 3 Bạn            │ Tặng thêm 30 Ngày Pro VIP   │ 15% Hoa hồng cơ sở         │
│               │                  │ (Trị giá 79.000đ)           │                            │
├───────────────┼──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 🥇 GOLD       │ 10 Bạn           │ Huy hiệu "Đại Sứ LingoPro"  │ Nâng tỷ lệ hoa hồng lên 20%│
│ (Ambassador)  │                  │ + Thưởng nóng 200.000đ tiền │ Rút tiền ưu tiên < 2h      │
├───────────────┼──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 💎 DIAMOND    │ 25+ Bạn          │ 1 Năm Pro VIP Miễn Phí      │ 20% - 25% Hoa hồng VIP     │
│ (KOL Partner) │                  │ (Trị giá 599.000đ)          │ Cấp Custom Link riêng biệt │
└───────────────┴──────────────────┴─────────────────────────────┴────────────────────────────┘
```

---

## 7. Quy Tắc Chống Gian Lận Cốt Lõi Về Mặt Chính Sách (Policy Guardrails)

1. **Giới hạn số lượt nhận thưởng theo tháng (Monthly Cap per User)**:
   - Học viên thông thường (Bậc Bronze & Silver): Tối đa **15 lượt nhận thưởng Pro VIP Tầng 1** mỗi tháng (tối đa 105 ngày Pro tích lũy/tháng). Được thực thi bằng truy vấn kiểm tra trong Stored Procedure `fn_evaluate_referral_activation`.
   - Không giới hạn số tiền hoa hồng Tầng 2 (vì tiền mặt chỉ phát sinh từ doanh thu thực thu).

2. **Chính Sách Kiểm Tra Thời Gian Trải Nghiệm (Anti-Bot Dwell Time Policy)**:
   - Tài khoản Người được mời (Referee) bắt buộc phải có **tuổi đời tài khoản $\ge 24$ giờ** HOẶC **phát sinh hoạt động học tập trên ít nhất 2 ngày lịch riêng biệt** (`srs_progress` across $\ge 2$ distinct calendar dates) trước khi hệ thống chấp thuận sự kiện kích hoạt và cấp phát ngày Pro VIP.
   - Khi hoàn thành tiêu chí từ vựng qua SRS, thời gian trôi giữa lần ôn đầu và cuối phải $\ge 60$ giây. Mọi tài khoản nạp 30 từ trong $< 60$ giây sẽ bị hệ thống tự động đánh dấu `fraud_flagged` và hủy bỏ tư cách kích hoạt.

3. **Khống Chế Rủi Ro Chi Phí Kích Hoạt Của Bot (Bot Activation Liability Cap)**:
   - Nhờ sự kết hợp giữa **Dwell-Time $\ge 24$h** và **Monthly Cap = 15 lượt/tháng**, rủi ro tài chính tối đa lý thuyết từ các tài khoản kích hoạt ảo (không bao giờ chuyển đổi thành khách hàng trả phí) được khống chế ở mức hoàn toàn không đáng kể:
     $$\text{Chi Phí Rủi Ro Tối Đa} = 15 \text{ lượt} \times 2 \text{ bên} \times \frac{7}{30} \times 8.000đ = \mathbf{56.000đ / user / tháng}$$
   - So với doanh thu của một khách hàng trả phí trung bình (ví dụ gói 1 Năm 599.000đ - 899.000đ), mức chi phí $56.000đ$ chiếm **$< 0.2\%$ tổng doanh thu nền tảng**, bảo đảm an toàn thanh khoản tuyệt đối 100%.

4. **Chính sách Tự giới thiệu (Self-Referral Prohibition)**:
   - Nghiêm cấm học viên sử dụng nhiều email cá nhân hoặc tài khoản phụ tạo trên cùng thiết bị nhằm tự trục lợi ngày Pro VIP hoặc tự chiết khấu hoa hồng cho chính mình.
   - Các trường hợp vi phạm sẽ bị hủy bỏ tư cách nhận thưởng và thu hồi toàn bộ số ngày VIP đã cấp.

5. **Quy tắc Thời Hạn Quyền Giới Thiệu (Attribution Window)**:
   - Cookie và liên kết giới thiệu có hiệu lực trong vòng **30 ngày** kể từ thời điểm Người được mời nhấp vào link lần đầu tiên.
   - Sau 30 ngày, nếu Người được mời mới đăng ký tài khoản mà không thông qua link mới, quan hệ giới thiệu sẽ không được ghi nhận.
