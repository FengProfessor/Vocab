# BÁO CÁO KIỂM TOÁN UI/UX: PHÂN HỆ HỌC VIÊN, STUDENT DASHBOARD & LMS

- **Mã tài liệu**: `docs/ui-audit/04_student_dashboard.md`
- **Phân hệ kiểm toán**: Giao diện Học viên (Student Core, Student Shell, LMS Dashboard, Hệ thống Ôn tập Review, Thư viện từ vựng, và Cổng Giới thiệu/Hồ sơ)
- **Đối tượng kiểm toán**: `src/app/student/`, `src/app/review/`, `src/app/import/`, `src/app/library/`, `src/app/group/`, các layout shell, navigation và modal phụ thuộc
- **Tiêu chuẩn kiểm toán**: 4 Trụ Cột Trọng Tâm — **THỪA** (Clutter/Duplication), **XẤU** (Visual Hierarchy/Clash), **CỨNG NGẮC** (Boxy/Rigidity), **AI QUÁ** (Template/Jargon/Fake)
- **Trạng thái**: Hoàn thành thẩm định chuyên sâu & Đề xuất giải pháp khắc phục

---

## 1. PHÂN LOẠI & TỔNG QUAN PHÂN HỆ (ROUTE & COMPONENT INVENTORY)

Phân hệ Học viên là trung tâm vận hành học tập hàng ngày của ứng dụng Vocab / LingoPro, phục vụ học viên từ giai đoạn tiếp nhận từ mới, luyện phản xạ, ôn tập ngắt quãng (FSRS) cho tới theo dõi chỉ số gamification (Streak, XP, Cấp độ).

### 1.1. Danh mục Tuyến đường (Route Inventory)

| Tuyến đường (Route) | File xử lý chính | Vai trò chức năng | Component giao diện chủ đạo |
|---|---|---|---|
| `/student` | `src/app/student/page.tsx` | Trung tâm học tập học viên (Learner Hub) | `StudentShell`, `DailyReadingCard`, `ChallengeWidget`, `EnableNotifications`, `ProTrialMilestoneCard`, SRS Distribution Chart |
| Layout dùng chung | `src/app/student/layout.tsx` | Khung ngữ cảnh bọc ngoài toàn bộ tuyến `/student/*` | `StudentProvider` (`src/components/student/StudentProvider.tsx`) |
| Shell Khung nhìn | `src/components/student/StudentShell.tsx` | Khung điều hướng chuẩn (Desktop Sidebar + Mobile Header + Mobile Drawer + Banners) | `StudentShell`, `CohortProPromoBanner`, `FreeQuotaBanner`, `UpgradeGiftModal`, `NotificationBell` |
| Điều hướng chân trang | `src/components/student/MobileBottomNav.tsx` | Thanh điều hướng 5 tab cố định dưới đáy mobile | Home (`/student`), Thư viện (`/library`), Lộ trình (`/journey`), Luyện thi (`/toeic-part-1`), Cổng cá nhân (`/student/profile`) |
| `/student/profile` | `src/app/student/profile/page.tsx` | Hồ sơ học viên, chỉnh sửa danh tính, cài đặt thông báo & thống kê | `StreakCounter`, Heatmap 30 ngày, Card thống kê từ yếu, Switch Web Push |
| `/student/stats` | `src/app/student/stats/page.tsx` | Tuyến đường thống kê di sản (Legacy redirect) | Gọi lệnh duy nhất: `redirect('/student/profile#stats')` |
| `/student/leaderboard` | `src/app/student/leaderboard/page.tsx` | Bảng xếp hạng thi đua theo Tuần / Tháng / Lớp | Podium Top 3, Danh sách xếp hạng Top 4+, Bộ lọc lớp học |
| `/student/referral` | `src/app/student/referral/page.tsx` | Cổng mời bạn học, nhận ngày VIP & cơ chế tri ân | `MOCK_LEADERBOARD`, 4 Stat Cards, VietQR Payout Modal, Tier Progression (Tier 1–5) |
| `/review` | `src/app/review/page.tsx` | Cửa ngõ trung tâm ôn tập ngắt quãng FSRS | Thẻ báo từ đến hạn (`dueCount`), Danh mục 6 chế độ ôn (`HUB_MODES`), Trigger ôn tự do |
| `/import` | `src/app/import/page.tsx` | Công cụ nhập danh sách từ vựng cá nhân | Bộ 4 tab nhập liệu (Dán text, File Excel/CSV, CSV+Nghĩa, Quét ảnh OCR) |
| `/library` | `src/app/library/page.tsx` | Thư viện giáo trình & danh mục micro-pack từ vựng | Header lọc bộ từ, Hero card micro-pack, Trình duyệt unit/chặng, Trình tạo PDF |
| `/student/speaking` | `src/app/student/speaking/page.tsx` | Phòng luyện nói phản xạ với trợ lý AI | AI Speaking Chatbot, Voice Recorder, Waveform Animation, Topic Switcher |
| `/group` | `src/app/group/page.tsx` | Quản lý gói học nhóm (Family / Study Group) | Thẻ trạng thái nhóm, Quản lý ghế thành viên (Seats), Mã mời tham gia |

### 1.2. Danh mục Modal & Thành phần Dùng chung Trọng yếu

| Tên Component | Đường dẫn file | Vai trò & Hành vi hiển thị |
|---|---|---|
| `WordDetailModal` | `src/components/student/WordDetailModal.tsx` | Hộp thoại xem chi tiết từ vựng (Nghĩa, IPA, Audio, Câu ví dụ, Collocations, Ảnh minh họa) |
| `NotificationBell` | `src/components/NotificationBell.tsx` | Chuông thông báo trên Header kèm popover liệt kê số từ vựng & ngữ pháp đến hạn |
| `UpgradeGiftModal` | `src/components/student/UpgradeGiftModal.tsx` | Modal pop-up chúc mừng / thúc ép nhận quà Pro VIP bật lên khi tải trang |
| `CohortProPromoBanner`| `src/components/student/StudentShell.tsx` | Banner ghim phía trên Header thông báo flash sale Pro cho đợt học |
| `FreeQuotaBanner` | `src/components/student/StudentShell.tsx` | Banner cảnh báo tài khoản Free đã lưu $\ge 150$ từ, thúc giục nâng cấp gói trả phí |

---

## 2. ĐÁNH GIÁ CHUYÊN SÂU THEO 4 TRỤ CỘT

---

### 2.1. TRỤ CỘT: THỪA (Visual Clutter, Redundant Shells & Banner Bombardment)

Phân hệ học viên đang chịu tải quá mức bởi các thành phần thừa thãi, xuất phát từ việc phát triển chắp vá giữa các giai đoạn thử nghiệm tính năng kinh doanh (growth hacking/upsell) và thiếu sự phân định ranh giới giữa Khung Shell bao ngoài (`StudentShell`) và Nội dung trang con (`Page Content`).

#### 🔴 Vấn đề 1.1: Double Sticky Headers & Duplicate Back Buttons trên 5 Subpages
- **Hiện tượng**: Khi học viên truy cập vào các trang con như Nhập từ (`/import`), Thư viện (`/library`), Bảng xếp hạng (`/student/leaderboard`), Luyện nói (`/student/speaking`), và Ôn tập (`/review`), trên màn hình đồng thời xuất hiện **2 thanh header song song dính chặt trên đỉnh**:
  1. **Header tầng 1**: Do chính `StudentShell` render (cao 56px, chứa nút Menu, Tiêu đề trang `title`, Chuông thông báo, Streak, XP, Avatar).
  2. **Header tầng 2**: Do chính trang con tự tạo thêm một thẻ `<header className="sticky ...">` hoặc `<div className="flex items-center ...">` riêng (cao 56px – 64px, chứa nút quay lại `ChevronLeft` / `ArrowLeft`, icon và tiêu đề trang lặp lại).
- **Hệ quả UX**:
  - Trên điện thoại di động (viewport chiều cao 667px – 844px), tổng chiều cao của 2 header cộng lại chiếm hơn **120px**, kết hợp với thanh Bottom Navigation 5 tab (cao 64px), khiến **hơn 25% diện tích màn hình bị "bắt cóc"** bởi các thanh công cụ thừa thãi.
  - Nút quay lại (`ChevronLeft / ArrowLeft`) đưa học viên về `/student` là hoàn toàn thừa thãi, bởi vì ngay dưới chân màn hình luôn có thanh Bottom Navigation với tab đầu tiên là Trang học (`/student`), và thanh Sidebar / Mobile Drawer bên trái cũng luôn có nút Trang học.
- **Minh chứng mã nguồn**:
  - `src/app/import/page.tsx:570-583`:
    ```tsx
    <StudentShell title="Nhập danh sách riêng" contentClassName="p-0">
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] ...">
        {/* Header thứ hai thừa thãi */}
        <header className="sticky top-header-safe z-10 flex h-16 items-center gap-4 border-b bg-white/80 px-4 backdrop-blur sm:px-6">
          <Link href="/student">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 font-bold text-sm transition-colors">
              <ChevronLeft className="h-5 w-5" /> Trang học
            </button>
          </Link>
          <div className="flex items-center gap-2 font-black text-slate-800">
            <Brain className="h-6 w-6 text-indigo-600" />
            <span>Nhập từ thủ công</span>
          </div>
        </header>
    ```
  - `src/app/library/page.tsx:542-560`:
    ```tsx
    <StudentShell title="Thư viện từ vựng" contentClassName="p-0">
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] ...">
        <header className="sticky top-0 z-30 flex h-header-safe items-center gap-2 border-b bg-white/90 px-3 backdrop-blur sm:px-6">
          <Link href="/student" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-700">
            <ChevronLeft className="h-5 w-5" aria-hidden /><span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-black">
            <span className="text-base">📦</span>
            <span>Thư viện</span>
          </div>
    ```
  - `src/app/student/leaderboard/page.tsx:108-118, 237`: Trang bọc trong `StudentShell title="Bảng xếp hạng"`, nhưng bên trong lại tạo Header riêng với `<ArrowLeft className="h-5 w-5" />` và `Bảng Xếp Hạng`.
  - `src/app/student/speaking/page.tsx:155-170`: Bọc trong `StudentShell title="AI Speaking Tutor"`, nhưng bên trong lại tạo thẻ `<header className="sticky top-header-safe z-30 flex h-14 ...">` với `<ChevronLeft className="h-4 w-4" /> Dashboard`.
  - `src/app/review/page.tsx:100-116`: Bọc trong `StudentShell title="Ôn tập"`, nhưng ngay dòng 109-115 lại render nút vuông `<ChevronLeft className="h-5 w-5" />` trỏ về `/student`.

---

#### 🔴 Vấn đề 1.2: Bão Banner Quảng Cáo & Upsell Tấn Công Người Học (Banner Bombardment)
- **Hiện tượng**: Khi học viên đăng nhập và truy cập trang chính `/student`, giao diện không tập trung ngay vào nhiệm vụ học mà dội thẳng vào mắt học viên một chuỗi **7 đến 8 thành phần quảng cáo, cảnh báo và đòi hỏi quyền hạn liên tiếp**:
  1. `CohortProPromoBanner` (`StudentShell.tsx:877`): Banner flash sale đếm ngược Pro kết thúc khóa học ghim ngay trên đỉnh.
  2. `FreeQuotaBanner` (`StudentShell.tsx:880`): Cảnh báo tài khoản Free sắp/đã vượt mức 150 từ, giục nâng cấp Pro.
  3. `UpgradeGiftModal` (`StudentShell.tsx:532`): Modal pop-up tự động bật lên đòi nhận quà VIP.
  4. `EnableNotifications` (`student/page.tsx:906`): Banner ép cấp quyền thông báo Web Push.
  5. `DailyReadingCard` (`student/page.tsx:909`): Thẻ thông báo bài đọc hàng ngày.
  6. `ChallengeWidget` (`student/page.tsx:912`): Thẻ thách thức nộp tiền cam kết học tập.
  7. `ProTrialMilestoneCard` (`student/page.tsx:1006`): Thẻ nhiệm vụ cày streak để đổi ngày dùng thử Pro VIP.
  8. Sidebar Footer Card (`StudentShell.tsx:784-804`): Khối thẻ vàng cam viền nhũ `Gói Pro VIP / ƯU ĐÃI` luôn ghim cố định ở đáy thanh điều hướng.
- **Hệ quả UX**:
  - Giao diện giáo dục biến thành một "sàn thương mại điện tử" săn sale giá rẻ. Tâm lý học viên bị xao nhãng nghiêm trọng; mục tiêu cốt lõi là **"Hôm nay tôi cần học từ gì?"** và **"Có bao nhiêu từ đến hạn cần ôn?"** bị đẩy tụt xuống dưới màn hình đầu tiên (below the fold). Tỷ lệ tín hiệu trên nhiễu (Signal-to-Noise Ratio) ở mức báo động.

---

#### 🔴 Vấn đề 1.3: Dữ Liệu Fake & Phong Cách Tiếp Thị Đa Cấp MLM trong Tuyến `/student/referral`
- **Hiện tượng**: Trang `/student/referral` được nhúng trực tiếp trong portal của học viên nhưng lại vận hành như một phần mềm tiếp thị liên kết MLM chuyên nghiệp:
  1. Cài cắm mảng dữ liệu giả lập tĩnh `MOCK_LEADERBOARD` (`referral/page.tsx:123-150`) với các tên ẩn danh giả (`Nguyễn Hoàng M***`, trường `FTU Hà Nội`, mời 46 người, nhận tiền mặt `3.850.000đ`).
  2. Giả lập thứ hạng của chính học viên dựa trên danh sách fake (`referral/page.tsx:446-449`):
     ```tsx
     const userRank = activatedCount > 0
       ? MOCK_LEADERBOARD.filter((item) => item.invitedCount > activatedCount).length + 1
       : null;
     ```
  3. Hardcode số liệu vinh danh và hiệu ứng giả lập cập nhật theo thời gian thực (`referral/page.tsx:1039-1051`): Chấm xanh chớp nháy `<span className="... animate-pulse" /> Cập nhật tuần này`, kèm chuỗi văn bản cứng: *"Đã trao thưởng: 14.800.000đ & 1.250+ ngày VIP"*.
  4. Bố trí nút rút tiền mặt tức thì 24/7 qua VietQR (`referral/page.tsx:580-596`) kèm phân tầng 5 cấp độ đại sứ (`Đồng Hành`, `Dẫn Đường`, `Khai Phóng`, `Đại Sứ Toàn Năng`). File component này phình to tới **1.682 dòng code**.
- **Hệ quả UX**:
  - Làm sụt giảm nghiêm trọng uy tín và tính học thuật của nền tảng LingoPro. Một ứng dụng rèn luyện từ vựng cho học sinh/sinh viên lại biến tướng thành công cụ kiếm tiền rút hoa hồng đa cấp, gây phản cảm cho phụ huynh và người học nghiêm túc.

---

#### 🟡 Vấn đề 1.4: Tuyến Đường Rác & Redirect Mồ Côi (`/student/stats`)
- **Hiện tượng**: Tuyến `src/app/student/stats/page.tsx` chỉ chứa duy nhất 6 dòng code gọi lệnh chuyển hướng Next.js:
  ```tsx
  import { redirect } from 'next/navigation';
  export default function StudentStatsPage() {
    redirect('/student/profile#stats');
  }
  ```
- **Hệ quả UX**: Khi học viên bấm vào các liên kết thống kê cũ hoặc bookmark URL, trình duyệt phải thực hiện một cú nhảy chuyển hướng làm giật màn hình. Phần thống kê tại `/student/profile#stats` lại nằm khuất ở nửa dưới trang thông tin cá nhân.

---

### 2.2. TRỤ CỘT: XẤU (Palette Clashes, Inconsistent Hierarchy & Visual Whiplash)

---

#### 🔴 Vấn đề 2.1: Xung Đột Bảng Màu Gai Mắt — Giao Diện Vũ Trụ Đen Tối Nhốt Trong Khung Trắng
- **Hiện tượng**: Bảng màu giữa khung ngoài (`StudentShell`) và các trang con bên trong đối chọi 100% về độ sáng và triết lý thị giác:
  - `StudentShell` sử dụng tông màu sáng hiện đại: Nền trang xám ngà `#f7f8fc`, thanh Desktop Sidebar màu trắng tinh khiết `#ffffff`, thanh Header kính mờ trắng `bg-white/90`.
  - Nhưng ngay khi học viên click vào tab Bảng xếp hạng (`/student/leaderboard`), trang con lại ép một dải màu đen tím vũ trụ:
    `bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950` (`leaderboard/page.tsx:105`).
  - Tương tự, trang Luyện nói (`/student/speaking`) ép nền đen kịt `bg-slate-900 text-slate-100` (`speaking/page.tsx:156`).
  - Trang Quản lý Nhóm (`/group`) ép nền tối đen thẳm `bg-[#070711] text-white` (`group/page.tsx:160`).
- **Hệ quả UX**:
  - Gây hiện tượng "sốc thị giác" (visual whiplash). Người dùng đang quen với thanh điều hướng màu trắng tinh sạch bên trái, khi chuyển trang thì vùng nội dung chính đột ngột tối sầm như một ứng dụng khác được ghép cưỡng bức vào qua thẻ `<iframe>`.
  - Vi phạm nguyên tắc nhận diện thương hiệu thống nhất (Brand Consistency).

---

#### 🔴 Vấn đề 2.2: Khối Hộp Đen Thô Kệch 160px & Icon Gạch Chéo khi Từ Vựng Không Có Ảnh
- **Hiện tượng**: Trong cửa sổ chi tiết từ vựng `WordDetailModal.tsx` (`lines 282-286`):
  ```tsx
  {word.image_url && !imageFailed ? (
    <div className="relative w-full h-40 overflow-hidden rounded-t-2xl bg-slate-800/50">
      <img src={resolveImageSrc(word.image_url)} ... />
    </div>
  ) : (
    /* KHI KHÔNG CÓ ẢNH HOẶC TẢI ẢNH THẤT BẠI: */
    <div className="relative w-full h-40 overflow-hidden rounded-t-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
      <ImageOff className="h-10 w-10" />
    </div>
  )}
  ```
- **Hệ quả UX**:
  - Hơn 70% từ vựng tiếng Anh học thuật thông thường không có sẵn ảnh minh họa. Mỗi lần học viên bấm vào xem chi tiết một từ trên điện thoại, một **khối hộp màu đen xám xịt cao tới 160px (`h-40`)** chình ình ở đầu modal với icon gạch chéo máy ảnh `ImageOff` to tướng (40px).
  - Khối rỗng vô nghĩa này đẩy toàn bộ nội dung quan trọng nhất (Từ chính, Phiên âm IPA, Loại từ, Định nghĩa tiếng Việt, Câu ví dụ) trôi tuột xuống đáy màn hình, buộc học viên phải dùng ngón tay cuộn xuống mới đọc được. Đây là một lỗi thiết kế phản công thái học nghiêm trọng.

---

#### 🟡 Vấn đề 2.3: Loạn Nhịp Điệu Viền (Border Clashes) & Trộn Lẫn 6 Màu Không Quy Chuẩn
- **Hiện tượng**: Tại nửa trên trang `/student/page.tsx` (`lines 915-1002, 1137-1163`), hệ thống trộn lẫn quá nhiều hệ màu và viền vi phạm nhịp điệu thị giác (spacing & color rhythm):
  - Card Học từ mới: Nền gradient tím `from-indigo-500 to-indigo-700`, viền `border-indigo-200/80`.
  - Card Ôn tập FSRS: Nền gradient xanh ngọc `from-emerald-500 to-teal-700`, viền `border-emerald-200/80`.
  - Nút Quiz nhanh: Nền trắng, viền xám `border-slate-200`.
  - Nút Lộ trình: Nền trắng, viền xanh da trời `border-sky-200`.
  - Thanh phân bố trí nhớ FSRS L1–L6: 6 dải màu rời rạc cạnh nhau (`rose-400`, `amber-400`, `sky-400`, `indigo-500`, `emerald-500`, `purple-500`).
- **Hệ quả UX**: Màn hình trông như một bảng đồ chơi trẻ em với quá nhiều màu sắc phân tán, thiếu một hệ màu chủ đạo (Primary brand palette) chuẩn mực cho đối tượng học sinh THPT, sinh viên đại học và người đi làm luyện thi TOEIC/IELTS.

---

### 2.3. TRỤ CỘT: CỨNG NGẮC (Boxy Grids, Abrupt Modals & Lack of Breathing Room)

---

#### 🟡 Vấn đề 3.1: Bố Cục Dạng Hộp Đóng Khung Thô Cứng (Heavy Boxy Container Overload)
- **Hiện tượng**:
  - Tại `src/app/student/profile/page.tsx:343-493` và `src/app/student/page.tsx:1064-1168`, các dữ liệu được nhét vào các hộp chữ nhật xám đóng khung viền lồng viền:
    Thẻ ngoài `border bg-background p-3` bao quanh thẻ trong `rounded-lg border bg-muted/30 px-2 py-2 text-center`.
- **Hệ quả UX**:
  - Giao diện thiếu khoảng thở (breathing room), phân cấp thị giác bị đóng khung cứng nhắc như các phần mềm desktop WinForms từ năm 2005. Người dùng cảm thấy ngột ngạt khi nhìn vào các ma trận ô vuông dày đặc.

---

#### 🟡 Vấn đề 3.2: Chuyển Trạng Thái Đột Ngột & Che Mờ Toàn Màn Hình Thô Bạo
- **Hiện tượng**:
  - Tại `src/app/student/page.tsx:1425-1439`: Khi học viên chọn xem một từ hoặc mở popup chọn nghĩa, hệ thống kích hoạt lớp overlay đen kịt 60% toàn màn hình kèm làm mờ nặng (`bg-black/60 backdrop-blur-md`).
- **Hệ quả UX**:
  - Trên thiết bị di động, việc mở một modal cố định lơ lửng giữa màn hình ngắt đứt hoàn toàn ngữ cảnh học tập. Ngón tay cái rất khó với tới nút đóng ở góc trên bên phải. Thay vì dùng Bottom Sheet dạng vuốt kéo xuống tự nhiên (Swipe-down Drawer), giao diện ép người dùng phải thao tác đóng hộp thoại cứng nhắc.

---

### 2.4. TRỤ CỘT: AI QUÁ (Formulaic AI Template Vibes & Prompt Jargon Overdose)

---

#### 🔴 Vấn đề 4.1: Lạm Dụng Gradient Tím - Xanh Ngọc, Đổ Bóng Bóng Bẩy & Emoji Kích Thước Lớn
- **Hiện tượng**:
  - Nút Lộ trình trên thanh Bottom Nav di động (`MobileBottomNav.tsx:116-123`):
    ```tsx
    <span className={cn(
      'absolute -top-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[28px] shadow-lg transition-transform active:scale-95',
      'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-300/50 ring-2 ring-emerald-200'
    )}>
      🗺️
    </span>
    ```
  - Thẻ Học từ mới (`student/page.tsx:923`): Khối kính mờ `bg-white/20 backdrop-blur-sm shadow-inner` chứa emoji 📖 kích thước 2xl.
- **Hệ quả UX**:
  - Đây là biểu hiện kinh điển của phong cách "AI Dashboard Template 2023": Nền bóng đổ màu neon sặc sỡ, hiệu ứng kính mờ glassmorphism cẩu thả không mục đích, nhét emoji cỡ lớn thay vì thiết kế hệ thống iconography vector chỉn chu. Giao diện toát lên vẻ "sản phẩm dựng vội bằng AI" thay vì một nền tảng edtech chuyên nghiệp.

---

#### 🟡 Vấn đề 4.2: Câu Chữ Mang Tính Chất AI Prompt Placeholder & Rò Rỉ Thuật Ngữ Kỹ Thuật
- **Hiện tượng**:
  - Tại `src/app/review/page.tsx:106`: Phụ đề trang ghi nguyên văn:
    *"Mix recognition · cloze · nghe · gõ — FSRS chung 1 pipeline"*.
  - Tại `src/app/review/page.tsx:219`: Chú thích chân trang:
    *"MCQ đúng tối đa Good · gõ/nghe nhanh có thể Easy · sai = Again"*.
  - Biểu tượng trang trí `<Sparkles className="h-4 w-4" />` được rải rác khắp nơi một cách sáo rỗng tại các vị trí không có tính năng AI nào thực sự hoạt động (`page.tsx:1254` "Kho còn trống", `page.tsx:1331` "Mở thư viện").
- **Hệ quả UX**:
  - Học viên phổ thông không hiểu "pipeline", "cloze", hay tham số "Good / Easy / Again" của thuật toán FSRS là gì. Việc để lộ các thuật ngữ kỹ thuật backend và ghi chú prompt của lập trình viên vào giao diện người dùng khiến trải nghiệm học tập trở nên xa lạ và thiếu tinh tế.

---

## 3. BẢNG MA TRẬN KHIẾM KHUYẾT (DEFECT MATRIX)

| ID | File Path | Component | Trụ Cột | Mức độ | Mô tả khiếm khuyết | Dòng code |
|---|---|---|---|---|---|---|
| **STU-01** | `src/app/import/page.tsx` | Header cục bộ | **Thừa + Xấu** | 🔴 Critical | Double sticky header; lặp lại nút "Trang học" và tiêu đề trong khi `StudentShell` đã có | L.570–584 |
| **STU-02** | `src/app/library/page.tsx` | Header cục bộ | **Thừa + Xấu** | 🔴 Critical | Double sticky header; lặp lại nút `ChevronLeft` Dashboard và tiêu đề Thư viện | L.542–561 |
| **STU-03** | `src/app/student/leaderboard/page.tsx` | Header & Container | **Thừa + Xấu** | 🔴 Critical | Double header + Xung đột nền tối vũ trụ (`indigo-950 via-slate-900`) trong shell trắng | L.105–118, L.237 |
| **STU-04** | `src/app/student/speaking/page.tsx` | Header & Main | **Thừa + Xấu** | 🔴 Critical | Double header + Xung đột nền xám đen (`bg-slate-900 text-slate-100`) trong shell sáng | L.155–171 |
| **STU-05** | `src/app/review/page.tsx` | Header & Back CTA | **Thừa** | 🟠 Major | Header nội bộ lặp lại tiêu đề + nút Back hình vuông thừa thãi về `/student` | L.100–116 |
| **STU-06** | `src/app/student/page.tsx` & `StudentShell.tsx` | Banners & Modals | **Thừa** | 🔴 Critical | Bão 7-8 banner/modal đồng thời (Flash sale Pro, Quota, Gift modal, Push, Reading, Challenge, Milestone) | L.906–913, L.1006; Shell L.532, L.877, L.880 |
| **STU-07** | `src/components/student/WordDetailModal.tsx` | Image Container | **Xấu + Cứng** | 🔴 Critical | Hộp đen xám 160px (`bg-slate-800/50`) với icon `ImageOff` choán nửa màn hình khi từ không có ảnh | L.282–286 |
| **STU-08** | `src/app/student/referral/page.tsx` | Referral Core | **Thừa + AI quá** | 🔴 Critical | Dữ liệu giả lập `MOCK_LEADERBOARD`, `userRank` ảo, rút tiền VietQR MLM 1.682 dòng code | L.123–150, L.446–450, L.580–596 |
| **STU-09** | `src/app/group/page.tsx` | Page Wrapper | **Xấu** | 🟠 Major | Giao diện tối thẳm `#070711` đối lập hoàn toàn với tông màu nền sáng của app | L.160–168 |
| **STU-10** | `src/components/student/MobileBottomNav.tsx` | Center FAB Button | **AI quá** | 🟡 Minor | Nút Lộ trình gradient xanh bóng nhẫy, emoji 🗺️ cỡ lớn phong cách template AI 2023 | L.116–123 |
| **STU-11** | `src/app/review/page.tsx` | Subtitle & Footer | **AI quá** | 🟡 Minor | Rò rỉ thuật ngữ kỹ thuật backend ("FSRS chung 1 pipeline", "MCQ đúng tối đa Good") | L.106, L.219 |
| **STU-12** | `src/app/student/stats/page.tsx` | Stats Route | **Thừa** | 🟡 Minor | Tuyến đường mồ côi 6 dòng lệnh gọi `redirect('/student/profile#stats')` gây giật màn hình | L.1–6 |

---

## 4. MINH CHỨNG MÃ NGUỒN CỤ THỂ (SOURCE CODE EVIDENCE)

### 4.1. Minh chứng Lỗi Double Sticky Headers (`src/app/import/page.tsx`)
```tsx
// src/app/import/page.tsx: dòng 570 - 584
return (
  // 1. StudentShell đã render sticky header chuẩn (cao 56px, chứa menu, streak, XP, avatar)
  <StudentShell title="Nhập danh sách riêng" contentClassName="p-0">
    <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 font-sans">
    {/* 2. Trang con lại tự chèn thêm một header dính thứ 2 ngay dưới */}
    <header className="sticky top-header-safe z-10 flex h-16 items-center gap-4 border-b bg-white/80 px-4 backdrop-blur sm:px-6">
      <Link href="/student">
        <button className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 font-bold text-sm transition-colors">
          <ChevronLeft className="h-5 w-5" /> Trang học
        </button>
      </Link>
      <div className="flex items-center gap-2 font-black text-slate-800">
        <Brain className="h-6 w-6 text-indigo-600" />
        <span>Nhập từ thủ công</span>
      </div>
    </header>
```

### 4.2. Minh chứng Lỗi Bão Banner & Pop-up Upsell (`src/app/student/page.tsx` & `StudentShell.tsx`)
```tsx
// src/components/student/StudentShell.tsx: dòng 875 - 881
{/* Flash sale Pro (kết thúc khóa) — trên banner quota */}
{showChrome && !effectiveImmersive ? (
  <CohortProPromoBanner variant="dashboard" />
) : null}
{/* Free >=150: banner dính + ép modal — lead upsell chắc thấy */}
{showChrome && !effectiveImmersive ? <FreeQuotaBanner /> : null}

// Kèm theo modal tự động nhảy lên khi vào app:
// src/components/student/StudentShell.tsx: dòng 532
<UpgradeGiftModal />

// Và hàng loạt banner tiếp theo ngay trong nội dung dashboard:
// src/app/student/page.tsx: dòng 906 - 913 & dòng 1006
<EnableNotifications />
<DailyReadingCard />
<ChallengeWidget />
...
<ProTrialMilestoneCard enabled ... />
```

### 4.3. Minh chứng Lỗi Hộp Đen `ImageOff` 160px (`src/components/student/WordDetailModal.tsx`)
```tsx
// src/components/student/WordDetailModal.tsx: dòng 270 - 286
{word.image_url && !imageFailed ? (
  <div className="relative w-full h-40 overflow-hidden rounded-t-2xl bg-slate-800/50">
    <img
      src={resolveImageSrc(word.image_url)}
      alt={word.word}
      className="w-full h-full object-cover"
      onError={() => setImageFailed(true)}
    />
  </div>
) : (
  // Khi không có ảnh: ép một hộp đen 160px với icon ImageOff choán sạch nửa trên modal
  <div className="relative w-full h-40 overflow-hidden rounded-t-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
    <ImageOff className="h-10 w-10" />
  </div>
)}
```

### 4.4. Minh chứng Lỗi Dữ Liệu Fake & Thứ Hạng Giả Lập (`src/app/student/referral/page.tsx`)
```tsx
// src/app/student/referral/page.tsx: dòng 123 - 134
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Nguyễn Hoàng M***',
    avatarBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300',
    badge: '👑 Đại Sứ Toàn Năng',
    invitedCount: 46,
    rewardCash: 3850000,
    rewardDays: 210,
    schoolOrCity: 'FTU Hà Nội',
  },
  ...
];

// Tính toán xếp hạng giả tạo dựa trên danh sách ảo:
// src/app/student/referral/page.tsx: dòng 446 - 449
const userRank =
  activatedCount > 0
    ? MOCK_LEADERBOARD.filter((item) => item.invitedCount > activatedCount).length + 1
    : null;
```

---

## 5. KẾ HOẠCH KHẮC PHỤC HÀNH ĐỘNG (ACTIONABLE REMEDIATION PLAN)

---

### 5.1. Nhóm Quick Wins (Khắc phục ngay trong 1-2 ngày)

#### 1. Triệt tiêu toàn bộ Double Sticky Headers trên 5 Subpages
- **Giải pháp**: Xóa bỏ hoàn toàn thẻ `<header>` cục bộ và nút `ChevronLeft` trong `import/page.tsx`, `library/page.tsx`, `student/speaking/page.tsx`, và `review/page.tsx`. Truyền các nút hành động phụ (nếu có, như nút "List riêng" của thư viện) vào thuộc tính `headerRight` của `<StudentShell>`.

```tsx
// CODE MẪU KHẮC PHỤC CHO src/app/import/page.tsx:
export default function ImportPage() {
  return (
    <StudentShell 
      title="Nhập từ vựng riêng"
      headerRight={
        <Link
          href="/library"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          Mở Thư viện
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tab switcher và form nhập liệu trực tiếp, không còn header tầng 2 */}
        ...
      </div>
    </StudentShell>
  );
}
```

#### 2. Xóa bỏ Hộp Đen `ImageOff` Trong `WordDetailModal.tsx`
- **Giải pháp**: Nếu từ vựng không có ảnh hoặc tải ảnh thất bại, **thu gọn hoàn toàn khối ảnh về 0px** (`hidden` hoặc không render), cho phép tiêu đề từ vựng, phiên âm IPA và định nghĩa hiển thị ngay lập tức ở đỉnh modal.

```tsx
// CODE MẪU KHẮC PHỤC CHO src/components/student/WordDetailModal.tsx:
{/* Chỉ render khi thực sự có ảnh hợp lệ và chưa bị lỗi tải */}
{word.image_url && !imageFailed ? (
  <div className="relative w-full h-44 overflow-hidden rounded-t-2xl bg-muted/30 border-b">
    <img
      src={resolveImageSrc(word.image_url)}
      alt={word.word}
      loading="lazy"
      className="w-full h-full object-cover"
      onError={() => setImageFailed(true)}
    />
  </div>
) : null}

{/* Phần Header từ vựng sẽ tự động đẩy lên sát đỉnh modal khi không có ảnh */}
<div className="p-6 pb-4">
  <h2 className="text-3xl font-black text-foreground leading-tight tracking-tight">
    {word.word}
  </h2>
  ...
</div>
```

#### 3. Đồng bộ Bảng màu Bảng Xếp Hạng (`/student/leaderboard`) Sang Giao Diện Sáng
- **Giải pháp**: Loại bỏ toàn bộ `bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950`. Áp dụng tông màu Technical Minimalist nền trắng/slate sáng (`bg-white` / `bg-slate-50/60`), các bục Podium vàng/bạc/đồng chuyển sang thẻ Card viền nét tinh gọn.

```tsx
// CODE MẪU KHẮC PHỤC CHO src/app/student/leaderboard/page.tsx:
return (
  <StudentShell title="Bảng xếp hạng thi đua">
    <div className="max-w-xl mx-auto space-y-5">
      {/* Selector tuần / tháng / lớp học */}
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        ...
      </div>
      
      {/* Top 3 Podium trên nền sáng */}
      <div className="grid grid-cols-3 gap-3 items-end pt-4">
        {/* Card 2nd (Bạc) */}
        <div className="bg-white border rounded-2xl p-3 text-center shadow-xs">...</div>
        {/* Card 1st (Vàng) */}
        <div className="bg-amber-50/60 border-2 border-amber-300 rounded-2xl p-4 text-center shadow-sm">...</div>
        {/* Card 3rd (Đồng) */}
        <div className="bg-white border rounded-2xl p-3 text-center shadow-xs">...</div>
      </div>
    </div>
  </StudentShell>
);
```

---

### 5.2. Nhóm Structural Changes (Tái cấu trúc trong Sprint tới)

#### 1. Gom nhóm & Dọn dẹp Bão Banner trên Student Dashboard
- **Giải pháp**:
  - Tách các thông báo thành 2 nhóm:
    - **Nhóm Khẩn cấp / Cần tương tác**: Tích hợp vào popover của `NotificationBell` trên Header (ví dụ: cấp quyền Push, bài tập đọc mới).
    - **Nhóm Upsell / Khuyến mãi**: Chỉ cho phép **tối đa 1 banner duy nhất** xuất hiện tại một thời điểm trên Dashboard theo thứ tự ưu tiên (Ưu tiên 1: Quota đầy $\ge 150$ từ $\rightarrow$ Ưu tiên 2: Flash sale $\rightarrow$ Ưu tiên 3: Milestone card). Mọi banner đều phải có nút tắt nhớ trạng thái (`dismissable` lưu vào `localStorage`).

#### 2. Tái cấu trúc Cổng Giới thiệu (`/student/referral`) Trở về Đúng Bản chất Giáo dục
- **Giải pháp**:
  - Xóa bỏ triệt để `MOCK_LEADERBOARD`, các chuỗi vinh danh tiền mặt hardcoded, và luồng rút tiền VietQR mang phong cách tiếp thị liên kết MLM.
  - Định vị lại trang thành: **"Cùng bạn học tập — Tặng ngày Pro VIP"**.
  - Cấu trúc giao diện tinh giản:
    1. Hộp chia sẻ liên kết mời bạn bè (Copy link / Mã QR).
    2. Bảng theo dõi số bạn bè đã tham gia thực tế (Dữ liệu thật từ cơ sở dữ liệu Supabase `referral_claims`).
    3. Thẻ tích lũy ngày học VIP thực nhận.
  - Rút gọn file component từ 1.682 dòng xuống dưới 300 dòng code sạch.

---

### 5.3. Nhóm Polish (Tinh chỉnh Thẩm mỹ & Ngôn ngữ)

#### 1. Chuẩn hóa Ngôn ngữ & Dọn dẹp Rò rỉ Kỹ thuật (Technical Leak Cleanup)
- **Giải pháp**:
  - Tại `/review`: Thay câu *"Mix recognition · cloze · nghe · gõ — FSRS chung 1 pipeline"* thành câu thân thiện với học viên: *"Ôn tập đa giác quan: Nhận diện, Điền từ, Luyện nghe và Gõ phím"*.
  - Thay câu *"MCQ đúng tối đa Good · gõ/nghe nhanh có thể Easy · sai = Again"* thành chú thích sư phạm: *"Hệ thống tự động điều chỉnh khoảng cách ôn tập dựa trên độ chính xác và tốc độ phản xạ của bạn."*

#### 2. Tinh chỉnh Iconography & Loại bỏ Gradient AI Rập Khuôn
- **Giải pháp**:
  - Thay thế nút Lộ trình gradient bóng nhẫy và emoji 🗺️ to tướng trên thanh `MobileBottomNav` bằng icon Lucide vector (`Map` hoặc `Compass`), viền phẳng chuẩn mực, đồng bộ kích thước $24\times 24\text{px}$ với 4 tab còn lại.
  - Giảm độ gắt của 2 card Học từ mới và Ôn tập FSRS trên Dashboard: Chuyển từ gradient sặc sỡ sang nền màu chức năng (Solid brand colors) kết hợp typography rõ ràng.
