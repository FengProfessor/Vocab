# BÁO CÁO TỔNG QUAN KIỂM TOÁN TOÀN DIỆN UI/UX
## LINGOPRO EDTECH PLATFORM — EXECUTIVE SUMMARY & MASTER AUDIT SYNTHESIS

**Mã tài liệu:** `docs/ui-audit/00_EXECUTIVE_SUMMARY.md`  
**Dự án:** LingoPro Web App (`d:\Vibe\Vocab\web-app`)  
**Ngày phát hành:** 04/10/2026  
**Thực hiện:** Ban Kiểm toán Giao diện & Trải nghiệm Người dùng LingoPro (Executive Synthesizer)  
**Phạm vi đối tượng:** Toàn bộ mã nguồn giao diện App Router (`src/app/`), Thư viện thành phần dùng chung (`src/components/`), CSS Tokens (`src/app/globals.css`), và 6 Báo cáo Phân hệ Chi tiết (`01` đến `06`).  
**Tiêu chuẩn đối chiếu:** Tôn chỉ **Technical Minimalist**, Bộ quy chuẩn Khảo thí Chuẩn hóa (`standardized-exam-engine`), Apple Human Interface Guidelines (44px Touch Targets), Google Material Design 3, WCAG 2.1 AA Contrast, và NNG UX Maturity Model.

---

## 1. ĐÁNH GIÁ SỨC KHỎE TỔNG THỂ GIAO DIỆN (OVERALL UI HEALTH ASSESSMENT)

### 1.1. Bảng Điểm Sức Khỏe & Trưởng Thành UX (UX Maturity & Health Scorecard)

Qua đợt kiểm toán toàn diện trên **75 khiếm khuyết được định danh và xác thực bằng mã nguồn thực tế**, hệ thống giao diện LingoPro hiện đang ở trạng thái **Nợ Kỹ thuật & Thẩm mỹ Nghiêm trọng (High Technical & Aesthetic Debt)**. 

| Chỉ số Đánh giá | Điểm số Thực tế | Phân hạng | Nhận định Tinh gọn |
|---|:---:|:---:|---|
| **Chỉ số Sức khỏe Giao diện (Overall UI Health Score)** | **52 / 100** | **C- (Báo động)** | Giao diện bị phân mảnh thành nhiều "ốc đảo" độc lập, thiếu quản trị hệ thống thiết kế (Design Governance). |
| **Cấp độ Trưởng thành UX (UX Maturity Level)** | **Level 2 / 5** | **Hạn chế / Chắp vá (Ad-hoc)** | Tính năng được phát triển thần tốc nhưng thiếu bộ quy chuẩn; giải pháp chắp vá từ nhiều nguồn mã mở và template AI. |
| **Mức độ Sạch Dữ liệu & Học thuật (Pedagogical Integrity)** | **45 / 100** | **Kém** | Xuất hiện số liệu giả mạo (FNV-1a), bẫy người dùng (Exit-intent), và số tài khoản ngân hàng ảo `1111111111`. |
| **Tính Thống nhất Hệ thống (System Consistency)** | **46 / 100** | **Kém** | Tồn tại đồng thời 6 bảng màu đối kháng, 4 hệ thống flashcard riêng biệt, và 2 trình làm đề TOEIC không tương thích. |
| **Công thái học Cảm ứng Di động (Mobile Touch Ergonomics)** | **54 / 100** | **Trung bình - Yếu** | Thành phần nhập liệu cốt lõi (`Input`, `Tabs`) chỉ cao 32px (vi phạm chuẩn 44px của Apple HIG). |

---

### 1.2. Radar Đánh Giá 4 Trụ Cột Trọng Tâm (4-Pillar Radar Breakdown)

Quy đổi theo thang điểm nghịch đảo khiếm khuyết (100 = Hoàn hảo, 0 = Khuyết tật toàn phần):

```
                   [THỪA] (Redundancy Control)
                            45/100
                              ▲
                              │
    [AI QUÁ]                  │                  [XẤU]
 (Anti-Gimmick) 48/100 ◄──────┼──────► 52/100 (Aesthetic Harmony)
                              │
                              ▼
                            54/100
                 [CỨNG NGẮC] (Ergonomic Agility)
```

1. **Trụ cột THỪA (Redundancy & Clutter) — 45/100**:
   - Tồn tại mã chết khổng lồ (~80KB Onboarding gồm 13 tệp không hề được import, file stub 4 dòng trả về `null`, 200 dòng form chết trong `/nhan-qua`).
   - Tình trạng kiến trúc phân đôi: 2 trang Landing Page chạy song song, 4 hệ thống Flashcard độc lập, 2 trình làm đề thi TOEIC độc lập, 2 Audio Player viết lại từ đầu.
   - Vấn nạn "Double Sticky Headers": 5 trang con của học sinh tự trồng thêm 1 header dính thứ hai đè lên header của `StudentShell`.
   - "Bão Banner": Trang `/student` dội 7-8 banner quảng cáo, cảnh báo và modal liên tiếp vào mặt người học.

2. **Trụ cột XẤU (Visual Discordance & Broken Rhythm) — 52/100**:
   - Hỗn loạn 6 bảng màu hoàn toàn đối nghịch: Design Tokens Indigo (`oklch`), Vintage Be ấm (`#f6efe6`), Cool Slate lạnh (`#f8fafc`), Rêu neon (`#d7ff64`), Cyberpunk tối đen (`slate-950`), và Cát ấm (`#faf9f5`). Gây hiện tượng "Visual Shock" (Sốc thị giác) khi điều hướng.
   - Loạn ngôn ngữ nửa Anh nửa Việt (Linguistic Code-Mixing) trong các màn hình quản trị (`Billing`, `Teacher Analytics`).
   - Phản công thái học: Khối đen xám xịt 160px với icon `ImageOff` choán nửa màn hình khi từ vựng không có ảnh trong `WordDetailModal`.
   - Bảng CRM 12 cột ép chặt với tiêu đề cụt lủn 1 chữ ("Lưu", "Học", "Ôn", "Quên"); hàng 8 thẻ KPI nén ngang làm vỡ phom typography.

3. **Trụ cột CỨNG NGẮC (Ergonomics & Navigation Rigidity) — 54/100**:
   - Vi phạm chuẩn Apple HIG: `Input` và `TabsList` trong `src/components/ui/` bị ép cứng chiều cao `h-8` (32px), khiến học viên bấm trượt liên tục trên mobile; thanh tua audio `ToeicAudioPlayer` chỉ mỏng 6px.
   - Hành vi cưỡng bức điều hướng (Route Hijacking): Onboarding `TourNavigator` tước đoạt quyền dùng nút Back, ép người dùng nhảy qua 7 URL; `SurveyModal` chặn đứng màn hình không nút đóng, không nút bỏ qua; bẫy chuột `mouseleave` (`clientY <= 8`) trong `/challenge-landing`.
   - Bẫy cuộn dọc trên tablet/mobile trong `ToeicSplitPane`; khung đọc bài Part 7 bị ép cứng 288px (`max-h-72`).
   - Phản ứng ngược cực đoan: Module Ngữ pháp bị thô ráp hóa với `rounded-none` và font typewriter in hoa ở khắp mọi nơi.

4. **Trụ cột AI QUÁ (Formulaic AI Tropes & Counterfeit Data) — 48/100**:
   - Ngụy tạo số liệu trực tiếp trong mã nguồn: Thuật toán băm FNV-1a trong `src/app/toeic/page.tsx` bịa đặt 21k–34k lượt thi và điểm trung bình; đồng hồ đếm ngược giả lập cố định `43/50 bạn` và `86% slot`; popup học viên giả lập bắn 10 giây/lần; `MOCK_LEADERBOARD` rút tiền đa cấp MLM trong `/student/referral`.
   - Rủi ro pháp lý & giao dịch: Modal thanh toán `ChallengeJoinModal.tsx` tạo mã VietQR với số tài khoản giả mạo `1111111111` nhưng cam kết "tự động xác nhận sau 1-3 phút".
   - Dấu vết template AI sáo rỗng: Khối cầu sáng ambient `blur-3xl` kích thước 700px, text gradient 3 màu nhấp nháy, nút bấm đồ chơi Duolingo 3D `border-b-4`, bìa sách 3D nhún nhảy `animate-bounce`, Mascot đại diện chỉ là emoji Unicode.
   - Rò rỉ thuật ngữ kỹ thuật và khẩu hiệu giật tít: "Sát thủ bài nghe", "bẻ gãy 15 bẫy", "FSRS chung 1 pipeline", ma trận thuật ngữ giả khoa học "VMS", "LCS", "Cramming".

---

## 2. TỔNG HỢP LIÊN PHÂN HỆ THEO 4 TRỤ CỘT (DEEP CROSS-CUTTING SYNTHESIS)

Một trong những phát hiện then chốt của đợt kiểm toán là các khiếm khuyết không tồn tại đơn lẻ ở từng trang, mà xuất phát từ **những lỗ hổng mang tính hệ thống trong kiến trúc kỹ thuật và tư duy sản phẩm**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          4 NGUYÊN NHÂN HỆ THỐNG GỐC RỄ                                 │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 1. THIẾU DESIGN          │ 2. SA ĐÀ VÀO CRO "ĐEN"      │ 3. PHÁT TRIỂN NGUYÊN KHỐI     │
│    GOVERNANCE            │    & SỐ LIỆU GIẢ TẠO        │    THAY VÌ DÙNG CHUNG MODULE  │
│ Các nhóm dev tự tạo màu, │ Tạo áp lực ảo (fake urgency,│ Mỗi tính năng tự code lại     │
│ tự viết class override,  │ fake social proof, fake     │ flashcard, audio player,      │
│ bỏ rơi token globals.css │ attempt stats) làm xói mòn  │ header riêng biệt dẫn tới     │
│ dẫn tới 6 hệ màu xung đột│ niềm tin học thuật.         │ trùng lặp hàng ngàn dòng code │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 2.1. Phân Tích Hệ Thống Trụ Cột: THỪA (Systemic Redundancy)
- **Tình trạng "Đa nhân cách kiến trúc" (Architectural Schizophrenia):**
  Dự án tồn tại song song 2 landing page (`/` và `/landing`), 4 hệ thống flashcard (`/review/session`, `/flashcard`, `vocab-station`, `ToeicLessonFlashcards`), và 2 trình làm đề thi TOEIC. Sự phân mảnh này xuất phát từ việc khi muốn thử nghiệm một giao diện mới, đội ngũ đã sao chép nguyên cả trang thay vì trừu tượng hóa thành các biến thể tham số.
- **Hiện tượng "Double Header" do ranh giới Shell lỏng lẻo:**
  Tại 5 trang con của học sinh (`/import`, `/library`, `/student/leaderboard`, `/student/speaking`, `/review`), các kỹ sư đã bọc trang trong `<StudentShell>` nhưng lại không tin tưởng vào thanh điều hướng của Shell, tự ý chèn thêm một thẻ `<header className="sticky ...">` với nút quay lại `ChevronLeft`. Hậu quả là màn hình mobile bị nuốt chửng hơn 120px chỉ cho thanh điều hướng.
- **Rác mã nguồn tích tụ theo thời gian:**
  13 tệp Onboarding (~1.950 dòng, ~80KB) bị vô hiệu hóa ngầm bằng cách cho `TourBootstrap` trả về `null` nhưng không hề được dọn dẹp khỏi ổ cứng, làm nặng dung lượng repository và kéo dài thời gian build bundle của Next.js.

### 2.2. Phân Tích Hệ Thống Trụ Cột: XẤU (Systemic Aesthetic Discordance)
- **Sự tan rã của Bản sắc Thương hiệu (Brand Identity Collapse):**
  Thay vì tuân thủ token chuẩn Indigo trong `src/app/globals.css`, mỗi phân hệ lại chọn một phong cách riêng: Marketing chuộng Vintage be `#f6efe6`, trang Refero dùng Cool slate `#f8fafc`, trang giáo viên dùng xanh rêu neon `#d7ff64`, trang nhận quà dùng đen Cyberpunk `slate-950`. Khách hàng chuyển trang liên tục bị "sốc thị giác".
- **Bỏ quên kiểm duyệt ngôn ngữ (Localization Neglect):**
  Các màn hình quản trị và báo cáo giáo viên bị trộn lẫn tiếng Anh và tiếng Việt vô tội vạ ("User", "Amount", "Pending" đứng cạnh "199.000₫"; "Top Students" đứng cạnh "Học sinh cần chú ý").
- **Thiếu giải pháp xử lý trạng thái rỗng công thái học:**
  Thay vì thu gọn vùng ảnh khi từ vựng không có hình minh họa, hệ thống lại dựng một khối hộp đen xám xịt 160px với icon `ImageOff` to tướng, đẩy nội dung kiến thức quan trọng trôi khỏi tầm nhìn của người học.

### 2.3. Phân Tích Hệ Thống Trụ Cột: CỨNG NGẮC (Systemic Ergonomic Rigidity)
- **Khiếm khuyết từ Primitives gốc lan truyền toàn hệ thống:**
  Việc file `src/components/ui/input.tsx` và `tabs.tsx` bị ép cứng chiều cao `h-8` (32px) đã khiến mọi form nhập liệu trong ứng dụng trở nên chật chội và dễ bấm trượt trên mobile. Thay vì sửa tận gốc ở component primitive, trang `/auth` lại chọn cách đối phó là tự viết một class riêng `min-h-12`.
- **Tư duy giam cầm người dùng (Hostile Navigation Patterns):**
  Onboarding `TourNavigator` sử dụng listener để cưỡng bức URL quay lại bước tour nếu người dùng bấm Back; `SurveyModal` không có nút thoát; `ChallengeInteractiveWrapper` bắt sự kiện chuột rời màn hình (`mouseleave`) để bung modal ép xem ưu đãi. Đây là những kỹ thuật xâm hại trải nghiệm người dùng nghiêm trọng.
- **Thiếu tư duy Responsive cho Bảng biểu dữ liệu:**
  Toàn bộ các bảng trong `/admin`, `/admin/crm`, `/admin/billing` đều dùng bảng HTML thuần bọc trong `overflow-x-auto`, biến việc tra cứu số liệu trên điện thoại thành một trải nghiệm cực hình với hàng chục thao tác vuốt ngang vô vọng.

### 2.4. Phân Tích Hệ Thống Trụ Cột: AI QUÁ (Systemic AI Gimmicks & Counterfeit Data)
- **Xâm phạm tính liêm chính dữ liệu EdTech (Academic Integrity Violation):**
  Hành vi dùng thuật toán băm FNV-1a để "chế" ra 21k–34k lượt thi TOEIC ảo, tạo số lượng chỗ giả `43/50 bạn` và `86% slot`, bắn toast sinh viên ảo 10 giây/lần, tạo bảng xếp hạng giới thiệu MLM ảo với số tiền thưởng bịa đặt, và đặc biệt là đưa số tài khoản giả `1111111111` vào mã thanh toán VietQR thật. Đây là những "vết đen" đe dọa trực tiếp uy tín pháp lý và thương hiệu LingoPro.
- **Lạm dụng vỏ bọc hình thức AI (Superficial AI Facade):**
  Các hiệu ứng cầu mờ `blur-3xl`, gradient 3 màu, bìa sách 3D nhấp nháy, emoji đội lốt mascot, và các thuật ngữ giả khoa học "VMS", "LCS", "Cramming" chỉ là lớp sơn mỏng che đậy sự thiếu vắng của những giá trị sư phạm cốt lõi.

---

## 3. MA TRẬN KHIẾM KHUYẾT TOÀN DIỆN (MASTER CROSS-MODULE SEVERITY MATRIX)

Dưới đây là bảng tổng hợp hợp nhất toàn bộ các khiếm khuyết được trích xuất từ 6 báo cáo phân hệ, phân cấp theo mức độ nghiêm trọng:

### 3.1. Nhóm Khiếm Khuyết Nguy Cấp (CRITICAL / P0 — 17 Vấn Đề)
*Tác động: Lỗi pháp lý/giao dịch, ngụy tạo số liệu, chiếm quyền điều hướng, mã chết diện rộng, vỡ giao diện cốt lõi.*

| Mã ID | Phân Hệ | File Đường Dẫn Cụ Thể | Vị Trí Dòng | Trụ Cột | Bản Chất Khiếm Khuyết & Rủi Ro |
|---|---|---|---|:---:|---|
| **MKT-01** | Marketing | `src/components/challenge/ChallengeJoinModal.tsx` | 56–63, 114 | **AI quá** | Mã QR VietQR thanh toán thật với STK giả `1111111111` Vietinbank, cam kết tự động xác nhận ảo. |
| **MKT-02** | Marketing | `src/app/page.tsx` vs `src/app/landing/page.tsx` | 267–270 | **Thừa** | Duy trì 2 landing page độc lập cạnh tranh nhau; nút "Bản Mới 2026" chắp vá trên navbar. |
| **MKT-03** | Marketing | `page.tsx`, `landing/`, `for-teachers/`, `nhan-qua/` | Toàn bộ tệp | **Xấu** | Hỗn loạn 6 bảng màu đối nghịch gây sốc thị giác (Vintage Be, Cool Slate, Xanh neon, Đen Cyberpunk). |
| **AUTH-01** | Auth | `src/components/auth/PasswordRecoveryForm.tsx` | 67–90 | **Xấu/Cứng** | Trang khôi phục mật khẩu trần trụi, không card, không logo, nút cam `bg-orange-800`, trông như web lừa đảo. |
| **AUTH-02** | Auth | `src/components/onboarding/*` (13 tệp) | Toàn thư mục | **Thừa** | ~80KB / ~1.950 dòng mã chết không hề được import; `TourBootstrap` bị ép trả về `null`. |
| **AUTH-03** | Auth | `src/components/onboarding/TourBootstrap.tsx` | 54–69 | **Cứng ngắc** | `TourNavigator` chiếm quyền điều hướng trình duyệt, chặn nút Back, ép nhảy qua 7 URL giam cầm học viên. |
| **D3-01** | Study/Exam | `src/app/toeic/page.tsx` | 201–246 | **AI quá/Thừa** | Thuật toán băm FNV-1a bịa đặt số liệu 21k–34k lượt thi và điểm trung bình cho toàn bộ danh mục đề ETS. |
| **D3-02** | Study/Exam | `src/app/flashcard/page.tsx` & `LearnMode.tsx` | Toàn bộ 939 dòng | **Thừa** | Hệ thống flashcard cũ chạy ngầm song song, trùng lặp logic FSRS và XP với `/review/session`. |
| **D3-03** | Study/Exam | `src/app/vstep/exam/[examId]/page.tsx` | 816–870, 178–204 | **Thừa/Cứng** | Monolith 1.459 dòng tự viết lại Audio Player, Timer, Question Palette và Barem CEFR thay vì dùng chung. |
| **D3-04** | Study/Exam | `src/components/lead-magnet/LeadMagnetClient.tsx` | 142–168, 223 | **AI quá/Thừa** | Phễu bán hàng giật tít ("15 bẫy sát thủ", "quà 699k"), 3 khối cầu mờ `blur-3xl` và sách 3D nhấp nháy. |
| **STU-01** | Student | `src/app/import/page.tsx` | 570–584 | **Thừa/Xấu** | Double sticky header; lặp lại nút "Trang học" và tiêu đề chiếm 120px đỉnh màn hình mobile. |
| **STU-02** | Student | `src/app/library/page.tsx` | 542–561 | **Thừa/Xấu** | Double sticky header; lặp lại nút `ChevronLeft` Dashboard và tiêu đề Thư viện. |
| **STU-03** | Student | `src/app/student/leaderboard/page.tsx` | 105–118, 237 | **Thừa/Xấu** | Double header + Xung đột nền tối vũ trụ (`indigo-950 via-slate-900`) nhốt trong Shell sáng. |
| **STU-04** | Student | `src/app/student/speaking/page.tsx` | 155–171 | **Thừa/Xấu** | Double header + Xung đột nền xám đen (`bg-slate-900`) nhốt trong Shell sáng. |
| **STU-06** | Student | `src/app/student/page.tsx` & `StudentShell.tsx` | L.906–913; Shell 532, 877 | **Thừa** | Bão 7-8 banner/modal dội thẳng vào mắt người học trước khi thấy nội dung từ vựng. |
| **STU-07** | Student | `src/components/student/WordDetailModal.tsx` | 282–286 | **Xấu/Cứng** | Khối hộp đen xám xịt 160px (`bg-slate-800/50`) với icon `ImageOff` choán nửa màn hình khi từ không có ảnh. |
| **STU-08** | Student | `src/app/student/referral/page.tsx` | 123–150, 446–450, 580 | **Thừa/AI quá** | Mảng dữ liệu giả `MOCK_LEADERBOARD`, tính hạng ảo `userRank`, luồng rút tiền VietQR MLM 1.682 dòng. |
| **ADM-01** | Admin | Thư mục `src/app/admin/` | Toàn thư mục | **Thừa/Cứng** | Toàn bộ phân hệ Admin thiếu `layout.tsx` và `AdminShell`; 5 trang tự trồng thanh header riêng rẽ. |
| **ADM-02** | Admin | `src/app/admin/crm/page.tsx` | 568–583 | **Xấu/Cứng** | Bảng CRM 12 cột chen chúc; 4 cột tiêu đề 1 từ khó hiểu ("Lưu", "Học", "Ôn", "Quên"). |
| **ADM-03** | Admin | `src/app/teacher/page.tsx` | 402, 651 | **Thừa/Xấu** | Multi-layer sticky headers: Header tầng 1 (56px) + Tabs tầng 2 (48px) chiếm 104px đỉnh màn hình. |
| **ADM-04** | Admin | `src/components/teacher/StudentsPanel.tsx` | 102–169, 635–682 | **AI quá** | Ma trận thuật ngữ giả khoa học VMS, LCS, Cramming, Ebbinghaus làm rối rắm giáo viên. |
| **D6-01** | Design Sys | `src/components/ui/input.tsx` | 11–14 | **Cứng ngắc** | Chiều cao `h-8` (32px) vi phạm nghiêm trọng chuẩn Apple HIG 44px; gây bấm trượt trên mobile. |

---

### 3.2. Nhóm Khiếm Khuyết Nghiêm Trọng (MAJOR / P1 — 28 Vấn Đề)
*Tác động: Trải nghiệm người dùng bị tổn hại rõ rệt, xung đột hiển thị mobile, phá vỡ hệ thống thiết kế.*

| Mã ID | Phân Hệ | File Đường Dẫn Cụ Thể | Vị Trí Dòng | Trụ Cột | Bản Chất Khiếm Khuyết |
|---|---|---|---|:---:|---|
| **MKT-04** | Marketing | `src/components/challenge-landing/UrgencyCountdown.tsx` | 11–37, 52 | **Thừa/AI quá** | Đếm ngược giả, cố định con số bịa đặt `43/50 bạn` và `86% slot`. |
| **MKT-05** | Marketing | `src/components/challenge-landing/FloatingSocialProof.tsx` | 15–56 | **Thừa/AI quá** | Popup social proof giả lập 5 sinh viên bắn liên tục mỗi 10 giây. |
| **MKT-06** | Marketing | `src/components/challenge-landing/ChallengeInteractiveWrapper.tsx`| 25–30 | **Cứng ngắc** | Bẫy chuột thoát màn hình desktop (`mouseleave`, `clientY <= 8`) ép xem ưu đãi. |
| **MKT-07** | Marketing | `src/app/download/page.tsx` | 82, 91–97 | **Cứng ngắc** | Nút logo và "Dashboard" trỏ cứng về `/student`, đẩy khách vãng lai sang `/auth`. |
| **MKT-08** | Marketing | `src/components/billing/WluWelcomeModal.tsx` | 71–82 | **Xấu** | Văn bản chat nội bộ xuề xòa (`cho ace thôi nhé ạ <3`, `cho e xin 1 lượt PR`) trên production. |
| **MKT-09** | Marketing | `src/app/nhan-qua/page.tsx` | 179–370 | **Thừa** | Gần 200 dòng mã form chết bị vô hiệu hóa thủ công bằng `{false && !isSuccess}`. |
| **MKT-10** | Marketing | `src/components/lead-magnet/LeadMagnetClient.tsx` | 154, 160–167 | **AI quá** | Lạm dụng từ ngữ giật tít ("Sát Thủ", "Bách Khoa Thực Chiến", "15 bẫy phòng thi"). |
| **AUTH-04** | Auth | `src/components/InstallPrompt.tsx` & `EnableNotifications.tsx` | 170 / 174 | **Thừa/Cứng** | Hai lớp floating bottom sheets cùng chiếm đáy màn hình, đè nát nhau trên mobile. |
| **AUTH-05** | Auth | `src/components/onboarding/SurveyModal.tsx` | 58–105 | **Cứng ngắc** | Bẫy khảo sát không nút đóng, không nút bỏ qua, chặn đứng màn hình. |
| **AUTH-06** | Auth | `src/components/ui/tabs.tsx` | 27 | **Cứng ngắc** | `TabsList` cao `h-8` (32px) vi phạm tiêu chuẩn vùng bấm 44px của Apple HIG. |
| **AUTH-07** | Auth | `src/app/auth/page.tsx` | 359–360, 515–546 | **Thừa** | Tự viết class `inputClass` cứu cháy và màn hình chuyển hướng thủ công `showManualRedirect`.|
| **AUTH-08** | Auth | `src/components/campaign/WelcomeKhaiGiangModal.tsx` | 153–180 | **AI quá/Xấu** | Modal đen Cyberpunk đối nghịch với `/auth`, lạm dụng glow blobs và ngày cũ 05/09. |
| **D3-05** | Study/Exam | `src/app/toeic/[part]/[ref]/page.tsx` | 353, 364–380 | **Thừa/Xấu** | Runner TOEIC cũ: khung đọc bị ép 288px (`max-h-72`), phương án mobile chia lưới 2x2 méo mó.|
| **D3-06** | Study/Exam | `src/components/toeic/ToeicSplitPane.tsx` | 1035–1048 | **Cứng ngắc** | Màn hình `< lg` bị xếp chồng dọc ép thí sinh cuộn lên xuống liên tục giữa đề và câu hỏi.|
| **D3-07** | Study/Exam | `src/components/toeic/ToeicAudioPlayer.tsx` | 312–321 | **Cứng ngắc** | Thanh tua audio mỏng 6px (`h-1.5`) không có hitbox mở rộng, vi phạm vùng chạm 44px. |
| **D3-08** | Study/Exam | `src/app/grammar/practice/page.tsx` | 882, 950–968 | **Cứng ngắc/Xấu** | Brutalist cực đoan `rounded-none`, font monospace in hoa gây sốc thẩm mỹ. |
| **D3-09** | Study/Exam | `src/app/practice/page.tsx` | 12–100, 106 | **Xấu/Cứng** | Khung co hẹp `max-w-lg` trên desktop; 8 màu cầu vồng tùy tiện, thiếu hoàn toàn dark mode. |
| **D3-10** | Study/Exam | `src/components/toeic/learn/ToeicLessonFlashcards.tsx` | 45–56 | **Thừa** | Trình flashcard thứ tư độc lập; tự ghi nhận từ đã thuộc vào `localStorage` riêng biệt. |
| **STU-05** | Student | `src/app/review/page.tsx` | 100–116 | **Thừa** | Header nội bộ lặp lại tiêu đề + nút Back hình vuông thừa thãi về `/student`. |
| **STU-09** | Student | `src/app/group/page.tsx` | 160–168 | **Xấu** | Giao diện tối thẳm `#070711` đối lập hoàn toàn với tông nền sáng của app. |
| **ADM-05** | Admin | `src/app/admin/billing/page.tsx` & `admin/page.tsx` | Billing 403; Admin 88 | **Xấu** | Trộn lẫn tiếng Anh và tiếng Việt cẩu thả ("User", "Amount", "Pending" vs "199.000₫"). |
| **ADM-06** | Admin | `src/app/admin/crm/page.tsx` | 434–445 | **Xấu** | Ép 8 thẻ KPI trên một hàng ngang (`lg:grid-cols-8`) làm vỡ nát font chữ và layout. |
| **ADM-07** | Admin | `src/app/admin/crm/`, `billing/`, `admin/` | crm 567; billing 400 | **Cứng ngắc** | Bẫy cuộn ngang trên mobile; không có Mobile Card View hoặc cố định cột đầu tiên. |
| **D6-02** | Design Sys | `src/components/ui/tabs.tsx` | 27 | **Cứng ngắc** | Chiều cao tab `h-8` (32px) gây chật chội trên màn hình cảm ứng di động. |
| **D6-03** | Design Sys | `src/components/ui/alert.tsx` | 3 | **Kỹ thuật** | Import sai thư viện tiện ích: `import { cn } from "cn"` thay vì `@/lib/utils`. |
| **D6-04** | Design Sys | `src/components/ui/checkbox.tsx` | 4 | **Kỹ thuật** | Import sai thư viện tiện ích: `import { cn } from "cn"` thay vì `@/lib/utils`. |
| **D6-05** | Design Sys | `src/app/globals.css` | 74 | **Xấu** | Token chuẩn `--primary` Indigo bị bỏ rơi; các trang tự do dùng màu be, xám slate, rêu neon.|
| **D6-06** | Design Sys | `src/components/ui/progress.tsx` | 31–38 | **Xấu** | Chiều cao thanh tiến độ chỉ dày 4px (`h-1`), gần như vô hình trên màn hình điện thoại. |

---

### 3.3. Nhóm Khiếm Khuyết Cần Tinh Chỉnh (MINOR & POLISH / P2 — 30 Vấn Đề)
*Tác động: Thẩm mỹ chi tiết, rác mã nguồn nhỏ, hiệu ứng template AI chưa tinh tế.*

| Mã ID | Phân Hệ | File Đường Dẫn Cụ Thể | Vị Trí Dòng | Trụ Cột | Bản Chất Khiếm Khuyết |
|---|---|---|---|:---:|---|
| **MKT-11** | Marketing | `src/components/lead-magnet/LeadMagnetClient.tsx` | 140–162 | **AI quá** | 3 khối cầu sáng ambient khổng lồ (`blur-3xl`, 700px) và text gradient 3 màu. |
| **MKT-12** | Marketing | `src/components/lead-magnet/BookCover3D.tsx` | 55–107 | **AI quá** | Mockup 3D đổ bóng cồng kềnh, badge nhún nhảy `animate-bounce`, avatar và rating 4.9/5 ảo. |
| **MKT-13** | Marketing | `src/app/for-teachers/page.tsx` | 264–266 | **Cứng ngắc** | Thẻ card bo cong thô cứng `rounded-[2rem]` đi kèm khung phụ xoay nghiêng `rotate-3` màu neon.|
| **MKT-14** | Marketing | `src/components/gamification/Mascot.tsx` | 5–31 | **AI quá** | Giả lập linh vật hời hợt bằng emoji Unicode nhún nhảy. |
| **MKT-15** | Marketing | `src/components/campaign/UpgradeGiftModal.tsx` | 1–4 | **Thừa** | File stub rỗng 4 dòng trả về `null` không mục đích. |
| **MKT-16** | Marketing | `src/components/upsell/UpsellModal.tsx` | 146–186 | **Xấu** | Tự định nghĩa hệ màu cát ấm riêng biệt (`#faf9f5`, `#e8e6dc`), lệch chuẩn Design Tokens. |
| **AUTH-09** | Auth | `src/components/onboarding/onboarding.css` | 132 | **Kỹ thuật** | Lỗi cú pháp CSS hiển nhiên `onboarding-pulse-glow: ;` không có giá trị. |
| **AUTH-10** | Auth | `src/components/ui/button.tsx` | 24–25 | **AI quá** | Biến thể nút bấm 3D viền đáy `border-b-4` đồ chơi Duolingo lệch pha với Technical Minimalist.|
| **D3-11** | Study/Exam | `src/app/toeic/page.tsx` | 550–591 | **Thừa** | 4 thẻ thống kê rỗng (3.700 câu, 20 đề, 7 parts, 10-990) chiếm diện tích lớn ở đầu trang. |
| **D3-12** | Study/Exam | `src/app/review/session/page.tsx` | 743–748 | **AI quá** | Màn hình hoàn thành dùng emoji thú cưng to 72px (`🦁🦊🐼`) và card tròn vo `rounded-3xl`. |
| **D3-13** | Study/Exam | `src/components/toeic/ToeicScoreReportView.tsx` | 71–117 | **Thừa/AI quá**| Bảng nhận xét tĩnh `PART_FEEDBACK` lặp lại khuôn mẫu cố định, không chẩn đoán đúng lỗi. |
| **D3-14** | Study/Exam | `src/app/practice/games/page.tsx` | 75–78 | **AI quá** | Hero banner gradient tím hồng rực rỡ với vòng tròn viền 30px trang trí rỗng. |
| **D3-15** | Study/Exam | `src/app/thpt/[type]/[ref]/page.tsx` | 130–136 | **Xấu/Cứng** | Phòng thi tốt nghiệp THPT dùng nút bấm đồ chơi `variant="chunky"` và emoji tiệc tùng `🎉`. |
| **D3-16** | Study/Exam | `src/app/review/session/page.tsx` | 488–525 | **Cứng ngắc** | Chuyển thẻ từ vựng giật cục đột ngột, thiếu hiệu ứng làm dịu mắt (fade transition). |
| **STU-10** | Student | `src/components/student/MobileBottomNav.tsx` | 116–123 | **AI quá** | Nút Lộ trình gradient xanh bóng nhẫy, emoji 🗺️ cỡ lớn phong cách template AI 2023. |
| **STU-11** | Student | `src/app/review/page.tsx` | 106, 219 | **AI quá** | Rò rỉ thuật ngữ kỹ thuật backend ("FSRS chung 1 pipeline", "MCQ đúng tối đa Good"). |
| **STU-12** | Student | `src/app/student/stats/page.tsx` | 1–6 | **Thừa** | Tuyến đường mồ côi 6 dòng lệnh gọi `redirect('/student/profile#stats')` gây giật màn hình. |
| **ADM-08** | Admin | `src/app/teacher/page.tsx` | 441–446 | **Cứng ngắc** | Popover chọn lớp trên mobile bị fixed lơ lửng (`top-16 inset-x-3`) thay vì Bottom Sheet. |
| **ADM-09** | Admin | `src/components/speaking/foundation/MouthAnatomyStudio.tsx`| 348–398 | **AI quá** | Gắn mác đao to búa lớn "Studio Khẩu Hình Chuẩn 2026" cho nội dung so sánh chữ đơn giản. |
| **ADM-10** | Admin | `src/components/teacher/StudentDetailSheet.tsx` | 548–589 | **AI quá** | Banner "Gemini AI đang soạn tin nhắn..." văn mẫu rập khuôn chiếm đỉnh hồ sơ học sinh. |
| **D6-07** | Design Sys | `src/components/ui/WordCardSkeleton.tsx` | Toàn bộ 40 dòng | **Thừa/Xấu** | Component nghiệp vụ thẻ từ bị đặt nhầm vào `ui/`; gán cứng `bg-white` làm hỏng dark mode. |
| **D6-08** | Design Sys | `src/components/ui/button.tsx` | 24–25 | **Xấu/Cứng** | Biến thể nút đồ chơi Duolingo 3D (`rounded-2xl border-b-4`) xung đột phong cách phẳng. |
| **D6-09** | Design Sys | `src/components/campaign/UpgradeGiftModal.tsx` | 1–4 | **Thừa** | Tệp stub rỗng 4 dòng chỉ trả về `return null;`. |
| **D6-10** | Design Sys | `src/components/ui/sonner.tsx` | 41 | **Kỹ thuật** | Tham chiếu class CSS ảo `cn-toast` không hề tồn tại trong dự án. |
| **D6-11** | Design Sys | `src/components/gamification/Mascot.tsx` | 5–32 | **AI quá** | Giả lập linh vật bằng cách bọc Emoji Unicode vào hiệu ứng giật `animate-bounce` sơ sài. |

---

## 4. DANH SÁCH 15 "QUICK WINS" THỰC THI NGAY (CONSOLIDATED QUICK WINS)

Các cải tiến có chi phí kỹ thuật thấp, thời gian triển khai dưới 2 giờ/tác vụ nhưng mang lại tác động trực tiếp và khôi phục sự trong sạch của hệ sinh thái:

1. **Xóa bỏ STK VietQR giả mạo `1111111111`:** Vô hiệu hóa nút thanh toán cọc trong `src/components/challenge/ChallengeJoinModal.tsx:56-63`, chuyển thành nút nhận thông báo cho đến khi tích hợp SePay/Cassie tự động.
2. **Thanh trừng thuật toán băm số liệu giả FNV-1a:** Xóa bỏ `hashStringFnv1a` và `getTestSocialMeta` tại `src/app/toeic/page.tsx:201-246`; thay bằng hiển thị thời lượng chuẩn (`120 phút`) và số câu hỏi (`200 câu`).
3. **Nâng kích thước vùng bấm `Input` và `Tabs` lên 44px (Apple HIG):** Sửa class trong `src/components/ui/input.tsx:12` thành `h-11 md:h-9` và `src/components/ui/tabs.tsx:27` thành `h-11 md:h-9`.
4. **Sửa lỗi import tiện ích `cn`:** Sửa `import { cn } from "cn"` thành `import { cn } from "@/lib/utils"` trong cả `src/components/ui/alert.tsx:3` và `checkbox.tsx:4`.
5. **Gỡ bỏ vĩnh viễn 2 bộ đồng hồ đếm ngược giả (Fake Countdown):** Xóa `UrgencyCountdown.tsx` và `ReferoUrgencyCountdownBar` (loại bỏ con số cố định `43/50 bạn` và `86% slot`).
6. **Gỡ bỏ 2 bộ popup sinh viên ảo (Fake Social Proof):** Xóa `FloatingSocialProof.tsx` và `ReferoFloatingSocialProof` (chấm dứt hiện tượng toast bắn liên tục 10s/lần).
7. **Gỡ bỏ bẫy chuột rời màn hình (Exit-Intent Trap):** Xóa listener `mouseleave` (`clientY <= 8`) trong `src/components/challenge-landing/ChallengeInteractiveWrapper.tsx:25-30`.
8. **Xóa bỏ hộp đen xám 160px `ImageOff` trong `WordDetailModal.tsx`:** Thu gọn khối ảnh về 0px khi từ vựng không có hình ảnh; đẩy tiêu đề và định nghĩa lên đỉnh modal.
9. **Xóa bỏ các tệp stub rác và class CSS ma:** Xóa tệp rác `src/components/campaign/UpgradeGiftModal.tsx`; xóa class ma `toast: "cn-toast"` trong `src/components/ui/sonner.tsx:41`.
10. **Dọn sạch 200 dòng mã form chết trong `/nhan-qua`:** Xóa toàn bộ khối `{false && !isSuccess ? ...}` tại `src/app/nhan-qua/page.tsx:179-370`.
11. **Sửa nút Back trên trang Download:** Chuyển `href="/student"` thành `href="/"` trong `src/app/download/page.tsx:82, 91` để khách vãng lai không bị ép sang `/auth`.
12. **Mở rộng vùng chạm tua Audio Player đạt 44px:** Bọc slider trong container `min-h-[44px] py-2.5` và tăng độ dày thanh tua lên 8px (`h-2`) trong `src/components/toeic/ToeicAudioPlayer.tsx:312`.
13. **Tăng độ dày thanh tiến độ học tập `ProgressTrack`:** Đổi `h-1` (4px) thành `h-2` (8px) trong `src/components/ui/progress.tsx:32`.
14. **Sửa lưới phương án 2x2 trên mobile của TOEIC Runner cũ:** Chuyển `grid-cols-2` thành `grid-cols-1` và nới lỏng `max-h-72` trong `src/app/toeic/[part]/[ref]/page.tsx:353, 366`.
15. **Chuẩn hóa văn bản xuề xòa trong `WluWelcomeModal.tsx`:** Thay thế đoạn chat `<3` và "xin lượt PR" bằng lời chào mừng học thuật, lịch thiệp.

---

## 5. KẾ HOẠCH HÀNH ĐỘNG CHIẾN LƯỢC 3 GIAI ĐOẠN (STRATEGIC 3-PHASE ACTION PLAN)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LỘ TRÌNH TỐI ƯU HÓA 3 GIAI ĐOẠN                           │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ GIAI ĐOẠN 1: QUICK WINS  │ GIAI ĐOẠN 2: TÁI CẤU TRÚC   │ GIAI ĐOẠN 3: ĐỒNG BỘ THẨM MỸ  │
│ (24 – 48 Giờ)            │ (Tuần 1 – Tuần 2)           │ (Tuần 3 – Tuần 4)             │
│ • Thanh lọc số liệu giả  │ • Hợp nhất AdminShell &     │ • Thống nhất 6 bảng màu       │
│ • Xóa mã rác & stubs     │   StudentShell              │ • Làm mềm phong cách          │
│ • Cứu nguy cảm ứng 44px  │ • Hợp nhất 4 lõi flashcard  │   Brutalist ngữ pháp          │
│ • Gỡ bỏ bẫy người dùng   │ • Chuẩn hóa Exam Runner     │ • Thanh lọc ngôn phong        │
│ • Xóa hộp đen ImageOff   │ • Xóa 13 tệp Onboarding     │ • Trưởng thành hóa Mascot     │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### GIAI ĐOẠN 1: QUICK WINS & INTEGRITY CLEANSE (Thực hiện trong 24 – 48 giờ)
- **Mục tiêu:** Loại bỏ toàn bộ rủi ro pháp lý, số liệu ngụy tạo, bẫy trải nghiệm và sửa các lỗi kỹ thuật nền tảng.
- **Các đầu việc trọng tâm:**
  1. Triển khai 15 hạng mục trong Danh sách Quick Wins ở Mục 4.
  2. Dịch 100% tiếng Việt cho các tiêu đề bảng trong `/admin/billing` và `/teacher` (loại bỏ hoàn toàn code-mixing).
  3. Cấu hình chuyển hướng (301 redirect) tạm thời cho các trang mồ côi `/student/stats` $\rightarrow$ `/student/profile`.
  4. Bổ sung class Dark Mode cho các thẻ trong `/practice/page.tsx` và `WordCardSkeleton.tsx` để chấm dứt tình trạng chói mắt ban đêm.

### GIAI ĐOẠN 2: STRUCTURAL ARCHITECTURE UNIFICATION (Thực hiện trong Tuần 1 – Tuần 2)
- **Mục tiêu:** Xóa bỏ sự phân mảnh kiến trúc, hợp nhất các hệ thống song song và tối ưu không gian hiển thị.
- **Các đầu việc trọng tâm:**
  1. **Xây dựng `AdminLayout` & `AdminSidebar` Chuẩn Mực:**
     - Tạo mới `src/app/admin/layout.tsx` với thanh Sidebar doanh nghiệp thống nhất (Tổng quan, CRM, Billing, Pilot Leads, Thử thách).
     - Xóa sạch toàn bộ các header tự trồng trong 5 trang con của `/admin`.
  2. **Triệt Tiêu Double Sticky Headers trong Student Portal:**
     - Xóa bỏ toàn bộ thẻ `<header>` cục bộ và nút `ChevronLeft` thừa thãi trong 5 trang con (`/import`, `/library`, `/student/leaderboard`, `/student/speaking`, `/review`).
     - Truyền các nút hành động phụ vào prop `headerRight` của `<StudentShell>`.
  3. **Hợp Nhất 4 Hệ Thống Flashcard Về 1 Lõi FSRS Duy Nhất:**
     - Đặt `/review/session` làm Runner trung tâm duy nhất kết nối với API `/api/words`.
     - Chuyển hướng 301 từ `/flashcard` về `/review/session`.
     - Tái cấu trúc Vocab Station và TOEIC Flashcards để gọi chung hook FSRS, chấm dứt việc lưu lén lút vào `localStorage`.
  4. **Chuẩn Hóa Động Cơ Khảo Thí (Standardized Exam Runner Unification):**
     - Đưa toàn bộ đề thi TOEIC về runner chuẩn `ToeicSplitPane.tsx`; xóa bỏ file legacy runner `src/app/toeic/[part]/[ref]/page.tsx`.
     - Trích xuất `ExamSplitPane` và `ExamAudioPlayer` dùng chung cho cả TOEIC và VSTEP, cắt giảm 800+ dòng mã trùng lặp trong VSTEP monolith.
     - Khai tử mảng dữ liệu MLM và luồng rút tiền trong `/student/referral`, chuyển thành trang "Mời bạn học — Tặng ngày VIP" dưới 300 dòng code.
  5. **Dọn Sạch Thư Mục Onboarding Rác (~80KB):**
     - Xóa bỏ hoàn toàn 13 tệp trong `src/components/onboarding/`.
     - Xây dựng cơ chế Contextual Onboarding (Thẻ chào mừng 3 bước nhẹ nhàng, dismissable) nhúng trực tiếp trong Dashboard `/student`.
  6. **Cơ Chế Điều Phối Độc Quyền (Mutex Slot) Cho Bottom Sheets Mobile:**
     - Xây dựng `useBottomBannerSlot` để giải quyết xung đột chồng đè giữa `InstallPrompt` (z-95) và `EnableNotifications` (z-96).
  7. **Hợp Nhất Canonical Landing Page:**
     - Giữ `src/app/page.tsx` làm trang chủ duy nhất.
     - Cấu hình chuyển hướng 301 từ `/landing` về `/`.
     - Xóa bỏ nút badge "Bản Mới 2026" trên thanh điều hướng.

### GIAI ĐOẠN 3: VISUAL POLISH & DESIGN SYSTEM HARMONY (Thực hiện trong Tuần 3 – Tuần 4)
- **Mục tiêu:** Đưa toàn bộ sản phẩm về chung triết lý Technical Minimalist, thanh lọc ngôn phong truyền thông và tinh chỉnh công thái học cao cấp.
- **Các đầu việc trọng tâm:**
  1. **Áp Đặt Kỷ Luật Token Toàn Diện (Strict Global Token Enforcement):**
     - Đồng bộ toàn bộ các trang công khai (`/privacy`, `/terms`, `/for-teachers`, `/challenge-landing`) về chung nền sáng tiêu chuẩn (`bg-background` hoặc nền trắng tối giản), loại bỏ nền đen tối sầm `slate-950` gây sốc thị giác.
     - Thay thế toàn bộ mã hex cứng (`#f6efe6`, `#241710`, `#f8fafc`) bằng các biến ngữ nghĩa `bg-background`, `text-foreground`, `border-border`, và `bg-primary`.
  2. **Làm Mềm Phong Cách Brutalist Trong Ngữ Pháp:**
     - Thay thế `rounded-none` thô ráp và font typewriter in hoa trong `src/app/grammar/practice/page.tsx` bằng góc bo nhẹ `rounded-sm` (4px) hoặc `rounded-md` (6px), viền mảnh trung tính.
  3. **Tối Ưu Hóa Split-Pane Cho Màn Hình Cảm Ứng Di Động:**
     - Trên màn hình `< lg`, thay thế cơ chế cuộn dọc 50/50 bằng bộ tab chuyển đổi cố định ở đỉnh: `[ 📄 Bài Đọc (Part 7) ]` và `[ ❓ Câu Hỏi (1/3) ]`.
  4. **Thanh Lọc Ngôn Phong Truyền Thông (Editorial Purity):**
     - Thay thế toàn bộ từ ngữ giật gân, tâng bốc ("Sát Thủ", "Bách Khoa Thực Chiến", "Bẻ gãy bẫy phòng thi") bằng ngôn từ khoa học, điềm đạm ("Cẩm Nang Chiến Lược Khảo Thí Bài Nghe TOEIC", "Phân Tích 15 Dạng Bẫy Thường Gặp").
     - Thay các thuật ngữ giả khoa học LMS ("VMS", "LCS", "Cramming") bằng tiếng Việt thân thiện ("Độ nhớ từ", "Chuyên cần", "Cần phụ đạo").
  5. **Nâng Cấp Hệ Thống Mascot & Feedback Gamification:**
     - Xóa bỏ các biểu tượng thú cưng trẻ con (`🦁🦊🐼`) ở màn hình chúc mừng FSRS; thay bằng đồng hồ năng lực CEFR / TOEIC ước tính chuyên nghiệp.
     - Thay thế `Mascot.tsx` emoji nhún nhảy bằng bộ biểu tượng SVG line-art tối giản mang phong cách học thuật cao cấp.
  6. **Loại Bỏ Hoàn Toàn Biến Thể Nút Đồ Chơi 3D Duolingo (`chunky`):**
     - Gỡ bỏ variant `chunky` khỏi `src/components/ui/button.tsx`, đồng bộ toàn bộ nút thao tác về phong cách phẳng tinh tế.

---

## 6. KẾT LUẬN & ĐIỀU KIỆN NGHIỆM THU TỔNG THỂ (AUDIT SIGN-OFF CRITERIA)

Dự án chỉ được coi là hoàn tất tái cấu trúc UI/UX và sẵn sàng cho các chiến dịch phát triển quy mô lớn khi thỏa mãn **toàn bộ 7 điều kiện nghiệm thu then chốt**:

1. **Liêm Chính Dữ Liệu 100%:** 0 dữ liệu giả mạo (0 FNV-1a hash, 0 fake timer, 0 fake social proof, 0 số tài khoản VietQR ảo, 0 MLM leaderboard).
2. **Loại Bỏ Hoàn Toàn Kiến Trúc Song Song:** 1 Landing Page duy nhất, 1 Động cơ Flashcard FSRS duy nhất, 1 Bộ Exam Split-Pane dùng chung cho mọi kỳ thi chuẩn hóa.
3. **Thanh Lọc 100% Mã Chết:** Toàn bộ thư mục rác `src/components/onboarding/`, tệp stub `UpgradeGiftModal.tsx`, và các khối JSX `false &&` được xóa sạch khỏi codebase.
4. **Chuẩn Hóa Công Thái Học Mobile (Apple HIG):** 100% các ô nhập liệu `Input`, bộ `Tabs`, và thanh trượt `AudioPlayer` đạt vùng chạm cảm ứng tối thiểu 44x44px.
5. **Triệt Tiêu Double Sticky Headers:** Không còn bất kỳ trang con nào tự tạo header thứ hai đè lên `StudentShell` hoặc `AdminLayout`.
6. **Nhất Quán Bản Sắc Thị Giác (Design Tokens Compliance):** 100% các trang tiêu thụ token màu sắc chuẩn trong `globals.css`; chấm dứt hoàn toàn tình trạng sốc thị giác giữa 6 bảng màu đối kháng.
7. **Thuần Khiết Ngôn Phong & Sư Phạm (Technical Minimalist Purity):** Không còn từ ngữ giật tít "sát thủ", không còn thuật ngữ giả khoa học rập khuôn; giao diện phẳng, sắc nét, trung tính và tôn trọng người học.
