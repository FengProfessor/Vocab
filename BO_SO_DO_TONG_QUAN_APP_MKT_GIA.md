# TỔNG HỢP CÁC SƠ ĐỒ HỆ THỐNG: TỔNG QUAN APP – CHIẾN LƯỢC MARKETING – BÀI TOÁN GIÁ & DÒNG TIỀN
## *Bộ Visual Toàn Diện Dành Cho Buổi Đàm Phán & Trình Chiếu Với Chủ Trung Tâm Tiếng Trung*

---

## MỤC LỤC
1. [HỆ THỐNG SƠ ĐỒ VỀ APP & CÔNG NGHỆ](#1-hệ-thống-sơ-đồ-về-app--công-nghệ)
   * 1.1. Sơ đồ Kiến trúc Máy chủ On-premise tại Trung tâm
   * 1.2. Sơ đồ Hệ sinh thái 4 Trụ cột Công nghệ Lingopro
   * 1.3. Sơ đồ Vòng lặp Học tập & Thuật toán FSRS 3 Chiều
2. [HỆ THỐNG SƠ ĐỒ VỀ MARKETING & HÚT LEAD](#2-hệ-thống-sơ-đồ-về-marketing--hút-lead)
   * 2.1. Sơ đồ Phễu Tuyển sinh 3 Tầng: Thử Thách & Mini-Test
   * 2.2. Sơ đồ Cỗ máy Sản xuất Video Remotion 0 Đồng & Phủ Đa Kênh
   * 2.3. Sơ đồ Luồng Chuyển đổi Lead thành Học viên (Telesales SLA 15 Phút)
3. [HỆ THỐNG SƠ ĐỒ VỀ GIÁ, ROI & DÒNG TIỀN](#3-hệ-thống-sơ-đồ-về-giá-roi--dòng-tiền)
   * 3.1. Sơ đồ Ma trận 3 Gói Giá Cao Cấp
   * 3.2. Sơ đồ Dòng tiền "Chi phí 0 đồng" (Profit Center Flow)
   * 3.3. Sơ đồ Cân bằng Điểm Hòa Vốn (Breakeven Analysis)

---

## 1. HỆ THỐNG SƠ ĐỒ VỀ APP & CÔNG NGHỆ

### 1.1. Sơ đồ Kiến trúc Máy chủ On-premise (Máy Trung Tâm + Cloudflare + Máy ở Nhà)

```mermaid
flowchart TD
    subgraph HOME["MÁY Ở NHÀ BẠN (Môi trường Dev & Quản trị kỹ thuật)"]
        DevPC["Laptop / PC cá nhân"] -->|"Viết code, thêm game, kiểm thử"| LocalCode["Source Code Next.js 16"]
        DevPC -->|"Đẩy bản cập nhật tính năng mới"| DeployChannel["Git / Remote Script an toàn"]
    end

    subgraph CENTER["MÁY TẠI VĂN PHÒNG TRUNG TÂM (Production Server)"]
        CenterPC["PC / Mini-PC Văn Phòng Trung Tâm<br/>(Core i3/i5, RAM 8GB-16GB, Win 10/11)"]
        CenterPC --> AppCore["Ứng dụng Web Lingopro"]
        CenterPC --> LocalDB["Cơ sở dữ liệu Supabase / PostgreSQL<br/>(Lưu toàn bộ SĐT, điểm số, data học sinh)"]
        CenterPC --> Cloudflared["Cloudflare Tunnel Agent (Chạy nền)"]
    end

    DeployChannel -->|"Đồng bộ cập nhật"| CenterPC

    subgraph CLOUD["KẾT NỐI INTERNET AN TOÀN (Zero-Config, Không cần IP tĩnh)"]
        Cloudflared -->|"Bảo mật SSL/HTTPS miễn phí"| CFEdge["Cloudflare Edge Network"]
        CFEdge --> CustomDomain["Tên miền riêng: app.tiengtrung[ten].vn"]
    end

    subgraph USERS["NGƯỜI DÙNG TRUY CẬP ĐA NỀN TẢNG"]
        CustomDomain --> StudentMobile["Học sinh dùng Điện thoại / Tablet tại nhà<br/>(PWA: Bấm 'Thêm vào MH chính')"]
        CustomDomain --> TeacherPC["Giáo viên dùng Máy tính / Máy chiếu trên lớp"]
        CustomDomain --> AdminDashboard["Chủ Trung tâm xem Báo cáo Doanh thu & Lead"]
    end
```

---

### 1.2. Sơ đồ Hệ sinh thái 4 Trụ cột Công nghệ Lingopro

```mermaid
graph TD
    Lingopro["HỆ THỐNG LINGOPRO ENTERPRISE"]

    Lingopro --> P1["1. CÔNG NGHỆ HÁN TỰ FSRS"]
    Lingopro --> P2["2. AI CONTENT STUDIO"]
    Lingopro --> P3["3. LMS & AT-RISK RADAR"]
    Lingopro --> P4["4. GAME HÓA 3-TRONG-1"]

    P1 --> P1_1["Mô hình nhớ 3 chiều: Nhận diện - Thanh điệu - Bút thuận"]
    P1 --> P1_2["Hệ số D0 = 7.42 tối ưu riêng cho chữ tượng hình"]
    P1 --> P1_3["Thông báo đẩy (Push FCM) nhắc ôn trước khi quên"]

    P2 --> P2_1["1-Click bóc tách giáo trình Boyan / HSK giấy thành data số"]
    P2 --> P2_2["Hoạt họa nét vẽ SVG chuẩn MakeMeAHanzi"]
    P2 --> P2_3["Giải nghĩa Chiết tự bằng AI (Visual Mnemonics)"]

    P3 --> P3_1["Dashboard tiến độ học tập thời gian thực của cả lớp"]
    P3 --> P3_2["Radar cảnh báo đỏ học sinh có nguy cơ bỏ học sau 3 ngày"]
    P3 --> P3_3["Báo cáo kết quả tự động gửi phụ huynh qua Zalo"]

    P4 --> P4_1["Flappy Bird Thanh điệu (chơi bằng giọng nói)"]
    P4 --> P4_2["Thuật Giả kim (kéo thả ghép bộ thủ)"]
    P4 --> P4_3["Hanzi Battle Royale (đối kháng trực tiếp trên lớp)"]
```

---

### 1.3. Sơ đồ Vòng lặp Học tập & Thuật toán FSRS 3 Chiều

```mermaid
stateDiagram-v2
    [*] --> NhapMon: Học sinh mở bài học mới
    NhapMon --> NhanDien: Nhìn chữ Hán & nghe audio chuẩn Bắc Kinh
    NhanDien --> ChietTu: Xem diễn giải chiết tự & xem hoạt họa bút thuận SVG
    ChietTu --> LuyenViet: Tập viết chữ bằng tay trên màn hình cảm ứng
    LuyenViet --> LuyenThanhDieu: Ghi âm phát âm (AI Tone Pitch chấm điểm)
    
    LuyenThanhDieu --> FSRS_Evaluation: FSRS phân tích kết quả 3 chiều
    
    state FSRS_Evaluation {
        [*] --> CheckMem
        CheckMem --> QuenMatChu: Sai mặt chữ -> Chu kỳ rút ngắn (10 phút)
        CheckMem --> NhapNhangThanhDieu: Đúng chữ nhưng sai thanh điệu -> Phạt chu kỳ (1 ngày)
        CheckMem --> ThuocLong: Đúng 100% -> Chu kỳ kéo dài (3 ngày -> 1 tuần -> 1 tháng)
    }

    FSRS_Evaluation --> PushNotify: Lên lịch gửi Push Notification vào đúng 'thời điểm vàng'
    PushNotify --> NhapMon: Học sinh vào ôn đúng 3 phút
```

---

## 2. HỆ THỐNG SƠ ĐỒ VỀ MARKETING & HÚT LEAD

### 2.1. Sơ đồ Phễu Tuyển sinh 3 Tầng (The Challenge & Mini-Test Funnel)

```mermaid
flowchart TD
    subgraph TANG1["TẦNG 1: THU HÚT LƯỢNG LỚN LEAD GIÁ SIÊU RẺ (Top of Funnel)"]
        Ads1["Meta Ads / TikTok Ads (Chi phí CPL: 25k - 40k)"]
        Organic["Video ngắn TikTok / Reels (Traffic 0 đồng)"]
        Ads1 --> Hook["Thông điệp Hook: 'Test 5 phút chẩn đoán năng khiếu tiếng Trung'"]
        Organic --> Hook
    end

    Hook --> WebAppTest["HỌC VIÊN VÀO WEB-APP LÀM TEST TRỰC TIẾP<br/>(Không cần đăng ký phức tạp)"]

    subgraph TANG2["TẦNG 2: PHỄU KÍCH HOẠT & NUÔI DƯỠNG (Middle of Funnel)"]
        WebAppTest --> TestEnd["Làm xong câu 12: Hệ thống tính toán điểm số"]
        TestEnd --> LeadGate["MÀN HÌNH BẮT BUỘC ĐIỀN TÊN & SỐ ZALO<br/>'Để nhận bảng phân tích năng lực HSK + Voucher 500k'"]
        LeadGate --> CRM["Data SĐT tự động bắn về Zalo/CRM của Tư vấn viên"]
        LeadGate --> Challenge7Day["Mời tham gia 'Thử thách 7 ngày xóa mù chữ Hán'<br/>(Cọc cam kết 99k - Hoàn 100% khi xong)"]
        Challenge7Day --> Habit["Học sinh dùng app 7 ngày, nghiện phương pháp học"]
    end

    subgraph TANG3["TẦNG 3: CHỐT HỌC VIÊN KHÓA CHÍNH THỨC (Bottom of Funnel)"]
        CRM --> TelesaleCall["Tư vấn viên gọi điện theo vai 'Bác sĩ học thuật đọc kết quả test'"]
        Habit --> TelesaleCall
        TelesaleCall --> WorkshopInvite["Mời tham gia 1 buổi Workshop chỉnh âm trực tiếp tại cơ sở"]
        WorkshopInvite --> CloseDeal["CHỐT ĐÓNG HỌC PHÍ KHÓA HỌC CHÍNH (3.000.000 đ - 5.000.000 đ)<br/>(Tỷ lệ chuyển đổi: 20% - 30%)"]
    end
```

---

### 2.2. Sơ đồ Cỗ máy Sản xuất Video Remotion 0 Đồng & Phủ Đa Kênh

```mermaid
flowchart LR
    Data["Kho 1.000 chữ Hán & Mẹo phát âm"] --> RemotionEngine["Remotion Automation Engine (Node.js)"]

    subgraph ASSETS["TỰ ĐỘNG TỔNG HỢP ASSETS"]
        Logo["Logo Trung tâm động"]
        Audio["Voice chuẩn Bắc Kinh"]
        StrokeAnim["Nét vẽ chữ Hán SVG"]
        ToneCurve["Đồ thị thanh điệu"]
    end

    ASSETS --> RemotionEngine
    RemotionEngine --> BatchExport["Render hàng loạt 30 - 50 video dọc 9:16/tháng<br/>(Chuẩn TikTok / Reels / Shorts)"]

    BatchExport --> Social1["Kênh TikTok Trung tâm"]
    BatchExport --> Social2["Facebook Reels"]
    BatchExport --> Social3["YouTube Shorts"]

    Social1 --> BioCTA["CTA: 'Link bio làm test HSK & nhận quà'"]
    Social2 --> BioCTA
    Social3 --> BioCTA

    BioCTA --> NewLead["Khách hàng mới vào Web-App Trung tâm"]
```

---

### 2.3. Sơ đồ Luồng Chuyển đổi Lead (Telesales SLA 15 Phút)

```mermaid
sequenceDiagram
    autonumber
    actor KhachHang as Khách hàng tiềm năng
    participant WebApp as Web-App Trung tâm
    participant CRM as Zalo / CRM Trung tâm
    actor TuVanVien as Chuyên viên tư vấn
    actor GiangVien as Giáo viên tại lớp

    KhachHang->>WebApp: Làm xong Mini-Test chẩn đoán HSK
    KhachHang->>WebApp: Điền Số điện thoại / Zalo để nhận kết quả
    WebApp->>CRM: Bắn webhook thông tin lead + Điểm yếu phát âm (ngay lập tức)
    Note over CRM,TuVanVien: Quy tắc vàng: Phản hồi trong 15 phút đầu!
    TuVanVien->>KhachHang: Gọi điện thoại: 'Bác sĩ học thuật thông báo kết quả bài test'
    TuVanVien->>KhachHang: Chỉ rõ: 'Bạn bị nhầm Thanh 1 và Thanh 4 ở 3 câu'
    TuVanVien->>KhachHang: Tặng 1 suất tham gia Workshop Chỉnh âm miễn phí tại trung tâm
    KhachHang->>GiangVien: Đến cơ sở dự buổi trải nghiệm thực tế
    GiangVien->>KhachHang: Hướng dẫn sửa khẩu hình + Giới thiệu app độc quyền
    TuVanVien->>KhachHang: Áp dụng Voucher 500k (hiệu lực 48h) -> Chốt đóng tiền khóa học
```

---

## 3. HỆ THỐNG SƠ ĐỒ VỀ GIÁ, ROI & DÒNG TIỀN

### 3.1. Sơ đồ Ma trận 3 Gói Giá Cao Cấp (High-Ticket)

```mermaid
graph TD
    subgraph G1["GÓI KHỞI ĐỘNG (SETUP CƠ BẢN)"]
        P1["15.000.000 VNĐ (Setup 1 lần)"]
        P1_M["+ 4.900.000 VNĐ / tháng"]
        F1["• Cài Server On-premise tại máy trung tâm<br/>• Số hóa giáo trình HSK 1-6<br/>• Gắn Logo, Tên miền riêng<br/>• Tặng 30 video Remotion/tháng"]
    end

    subgraph G2["GÓI ĐỐI TÁC CHIẾN LƯỢC 1 NĂM (KHUYÊN DÙNG NHẤT)"]
        P2["49.000.000 VNĐ / CẢ NĂM"]
        F2["• MIỄN PHÍ 100% PHÍ SETUP (Tiết kiệm 15tr)<br/>• TẶNG THÊM 2 THÁNG SỬ DỤNG (Tiết kiệm 9.8tr)<br/>• Tổng tiết kiệm: 24.800.000 VNĐ<br/>• CAM KẾT ĐỘC QUYỀN KHU VỰC BÁN KÍNH 5KM"]
    end

    subgraph G3["GÓI CHUỖI NHIỀU CƠ SỞ (ENTERPRISE)"]
        P3["89.000.000 VNĐ / CẢ NĂM"]
        F3["• Áp dụng cho toàn bộ 2 - 5 cơ sở<br/>• Đóng gói App Mobile Native riêng lên App Store & Google Play<br/>• Kỹ sư trực tiếp onboarding và bảo trì tận nơi"]
    end
```

---

### 3.2. Sơ đồ Dòng tiền "Chi phí 0 đồng" (Profit Center Flowchart)

```mermaid
flowchart LR
    subgraph INFLOW["NGUỒN THU CỦA TRUNG TÂM (Học viên đóng tiền)"]
        Student["150 Học viên đang học"] -->|"Thu phí: Combo Giáo trình + Trợ giảng số Lingopro<br/>(120.000 đ / học viên / khóa 3 tháng ~ 40k/tháng)"| CenterPocket["TỔNG THU VÀO TÚI TRUNG TÂM:<br/>150 HS x 120.000 đ = 18.000.000 VNĐ"]
    end

    subgraph OUTFLOW["CHI PHÍ TRẢ CHO LINGOPRO"]
        CenterPocket -->|"Thanh toán gói vận hành Lingopro Pro:<br/>2.900.000 đ x 3 tháng"| Cost["8.700.000 VNĐ"]
    end

    subgraph PROFIT["LỢI NHUẬN RÒNG TRUNG TÂM ĐÚT TÚI"]
        Cost --> NetProfit["LÃI RÒNG TIỀN MẶT CỦA TRUNG TÂM:<br/>18.000.000 đ - 8.700.000 đ = +9.300.000 VNĐ / KHÓA!"]
    end

    NetProfit --> Win["KẾT QUẢ:<br/>• Học sinh có app xịn học mê say<br/>• Trung tâm KHÔNG MẤT TIỀN mà còn CÓ LÃI!"]
```

---

### 3.3. Sơ đồ Cân bằng Điểm Hòa Vốn (Breakeven Analysis)

```mermaid
graph TD
    Cost["Chi phí bản quyền Lingopro:<br/>4.900.000 VNĐ / tháng"]

    Cost --> Case1["TRƯỜNG HỢP 1: GIỮ CHÂN HỌC VIÊN CŨ"]
    Case1 --> B1["Mỗi tháng chỉ cần giữ chân ĐÚNG 2 HỌC VIÊN không bỏ học giữa chừng<br/>(2 học viên x 2.500.000 đ học phí = 5.000.000 đ)"]
    B1 --> Res1["ĐÃ HÒA VỐN 100% PHẦN MỀM!"]

    Cost --> Case2["TRƯỜNG HỢP 2: TUYỂN SINH HỌC VIÊN MỚI"]
    Case2 --> B2["Cỗ máy video ngắn & mini-test chỉ cần tuyển thêm ĐÚNG 2 HỌC VIÊN MỚI / tháng<br/>(2 học viên x 3.000.000 đ học phí = 6.000.000 đ)"]
    B2 --> Res2["ĐÃ CÓ LÃI RÒNG DÔI RA!"]

    Cost --> Case3["TRƯỜNG HỢP 3: THỰC TẾ TRIỂN KHAI"]
    Case3 --> B3["Trung tâm tuyển thêm 10 - 20 học viên mới<br/>(Doanh thu thêm: 30.000.000 đ - 60.000.000 đ)"]
    B3 --> Res3["LÃI GẤP 6 - 12 LẦN CHI PHÍ ĐẦU TƯ!"]
```

---

> **Tài liệu trực quan biên soạn bởi Đội ngũ Kiến trúc sư & Chiến lược Lingopro**  
> **Hotline / Zalo hỗ trợ kỹ thuật:** `0949 317 036` (Mr Phong)
