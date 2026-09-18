# 03. CHIẾN LƯỢC PHÒNG CHỐNG GIAN LẬN & LẠM DỤNG (R3)
## (Anti-Fraud, Abuse Countermeasures & Defense-in-Depth Architecture)
### Dự án: Hệ Thống Giới Thiệu & Tiếp Thị Liên Kết (Referral & Affiliate Program) — LingoPro
**Ngày ban hành:** 18/09/2026  
**Phiên bản:** 1.0.0  
**Tác giả:** Worker 1 — Technical & Business Specification Lead  
**Vị trí tài liệu:** `docs/proposals/referral-system/03_ANTI_FRAUD.md`

---

## 1. Tổng Quan Triết Lý Phòng Ngự (Security & Anti-Fraud Philosophy)

Trong bất kỳ hệ thống phân phối phần thưởng và tiếp thị liên kết (Affiliate) nào, khi có sự xuất hiện của giá trị kinh tế (ngày học Pro VIP và hoa hồng tiền mặt), nguy cơ bị tấn công bởi các tác nhân trục lợi (Bad Actors, Fraudsters, Sybil Networks) là điều không thể tránh khỏi.

Kiến trúc phòng chống gian lận của LingoPro được thiết kế theo nguyên tắc **Phòng Ngự Chiều Sâu (Defense-in-Depth)** và **Giảm Tải Động Lực Trục Lợi (Friction Optimization)**:
- Không tạo phiền toái cho học viên trung thực (Frictionless for Honest Learners).
- Khiến chi phí tạo tài khoản gian lận và thời gian cày bot vượt xa giá trị phần thưởng nhận được (Economic Disincentive).
- Xây dựng 5 lớp hàng rào công nghệ từ Client Fingerprint, Edge Rate Limiter, Database Transaction Engine đến Thuật toán chấm điểm rủi ro tự động (Automated Risk Scoring).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             5 LỚP HÀNG RÀO PHÒNG NGỰ CHIỀU SÂU                              │
├──────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 1. Client & Hardware Layer   │ Canvas Hash + Audio Context + WebGL Fingerprint + Storage ID │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2. Network & Velocity Layer  │ IP Subnet CIDR /24 Tracking + Cloudflare Edge Rate Limiting  │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 3. Behavioral Learning Layer │ Human-in-the-loop: Verification qua FSRS & Dwell-Time Check  │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 4. Transactional Engine      │ 7-14 ngày Holding Period + Atomic Stored Procedures          │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 5. Payout Verification Layer │ Đối soát STK Ngân Hàng chính chủ + Auto Risk Score (0 - 100) │
└──────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 2. Phân Tích 5 Vector Tấn Công & Giải Pháp Kỹ Thuật (Threat Vectors & Countermeasures)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            MA TRẬN 5 VECTOR TẤN CÔNG GIAN LẬN                               │
├───────────────────────┬──────────────────────────────┬──────────────────────────────────────┤
│ VECTOR TẤN CÔNG       │ CƠ CHẾ TRỤC LỢI              │ GIẢI PHÁP ĐỐI ỨNG KỸ THUẬT           │
├───────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ 1. Self-Referral &    │ Học viên tự mở tab ẩn danh   │ - Canvas/Audio Fingerprint hash.     │
│    Multi-Account      │ tạo nick phụ mời chính mình  │ - Chặn cùng IP Subnet trong 24h.     │
│    (Sybil Farming)    │ để cày ngày học Pro VIP.     │ - Chặn email alias (+tag, disposable)│
├───────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ 2. Fake Activation    │ Dùng Puppeteer / Script bot  │ - Dwell-time check (> 5s / thẻ từ).  │
│    (Bot Emulation)    │ tự động click ôn 30 từ để    │ - Timestamp phân bố đều trên 3 ngày. │
│    (Cày bot tự động)  │ đạt điều kiện kích hoạt.     │ - Turnstile CAPTCHA khi phát hiện tốc│
│                       │                              │   độ click dị thường.                │
├───────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ 3. Refund /           │ Mua gói 1 Năm (599k), nhận   │ - Giam tiền 7-14 ngày (Holding).     │
│    Chargeback Abuse   │ hoa hồng 90k rút về, sau đó  │ - Cơ chế Tự Động Clawback (Thu hồi)  │
│    (Rút rồi đòi tiền) │ đòi hoàn tiền đơn hàng.      │   nếu order đổi trạng thái refunded. │
├───────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ 4. Spamming & Brand   │ Chạy quảng cáo Google Search │ - Ràng buộc pháp lý điều khoản TOS.  │
│    Hijacking          │ từ khóa "LingoPro" hoặc spam │ - Tự động phát hiện UTM & Referrer.  │
│    (Cướp thương hiệu) │ link vào hội nhóm vô tội vạ. │ - Thu hồi vĩnh viễn tư cách đối tác. │
├───────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ 5. Collusion Fraud    │ Nhóm người câu kết tạo giao  │ - Graph Analysis phát hiện giao dịch │
│    (Gian lận liên minh│ dịch vòng tròn ảo để rút tiền│   vòng tròn (A -> B -> C -> A).      │
│    vòng tròn)         │ hoa hồng hoặc điểm thưởng.   │ - Chặn trùng thông tin tài khoản Bank│
└───────────────────────┴──────────────────────────────┴──────────────────────────────────────┘
```

### 2.1. Vector 1: Self-Referral & Đa Tài Khoản Ảo (Sybil Attack)
- **Hành vi**: Một người dùng cố tình tạo hàng chục tài khoản ảo bằng email rác hoặc Gmail alias (ví dụ `user+1@gmail.com`, `user+2@gmail.com`) trên cùng một máy tính để tự cộng dồn hàng trăm ngày Pro VIP.
- **Phương Án Đối Ứng**:
  1. **Device Fingerprinting không dựa vào Cookie**:
     - Tạo hàm thu thập dấu vân tay phần cứng máy khách: Canvas 2D render hash, WebGL vendor/renderer, AudioContext frequency analysis, độ phân giải màn hình, danh sách font chữ hệ thống và timezone.
     - Sinh mã băm bất biến `device_hash` (ví dụ SHA-256).
     - Ghi nhận vào bảng `referral_logs`. Nếu `referrer.device_hash === referee.device_hash` $\Rightarrow$ **Từ chối kích hoạt ngay lập tức với mã lỗi `FRAUD_DEVICE_COLLISION`**.
  2. **Chuẩn Hóa & Làm Sạch Email (Email Normalization)**:
     - Tự động xóa phần mở rộng alias sau dấu `+` đối với các nhà cung cấp phổ biến (Gmail, Outlook, iCloud): `abc+test1@gmail.com` $\to$ `abc@gmail.com`.
     - Chặn danh sách hơn 3.000 tên miền email tạm thời (Disposable/Temp Mail Domains như `mailinator.com`, `guerrillamail.com`, `10minutemail.com`).
  3. **Giới Hạn IP Subnet (Subnet Velocity Limit)**:
     - Cho phép tối đa **3 tài khoản đăng ký nhận referral trên cùng 1 dải IP mạng (/24 IPv4 hoặc /48 IPv6) trong vòng 24 giờ**. Các tài khoản thứ 4 trở đi vẫn được tạo tài khoản nhưng bị đánh dấu cờ `fraud_flagged` và không được cấp ngày Pro.

### 2.2. Vector 2: Giả Lập Kích Hoạt Bằng Bot (Fake Activation Scripts)
- **Hành vi**: Sử dụng các công cụ tự động hóa headless (Puppeteer, Playwright, Python Requests) để gọi liên tục API học từ vựng (`POST /api/practice/...`) nhằm thỏa mãn điều kiện "học 30 từ" trong vài giây.
- **Phương Án Đối Ứng**:
  1. **Kiểm Tra Thời Gian Tương Tác Tự Nhiên (Human Dwell-Time Verification)**:
     - Để học 1 từ vựng hoặc làm 1 flashcard FSRS, người học thực tế cần trung bình 4 đến 12 giây.
     - Backend kiểm tra độ trôi thời gian (`created_at` giữa các lần review trong `srs_progress`): Nếu một tài khoản "học" 30 từ trong thời gian dưới **60 giây** (tức $< 2\text{ giây/từ}$) $\Rightarrow$ Đánh dấu bot bất thường, vô hiệu hóa tiến trình kích hoạt.
  2. **Ràng Buộc Phân Bố Thời Gian (Temporal Distribution Check)**:
     - Với tiêu chí Streak $\ge 3$ ngày: Hệ thống yêu cầu 3 ngày kích hoạt phải tương ứng với 3 ngày lịch riêng biệt trên múi giờ Việt Nam (`Asia/Ho_Chi_Minh`), không thể tua nhanh hay giả mạo ngày hệ thống ở client.
  3. **Cloudflare Turnstile Thích Ứng (Adaptive Bot Challenge)**:
     - Tích hợp Turnstile CAPTCHA vô hình tại bước đăng ký và bước claim quà đối với các IP có điểm tín nhiệm thấp (Low Reputation IP từ datacenter, VPN, proxy).

### 2.3. Vector 3: Gian Lận Nạp Tiền Rồi Yêu Cầu Hoàn Tiền (Refund/Chargeback Abuse)
- **Hành vi**: Kẻ gian cấu kết: A mời B, B mua gói 1 Năm (599.000đ). A nhận ngay 90.000đ hoa hồng và rút tiền về ngân hàng. Sau đó B khiếu nại qua ngân hàng hoặc liên hệ CSKH đòi hủy đơn hoàn tiền với lý do "chuyển nhầm" hoặc "không có nhu cầu học".
- **Phương Án Đối Ứng**:
  1. **Cơ Chế Giam Tiền Bảo Đảm (Mandatory Holding Period)**:
     - Toàn bộ hoa hồng Tầng 2 khi phát sinh được ghi nhận ở trạng thái `pending_clearance`.
     - Thời gian giam tiền: **7 ngày** đối với gói tháng và **14 ngày** đối với gói năm.
     - Sau thời gian giam tiền, nếu đơn hàng không phát sinh khiếu nại hay hoàn trả, trạng thái mới tự động chuyển sang `available`.
  2. **Cơ Chế Thu Hồi Tự Động (Automatic Clawback Trigger)**:
     - Tạo Database Trigger trên bảng `orders`: Khi trạng thái đơn hàng chuyển thành `'refunded'` hoặc `'cancelled'`:
       ```sql
       -- Tự động hủy giao dịch hoa hồng tương ứng
       UPDATE public.reward_transactions
       SET status = 'clawback',
           note = 'Tự động thu hồi do đơn hàng gốc bị hoàn trả (Refund Order: ' || NEW.id || ')'
       WHERE order_id = NEW.id;
       ```
     - Nếu hoa hồng đã lỡ được rút (trong trường hợp đặc biệt), số dư hoa hồng của Người giới thiệu sẽ bị ghi âm (`negative balance`), trừ dần vào các đơn hàng giới thiệu thành công tiếp theo.

### 2.4. Vector 4: Spamming Link Tràn Lan & Cướp Từ Khóa Thương Hiệu (Brand Hijacking)
- **Hành vi**: Một số đối tác affiliate chạy quảng cáo Google Ads Search đấu thầu trực tiếp từ khóa thương hiệu "LingoPro", "Học tiếng Anh LingoPro", điều hướng người dùng đang tìm kiếm LingoPro qua link ref của họ; hoặc dùng tool spam link ref lên hàng nghìn nhóm Facebook/Zalo/Diễn đàn làm ảnh hưởng xấu đến uy tín thương hiệu.
- **Phương Án Đối Ứng**:
  1. **Quy Tắc Điều Khoản Hoạt Động (Affiliate Terms of Service - TOS)**:
     - Nghiêm cấm chạy quảng cáo trả phí (Google Ads, Facebook Ads, TikTok Ads) đấu thầu trực tiếp vào từ khóa chứa nhãn hiệu "LingoPro" (Negative Keywords Requirement).
     - Nghiêm cấm spam tự động, gửi tin nhắn rác không có sự đồng ý của người nhận.
  2. **Theo Dõi HTTP Referer & Tham Số UTM**:
     - Hệ thống kiểm tra header `Referer` và query `utm_source`: Nếu phát hiện lưu lượng truy cập trực tiếp từ chiến dịch Google Ads vi phạm hoặc từ các trang web nội dung độc hại $\Rightarrow$ Tự động ngắt attribution và khóa vĩnh viễn quyền tham gia Affiliate của tài khoản vi phạm.

### 2.5. Vector 5: Gian Lận Liên Minh Câu Kết (Collusion & Circular Fraud)
- **Hành vi**: Một nhóm 2-3 người dùng trao đổi mã giới thiệu vòng tròn (A mời B, B mời C, C mời A) với mục đích tích lũy ngày học VIP chéo mà không mang lại người dùng thực sự cho hệ thống.
- **Phương Án Đối Ứng**:
  1. **Đồ Thị Giới Thiệu Phi Chu Trình (Directed Acyclic Graph - DAG)**:
     - Trong cơ sở dữ liệu, quan hệ `referral_logs` được kiểm tra đệ quy thông qua Stored Procedure PostgreSQL:
     - Trước khi cho phép B nhận A làm người giới thiệu, hàm kiểm tra cây quan hệ: Nếu A đã từng là Referee trực tiếp hoặc gián tiếp của B $\Rightarrow$ **Chặn giao dịch với lỗi `CIRCULAR_REFERRAL_DETECTED`**.
  2. **Đối Soát Thông Tin Tài Khoản Ngân Hàng (Bank Account Uniqueness)**:
     - Mỗi số tài khoản ngân hàng (STK) chỉ được liên kết với duy nhất **1 tài khoản học viên** trên hệ thống.
     - Tên chủ tài khoản ngân hàng nhận tiền phải trùng khớp với tên thật đăng ký trên hồ sơ cá nhân. Không chấp nhận rút tiền về nhiều tài khoản khác nhau nhưng cùng một STK nhận.

---

## 3. Quy Chế Rút Tiền & Giới Hạn Trần Thưởng (Payout Policy & Limits)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 BẢNG QUY CHUẨN RÚT TIỀN HOA HỒNG                            │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ TIÊU CHÍ VẬN HÀNH            │ HỌC VIÊN THÔNG THƯỜNG        │ ĐẠI SỨ ĐÃ XÁC MINH (AMBASSADOR)│
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ Ngưỡng rút tối thiểu         │ 100.000 VNĐ                  │ 100.000 VNĐ                   │
│ Ngưỡng rút tối đa / ngày     │ 2.000.000 VNĐ                │ 10.000.000 VNĐ                │
│ Thời gian giam tiền (Holding)│ 7 ngày (Gói tháng) / 14 ngày │ 7 ngày (Tất cả các gói)       │
│ Thời gian xử lý lệnh rút     │ 24h - 48h làm việc           │ < 2h (Ưu tiên chuyển tự động) │
│ Giới hạn số lượt mời Tầng 1  │ 15 lượt kích hoạt Pro/tháng  │ Không giới hạn                │
│ Giới hạn hoa hồng Tầng 2     │ Không giới hạn               │ Không giới hạn                │
│ Khấu trừ thuế TNCN           │ 10% nếu rút >= 2.000.000đ    │ Hỗ trợ xuất chứng từ thuế     │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

---

## 4. Động Cơ Chấm Điểm Rủi Ro Tự Động (Automated Risk Scoring Engine)

Mỗi giao dịch giới thiệu và yêu cầu rút tiền đều được tính toán một chỉ số rủi ro từ **0 đến 100 điểm** (`risk_score`). Thuật toán chấm điểm dựa trên trọng số các yếu tố sau:

$$\text{Risk Score} = \sum_{i=1}^{k} w_i \times \text{Risk Factor}_i$$

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BẢNG TRỌNG SỐ ĐIỂM NGUY CƠ (RISK FACTORS)                      │
├────────────────────────────────────────┬───────────┬────────────────────────────────────────┤
│ Yếu Tố Nguy Cơ (Risk Factor)           │ Điểm Cộng │ Điều Kiện Kích Hoạt                    │
├────────────────────────────────────────┼───────────┼────────────────────────────────────────┤
│ 1. Trùng Device Fingerprint            │ +50 điểm  │ Hai tài khoản có chung mã thiết bị     │
│ 2. Cùng dải IP Subnet (/24)            │ +20 điểm  │ Đăng ký cùng mạng WiFi/mạng nội bộ     │
│ 3. Tốc độ kích hoạt học từ siêu tốc    │ +25 điểm  │ Học 30 từ trong thời gian < 120 giây   │
│ 4. Địa chỉ IP thuộc Data Center / VPN  │ +30 điểm  │ ASN thuộc DigitalOcean, AWS, NordVPN...│
│ 5. Tỷ lệ bỏ học sau kích hoạt (100%)   │ +15 điểm  │ Referee không bao giờ quay lại sau khi │
│                                        │           │ Referrer đã nhận thưởng Pro            │
│ 6. Email có cấu trúc bất thường        │ +10 điểm  │ Chứa nhiều ký tự số ngẫu nhiên liên tiếp│
└────────────────────────────────────────┴───────────┴────────────────────────────────────────┘
```

### Phân Loại Xử Lý Theo Thang Điểm Rủi Ro:
- **Từ 0 đến 29 điểm (Mức Xanh - Low Risk)**:  
  Giao dịch hoàn toàn hợp lệ, tự động phê duyệt và cấp ngày Pro VIP / duyệt lệnh rút tiền tức thì.
- **Từ 30 đến 69 điểm (Mức Vàng - Medium Risk)**:  
  Hệ thống chuyển lệnh rút tiền sang trạng thái `manual_review` (chờ Admin kiểm tra). Yêu cầu Người giới thiệu bổ sung xác thực tài khoản mạng xã hội hoặc số điện thoại.
- **Từ 70 đến 100 điểm (Mức Đỏ - Critical Risk)**:  
  Tự động chặn giao dịch (`fraud_flagged`), thu hồi ngày Pro VIP đã cấp, đóng băng ví hoa hồng và gửi cảnh báo đến kênh Telegram quản trị.

---

## 5. Quy Trình Vận Hành & Kháng Nghị (Appeals & Operations Workflow)

Để đảm bảo tính công bằng và tránh xử lý oan sai cho các trường hợp đặc biệt (ví dụ hai anh em trong cùng một gia đình dùng chung mạng WiFi và máy tính để học tập):
1. **Thông Báo Minh Bạch**: Khi tài khoản bị gắn cờ hạn chế nhận thưởng, giao diện `/referral` hiển thị thông điệp nhã nhặn:  
   *"Hệ thống ghi nhận hoạt động cần xác minh thêm để đảm bảo an toàn tài khoản. Vui lòng liên hệ đội ngũ hỗ trợ để được trợ giúp."*
2. **Quy Trình Kháng Nghị (Appeals Ticket)**:  
   Học viên có thể gửi yêu cầu xác minh danh tính (Cung cấp ảnh chụp góc học tập hoặc 2 CCCD khác nhau nếu học chung máy). Đội ngũ CSKH có bảng điều khiển Admin (`/admin/referral/payouts`) để mở khóa (`whitelist`) cho các trường hợp chính đáng trong vòng 12 giờ làm việc.
