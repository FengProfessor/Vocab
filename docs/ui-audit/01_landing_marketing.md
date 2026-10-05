# Báo Cáo Kiểm Toán UI/UX: Marketing, Landing Pages & Tối Ưu Chuyển Đổi (CRO)

**Mã tài liệu:** `UI-AUDIT-01`  
**Phân hệ:** Marketing & Landing Pages, Chiến dịch Khảo thí, B2B Teachers, Quà tặng & Cơ chế CRO  
**Ngày kiểm toán:** 04/10/2026  
**Đơn vị thực hiện:** Nhóm Kiểm toán UI/UX LingoPro (Worker 1 - Marketing & Auth Auditor)  
**Tiêu chuẩn đánh giá:** 4 Trụ cột — **Thừa - Xấu - Cứng ngắc - AI quá** (Đối chiếu với Tôn chỉ Technical Minimalist & Thiết kế Chuẩn mực EdTech)

---

## 1. Phân Loại & Tổng Quan Phân Hệ (Route & Component Inventory)

Phân hệ Marketing & Landing đóng vai trò là cửa ngõ tiếp cận người học, phụ huynh, giáo viên và đối tác trung tâm ngoại ngữ. Qua rà soát toàn bộ thư mục `src/app` và `src/components`, phân hệ bao gồm 7 tuyến đường (routes) công khai và 12 thành phần điều hướng/chuyển đổi (CRO components) quan trọng:

### 1.1. Bảng Kiểm Kê Tuyến Đường (Route Inventory)
| Tuyến đường (URL) | Tệp mã nguồn App Router | Thành phần chính | Vai trò nghiệp vụ | Hiện trạng thị giác & trải nghiệm |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` (849 dòng) | `LandingPage`, `DictionaryDemo`, `AuthRedirectGate` | Trang chủ đón khách chính thức của ứng dụng | Theme Vintage Cream (`#f6efe6`), badge chắp vá "Bản Mới 2026" gắn trên navbar, link giật tít "Sát Thủ TOEIC". |
| `/landing` | `src/app/landing/page.tsx` (119 dòng) | `ReferoLandingMaster`, 17 components trong `@/components/landing/refero/*` | Landing page thay thế thiết kế theo phong cách SaaS Refero | Theme Cool Slate (`#f8fafc`), đối nghịch 100% với trang chủ, cạnh tranh SEO nội bộ, chứa thanh countdown và social proof giả. |
| `/challenge-landing` | `src/app/challenge-landing/page.tsx` | `ChallengeInteractiveWrapper`, `UrgencyCountdown`, `FloatingSocialProof` | Trang bán "Thử Thách 180 Ngày Hoàn Tiền" | Tone màu cam hổ phách dồn dập, bẫy chuột thoát màn hình (desktop exit-intent), popups học viên ảo. |
| `/sat-thu-toeic-listening` / `/lead-magnet/...` | `src/app/lead-magnet/sat-thu-toeic-listening/page.tsx` (39 dòng) | `LeadMagnetClient`, `BookCover3D`, `DiagnosticScorecard`, `EmailOptinCard` | Phễu thu thập lead tặng Ebook TOEIC Listening ETS 2026 | Lạm dụng gradient 3 màu, khối cầu sáng ambient nhấp nháy, mockup 3D đổ bóng nặng nề, từ ngữ giật tít. |
| `/for-teachers` | `src/app/for-teachers/page.tsx` (675 dòng) | `ForTeachersPage`, `TeacherPilotClient` | Landing page B2B dành cho giáo viên và trung tâm | Theme xanh rêu (`#f7f8f2`) kết hợp xanh chanh neon (`#d7ff64`), các khối card xoay nghiêng 3 độ gượng gạo. |
| `/nhan-qua` & `/khaigiang` | `src/app/nhan-qua/page.tsx` (481 dòng) & `src/app/khaigiang/page.tsx` (11 dòng) | `NhanQuaKhaiGiangPage` | Phễu tặng 3 tháng VIP Pro đợt khai giảng | Giao diện nền đen kịt `slate-950`, confetti, ngày hết hạn cũ (05/09), chứa gần 200 dòng mã form chết (`false && !isSuccess`). |
| `/download` | `src/app/download/page.tsx` (355 dòng) | `DownloadPage` | Trang tải ứng dụng Windows Desktop & hướng dẫn cài đặt | Nút Logo và "Dashboard" trỏ cứng về `/student`, đẩy khách vãng lai chưa đăng nhập vào vòng lặp chuyển hướng. |
| `/privacy` & `/terms` | `src/app/privacy/page.tsx` (110 dòng) & `src/app/terms/page.tsx` (173 dòng) | `PrivacyPage`, `TermsPage` | Trang Chính sách bảo mật & Điều khoản sử dụng | Toàn bộ nền trang màu đen tối sầm `slate-950`, gây sốc thị giác khi chuyển tiếp từ footer nền be sáng của `page.tsx`. |

### 1.2. Bảng Kiểm Kê Thành Phần CRO & Upsell (CRO & Conversion Components)
| Thành phần | Đường dẫn tệp | Chức năng dự kiến | Tình trạng khiếm khuyết |
|---|---|---|---|
| `ChallengeJoinModal` | `src/components/challenge/ChallengeJoinModal.tsx` | Modal xác nhận nộp phí cam kết thử thách qua VietQR | Sử dụng số tài khoản giả `1111111111` Vietinbank nhưng cam kết tự động xác nhận sau 1-3 phút. |
| `UrgencyCountdown` | `src/components/challenge-landing/UrgencyCountdown.tsx` | Thanh đếm ngược tạo cảm giác gấp gáp | Chạy đồng hồ 24h giả lặp lại vô tận, số lượng chỗ cố định `43/50 bạn` và `86%`. |
| `ReferoUrgencyCountdownBar` | `src/components/landing/refero/ReferoCroModules.tsx` | Thanh đếm ngược trên trang `/landing` | Trùng lặp mã 100% với `UrgencyCountdown.tsx`, cùng con số giả `43/50 bạn`. |
| `FloatingSocialProof` | `src/components/challenge-landing/FloatingSocialProof.tsx` | Popup học viên vừa đăng ký hoặc nhận hoàn tiền | Danh sách 5 sinh viên bịa đặt bắn lên màn hình mỗi 10 giây, gây phân tâm thị giác. |
| `ReferoFloatingSocialProof` | `src/components/landing/refero/ReferoCroModules.tsx` | Popup social proof trên trang `/landing` | Bản sao chép của `FloatingSocialProof.tsx` với cùng nội dung và hành vi. |
| `ChallengeInteractiveWrapper` | `src/components/challenge-landing/ChallengeInteractiveWrapper.tsx` | Bọc trang và kích hoạt bẫy khách rời trang | Bắt sự kiện chuột `mouseleave` (`clientY <= 8`) để bung modal ép xem ưu đãi. |
| `WluWelcomeModal` | `src/components/billing/WluWelcomeModal.tsx` | Modal thông báo kích hoạt mã đối tác WLU | Chứa văn bản trò chuyện nội bộ xuề xòa (`cho ace thôi nhé ạ <3`, `cho e xin 1 lượt PR`). |
| `UpsellModal` | `src/components/upsell/UpsellModal.tsx` | Modal chào gói Pro khi học viên chạm giới hạn từ/AI | Sử dụng bảng màu cát ấm riêng biệt (`#faf9f5`, `#e8e6dc`), không kết nối với Design Tokens. |
| `UpgradeGiftModal` | `src/components/campaign/UpgradeGiftModal.tsx` | Modal nhận quà nâng cấp | Tệp rỗng 4 dòng trả về `null` (Dead code stub). |
| `Mascot` | `src/components/gamification/Mascot.tsx` | Linh vật thương hiệu | Chỉ bọc emoji Unicode (`😊`, `🥳`) vào `animate-bounce`, đối phó sơ sài. |

---

## 2. Đánh Giá Chuyên Sâu 4 Trụ Cột: "Thừa - Xấu - Cứng Ngắc - AI Quá"

---

### TRỤ CỘT 1: THỪA (Redundancy, Clutter, Duplicate Patterns, Dead Code)

#### 1.1. Hai Trang Landing Page Trùng Lặp Mục Tiêu Hoạt Động Song Song
- **Hiện trạng:** Dự án duy trì đồng thời hai trang đón khách hoàn chỉnh: `src/app/page.tsx` (Landing page phong cách Vintage Cream, 849 dòng) và `src/app/landing/page.tsx` (Landing page phong cách SaaS Refero với 17 tệp con).
- **Vấn đề thị giác & sản phẩm:**
  - Trên thanh điều hướng chính của `src/app/page.tsx` (dòng 267–270), xuất hiện một nút bấm dạng badge:
    ```tsx
    <Link href="/landing" className="hover:text-indigo-900 font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs flex items-center gap-1">
      <Sparkles className="w-3 h-3 text-indigo-600" />
      <span>Bản Mới 2026</span>
    </Link>
    ```
  - Khách truy cập vào trang chủ đang đọc về sản phẩm lại bị mời chào bấm sang một trang khác mang tên "Bản Mới 2026", nơi toàn bộ nội dung sản phẩm được trình bày lại bằng một giao diện khác hoàn toàn (xanh xám mát).
  - Tình trạng này làm phân mảnh nhận diện thương hiệu, gây loãng chỉ số SEO (hai trang cạnh tranh cùng từ khóa "LingoPro FSRS"), và tăng gấp đôi gánh nặng bảo trì khi thay đổi chính sách giá hay tính năng.

#### 1.2. Sự Dư Thừa Và Sao Chép Trắng Trợn Của Hai Bộ "Đếm Ngược Giả" (Fake Urgency Timers)
- **Hiện trạng:** Tồn tại hai component độc lập làm cùng một nhiệm vụ tạo áp lực thời gian giả:
  - `src/components/challenge-landing/UrgencyCountdown.tsx` (dòng 52–58)
  - `src/components/landing/refero/ReferoCroModules.tsx` (`ReferoUrgencyCountdownBar`, dòng 58–66)
- **Bằng chứng mã nguồn:** Cả hai file đều sao chép nguyên vẹn cụm văn bản và thanh tiến độ bịa đặt:
  ```tsx
  // UrgencyCountdown.tsx:
  <span>ĐỢT THỬ THÁCH THÁNG NÀY: Bắt đầu học 00:00 ngày mai • Đã có <strong className="text-yellow-200 underline decoration-yellow-400">43/50 bạn</strong> giữ chỗ</span>
  <span className="w-14 h-1.5 bg-white/20 rounded-full overflow-hidden inline-block">
    <span className="block h-full bg-yellow-300 rounded-full w-[86%]"></span>
  </span>

  // ReferoCroModules.tsx:
  <span><strong className="text-yellow-200">ĐỢT ƯU ĐÃI THÁNG NÀY:</strong> Đã có <u className="decoration-yellow-300 font-black">43/50 bạn</u> giữ chỗ VIP 0đ</span>
  <span className="w-12 h-1.5 bg-white/30 rounded-full inline-block overflow-hidden">
    <span className="block h-full bg-yellow-300 w-[86%]"></span>
  </span>
  ```
- **Hệ quả:** Người dùng dù tải lại trang vào bất kỳ ngày nào trong tháng cũng luôn thấy con số `43/50 bạn` và `86%`. Đây là kỹ thuật CRO "đen" lỗi thời, làm xói mòn nghiêm trọng uy tín sư phạm của một nền tảng giáo dục.

#### 1.3. Sự Trùng Lặp Của Hai Bộ Popup "Thông Báo Ảo" (Fake Social Proof Toasts)
- **Hiện trạng:** Cả `src/components/challenge-landing/FloatingSocialProof.tsx` và `src/components/landing/refero/ReferoCroModules.tsx` đều định nghĩa một mảng gồm đúng 5 đối tượng sinh viên đại học (Bách Khoa, NEU, FTU, Sư Phạm, HV Tài Chính) và dùng `setInterval` (9–10 giây) để liên tục bắn toast ở góc trái bên dưới màn hình.
- **Hệ quả:** Chiếm dụng không gian hiển thị, che chắn nội dung bài viết và nút điều hướng trên thiết bị di động, tạo ra "tiếng ồn thị giác" (visual spam) khiến người dùng mất tập trung và có xu hướng đóng tab ngay lập tức.

#### 1.4. Gần 200 Dòng Mã Chết (Dead Form Code) Bị Vô Hiệu Hóa Thủ Công Trong Phễu `/nhan-qua`
- **Hiện trạng:** Trong `src/app/nhan-qua/page.tsx` (dòng 179), lập trình viên vô hiệu hóa toàn bộ form đăng ký nhận mã bằng cách gán điều kiện bất khả thi:
  ```tsx
  {false && !isSuccess ? (
    <form onSubmit={handleSubmit} className="...">
      {/* Gần 200 dòng mã với input họ tên, sđt, năm sinh, trường học, mục tiêu... */}
    </form>
  ) : null}
  ```
- **Hệ quả:** Hàng trăm dòng mã JSX và toàn bộ logic xử lý `handleSubmit`, gọi fetch API `/api/campaign/khaigiang` trở thành dead code nằm lưu cửu trong file mà không được dọn dẹp hoặc tách module.

#### 1.5. Component Stub Rỗng Vô Nghĩa
- **Bằng chứng:** `src/components/campaign/UpgradeGiftModal.tsx`:
  ```tsx
  export function UpgradeGiftModal() {
    return null;
  }
  ```
- **Hệ quả:** Tệp rác 4 dòng không có giá trị vận hành nhưng gây ô nhiễm danh mục tìm kiếm khi các kỹ sư tra cứu modal chiến dịch.

---

### TRỤ CỘT 2: XẤU (Visual Discordance, Palette Clashes, Broken Rhythm, Harsh Borders)

#### 2.1. Tình Trạng Hỗn Loạn 6 Hệ Thống Bảng Màu Không Tương Thích
Một sản phẩm chuẩn mực đòi hỏi tính nhất quán về bản sắc thị giác (Brand Identity). Hiện tại, ứng dụng có tới 6 bảng màu hoàn toàn tách biệt:
1. **Design Tokens quy chuẩn (`src/app/globals.css`):**
   - Nền: `oklch(1 0 0)` (Trắng tinh khiết).
   - Màu chủ đạo: `--primary: oklch(0.511 0.262 276.966)` (Indigo hiện đại, sang trọng).
2. **Landing Page chính (`src/app/page.tsx` & `/auth`):**
   - Nền: `#f6efe6` (Vàng be cổ điển / Vintage Warm Cream).
   - Văn bản: `#241710` (Nâu đen đậm).
   - Điểm nhấn: `#b5502f` (Cam gạch / Terracotta).
3. **Landing Page Refero (`src/app/landing/page.tsx`):**
   - Nền: `#f8fafc` (Xám xanh lạnh / Cool Slate).
   - Văn bản: `slate-900`.
   - Điểm nhấn: `blue-600` / `indigo-600`.
4. **Trang Giáo viên B2B (`src/app/for-teachers/page.tsx`):**
   - Nền: `#f7f8f2` (Xanh rêu nhạt).
   - Văn bản: `#17231d` (Xanh lá rừng sẫm).
   - Điểm nhấn: `#d7ff64` (Xanh chanh neon chói gắt).
5. **Trang Quà Tặng Khai Giảng (`src/app/nhan-qua/page.tsx`):**
   - Nền: `bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950` (Tối đen Cyberpunk).
   - Điểm nhấn: Gradient đa sắc `from-white via-indigo-200 to-emerald-300`.
6. **Trang Điều Khoản & Chính Sách (`/privacy`, `/terms`):**
   - Nền: `bg-slate-950` (Đen kịt đơn điệu), văn bản `slate-200`.

**Hành trình trải nghiệm thực tế:** Khách hàng bắt đầu từ trang chủ (`#f6efe6` màu be ấm), bấm vào "Bản Mới 2026" thì chuyển sang giao diện xanh lạnh (`#f8fafc`), bấm tiếp vào "Chính sách bảo mật" ở footer thì toàn bộ màn hình sập xuống màu đen kịt (`slate-950`). Đây là hiện tượng **"Visual Shock" (Sốc thị giác)** điển hình, phản ánh tình trạng code chắp vá từ nhiều nguồn mã mở và template khác nhau mà không qua tinh chỉnh hệ thống.

#### 2.2. Văn Bản Nháp "Nội Bộ" Xuề Xòa Xuất Hiện Trên Giao Diện Production
- **Bằng chứng mã nguồn:** `src/components/billing/WluWelcomeModal.tsx` (dòng 71–82):
  ```tsx
  <div className="space-y-4 text-left text-sm sm:text-[15px] leading-relaxed text-slate-200">
    <p>
      Xin chào ace, xin cảm ơn ace đã dành thêm thời gian để luyện tập ngoại ngữ, mong rằng thông qua app nhỏ bé này giúp cho ace trên con đường học tập thật tốt và bày tỏ tốt.
    </p>

    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5 text-amber-200 font-medium text-center">
      Lưu ý: mình dùng nội bộ cho ace thôi nhé ạ <3
    </div>

    <p className="text-center font-medium text-emerald-300">
      Và nếu thật tuyệt vời nếu ace cho e xin 1 lượt PR ha <3
    </p>
  </div>
  ```
- **Phân tích:** Việc sử dụng các ký hiệu chat mạng xã hội `<3`, xưng hô "ace - e" và lời dặn "dùng nội bộ xin lượt PR" bên trong một modal kích hoạt chính thức làm giảm sút hoàn toàn sự uy tín, chuyên nghiệp và phong thái học thuật của nền tảng LingoPro.

#### 2.3. Lỗi Thời Gian & Nội Dung Cũ Trong Chiến Dịch Tiếp Thị
- **Bằng chứng mã nguồn:**
  - `src/app/nhan-qua/page.tsx` (dòng 108): `"MỪNG KHAI GIẢNG 05/09 — QUÀ TẶNG ĐỘC QUYỀN"`
  - `src/components/campaign/WelcomeKhaiGiangModal.tsx` (dòng 175): `"CHÀO MỪNG KHAI GIẢNG 05/09 · MÃ: KHAIGIANG3M"`
- **Phân tích:** Các mốc thời gian cố định "05/09" từ đợt khai giảng năm học cũ vẫn hiển thị công khai trên giao diện tháng 10/2026. Một chiến dịch đã kết thúc từ lâu nhưng vẫn để lại banner và modal gây cảm giác trang web bị bỏ hoang, không được chăm sóc.

---

### TRỤ CỘT 3: CỨNG NGẮC (Boxy Frames, Route Hijacking, Lack of Breathing Room, Substandard Navigation)

#### 3.1. Bẫy Rời Chuột Thoát Màn Hình (Aggressive Desktop Exit-Intent Trigger)
- **Bằng chứng mã nguồn:** `src/components/challenge-landing/ChallengeInteractiveWrapper.tsx` (dòng 25–30):
  ```tsx
  const handleMouseLeave = (e: MouseEvent) => {
    if (e.clientY <= 8 && !hasTriggeredExit && !isModalOpen) {
      hasTriggeredExit = true;
      sessionStorage.setItem('challenge_lead_seen', 'true');
      setIsModalOpen(true);
    }
  };
  ```
- **Phân tích:** Khi người dùng di chuyển chuột lên mép trên cửa sổ trình duyệt (ví dụ: muốn đổi tab, mở bookmark hoặc tắt trình duyệt), hệ thống tự động giật mở modal chiếm trọn màn hình. Hành vi bắt ép này bị các chuyên gia trải nghiệm người dùng xếp vào loại "User Hostile" (chống lại người dùng), gây cảm giác bực bội và làm tăng tỷ lệ thoát trang vĩnh viễn (bounce rate).

#### 3.2. Điều Hướng Cưỡng Bức Sai Ngữ Cảnh Trên Trang `/download`
- **Bằng chứng mã nguồn:** `src/app/download/page.tsx` (dòng 82, 91–97):
  ```tsx
  {/* Header logo link */}
  <Link href="/student" className="flex shrink-0 items-center gap-2.5">
    {/* ... */}
  </Link>
  {/* Right button */}
  <Link
    href="/student"
    className="hidden items-center gap-1.5 rounded-[11px] px-3 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted sm:inline-flex"
  >
    <ArrowLeft className="h-4 w-4" />
    Dashboard
  </Link>
  ```
- **Phân tích:** Khách vãng lai từ trang chủ bấm nút `Desktop` (tại `src/app/page.tsx:285`) để xem hướng dẫn cài đặt. Khi họ muốn quay lại trang chủ bằng cách click vào Logo LingoPro hoặc nút Back, hệ thống lại trỏ cứng về `/student`. Vì khách chưa đăng nhập, Next.js sẽ chuyển hướng họ sang `/auth`. Đây là một lỗi điều hướng cơ bản làm gián đoạn hành trình khám phá sản phẩm của khách hàng tiềm năng.

#### 3.3. Bố Cục Đóng Hộp Thô Cứng (Boxy Framing) Trên Trang `/for-teachers`
- **Bằng chứng mã nguồn:** `src/app/for-teachers/page.tsx` (dòng 264–266):
  ```tsx
  <div className="absolute -inset-5 rotate-3 rounded-[2rem] bg-[#d7ff64]" />
  <div className="relative rounded-[2rem] border border-[#17231d]/10 bg-[#17231d] p-5 text-white shadow-2xl sm:p-7">
  ```
- **Phân tích:** Việc sử dụng các góc bo quá lớn `rounded-[2rem]` đi kèm lớp nền phụ bị xoay nghiêng `rotate-3` màu xanh chanh neon tạo cảm giác nặng nề, thiếu tính công thái học và hoàn toàn đi ngược lại chuẩn mực thiết kế vuông vức, trang nhã của trường phái Technical Minimalist.

---

### TRỤ CỘT 4: AI QUÁ (Formulaic AI Templates, Gratuitous Gradients, Ambient Blobs, Fake CRO Dark Patterns, Buzzword Spam)

#### 4.1. Lạm Dụng Khối Cầu Sáng Đa Sắc (Ambient Glow Blobs) & Text Gradient 3 Điểm Vô Cớ
- **Bằng chứng mã nguồn:** `src/components/lead-magnet/LeadMagnetClient.tsx` (dòng 140–163):
  ```tsx
  {/* Glow ambient effects */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
    <div className="absolute top-40 right-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-3xl" />
  </div>

  <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-[1.15] text-slate-900">
    Bách Khoa Thực Chiến:<br />
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600">
      Sát Thủ Bài Nghe TOEIC
    </span>
  </h1>
  ```
- **Phân tích:** Các khối cầu mờ `blur-3xl` kích thước khổng lồ (300px – 700px) xếp chồng xanh/tím/ngọc kết hợp cùng văn bản gradient 3 màu chạy dài là dấu hiệu đặc trưng của việc tạo giao diện bằng công cụ AI (Prompting AI to generate landing page). Chúng làm giảm độ tương phản của chữ, gây giật lag khi cuộn trang trên điện thoại có GPU yếu và không mang lại bất kỳ giá trị thông tin nào cho người học.

#### 4.2. Mockup Bìa Sách 3D Nặng Nề & Số Liệu Đánh Giá Bịa Đặt
- **Bằng chứng mã nguồn:** `src/components/lead-magnet/BookCover3D.tsx` (dòng 56, 81–100):
  ```tsx
  {/* Huy hiệu nhảy nhót */}
  <div className="absolute -top-3 -right-3 ... animate-bounce [animation-duration:3s]">
    <span className="block text-[11px] font-extrabold text-slate-900">Trang Tinh Gọn</span>
  </div>

  {/* Khối đánh giá ảo */}
  <div className="flex -space-x-1.5">
    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 ...">H</div>
    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 ...">M</div>
    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 ...">T</div>
  </div>
  <span className="ml-1 font-bold text-slate-800 text-[11px]">4.9/5</span>
  <span className="text-[10px] text-slate-500">3,850+ thí sinh đã tải về</span>
  ```
- **Phân tích:** Mockup 3D đổ bóng rườm rà, huy hiệu nảy tưng tưng liên tục (`animate-bounce`), hàng avatar tròn viết tắt chữ cái hoa giả tạo cùng con số cố định `4.9/5` và `3,850+ thí sinh` là những chi tiết sáo rỗng thường thấy trên các trang phễu bán hàng kém chất lượng.

#### 4.3. Mã QR Thanh Toán Phí Cam Kết Với Số Tài Khoản Giả Mạo
- **Bằng chứng mã nguồn:** `src/components/challenge/ChallengeJoinModal.tsx` (dòng 56–63, 114):
  ```tsx
  const bankId = '970415' // Vietinbank as example
  const accountNo = '1111111111'
  const accountName = 'LINGOPRO'
  const amount = challenge.deposit_amount
  const description = `LINGOPRO ${challenge.slug}`.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '')

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`
  ```
  Đi kèm dòng thông báo:
  ```tsx
  <AlertDescription className="text-xs mt-1">
    Vui lòng nhập chính xác nội dung chuyển khoản. Hệ thống sẽ tự động xác nhận trong vòng 1-3 phút.
  </AlertDescription>
  ```
- **Phân tích:** Đây là rủi ro cực kỳ nghiêm trọng về mặt thanh toán và pháp lý. Khi học viên nghiêm túc quét mã để nộp tiền cam kết học tập, hệ thống lại đưa ra một số tài khoản giả `1111111111`. Nếu học sinh chuyển tiền thật, giao dịch sẽ lỗi hoặc thất thoát tài chính. Lời hứa "hệ thống tự động xác nhận sau 1-3 phút" là hoàn toàn sai sự thật vì chưa có webhook tích hợp thực tế tại modal này.

#### 4.4. Lạm Dụng Khẩu Hiệu Giật Tít, Tâng Bốc Sáo Rỗng (Copy Buzzword Inflation)
- **Bằng chứng mã nguồn:**
  - Tiêu đề tại `src/app/page.tsx:274`: `<Link href="/sat-thu-toeic-listening">🎧 Sát Thủ TOEIC</Link>`
  - Tiêu đề tại `src/app/lead-magnet/sat-thu-toeic-listening/page.tsx:5`: `"Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 & ETS 2026"`
  - Tiêu đề tại `LeadMagnetClient.tsx:154`: `"ẤN PHẨM KHẢO THÍ ĐỘC QUYỀN LINGOPRO 2026"`
  - Khẩu hiệu tại `LeadMagnetClient.tsx:167`: `"Bẻ gãy 15 bẫy sát thủ phòng thi, chinh phục 450+ đến 495 điểm tuyệt đối"`
- **Phân tích:** Vi phạm trực tiếp chỉ thị biên tập đã nêu trong `ORIGINAL_REQUEST.md`: Loại bỏ triệt để các khẩu hiệu giật tít, tâng bốc, giật gân ("sát thủ", "bẻ gãy bẫy", "tuyệt đối") để chuyển hóa toàn bộ nội dung sang văn phong học thuật, khoa học, điềm tĩnh và đáng tin cậy.

#### 4.5. Giả Lập Linh Vật Thương Hiệu Bằng Emoji Nhún Nhảy
- **Bằng chứng mã nguồn:** `src/components/gamification/Mascot.tsx` (dòng 5–31):
  ```tsx
  const MOODS: Record<MascotMood, { face: string; class: string }> = {
    happy:    { face: '😊', class: '' },
    cheer:    { face: '🥳', class: 'animate-bounce' },
    sleepy:   { face: '😴', class: '' },
    sad:      { face: '😢', class: '' },
    thinking: { face: '🤔', class: '' },
  };
  export function Mascot({ mood = 'happy', size = 'md', className = '' }: Props) {
    const { face, class: moodClass } = MOODS[mood];
    return <span role="img" aria-label={mood} className={`inline-block select-none ${SIZES[size]} ${moodClass} ${className}`}>{face}</span>;
  }
  ```
- **Phân tích:** Một component mang tên `Mascot` nhưng bên trong thực chất chỉ in ra các ký tự Emoji Unicode mặc định của hệ điều hành kèm class `animate-bounce`. Đây là cách đối phó sơ sài của template AI, gây mất thẩm mỹ và thiếu bản sắc nhận diện riêng.

---

## 3. Bảng Ma Trận Khiếm Khuyết (Defect Matrix)

| ID | Đường dẫn tệp | Thành phần | Trụ cột | Mức độ | Mô tả chi tiết khiếm khuyết | Dòng code |
|---|---|---|---|---|---|---|
| **MKT-01** | `src/components/challenge/ChallengeJoinModal.tsx` | `ChallengeJoinModal` | AI quá | **Critical** | Tạo mã VietQR với số tài khoản giả `1111111111` kèm cam kết xác nhận tự động 1-3 phút | 56–63, 114 |
| **MKT-02** | `src/app/page.tsx` vs `src/app/landing/page.tsx` | `LandingPage` vs `ReferoLandingMaster` | Thừa | **Critical** | Hai trang landing page độc lập cạnh tranh nhau, nút gài "Bản Mới 2026" chắp vá ở navbar | 267–270 (`page.tsx`) |
| **MKT-03** | `page.tsx`, `landing/`, `for-teachers/`, `nhan-qua/`, `privacy/` | Các layout chính | Xấu | **Critical** | Hỗn loạn 6 bảng màu đối nghịch (Vintage Be, Cool Slate, Xanh chanh neon, Đen Cyberpunk) | Toàn bộ tệp |
| **MKT-04** | `src/components/challenge-landing/UrgencyCountdown.tsx` & `ReferoCroModules.tsx` | `UrgencyCountdown` & `ReferoUrgencyCountdownBar` | Thừa / AI quá | **Major** | Trùng lặp hai bộ đồng hồ đếm ngược giả, cố định số lượng bịa đặt `43/50 bạn` và `86% slot` | 11–37, 52 (`UrgencyCountdown.tsx`) |
| **MKT-05** | `src/components/challenge-landing/FloatingSocialProof.tsx` & `ReferoCroModules.tsx` | `FloatingSocialProof` & `ReferoFloatingSocialProof` | Thừa / AI quá | **Major** | Trùng lặp hai bộ popup social proof giả lập 5 sinh viên đại học bắn liên tục mỗi 10 giây | 15–56 (`FloatingSocialProof.tsx`) |
| **MKT-06** | `src/components/challenge-landing/ChallengeInteractiveWrapper.tsx` | `ChallengeInteractiveWrapper` | Cứng ngắc | **Major** | Bắt sự kiện chuột `mouseleave` trên desktop (`clientY <= 8`) để bung modal chặn người dùng | 25–30 |
| **MKT-07** | `src/app/download/page.tsx` | `DownloadPage` | Cứng ngắc | **Major** | Nút logo và "Dashboard" trỏ cứng về `/student`, ép khách vãng lai chưa đăng nhập bị văng sang `/auth` | 82, 91–97 |
| **MKT-08** | `src/components/billing/WluWelcomeModal.tsx` | `WluWelcomeModal` | Xấu | **Major** | Modal production chứa văn bản trò chuyện nội bộ xuề xòa (`cho ace thôi nhé ạ <3`, `cho e xin 1 lượt PR`) | 71–82 |
| **MKT-09** | `src/app/nhan-qua/page.tsx` | `NhanQuaKhaiGiangPage` | Thừa | **Major** | Gần 200 dòng mã form chết bị vô hiệu hóa thủ công bằng `{false && !isSuccess ? ...}` | 179–370 |
| **MKT-10** | `src/components/lead-magnet/LeadMagnetClient.tsx` & `page.tsx` | `LeadMagnetClient` | AI quá | **Major** | Lạm dụng từ ngữ giật tít ("Sát Thủ", "Bách Khoa Thực Chiến", "15 bẫy sát thủ phòng thi", "Ấn phẩm độc quyền") | 154, 160–167 |
| **MKT-11** | `src/components/lead-magnet/LeadMagnetClient.tsx` | `LeadMagnetClient` | AI quá | **Minor** | 3 khối cầu sáng ambient khổng lồ (`blur-3xl`, 700px) và text gradient 3 màu | 140–162 |
| **MKT-12** | `src/components/lead-magnet/BookCover3D.tsx` | `BookCover3D` | AI quá | **Minor** | Mockup 3D đổ bóng cồng kềnh, badge nhún nhảy `animate-bounce`, cụm avatar và rating `4.9/5` giả | 55–107 |
| **MKT-13** | `src/app/for-teachers/page.tsx` | `ForTeachersPage` | Cứng ngắc | **Minor** | Thẻ card bo cong thô cứng `rounded-[2rem]` đi kèm khung phụ xoay nghiêng `rotate-3` màu xanh chanh | 264–266 |
| **MKT-14** | `src/components/gamification/Mascot.tsx` | `Mascot` | AI quá | **Minor** | Giả lập linh vật hời hợt bằng emoji Unicode nhún nhảy | 5–31 |
| **MKT-15** | `src/components/campaign/UpgradeGiftModal.tsx` | `UpgradeGiftModal` | Thừa | **Minor** | File stub rỗng 4 dòng trả về `null` không mục đích | 1–4 |
| **MKT-16** | `src/components/upsell/UpsellModal.tsx` | `UpsellModal` | Xấu | **Minor** | Tự định nghĩa hệ màu cát ấm riêng biệt (`#faf9f5`, `#e8e6dc`), lệch chuẩn Design Tokens | 146–186 |

---

## 4. Minh Chứng Mã Nguồn Cụ Thể (Source Code Evidence)

### 4.1. Minh Chứng VietQR Ảo Trong Giao Dịch Thật
**Đường dẫn:** `src/components/challenge/ChallengeJoinModal.tsx` (dòng 56–63):
```tsx
56:   const bankId = '970415' // Vietinbank as example
57:   const accountNo = '1111111111'
58:   const accountName = 'LINGOPRO'
59:   const amount = challenge.deposit_amount
60:   const description = `LINGOPRO ${challenge.slug}`.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '')
61:   
62:   const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`
```

### 4.2. Minh Chứng Trùng Lặp Giữa 2 Bộ Countdown Giả Mạo
**Đường dẫn:** `src/components/challenge-landing/UrgencyCountdown.tsx` (dòng 51–58):
```tsx
51:   <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
52:   <span className="hidden sm:inline">ĐỢT THỬ THÁCH THÁNG NÀY:</span> Bắt đầu học 00:00 ngày mai • Đã có <strong className="text-yellow-200 underline decoration-yellow-400">43/50 bạn</strong> giữ chỗ
53:   <span className="hidden md:inline-flex items-center gap-1.5 ml-2 bg-black/25 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-white/10">
54:     <span>86% đã đặt chỗ</span>
55:     <span className="w-14 h-1.5 bg-white/20 rounded-full overflow-hidden inline-block">
56:       <span className="block h-full bg-yellow-300 rounded-full w-[86%]"></span>
57:     </span>
58:   </span>
```
**Đối chiếu:** `src/components/landing/refero/ReferoCroModules.tsx` (dòng 56–66):
```tsx
56:   <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
57:   <span>
58:     <strong className="text-yellow-200">ĐỢT ƯU ĐÃI THÁNG NÀY:</strong> Đã có{' '}
59:     <u className="decoration-yellow-300 font-black">43/50 bạn</u> giữ chỗ VIP 0đ
60:   </span>
61:   <span className="hidden md:inline-flex items-center gap-1 ml-2 bg-black/20 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-white/20">
62:     <span>86% slot</span>
63:     <span className="w-12 h-1.5 bg-white/30 rounded-full inline-block overflow-hidden">
64:       <span className="block h-full bg-yellow-300 w-[86%]" />
65:     </span>
66:   </span>
```

### 4.3. Minh Chứng Bẫy Thoát Màn Hình (Exit-Intent Trap)
**Đường dẫn:** `src/components/challenge-landing/ChallengeInteractiveWrapper.tsx` (dòng 25–36):
```tsx
25:     const handleMouseLeave = (e: MouseEvent) => {
26:       if (e.clientY <= 8 && !hasTriggeredExit && !isModalOpen) {
27:         hasTriggeredExit = true;
28:         sessionStorage.setItem('challenge_lead_seen', 'true');
29:         setIsModalOpen(true);
30:       }
31:     };
32: 
33:     document.addEventListener('mouseleave', handleMouseLeave);
34:     return () => {
35:       document.removeEventListener('mouseleave', handleMouseLeave);
36:     };
```

### 4.4. Minh Chứng Nút Back Trên Trang Download Bị Sai Ngữ Cảnh
**Đường dẫn:** `src/app/download/page.tsx` (dòng 82, 91–97):
```tsx
82:   <Link href="/student" className="flex shrink-0 items-center gap-2.5">
...
91:   <Link
92:     href="/student"
93:     className="hidden items-center gap-1.5 rounded-[11px] px-3 py-2 text-sm font-bold text-[#525a68] transition-colors hover:bg-muted sm:inline-flex"
94:   >
95:     <ArrowLeft className="h-4 w-4" />
96:     Dashboard
97:   </Link>
```

### 4.5. Minh Chứng Gần 200 Dòng Mã Chết Trong Form Nhận Quà
**Đường dẫn:** `src/app/nhan-qua/page.tsx` (dòng 179–185):
```tsx
179:   {false && !isSuccess ? (
180:     <form
181:       onSubmit={handleSubmit}
182:       className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5"
183:     >
184:       <div className="border-b border-slate-800 pb-3">
185:         <h2 className="text-lg font-bold text-white flex items-center gap-2">
```

---

## 5. Kế Hoạch Khắc Phục Hành Động (Actionable Fixes & Code Samples)

Lộ trình khắc phục được phân bổ thành 3 giai đoạn rõ ràng:

---

### GIAI ĐOẠN 1: QUICK WINS (Thực hiện ngay trong 24 giờ)

#### 1. Loại Bỏ Hoàn Toàn Các Dark Patterns Giả Lập & Bẫy Rời Chuột
- **Hành động:**
  - Xóa bỏ `FloatingSocialProof.tsx` và `ReferoFloatingSocialProof`.
  - Xóa bỏ thanh đếm ngược giả `UrgencyCountdown.tsx` và `ReferoUrgencyCountdownBar`.
  - Gỡ bỏ `document.addEventListener('mouseleave')` trong `ChallengeInteractiveWrapper.tsx`.
- **Mã nguồn khắc phục cho `ChallengeInteractiveWrapper.tsx`:**
```tsx
// File: src/components/challenge-landing/ChallengeInteractiveWrapper.tsx
'use client';

import React, { useState } from 'react';
import { ChallengeHeader } from './ChallengeHeader';
import { LeadMagnetModal } from './LeadMagnetModal';
import { StickyMobileCta } from './StickyMobileCta';

interface ChallengeInteractiveWrapperProps {
  children: React.ReactNode;
}

export function ChallengeInteractiveWrapper({ children }: ChallengeInteractiveWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openLeadModal = () => setIsModalOpen(true);
  const closeLeadModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Giữ lại Navigation sạch sẽ, loại bỏ UrgencyCountdown và FloatingSocialProof */}
      <ChallengeHeader onOpenLeadModal={openLeadModal} />

      <div
        onClick={(e) => {
          const target = (e.target as HTMLElement).closest('[data-trigger="lead-modal"]');
          if (target) {
            e.preventDefault();
            openLeadModal();
          }
        }}
      >
        {children}
      </div>

      <StickyMobileCta onOpenLeadModal={openLeadModal} />
      <LeadMagnetModal isOpen={isModalOpen} onClose={closeLeadModal} />
    </>
  );
}
```

#### 2. Dọn Dẹp Các Tệp Rác & Dead Code
- Xóa tệp `src/components/campaign/UpgradeGiftModal.tsx`.
- Trong `src/app/nhan-qua/page.tsx`, xóa bỏ toàn bộ khối JSX chết bị bọc bởi `{false && !isSuccess ? ...}` (dòng 179–370) cùng với các state và hàm xử lý `handleSubmit` không còn dùng đến.
- Sửa nút Back trên `src/app/download/page.tsx` thành:
```tsx
// Trỏ về trang chủ '/' thay vì ép buộc '/student'
<Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
  <ArrowLeft className="h-4 w-4" /> Về trang chủ
</Link>
```

#### 3. Chuẩn Hóa Văn Bản Trong `WluWelcomeModal.tsx`
- **Mã nguồn khắc phục:**
```tsx
// File: src/components/billing/WluWelcomeModal.tsx (dòng 70–83)
<div className="space-y-4 text-left text-sm sm:text-base leading-relaxed text-slate-200">
  <p>
    Xin chào bạn! Chúc mừng bạn đã kích hoạt thành công quyền lợi tài khoản đối tác học tập WLU trên LingoPro.
  </p>

  <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3.5 text-indigo-200 font-medium text-center text-xs sm:text-sm">
    Tài khoản của bạn đã được nâng cấp đầy đủ các quyền lợi học tập và ôn luyện cá nhân hóa FSRS.
  </div>

  <p className="text-center text-xs text-slate-400">
    Nếu cần hỗ trợ kỹ thuật trong quá trình học tập, vui lòng liên hệ đội ngũ cố vấn học tập của chúng tôi.
  </p>
</div>
```

---

### GIAI ĐOẠN 2: STRUCTURAL CHANGES (Tái cấu trúc giao diện trong 1–2 tuần)

#### 1. Hợp Nhất 2 Trang Landing Page Về 1 Tuyến Đường Duy Nhất
- **Kế hoạch hành động:**
  - Giữ `src/app/page.tsx` làm Canonical Landing Page duy nhất.
  - Chuyển giao các tính năng có giá trị từ Refero (như bảng so sánh tính năng trực quan, FAQ có cấu trúc) sang `src/app/page.tsx`.
  - Cấu hình chuyển hướng vĩnh viễn (301 Redirect) từ `/landing` về `/` trong `next.config.ts`.
  - Xóa bỏ nút badge "Bản Mới 2026" gây rối mắt trên thanh header của `page.tsx`.
- **Cấu hình Redirect trong `next.config.ts`:**
```typescript
async redirects() {
  return [
    {
      source: '/landing',
      destination: '/',
      permanent: true,
    },
    {
      source: '/khaigiang',
      destination: '/',
      permanent: true,
    },
  ];
}
```

#### 2. Xử Lý An Toàn Modal Thanh Toán VietQR
- **Kế hoạch hành động:**
  - Nếu tính năng "Thử thách có cam kết tiền cọc" chưa sẵn sàng backend kiểm tra giao dịch tự động: Tạm thời vô hiệu hóa nút nạp tiền và thay thế bằng nút "Đăng ký nhận thông báo đợt thử thách tiếp theo".
  - Nếu đưa vào vận hành thật: Chuyển toàn bộ thông tin ngân hàng sang biến môi trường (`NEXT_PUBLIC_PAYMENT_BANK_ID`, `NEXT_PUBLIC_PAYMENT_ACCOUNT_NO`) và tích hợp SePay/Cassie webhook kiểm tra số dư thực tế, tuyệt đối không dùng tài khoản giả `1111111111`.

---

### GIAI ĐOẠN 3: POLISH & TECHNICAL MINIMALIST ALIGNMENT (Tinh chỉnh chuẩn mực)

#### 1. Thống Nhất Màu Sắc & Loại Bỏ Visual Shock
- Đồng bộ toàn bộ các trang công khai (`/privacy`, `/terms`, `/for-teachers`, `/challenge-landing`) về chung nền sáng tiêu chuẩn (`bg-background` hoặc nền trắng tối giản), loại bỏ nền đen tối sầm `slate-950` gây sốc thị giác.
- Chuẩn hóa typography theo đúng chỉ số của Design Tokens (`--font-sans`).

#### 2. Thanh Lọc Ngôn Phong Truyền Thông (Editorial Purity)
- Thay thế toàn bộ các từ ngữ giật gân, tâng bốc theo bảng chuyển đổi chuẩn:

| Cụm từ cũ (Giật tít / AI Prompt) | Cụm từ mới (Chuẩn mực Sư phạm Technical Minimalist) |
|---|---|
| "Sát Thủ Bài Nghe TOEIC" | "Cẩm Nang Chiến Lược Bài Nghe TOEIC" |
| "Bách Khoa Thực Chiến" | "Tài Liệu Khảo Thí & Phân Tích Thực Tế" |
| "Bẻ gãy 15 bẫy sát thủ phòng thi" | "Phân Tích 15 Dạng Bẫy Thường Gặp Trong Đề ETS" |
| "ẤN PHẨM KHẢO THÍ ĐỘC QUYỀN LINGOPRO 2026" | "Tài Liệu Hướng Dẫn Ôn Thi TOEIC 2026" |
| "Chinh phục 450+ đến 495 điểm tuyệt đối" | "Tối Ưu Phản Xạ Để Hướng Tới Mục Tiêu 450+ Listening" |

#### 3. Loại Bỏ Khối Cầu Sáng Ambient & Thay Thế Mascot Bằng Biểu Tượng Chuẩn
- Xóa các div chứa `blur-3xl` và gradient đa sắc.
- Thay thế component `Mascot.tsx` bằng biểu tượng SVG chuyên nghiệp hoặc lược bỏ hoàn toàn để giữ vững phong cách tối giản kỹ thuật (Technical Minimalist).
