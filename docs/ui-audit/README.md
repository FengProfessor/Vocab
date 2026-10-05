# TRUNG TÂM KIỂM TOÁN UI/UX LINGOPRO (MASTER AUDIT HUB)
## BỘ BÁO CÁO KIỂM TOÁN TOÀN DIỆN GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG

**Thư mục lưu trữ:** `docs/ui-audit/`  
**Dự án:** LingoPro Web Application (`d:\Vibe\Vocab\web-app`)  
**Ngày phát hành:** 04/10/2026  
**Phiên bản kiểm toán:** 1.0 (Full System Audit)  
**Tiêu chuẩn định hướng:** **Technical Minimalist**, EdTech Academic Standards, Apple HIG (44px Touch Targets), WCAG 2.1 AA Contrast.

---

## 1. BẢNG ĐIỀU KHIỂN TỔNG QUAN KIỂM TOÁN (AUDIT DASHBOARD)

### 1.1. Siêu Dữ Liệu Kiểm Toán (Audit Metadata)
- **Tổng số Route App Router được rà soát:** **38 Tuyến đường** (`src/app/**`)
- **Tổng số Component giao diện được đối soát:** **120+ Thành phần** (`src/components/**`)
- **Tổng số dòng mã nguồn được phân tích trực tiếp:** **> 35.000 dòng mã**
- **Tổng số khiếm khuyết được định danh & chứng minh:** **75 Khiếm khuyết (Defects)**

### 1.2. Thống Kê Theo Mức Độ Nghiêm Trọng (Severity Breakdown)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TỔNG HỢP 75 KHIẾM KHUYẾT                        │
├─────────────────────────┬────────────────────────┬─────────────────────┤
│ 🔴 CRITICAL (Nguy cấp)  │ 🟠 MAJOR (Nghiêm trọng)│ 🟡 MINOR (Tinh chỉnh│
│      22 Khiếm khuyết    │     27 Khiếm khuyết    │     26 Khiếm khuyết │
│          (29.3%)        │         (36.0%)        │         (34.7%)     │
└─────────────────────────┴────────────────────────┴─────────────────────┘
```

- **🔴 Critical (22 lỗi):** Giao dịch với STK giả mạo, ngụy tạo số liệu băm FNV-1a, chiếm quyền điều hướng trình duyệt, ~80KB mã chết Onboarding, vi phạm vùng bấm cảm ứng Apple HIG, double sticky headers nuốt trọn mobile, MLM referral giả.
- **🟠 Major (27 lỗi):** Đồng hồ đếm ngược giả, popup học viên ảo, bẫy chuột rời màn hình, xung đột 6 bảng màu, runner TOEIC vỡ lưới trên mobile, code-mixing Anh-Việt, thiếu Admin Layout.
- **🟡 Minor & Polish (26 lỗi):** Lỗi cú pháp CSS stylesheet, hiệu ứng gradient 3 màu AI, linh vật emoji nhún nhảy, thẻ rỗng trả về `null`, thuật ngữ giả khoa học LMS.

---

### 1.3. Thống Kê Theo 4 Trụ Cột Đánh Giá (4-Pillar Distribution)

```
       [THỪA] 24 Lỗi (32.0%)  ──────────  Mã chết, trùng lặp 4 flashcard, 2 landing page, double header.
        [XẤU] 18 Lỗi (24.0%)  ──────────  Hỗn loạn 6 bảng màu, code-mixing, hộp đen ImageOff 160px.
   [CỨNG NGẮC] 16 Lỗi (21.3%)  ──────────  Touch target 32px vi phạm Apple HIG, route hijacking, cuộn dọc.
     [AI QUÁ] 17 Lỗi (22.7%)  ──────────  Bịa đặt FNV-1a, đếm ngược giả, VietQR ảo, ambient blobs, MLM.
```

---

### 1.4. Ma Trận Thống Kê Theo Từng Phân Hệ (Module Defect Matrix)

| Mã Phân Hệ | Tài Liệu Báo Cáo | Phạm Vi Kiểm Toán | Critical | Major | Minor | Tổng Số | Sức Khỏe UI |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|
| **01** | [`01_landing_marketing.md`](./01_landing_marketing.md) | Landing Pages, Chiến dịch, B2B Teachers, CRO | 3 | 7 | 6 | **16** | 48 / 100 |
| **02** | [`02_auth_onboarding.md`](./02_auth_onboarding.md) | Đăng nhập, Khôi phục mật khẩu, Onboarding, Modals | 3 | 5 | 2 | **10** | 46 / 100 |
| **03** | [`03_study_exam_engines.md`](./03_study_exam_engines.md) | Khảo thí TOEIC, VSTEP, THPT, Flashcard, Ngữ pháp | 4 | 6 | 6 | **16** | 58 / 100 |
| **04** | [`04_student_dashboard.md`](./04_student_dashboard.md) | Student Hub, LMS Dashboard, Ôn tập FSRS, Profile | 6 | 3 | 3 | **12** | 52 / 100 |
| **05** | [`05_admin_management.md`](./05_admin_management.md) | Admin Suite, Billing, CRM, Teacher LMS Portal | 4 | 3 | 3 | **10** | 50 / 100 |
| **06** | [`06_design_system_components.md`](./06_design_system_components.md) | Design Tokens, UI Primitives, Touch Ergonomics | 1 | 4 | 6 | **11** | 56 / 100 |
| **00** | [`00_EXECUTIVE_SUMMARY.md`](./00_EXECUTIVE_SUMMARY.md) | **Báo Cáo Tổng Hợp & Kế Hoạch Hành Động 3 Giai Đoạn** | — | — | — | — | **52 / 100** |

---

## 2. DANH MỤC TÀI LIỆU KIỂM TOÁN (DOCUMENT DIRECTORY & NAVIGATION HUB)

Bộ tài liệu kiểm toán gồm 7 báo cáo được liên kết chặt chẽ, phục vụ cho Ban Giám đốc Sản phẩm (CPO), Kiến trúc sư Trưởng (Lead Architect), và Đội ngũ Kỹ sư Frontend:

```
docs/ui-audit/
├── 00_EXECUTIVE_SUMMARY.md            # Báo cáo Tổng quan Chiến lược & Lộ trình 3 Giai đoạn
├── 01_landing_marketing.md            # Phân hệ Marketing, Landing Pages & Tối ưu Chuyển đổi (CRO)
├── 02_auth_onboarding.md             # Phân hệ Xác thực (Auth) & Hướng dẫn Nhập cuộc (Onboarding)
├── 03_study_exam_engines.md           # Phân hệ Động cơ Học tập & Phòng thi Chuẩn hóa (TOEIC, VSTEP, THPT)
├── 04_student_dashboard.md            # Phân hệ Học viên, Student Dashboard & LMS
├── 05_admin_management.md             # Phân hệ Quản trị Admin, Teacher LMS & Studio CMS
├── 06_design_system_components.md     # Hệ thống Thiết kế, UI Primitives & Tokens
└── README.md                          # Trung tâm Điều hướng & Dashboard Tổng thể (Tài liệu này)
```

### Chi Tiết Tóm Tắt Từng Tài Liệu:

1. **[`00_EXECUTIVE_SUMMARY.md`](./00_EXECUTIVE_SUMMARY.md) — Báo Cáo Tổng Quan & Lộ Trình Hành Động**
   - Đánh giá sức khỏe tổng thể (52/100, UX Maturity Level 2).
   - Phân tích sâu 4 nguyên nhân gốc rễ liên phân hệ.
   - Bảng Ma trận Khiếm khuyết Toàn diện (Master Severity Matrix: 22 Critical, 28 Major, 25 Minor).
   - Danh sách 15 "Quick Wins" có thể thực thi ngay trong 24 giờ.
   - Lộ trình chiến lược 3 giai đoạn: Quick Wins $\rightarrow$ Tái cấu trúc Kiến trúc $\rightarrow$ Đồng bộ Thẩm mỹ.

2. **[`01_landing_marketing.md`](./01_landing_marketing.md) — Marketing, Landing & CRO**
   - Vạch trần tình trạng 2 Landing Page song song (`/` và `/landing`), nút gài "Bản Mới 2026" chắp vá.
   - Minh chứng mã nguồn số tài khoản ngân hàng giả `1111111111` trong VietQR nạp cọc `ChallengeJoinModal.tsx`.
   - Vạch trần 2 bộ đồng hồ đếm ngược giả (43/50 bạn, 86%) và popup sinh viên ảo bắn 10s/lần.
   - Bẫy chuột rời màn hình desktop (`mouseleave`, `clientY <= 8`).
   - 200 dòng mã form chết trong `/nhan-qua`; từ ngữ giật tít ("Sát thủ", "Bách khoa thực chiến").

3. **[`02_auth_onboarding.md`](./02_auth_onboarding.md) — Xác Thực & Hướng Dẫn Nhập Cuộc**
   - Vạch trần trang Quên mật khẩu trần trụi, nút cam chắp vá, trông như trang web lừa đảo (phishing).
   - Phát hiện ~80KB mã nguồn chết gồm 13 tệp trong `src/components/onboarding/` không hề được import.
   - Vạch trần cơ chế chiếm quyền điều hướng (Route Hijacking) của `TourNavigator` ép chuyển 7 URL.
   - Bẫy khảo sát `SurveyModal` không nút thoát; xung đột tọa độ của 2 lớp bottom sheet trên mobile.

4. **[`03_study_exam_engines.md`](./03_study_exam_engines.md) — Động Cơ Học Tập & Khảo Thí Chuẩn Hóa**
   - Vạch trần thuật toán băm FNV-1a ngụy tạo 21k–34k lượt thi và điểm trung bình cho đề thi TOEIC.
   - Phát hiện 4 hệ thống Flashcard độc lập chạy song song, phân mảnh tiến trình học viên.
   - Monolith VSTEP 1.459 dòng tự viết lại toàn bộ Audio Player và Question Palette.
   - Runner TOEIC cũ: khung đọc Part 7 bị ép cứng 288px (`max-h-72`), mobile chia lưới phương án 2x2 lệch lạc.
   - Phong cách Brutalist cực đoan `rounded-none` trong phòng thực hành Ngữ pháp.

5. **[`04_student_dashboard.md`](./04_student_dashboard.md) — Học Viên, Student Dashboard & LMS**
   - Vấn nạn "Double Sticky Headers": 5 trang con (`/import`, `/library`, `/student/leaderboard`, `/student/speaking`, `/review`) tự trồng header dính thứ 2 đè lên `StudentShell`, chiếm 120px đỉnh mobile.
   - Khối hộp đen xám 160px với icon `ImageOff` choán nửa màn hình khi từ không có ảnh trong `WordDetailModal`.
   - Bão 7-8 banner quảng cáo và modal dội vào học viên trước khi thấy từ vựng.
   - Mô hình tiếp thị đa cấp MLM với danh sách sinh viên giả `MOCK_LEADERBOARD` trong `/student/referral`.

6. **[`05_admin_management.md`](./05_admin_management.md) — Quản Trị Admin, Teacher LMS & CMS**
   - Thư mục `src/app/admin/` hoàn toàn thiếu `layout.tsx` và `AdminShell`; 5 trang con là các ốc đảo rời rạc.
   - Bảng CRM 12 cột chen chúc với tiêu đề cụt lủn 1 chữ ("Lưu", "Học", "Ôn", "Quên").
   - Multi-layer sticky headers trong Teacher LMS: Header tầng 1 (56px) + Tabs tầng 2 (48px) chiếm 104px.
   - Ma trận thuật ngữ giả khoa học VMS, LCS, Cramming, Ebbinghaus làm khó giáo viên.
   - Loạn ngôn ngữ nửa Anh nửa Việt trên các bảng quản trị và báo cáo.

7. **[`06_design_system_components.md`](./06_design_system_components.md) — Hệ Thống Thiết Kế & Primitives**
   - Component `Input` và `TabsList` trong `src/components/ui/` bị ép cứng chiều cao 32px (`h-8`), vi phạm nghiêm trọng chuẩn Apple HIG 44px.
   - Lỗi import thư viện tiện ích: `import { cn } from "cn"` thay vì `@/lib/utils` trong `alert.tsx` và `checkbox.tsx`.
   - Thanh tiến độ mỏng như sợi chỉ 4px (`h-1`) trong `progress.tsx`.
   - Biến thể nút bấm đồ chơi Duolingo 3D `chunky` (`border-b-4`) lệch pha với ngôn ngữ phẳng.
   - Component nghiệp vụ `WordCardSkeleton.tsx` nằm nhầm trong thư mục `ui/`, thiếu dark mode.

---

## 3. TOP 10 KHIẾM KHUYẾT ẢNH HƯỞNG LỚN NHẤT (TOP 10 HIGH-IMPACT FINDINGS)

Bảng xếp hạng 10 vấn đề có mức độ đe dọa cao nhất đối với tính liêm chính sản phẩm, trải nghiệm người dùng và kiến trúc hệ thống:

| Hạng | Mã ID | Tệp Mã Nguồn & Vị Trí Dòng | Tóm Tắt Khiếm Khuyết Trọng Yếu | Mức Độ | Báo Cáo Chi Tiết |
|:---:|:---:|---|---|:---:|:---:|
| **#1** | **MKT-01** | `src/components/challenge/ChallengeJoinModal.tsx:56-63` | **Tạo mã VietQR nạp tiền cọc thật với STK giả `1111111111`**, cam kết tự động xác nhận ảo. Rủi ro pháp lý và thất thoát tài chính. | 🔴 Critical | [`01_landing_marketing.md`](./01_landing_marketing.md#41-minh-chứng-vietqr-ảo-trong-giao-dịch-thật) |
| **#2** | **D3-01** | `src/app/toeic/page.tsx:201-246` | **Thuật toán băm FNV-1a bịa đặt 21k–34k lượt thi và điểm trung bình** cho toàn bộ đề ETS. Xâm phạm trực tiếp tính liêm chính học thuật. | 🔴 Critical | [`03_study_exam_engines.md`](./03_study_exam_engines.md#41-minh-chứng-thuật-toán-băm-số-liệu-giả-mạo-fnv-1a) |
| **#3** | **AUTH-02**<br/>**AUTH-03** | `src/components/onboarding/*`<br/>`TourBootstrap.tsx:54-69` | **~80KB mã nguồn chết gồm 13 tệp Onboarding**; component `TourNavigator` bắt cóc router, ép đổi 7 URL giam cầm người dùng. | 🔴 Critical | [`02_auth_onboarding.md`](./02_auth_onboarding.md#42-minh-chứng-tourbootstrap-đã-bị-vô-hiệu-hóa-khẩn-cấp-nhưng-để-lại-rác) |
| **#4** | **D6-01** | `src/components/ui/input.tsx:11-14` | **Ô nhập liệu Input cao 32px (`h-8`) vi phạm chuẩn Apple HIG 44px**, gây bấm trượt liên tục trên mobile; ép `/auth` phải tự viết class cứu cháy. | 🔴 Critical | [`06_design_system_components.md`](./06_design_system_components.md#41-minh-chứng-vi-phạm-chiều-cao-vùng-bấm-32px-trong-inputtsx) |
| **#5** | **STU-01**<br/>**STU-02** | `src/app/import/page.tsx:570`<br/>`src/app/library/page.tsx:542` | **Double Sticky Headers trên 5 subpages của học sinh**: lặp lại nút Back và tiêu đề, cướp mất 120px diện tích màn hình di động. | 🔴 Critical | [`04_student_dashboard.md`](./04_student_dashboard.md#41-minh-chứng-lỗi-double-sticky-headers-srcappimportpagetsx) |
| **#6** | **MKT-02** | `src/app/page.tsx:267-270`<br/>`src/app/landing/page.tsx` | **Hai landing page độc lập cạnh tranh nhau**, nút gài "Bản Mới 2026" chắp vá trên navbar làm phân mảnh nhận diện và loãng SEO. | 🔴 Critical | [`01_landing_marketing.md`](./01_landing_marketing.md#11-hai-trang-landing-page-trùng-lặp-mục-tiêu-hoạt-động-song-song) |
| **#7** | **D3-02**<br/>**D3-10** | `src/app/flashcard/page.tsx`<br/>`ToeicLessonFlashcards.tsx` | **4 hệ thống flashcard độc lập chạy song song xung đột**, tự duy trì queue SRS và lưu `localStorage` riêng rẽ, không đồng bộ FSRS. | 🔴 Critical | [`03_study_exam_engines.md`](./03_study_exam_engines.md#21-pillar-1-thừa-redundancy-clutter-duplicate-runners--dead-systems) |
| **#8** | **STU-08** | `src/app/student/referral/page.tsx:123-150` | **Hệ thống mời bạn bè biến tướng thành tiếp thị đa cấp MLM 1.682 dòng**, chứa dữ liệu giả `MOCK_LEADERBOARD` và nút rút tiền mặt VietQR. | 🔴 Critical | [`04_student_dashboard.md`](./04_student_dashboard.md#44-minh-chứng-lỗi-dữ-liệu-fake--thứ-hạng-giả-lập-srcappstudentreferralpagetsx) |
| **#9** | **ADM-01** | Thư mục `src/app/admin/` | **Toàn bộ phân hệ Admin hoàn toàn thiếu `layout.tsx` và `AdminShell`**; 5 trang con tự trồng thanh điều hướng rời rạc, nhảy nút lung tung. | 🔴 Critical | [`05_admin_management.md`](./05_admin_management.md#41-minh-chứng-bảng-crm-12-cột--tiêu-đề-cụt-lủn-srcappadmincrmpagetsx) |
| **#10** | **MKT-03**<br/>**D6-05** | Toàn bộ các trang công khai & `globals.css:74` | **Hỗn loạn 6 bảng màu đối nghịch gây "Visual Shock"**: Vintage Be (`#f6efe6`), Cool Slate (`#f8fafc`), Rêu neon, Đen Cyberpunk (`slate-950`). | 🔴 Critical | [`01_landing_marketing.md`](./01_landing_marketing.md#21-tình-trạng-hỗn-loạn-6-hệ-thống-bảng-màu-không-tương-thích) |

---

## 4. HƯỚNG DẪN TRIỂN KHAI CHO ĐỘI NGŨ KỸ SƯ & SẢN PHẨM (IMPLEMENTATION GUIDE)

Để đảm bảo quá trình tái cấu trúc diễn ra an toàn, không gián đoạn dịch vụ production và đạt chuẩn nghiệm thu cao nhất, các nhóm kỹ sư cần tuân thủ nghiêm ngặt quy trình dưới đây:

### 4.1. Chiến Lược Phân Nhánh Git (Git Branching Strategy)

```
main (Production)
  │
  ├── release/ui-overhaul-2026
  │     │
  │     ├── feature/ui-audit-phase1-quickwins      (Sprint 1: 24-48h)
  │     ├── feature/ui-audit-phase2-architecture   (Sprint 2: Tuần 1-2)
  │     └── feature/ui-audit-phase3-polish         (Sprint 3: Tuần 3-4)
```

1. **Sprint 1 — `feature/ui-audit-phase1-quickwins`:**
   - Tập trung xử lý dứt điểm 15 Quick Wins trong [`00_EXECUTIVE_SUMMARY.md § 4`](./00_EXECUTIVE_SUMMARY.md#4-danh-sách-15-quick-wins-thực-thi-ngay-consolidated-quick-wins).
   - Kiểm tra hồi quy: Chạy `npm run lint` và `npx tsc --noEmit`.
2. **Sprint 2 — `feature/ui-audit-phase2-architecture`:**
   - Xây dựng `src/app/admin/layout.tsx` và `AdminSidebar`.
   - Triệt tiêu các header con thừa thãi trong `StudentShell`.
   - Xóa bỏ thư mục `src/components/onboarding/`.
   - Chuyển hướng 301 cho `/landing` và `/flashcard`.
3. **Sprint 3 — `feature/ui-audit-phase3-polish`:**
   - Đồng bộ token màu sắc, loại bỏ toàn bộ mã hex cứng.
   - Thay thế nút đồ chơi Duolingo `chunky`, làm mềm Ngữ pháp, tinh chỉnh Mascot.

---

### 4.2. Danh Sách Kiểm Tra Khi Mở Pull Request (PR Review Checklist)

Mọi Pull Request liên quan đến giao diện bắt buộc phải thỏa mãn 6 tiêu chí kiểm tra nghiêm ngặt:

- [ ] **Liêm chính Dữ liệu (Integrity Check):** Tuyệt đối không chứa số liệu tạo bằng hàm băm ngẫu nhiên, không chứa đồng hồ đếm ngược cố định, không dùng số tài khoản ngân hàng ảo.
- [ ] **Công thái học Cảm ứng (Touch Target Check):** Tất cả các thành phần tương tác (`button`, `input`, `select`, `tab`) phải đạt chiều cao tối thiểu **44px trên màn hình di động** (< 768px).
- [ ] **Kỷ luật Token (Token Discipline):** Không sử dụng mã màu hex cố định (`#...`) trong class Tailwind; bắt buộc dùng token ngữ nghĩa (`bg-background`, `text-foreground`, `bg-primary`, `border-border`).
- [ ] **Độc tôn Khung nhìn (Single Shell Policy):** Trang con bọc trong Shell không được phép tự tạo thêm sticky header thứ hai hoặc nút quay lại thừa thãi.
- [ ] **Thẩm mỹ Technical Minimalist:** Không sử dụng nút bấm 3D dày cộp `border-b-4`, không dùng các khối cầu mờ `blur-3xl` kích thước lớn vô căn cứ, không dùng text gradient 3 màu nhấp nháy.
- [ ] **Kiểm thử Tĩnh (Static Verification):** Vượt qua hoàn toàn lệnh kiểm tra tĩnh của dự án (`npm run type-check` hoặc `npm run lint`) với 0 cảnh báo mới.

---

### 4.3. Phân Công Trách Nhiệm Phối Hợp (Cross-Functional RACI)

| Vai trò | Thành viên phụ trách | Nhiệm vụ chính trong chiến dịch tối ưu hóa |
|---|---|---|
| **Tech Lead / Architect** | Kỹ sư Trưởng | Phê duyệt kiến trúc `AdminLayout`, `ExamSplitPane`, và cơ chế Mutex Slot cho Mobile Bottom Sheets; giám sát việc xóa bỏ mã chết. |
| **Frontend Engineer 1** | Kỹ sư Marketing & Auth | Thực thi các Quick Wins Marketing; hợp nhất 2 landing pages; chuẩn hóa `PasswordRecoveryForm`; xóa 13 tệp Onboarding cũ. |
| **Frontend Engineer 2** | Kỹ sư Study & Exam | Hợp nhất 4 hệ thống Flashcard về FSRS lõi; tích hợp runner TOEIC và VSTEP; chuẩn hóa Audio Player. |
| **Frontend Engineer 3** | Kỹ sư Student & Admin | Triệt tiêu Double Sticky Headers; xây dựng `AdminSidebar`; chuẩn hóa bảng CRM; xóa bỏ luồng MLM referral. |
| **Product Designer** | Chuyên viên UI/UX | Giám sát việc tuân thủ Design Tokens; chuẩn hóa hệ thống Mascot SVG; kiểm tra độ tương phản WCAG 2.1 AA. |
| **Pedagogical Lead** | Trưởng ban Chuyên môn | Biên tập lại toàn bộ ngôn phong truyền thông (loại bỏ từ giật tít "sát thủ", thay thế thuật ngữ giả khoa học LMS VMS/LCS). |

---

## 5. THÔNG TIN LIÊN HỆ & PHẢN HỒI

Mọi thắc mắc hoặc đề xuất điều chỉnh liên quan đến bộ báo cáo kiểm toán UI/UX, vui lòng đối chiếu trực tiếp với các tệp báo cáo chuyên biệt tương ứng hoặc liên hệ với Nhóm Kiểm toán UI/UX LingoPro thông qua kênh kỹ thuật nội bộ của dự án.
