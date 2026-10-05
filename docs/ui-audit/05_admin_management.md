# BÁO CÁO KIỂM TOÁN UI/UX: PHÂN HỆ QUẢN TRỊ ADMIN, TEACHER LMS & STUDIO CMS

- **Mã tài liệu**: `docs/ui-audit/05_admin_management.md`
- **Phân hệ kiểm toán**: Phân hệ Quản trị Vận hành (Admin Suite), Cổng Quản lý Lớp học Giáo viên (Teacher LMS Portal), Hệ thống Quản trị Nội dung (CMS & Studio Tools)
- **Đối tượng kiểm toán**: `src/app/admin/` (main, billing, crm, challenges, pilot-leads), `src/app/teacher/`, `src/components/teacher/` (`StudentsPanel`, `WordsPanel`, `GrammarPanel`, `AnalyticsPanel`, `StudentDetailSheet`), và các Studio nhúng (`IpaPracticeStudio.tsx`, `MouthAnatomyStudio.tsx`)
- **Tiêu chuẩn kiểm toán**: 4 Trụ Cột Trọng Tâm — **THỪA** (Disconnected Pages/Headers), **XẤU** (Code-Mixing/12-Column Cramming), **CỨNG NGẮC** (Mobile Table Traps/Popovers), **AI QUÁ** (Pseudoscientific Jargon/Studio Gimmicks)
- **Trạng thái**: Hoàn thành thẩm định chuyên sâu & Đề xuất giải pháp khắc phục

---

## 1. PHÂN LOẠI & TỔNG QUAN PHÂN HỆ (ROUTE & COMPONENT INVENTORY)

Phân hệ Quản trị & Giảng dạy chịu trách nhiệm vận hành dữ liệu người dùng, đối soát doanh thu, quản lý danh sách học sinh theo lớp, theo dõi tiến độ ghi nhớ từ vựng và biên soạn học liệu. Khác với phân hệ học viên, nhóm giao diện này yêu cầu mật độ thông tin cao, thao tác nhanh và tính chuẩn xác của các số liệu phân tích.

### 1.1. Danh mục Tuyến đường Quản trị & Giảng dạy (Route Inventory)

| Tuyến đường (Route) | File xử lý chính | Vai trò chức năng | Thành phần giao diện chủ đạo |
|---|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | Trang tổng quan vận hành hệ thống | Header tự tạo với 4 nút pill, 4 Thẻ KPI tổng, Bảng User Activity 6 cột |
| `/admin/crm` | `src/app/admin/crm/page.tsx` | Quản lý quan hệ khách hàng & theo dõi phễu học viên | 8 Thẻ KPI ngang, `CrmSignupChart`, Bảng khách hàng 12 cột, `CustomerDrawer` trượt phải |
| `/admin/billing` | `src/app/admin/billing/page.tsx` | Quản trị đơn hàng, thanh toán SePay & doanh thu | `BillingRevenueChart`, 5 Thẻ KPI tài chính, Bảng đơn hàng 7 cột, Quản lý Coupon |
| `/admin/challenges` | `src/app/admin/challenges/page.tsx` | Quản trị sự kiện thử thách học tập & đặt cọc | Bảng danh sách challenge, Form tạo điều kiện hoàn tiền |
| `/admin/pilot-leads`| `src/app/admin/pilot-leads/page.tsx` | Phễu khách hàng tiềm năng chương trình thí điểm | Bộ lọc trạng thái lead, Bảng liên hệ trung tâm & trường học |
| `/teacher` | `src/app/teacher/page.tsx` | Cổng LMS Giáo viên theo dõi lớp học | Header tầng 1 (Class Switcher), Sub-bar tầng 2 (Tabs switcher), 4 Thẻ KPI sư phạm |
| Nhúng trong `/teacher` | `src/components/teacher/` | 5 Panel chuyên môn theo lớp học | `StudentsPanel.tsx`, `StudentDetailSheet.tsx`, `WordsPanel.tsx`, `GrammarPanel.tsx`, `AnalyticsPanel.tsx` |
| `/import` | `src/app/import/page.tsx` | CMS nạp từ vựng hàng loạt | Bộ chuyển 4 tab nạp dữ liệu (Dán text, Excel, CSV, Quét OCR) |
| `/library` | `src/app/library/page.tsx` | CMS quản lý gói học & danh mục micro-pack | Catalog bài học, Trình xem trước micro-pack, Trình tạo PDF bài giảng |
| Studio Khẩu hình | `src/components/speaking/foundation/MouthAnatomyStudio.tsx` | Module hướng dẫn khẩu hình phát âm | Thẻ so sánh cơ miệng & luồng hơi, Huy hiệu "Chuẩn 2026", Toggle Video |
| Studio Ngữ âm IPA | `src/components/ipa/IpaPracticeStudio.tsx` | Module luyện phát âm ngữ âm chuyên sâu | 5 bước luyện IPA, Bài tập cặp âm tối thiểu (Minimal pairs), Audio recorder |

### 1.2. Hiện trạng Kiến trúc Khung nhìn (Layout Architecture Gap)

Điểm khiếm khuyết cấu trúc lớn nhất của phân hệ Admin:
- Trong khi phân hệ học sinh có `src/app/student/layout.tsx` và `StudentShell.tsx` đồng nhất, thì **thư mục `src/app/admin/` hoàn toàn KHÔNG CÓ file `layout.tsx`**.
- Hậu quả là cả 5 trang con (`/admin`, `/admin/crm`, `/admin/billing`, `/admin/challenges`, `/admin/pilot-leads`) là những "hòn đảo độc lập", mỗi trang tự viết lại một thẻ `<header className="sticky top-0 ...">` riêng biệt với danh sách nút điều hướng tự phát và không đồng nhất.

---

## 2. ĐÁNH GIÁ CHUYÊN SÂU THEO 4 TRỤ CỘT

---

### 2.1. TRỤ CỘT: THỪA (Disconnected Navigation, Multi-Layer Sticky Headers & UI Duplication)

---

#### 🔴 Vấn đề 1.1: Hệ Thống Admin Rời Rạc — Thiếu Admin Shell & Tự Trồng Navigation Thủ Công
- **Hiện tượng**: Do không có layout chung, mỗi trang con trong cụm `/admin` tự xây dựng một thanh Header riêng với các liên kết bất nhất:
  1. Tại `src/app/admin/page.tsx:68-81`: Header chứa 4 nút pill màu sắc sặc sỡ:
     - `CRM` (nền xanh dương `bg-blue-500/10`)
     - `Pilot Leads` (nền xanh lá `bg-emerald-500/10`)
     - `Challenges` (nền vàng cam `bg-amber-500/10`)
     - `Billing` (nền tím/chính `bg-primary/10`)
  2. Tại `src/app/admin/crm/page.tsx:423-428`: Header lại chỉ có nút `Billing` và nút `CSV`, hoàn toàn biến mất liên kết sang `Pilot Leads` và `Challenges`.
  3. Tại `src/app/admin/billing/page.tsx:268-272`: Header lại chỉ hiển thị badge `pending` và nút quay về `/admin`, không có bất kỳ lối tắt nào sang CRM.
- **Hệ quả UX**:
  - Quản trị viên khi làm việc cảm thấy như đang nhảy giữa các website hoàn toàn khác nhau.
  - Không có thanh Sidebar Admin chuẩn mực, không có trạng thái tab hiện tại (`active state`), vị trí các nút hành động nhảy loạn xạ khi chuyển trang.

---

#### 🔴 Vấn đề 1.2: Multi-Layer Sticky Headers Trong Teacher LMS (`src/app/teacher/page.tsx`)
- **Hiện tượng**: Khi giáo viên mở cổng LMS (`/teacher`), màn hình bị chiếm giữ bởi **2 thanh bar dính chặt liên tiếp**:
  ```tsx
  // src/app/teacher/page.tsx: dòng 402 - 404
  {/* Header tầng 1: Cao 56px (sticky top-0 z-40) */}
  <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
    ... (Thương hiệu LingoPro, Popover chuyển lớp học, Nút Sư phạm, Avatar)
  </header>

  // src/app/teacher/page.tsx: dòng 651 - 653
  {/* Header tầng 2: Ngay dưới tầng 1 (sticky top-14 z-30) */}
  <div className="sticky top-14 z-30 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6">
    ... (4 Tab: Học sinh | Từ vựng | Ngữ pháp | Phân tích)
  </div>
  ```
- **Hệ quả UX**:
  - Hai thanh bar ghim dính trên đỉnh ngốn tới **110px** chiều cao màn hình.
  - Khi giáo viên nhấp vào một học sinh trong `StudentsPanel`, một ngăn kéo trượt `StudentDetailSheet` mở ra từ cạnh phải lại chứa thêm một header riêng tầng 3, tạo cảm giác chật chội, ngột ngạt và lãng phí không gian hiển thị danh sách lớp.

---

### 2.2. TRỤ CỘT: XẤU (Linguistic Code-Mixing, 12-Column Cramming & Typography Distortion)

---

#### 🔴 Vấn đề 2.1: Loạn Ngôn Ngữ Nửa Anh Nửa Việt (Severe Linguistic Code-Mixing)
- **Hiện tượng**: Ngôn ngữ trên các trang quản trị bị pha trộn vô tội vạ giữa tiếng Anh và tiếng Việt trong cùng một khối thông tin:
  - **Trang Billing** (`src/app/admin/billing/page.tsx:403-411`):
    - Tiêu đề cột bảng hoàn toàn bằng tiếng Anh: `User`, `Plan`, `Amount`, `Status`, `Payment`, `Date`, `Action`.
    - Trạng thái rỗng hoàn toàn bằng tiếng Anh: `No orders found`.
    - Nhưng dữ liệu hiển thị bên dưới lại mang định dạng tiếng Việt: `199.000₫`, ngày `04/10/2026`.
  - **Trang Dashboard Admin** (`src/app/admin/page.tsx:88-125`):
    - Thẻ thống kê: `Total Users`, `Active Users`, `Total Words`, `Quizzes Done`.
    - Bảng hoạt động: `User Activity`, `Real-time usage statistics`, `No users yet`.
    - Nhưng trường ngày kích hoạt lại format qua `toLocaleDateString('vi-VN')`.
  - **Bảng Analytics Giáo viên** (`src/components/teacher/AnalyticsPanel.tsx:45-81`):
    - Cột bên trái (L.45): Tiêu đề tiếng Anh **"Top Students"**, phụ đề `by mastery`, rỗng báo `No data yet`.
    - Cột bên phải (L.77): Tiêu đề tiếng Việt **"Học sinh cần chú ý"**, phụ đề `accuracy < 60%`, rỗng báo `Tất cả học sinh đang ổn`.
    - Thẻ học sinh (L.100): Trộn lẫn `Active hôm nay` với `3 ngày trước`.
- **Hệ quả UX**:
  - Giao diện toát lên vẻ chắp vá, cẩu thả. Tạo cảm giác đây là một bản dựng tạm thời bằng các đoạn mã mẫu AI chưa qua khâu biên tập ngôn ngữ (localization review).

---

#### 🔴 Vấn đề 2.2: Bảng CRM 12 Cột Chèn Ép Nghẹt Thở & Tiêu Đề Cột 1 Ký Tự
- **Hiện tượng**: Bảng khách hàng CRM (`src/app/admin/crm/page.tsx:570-583`) chứa tới 12 cột chen chúc trên một hàng ngang:
  ```tsx
  <tr className="border-b bg-muted/30 text-muted-foreground">
    <th className="text-left px-5 py-3 font-semibold">Người dùng</th>
    <th className="text-center px-3 py-3 font-semibold">Gói</th>
    <th className="text-center px-3 py-3 font-semibold">Nguồn</th>
    <th className="text-center px-3 py-3 font-semibold">Vòng đời</th>
    <th className="text-right px-3 py-3 font-semibold">Ôn cuối</th>
    <th className="text-right px-3 py-3 font-semibold">Due</th>
    <th className="text-right px-3 py-3 font-semibold">Hoạt động</th>
    <th className="text-right px-3 py-3 font-semibold">Lưu</th>
    <th className="text-right px-3 py-3 font-semibold">Học</th>
    <th className="text-right px-3 py-3 font-semibold">Ôn</th>
    <th className="text-right px-3 py-3 font-semibold">Quên</th>
    <th className="text-right px-5 py-3 font-semibold">Đã trả</th>
  </tr>
  ```
- **Hệ quả UX**:
  - **Tiêu đề cột đánh đố**: Bốn cột số liệu quan trọng nhất bị rút gọn thành các từ cụt lủn: **"Lưu"** (tổng từ đã add), **"Học"** (từ đã ôn $\ge 1$ lần), **"Ôn"** (tổng lượt review), **"Quên"** (số lần bấm Again). Quản trị viên mới vào hoàn toàn không thể hiểu "Lưu" khác "Học" chỗ nào, và tại sao "Ôn" với "Quên" lại là hai cột độc lập.
  - Bảng bị phình ngang quá mức, các cột số bị ép sát rạt vào nhau gây đọc lệch hàng, mất tính trực quan của một công cụ CRM.

---

#### 🟡 Vấn đề 2.3: Hàng 8 Thẻ KPI Ép Ngang Làm Móp Méo Typography (`admin/crm/page.tsx:434`)
- **Hiện tượng**:
  ```tsx
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
  ```
- **Hệ quả UX**:
  - Trên màn hình máy tính phổ thông (Full HD 1920px hoặc laptop 1366–1440px), việc chia `lg:grid-cols-8` khiến mỗi thẻ card chỉ có chiều rộng vỏn vẹn ~110px – 130px.
  - Các nhãn văn bản dài như *"Free $\ge 150$ từ (bấm lọc)"* hoặc *"Doanh thu tháng"* bị vỡ vụn thành 3 đến 4 dòng lem nhem, số liệu hiển thị bị cắt cụt dấu phân cách hàng nghìn.

---

### 2.3. TRỤ CỘT: CỨNG NGẮC (Mobile Table Traps, Clunky Popovers & Rigid Drawers)

---

#### 🔴 Vấn đề 3.1: "Bẫy Cuộn Ngang" Trên Mobile Tại Toàn Bộ Các Bảng Admin
- **Hiện tượng**:
  - Cả 3 trang Admin chủ lực (`/admin`, `/admin/crm`, `/admin/billing`) đều chỉ bọc bảng dữ liệu trong thẻ thông thường `<div className="overflow-x-auto">` mà không có chế độ hiển thị thẻ (Card View) riêng cho mobile:
    - `src/app/admin/crm/page.tsx:567`
    - `src/app/admin/billing/page.tsx:400`
    - `src/app/admin/page.tsx:109`
- **Hệ quả UX**:
  - Khi quản trị viên truy cập bằng điện thoại để kiểm tra đơn hàng gấp hoặc kiểm tra học viên mới, giao diện bị vỡ nát. Người dùng phải vuốt ngang hàng chục lần mới thấy được nút duyệt tiền (`handleConfirm`) hoặc số điện thoại.
  - Bảng không có cơ chế cố định cột đầu tiên (No sticky first column), khiến người dùng vuốt sang phải thì mất hoàn toàn thông tin người dùng đang xem là ai.

---

#### 🟡 Vấn đề 3.2: Popover Class Switcher Cứng Nhắc Trên Mobile (`src/app/teacher/page.tsx`)
- **Hiện tượng**:
  - Tại `src/app/teacher/page.tsx:441-446`:
    ```tsx
    <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs sm:hidden" onClick={() => setIsClassSwitcherOpen(false)} />
    <div className="max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto sm:absolute sm:left-0 sm:top-full sm:mt-2 sm:w-80 bg-background border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
    ```
- **Hệ quả UX**:
  - Trên màn hình di động, menu chọn lớp học bị ghim cứng đơ ở vị trí cách đỉnh 64px (`top-16`) và ép phẳng 2 bên lề (`inset-x-3`).
  - Thay vì sử dụng một Bottom Sheet trượt mượt mà từ đáy màn hình theo thói quen thao tác ngón tay cái, giao diện ép người dùng phải nhìn vào một hộp nổi cứng ngắc nằm lơ lửng ở phần trên màn hình.

---

### 2.4. TRỤ CỘT: AI QUÁ (Pseudoscientific Jargon Overdose & Gimmicky Studio Labels)

---

#### 🔴 Vấn đề 4.1: Ma Trận Thuật Ngữ Giả Khoa Học Đánh Đố Giáo Viên (Pseudoscientific Jargon)
- **Hiện tượng**: Trong Cổng Giáo viên (`src/components/teacher/StudentsPanel.tsx:102-169, 635-682`), hệ thống nhồi nhét dày đặc các thuật ngữ viết tắt và nhãn phân loại mang tính chất giả khoa học:
  1. Thẻ KPI đo lường: **"Độ bền trí nhớ (VMS)"** - Chú thích: *"Chủ động: A% • Thụ động: P%"*.
  2. Thẻ KPI rèn luyện: **"Độ chăm chỉ (LCS > 70%)"**.
  3. Bảng thẻ phân loại học sinh với các tag in hoa đao to búa lớn:
     - `DORMANT`: *"💤 Vắng mặt: Học sinh ngừng hoạt động > 3 ngày... rơi rụng từ vựng theo đường cong lãng quên Ebbinghaus"*.
     - `AT RISK`: *"🔴 Cần củng cố: VMS dưới 30% dù đã học nhiều từ... giao bài tập củng cố (Drill)"*.
     - `CRAMMING`: *"🟡 Học dồn: LCS < 30% & điểm quiz cao... Học dồn chỉ nhớ ngắn hạn"*.
     - `RISING STAR`: *"🟢 Tích cực: LCS > 80% & điểm quiz cao"*.
- **Hệ quả UX**:
  - Giáo viên đứng lớp thực tế cần những thông tin rõ ràng, trực diện: *Học sinh nào nghỉ học lâu ngày? Ai làm bài hay sai? Ai cần giao thêm bài tập?*
  - Việc đưa các chỉ số tự bịa ra như **VMS (Vocabulary Memory Score)**, **LCS (Learning Consistency Score)**, **Active/Passive VMS**, kèm theo các lời khuyên giảng dạy mang giọng điệu máy móc giáo điều ("đường cong Ebbinghaus", "can thiệp sư phạm") phản ánh rõ rệt việc đưa thẳng output sinh thô từ prompt LLM vào sản phẩm cuối.

---

#### 🟡 Vấn đề 4.2: Chiêu Trò Gắn Mác Studio & Huy Hiệu "Chuẩn 2026" Gượng Gạo
- **Hiện tượng**: Tại `src/components/speaking/foundation/MouthAnatomyStudio.tsx:348-398`:
  ```tsx
  <div className="flex items-center gap-2">
    <span className="text-xs sm:text-sm font-bold">Phương Thức Học Khẩu Hình</span>
    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
      Chuẩn 2026
    </span>
  </div>
  <p className="text-[11px] text-slate-500 hidden sm:block">
    Không cần xem video cũ kéo dài — Nắm bắt cấu trúc cơ miệng và luồng hơi ngay tức thì!
  </p>
  ...
  <button ...>
    <Sparkles className="size-3.5 text-amber-500" />
    <span>Studio Khẩu Hình (Khuyên dùng)</span>
  </button>
  ```
- **Hệ quả UX**:
  - Thành phần này thực chất chỉ là 2 thẻ so sánh chữ mô tả vị trí lưỡi và emoji (`👅⬆️`, `😁`), nhưng được dán nhãn đao to búa lớn là **"Studio Khẩu Hình Chuẩn 2026"** kèm khẩu hiệu dìm hàng video truyền thống. Cách đặt tên kêu nhưng nội dung nghèo nàn tạo cảm giác "làm màu", thiếu độ tin cậy sư phạm.

---

#### 🟡 Vấn đề 4.3: Tính Năng AI "Soạn Tin Nhắn Zalo" Giả Lập Trong Hồ Sơ Học Sinh
- **Hiện tượng**: Tại `src/components/teacher/StudentDetailSheet.tsx:548-589`:
  - Mỗi khi giáo viên click chuyển qua một học sinh trong danh sách, thanh trên cùng của Sheet lại kích hoạt hiệu ứng xoay tròn:
    `<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Gemini AI đang soạn tin nhắn...`
  - Bên cạnh là nút bấm nổi bật: `Sao chép tin nhắn Zalo (C)`.
- **Hệ quả UX**:
  - Đoạn tin nhắn sinh ra mang nặng tính văn mẫu rập khuôn (*"Chào em, thầy thấy gần đây em vắng mặt 3 ngày, hãy vào ôn lại từ vựng nhé..."*). Giáo viên thực tế không sử dụng các câu văn máy móc này để gửi cho phụ huynh hay học sinh.
  - Banner này chiếm mất 80px diện tích quý giá ngay trên đỉnh hồ sơ chi tiết học sinh, đẩy bảng nhật ký học tập xuống dưới.

---

## 3. BẢNG MA TRẬN KHIẾM KHUYẾT (DEFECT MATRIX)

| ID | File Path | Component | Trụ Cột | Mức độ | Mô tả khiếm khuyết | Dòng code |
|---|---|---|---|---|---|---|
| **ADM-01** | `src/app/admin/` | Routing & Shell | **Thừa + Cứng** | 🔴 Critical | Toàn bộ phân hệ Admin thiếu `layout.tsx` và `AdminShell`; 5 trang tự trồng navigation manh mún | Thư mục `src/app/admin/` |
| **ADM-02** | `src/app/admin/crm/page.tsx` | CRM Table Header | **Xấu + Cứng** | 🔴 Critical | Bảng 12 cột chèn ép nghẹt thở; 4 cột tiêu đề 1 từ khó hiểu ("Lưu", "Học", "Ôn", "Quên") | L.568–583 |
| **ADM-03** | `src/app/teacher/page.tsx` | Header Layers | **Thừa + Xấu** | 🔴 Critical | Multi-layer sticky headers: Header tầng 1 (56px) + Tabs tầng 2 (48px) chiếm 104px đỉnh màn hình | L.402, L.651 |
| **ADM-04** | `src/components/teacher/StudentsPanel.tsx` | Metrics & Tags | **AI quá** | 🔴 Critical | Lạm dụng thuật ngữ giả khoa học VMS, LCS, Cramming, Ebbinghaus làm khó hiểu cho giáo viên | L.102–169, L.635–682 |
| **ADM-05** | `src/app/admin/billing/page.tsx` & `admin/page.tsx` | Tables & KPI | **Xấu** | 🟠 Major | Trộn lẫn tiếng Anh và tiếng Việt cẩu thả ("User", "Amount", "Pending" vs "199.000₫", ngày VN) | Billing L.403–411; Admin L.88–125 |
| **ADM-06** | `src/app/admin/crm/page.tsx` | KPI Container | **Xấu** | 🟠 Major | Ép 8 thẻ KPI trên một hàng ngang (`lg:grid-cols-8`) làm vỡ nát font chữ và layout | L.434–445 |
| **ADM-07** | `src/app/admin/crm/`, `billing/`, `admin/` | Table Responsive | **Cứng ngắc** | 🟠 Major | Bẫy cuộn ngang trên mobile; không có Mobile Card View hoặc cố định cột đầu tiên | crm L.567; billing L.400; admin L.109 |
| **ADM-08** | `src/app/teacher/page.tsx` | Class Switcher | **Cứng ngắc** | 🟡 Minor | Popover chọn lớp trên mobile bị fixed lơ lửng (`top-16 inset-x-3`) thay vì Bottom Sheet trượt | L.441–446 |
| **ADM-09** | `src/components/speaking/foundation/MouthAnatomyStudio.tsx` | Badges & Labels | **AI quá** | 🟡 Minor | Gắn mác đao to búa lớn "Studio Khẩu Hình Chuẩn 2026" cho nội dung so sánh chữ đơn giản | L.348–398 |
| **ADM-10** | `src/components/teacher/StudentDetailSheet.tsx` | Zalo Banner | **AI quá** | 🟡 Minor | Banner "Gemini AI đang soạn tin nhắn..." văn mẫu rập khuôn chiếm đỉnh hồ sơ học sinh | L.548–589 |

---

## 4. MINH CHỨNG MÃ NGUỒN CỤ THỂ (SOURCE CODE EVIDENCE)

### 4.1. Minh chứng Bảng CRM 12 Cột & Tiêu Đề Cụt Lủn (`src/app/admin/crm/page.tsx`)
```tsx
// src/app/admin/crm/page.tsx: dòng 568 - 583
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b bg-muted/30 text-muted-foreground">
        <th className="text-left px-5 py-3 font-semibold">Người dùng</th>
        <th className="text-center px-3 py-3 font-semibold">Gói</th>
        <th className="text-center px-3 py-3 font-semibold">Nguồn</th>
        <th className="text-center px-3 py-3 font-semibold">Vòng đời</th>
        <th className="text-right px-3 py-3 font-semibold" title="Lần ôn SRS cuối (giờ VN)">Ôn cuối</th>
        <th className="text-right px-3 py-3 font-semibold" title="Số từ đang đến hạn ôn">Due</th>
        <th className="text-right px-3 py-3 font-semibold">Hoạt động</th>
        {/* 4 Cột 1 từ gây hoang mang cho người xem: */}
        <th className="text-right px-3 py-3 font-semibold" title="Từ đã lưu (added_by)">Lưu</th>
        <th className="text-right px-3 py-3 font-semibold" title="Từ đã ôn (SRS review >= 1)">Học</th>
        <th className="text-right px-3 py-3 font-semibold" title="Tổng lượt ôn SRS">Ôn</th>
        <th className="text-right px-3 py-3 font-semibold" title="Lần quên (Again)">Quên</th>
        <th className="text-right px-5 py-3 font-semibold">Đã trả</th>
      </tr>
    </thead>
```

### 4.2. Minh chứng Hai Tầng Header Chồng Nhau trong Teacher LMS (`src/app/teacher/page.tsx`)
```tsx
// src/app/teacher/page.tsx: dòng 402 và dòng 651
// Tầng 1: Header tổng quan ghim cố định đỉnh trang
<header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
  ...
</header>

// Tầng 2: Thanh Tab điều hướng ghim ngay sát dưới tầng 1
{selectedClass && (
  <div className="sticky top-14 z-30 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6">
    <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-none">
      {TABS.map((t) => (
        <button key={t.key} ...>
          {t.label}
        </button>
      ))}
    </div>
  </div>
)}
```

### 4.3. Minh chứng Thuật Ngữ Giả Khoa Học VMS/LCS/Cramming (`src/components/teacher/StudentsPanel.tsx`)
```tsx
// src/components/teacher/StudentsPanel.tsx: dòng 102 - 144
export function getStudentStatus(s: StudentProgress): StudentStatusInfo {
  const isDormant = Boolean(s.last_active && Date.now() - new Date(s.last_active).getTime() > 3 * 86_400_000);
  if (isDormant) {
    return {
      key: 'dormant',
      label: 'Vắng mặt',
      tag: 'DORMANT',
      advice: 'Cần gửi tin nhắn nhắc nhở ngay để học sinh không bị rơi rụng từ vựng theo đường cong lãng quên Ebbinghaus.',
    };
  }

  const isAtRisk = Boolean((s.vms || 0) < 30 && (s.words_reviewed || 0) > 10);
  if (isAtRisk) {
    return {
      key: 'at_risk',
      label: 'Cần củng cố',
      tag: 'AT RISK',
      advice: 'Độ bền ghi nhớ (VMS) dưới 30% dù đã học nhiều từ. Hãy giao bài tập củng cố (Drill) các từ hay quên.',
    };
  }

  const isCramming = Boolean((s.lcs || 0) < 30 && (s.avg_quiz_accuracy || 0) > 0.8 && (s.quizzes_taken || 0) > 2);
  if (isCramming) {
    return {
      key: 'cramming',
      label: 'Học dồn',
      tag: 'CRAMMING',
      advice: 'Điểm quiz cao nhưng tính đều đặn thấp. Học dồn chỉ nhớ ngắn hạn; cần hướng dẫn học sinh phân bổ 5-10 phút mỗi ngày.',
    };
  }
```

### 4.4. Minh chứng Loạn Ngôn Ngữ Song Ngữ Trộn Lẫn (`src/components/teacher/AnalyticsPanel.tsx`)
```tsx
// src/components/teacher/AnalyticsPanel.tsx: dòng 43 - 82
{/* Cột trái: Tiêu đề tiếng Anh hoàn toàn */}
<div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
  <div className="px-5 py-4 border-b flex items-center gap-2">
    <Star className="h-4 w-4 text-amber-500" />
    <h3 className="font-bold text-sm">Top Students</h3>
    <span className="ml-auto text-xs text-muted-foreground">by mastery</span>
  </div>
  {analytics.topStudents.length === 0 ? (
    <div className="p-6 text-center text-xs text-muted-foreground">No data yet</div>
  ) : ...}
</div>

{/* Cột phải: Tiêu đề tiếng Việt hoàn toàn nằm song song */}
<div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
  <div className="px-5 py-4 border-b flex items-center gap-2">
    <AlertTriangle className="h-4 w-4 text-rose-500" />
    <h3 className="font-bold text-sm">Học sinh cần chú ý</h3>
    <span className="ml-auto text-xs text-muted-foreground">accuracy < 60%</span>
  </div>
  {analytics.strugglingStudents.length === 0 ? (
    <div className="p-6 text-center text-xs text-muted-foreground">Tất cả học sinh đang ổn</div>
  ) : ...}
</div>
```

---

## 5. KẾ HOẠCH KHẮC PHỤC HÀNH ĐỘNG (ACTIONABLE REMEDIATION PLAN)

---

### 5.1. Nhóm Quick Wins (Khắc phục ngay trong 1-2 ngày)

#### 1. Chuẩn hóa 100% Tiếng Việt trên Toàn bộ Bảng & Panel
- **Giải pháp**:
  - Tại `src/app/admin/billing/page.tsx`: Dịch toàn bộ tiêu đề cột sang tiếng Việt chuẩn (`Người dùng`, `Gói đăng ký`, `Số tiền`, `Trạng thái`, `Phương thức`, `Ngày thanh toán`, `Thao tác`).
  - Tại `src/components/teacher/AnalyticsPanel.tsx`: Đồng bộ hai cột:
    - Đổi `Top Students` $\rightarrow$ **"Học sinh tiến bộ nhất"** (theo mức độ ghi nhớ). Rỗng: *"Chưa có dữ liệu"*.
    - Cột phải giữ nguyên: **"Học sinh cần chú ý"** (độ chính xác $< 60\%$). Rỗng: *"Tất cả học sinh đang ổn định"*.

#### 2. Tinh gọn Bảng CRM 12 Cột Thành 6 Nhóm Cột Có Ý Nghĩa
- **Giải pháp**:
  - Gom các cột rời rạc ("Lưu", "Học", "Ôn", "Quên") thành một cột phức hợp trực quan: **"Tiến độ từ vựng"** (hiển thị số từ đã lưu kèm thanh phân bố màu: đã thuộc / đang ôn / hay quên).
  - Đổi tiêu đề `Due` $\rightarrow$ **"Đến hạn"**.
  - Đổi tiêu đề `Vòng đời` $\rightarrow$ **"Phân nhóm"**.

```tsx
// CODE MẪU BẢNG CRM KHẮC PHỤC:
<thead>
  <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    <th className="text-left px-5 py-3">Khách hàng / Email</th>
    <th className="text-center px-3 py-3">Gói</th>
    <th className="text-center px-3 py-3">Phân loại</th>
    <th className="text-right px-3 py-3">Lần ôn cuối</th>
    <th className="text-center px-4 py-3">Tiến độ từ vựng (Lưu · Thuộc · Quên)</th>
    <th className="text-right px-5 py-3">Tổng thanh toán</th>
  </tr>
</thead>
```

#### 3. Chuẩn hóa Thuật Ngữ Giáo Viên (Loại bỏ VMS/LCS/Cramming)
- **Giải pháp**:
  - Thay `VMS (Vocabulary Memory Score)` $\rightarrow$ **"Độ nhớ từ"** (%).
  - Thay `LCS (Learning Consistency Score)` $\rightarrow$ **"Chuyên cần"** (%).
  - Bỏ các mã tag tiếng Anh in hoa `DORMANT`, `AT RISK`, `CRAMMING`, `RISING STAR`. Thay bằng huy hiệu tiếng Việt thân thiện:
    - 💤 *Nghỉ học > 3 ngày*
    - 🔴 *Cần phụ đạo*
    - 🟡 *Học ngắt quãng*
    - 🟢 *Tích cực*

---

### 5.2. Nhóm Structural Changes (Tái cấu trúc trong Sprint tới)

#### 1. Xây dựng Layout Chung `src/app/admin/layout.tsx` và `AdminShell`
- **Giải pháp**:
  - Thiết kế `AdminShell` chuẩn quản trị doanh nghiệp: Sidebar cố định bên trái (Tổng quan, CRM Khách hàng, Đơn hàng & Doanh thu, Khách hàng Pilot, Sự kiện & Thử thách) và Header tối giản chỉ chứa thông tin tài khoản admin và nút Đăng xuất.
  - Loại bỏ hoàn toàn các header tự trồng trong từng trang con.

```tsx
// CODE MẪU KIẾN TRÚC LAYOUT ADMIN:
// src/app/admin/layout.tsx
import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Sidebar quản trị thống nhất */}
      <AdminSidebar />
      
      {/* Vùng nội dung chính */}
      <main className="flex-1 min-w-0 md:pl-64 flex flex-col">
        {children}
      </main>
    </div>
  );
}
```

#### 2. Hợp nhất Hai Tầng Header Trong Teacher LMS Thành Một Tầng Duy Nhất
- **Giải pháp**:
  - Tích hợp thanh chọn lớp học (Class Switcher) và các tab chức năng (Học sinh, Từ vựng, Ngữ pháp, Phân tích) vào cùng **một thanh Header duy nhất cao 56px**.
  - Trên mobile, chuyển Popover chọn lớp học thành **Bottom Sheet Drawer** vuốt trượt tự nhiên từ dưới lên.

```tsx
// CODE MẪU HEADER HỢP NHẤT CHO src/app/teacher/page.tsx:
<header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
  <div className="flex items-center gap-3">
    <TeacherClassSwitcher selectedClass={selectedClass} onSelect={setSelectedClass} />
    
    {/* Navigation Tabs nằm ngay trên Header chính */}
    <nav className="hidden md:flex items-center gap-1 ml-4 border-l pl-4">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
            activeTab === tab.key
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
  
  <TeacherUserMenu />
</header>
```

#### 3. Bổ sung Chế độ Thẻ (Mobile Card View) Cho Toàn Bộ Bảng Admin
- **Giải pháp**:
  - Tại `/admin/crm` và `/admin/billing`, áp dụng cơ chế hiển thị kép tương tự `StudentsPanel`: Màn hình $\ge \text{md}$ hiển thị dạng Bảng (Table), màn hình di động hiển thị dạng Thẻ (Card). Cung cấp khả năng lọc và duyệt đơn hàng 1-chạm mà không cần vuốt ngang.

---

### 5.3. Nhóm Polish (Tinh chỉnh Thẩm mỹ & Trải nghiệm)

#### 1. Xóa bỏ Huy hiệu "Chuẩn 2026" & Rác AI Trang Trí trong Studio
- **Giải pháp**:
  - Gỡ bỏ huy hiệu giả tạo `Chuẩn 2026` và khẩu hiệu quảng cáo dìm video trong `MouthAnatomyStudio.tsx`.
  - Giữ lại tính năng so sánh khẩu hình trực quan với tên gọi đúng mực: **"Hướng dẫn khẩu hình & luồng hơi"**.

#### 2. Dọn dẹp Banner "Gemini AI Soạn Tin Nhắn" Trong Hồ Sơ Học Sinh
- **Giải pháp**:
  - Thay vì ép hộp thoại AI chiếm trọn đỉnh `StudentDetailSheet`, chuyển tính năng soạn tin nhắn thành một nút icon nhỏ đặt cạnh số điện thoại/Zalo của học sinh. Giáo viên chỉ nhấn khi thực sự có nhu cầu tạo tin nhắn gợi ý, tránh việc tự động kích hoạt animation AI giả gây chậm thao tác xem bài.
