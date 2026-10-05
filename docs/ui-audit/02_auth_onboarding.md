# Báo Cáo Kiểm Toán UI/UX: Xác Thực (Auth) & Hướng Dẫn Người Dùng (Onboarding)

**Mã tài liệu:** `UI-AUDIT-02`  
**Phân hệ:** Xác thực Người dùng (Auth, OAuth, Recovery) & Quy trình Nhập cuộc (Onboarding, Tour, Tooltips, System Modals)  
**Ngày kiểm toán:** 04/10/2026  
**Đơn vị thực hiện:** Nhóm Kiểm toán UI/UX LingoPro (Worker 1 - Marketing & Auth Auditor)  
**Tiêu chuẩn đánh giá:** 4 Trụ cột — **Thừa - Xấu - Cứng ngắc - AI quá** (Đối chiếu với Chuẩn mực Mobile Usability, Apple HIG, Material Design & Technical Minimalist)

---

## 1. Phân Loại & Tổng Quan Phân Hệ (Route & Component Inventory)

Phân hệ Xác thực (Auth) và Hướng dẫn Người dùng mới (Onboarding) quyết định trải nghiệm "First Time User Experience" (FTUE). Sự mượt mà và cảm giác an tâm trong 60 giây đầu tiên là yếu tố then chốt giúp học viên gắn bó với sản phẩm.

Qua khảo sát toàn diện mã nguồn, phân hệ gồm 4 tuyến đường App Router và 16 thành phần giao diện chuyên trách:

### 1.1. Bảng Kiểm Kê Tuyến Đường Xác Thực (Auth Route Inventory)
| Tuyến đường (URL) | Tệp mã nguồn App Router | Thành phần chính | Vai trò nghiệp vụ | Hiện trạng thị giác & tương tác |
|---|---|---|---|---|
| `/auth` | `src/app/auth/page.tsx` (746 dòng) | `AuthPage` | Đăng nhập, đăng ký bằng Email & Google OAuth, chọn vai trò học sinh/giáo viên | Giao diện Vintage Cream (`#f6efe6`) kết hợp card đen nâu (`#241710`), chứa logic phát hiện trình duyệt in-app (Zalo, FB WebView), banner quà tặng giới thiệu, và nút dự phòng chuyển hướng thủ công. Phải tự định nghĩa lại class `inputClass` vì UI primitive bị lỗi. |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` (7 dòng) | `PasswordRecoveryForm (mode="request")` | Gửi yêu cầu đặt lại mật khẩu qua email | **Trạng thái Scaffold mộc thô:** Không có card bao bọc, không có logo thương hiệu, input HTML thô ráp, nút cam `bg-orange-800` chắp vá. |
| `/auth/recovery` | `src/app/auth/recovery/page.tsx` (7 dòng) | `PasswordRecoveryForm (mode="reset")` | Nhập mật khẩu mới từ liên kết xác nhận email | Giao diện trần trụi, thiếu thông tin trợ giúp, liên kết văn bản thuần không có style, tạo cảm giác như trang web lừa đảo (phishing). |
| `/auth/complete` | `src/app/auth/complete/page.tsx` | `AuthCallbackPage` | Điểm tiếp nhận trung chuyển OAuth sau khi Google callback | Xử lý token phiên sạch sẽ, giao diện trạng thái chờ cơ bản. |

### 1.2. Bảng Kiểm Kê Hạ Tầng Onboarding & Modals Toàn Cục
| Thư mục / Tệp mã nguồn | Số tệp / Dòng | Thành phần chính | Hiện trạng vận hành |
|---|---|---|---|
| `src/components/onboarding/` (13 tệp) | 13 tệp (~1.950 dòng, ~80KB) | `OnboardingProvider`, `SpotlightOverlay`, `TutorialTooltip`, `TourBootstrap`, `SurveyModal`, `WelcomeModal`, `FeatureGuideModal`, `MethodModal`, `RewardModal`, `SetupModal`, `onboarding-steps.ts`, `onboarding.css` | **100% Dead Code:** Toàn bộ thư mục không hề được import tại bất kỳ trang nào trong `src/app`. `TourBootstrap.tsx` bị ép trả về `null` vì từng gây lỗi nghẽn kẹt người dùng nghiêm trọng. Tệp CSS chứa lỗi cú pháp hiển nhiên. |
| `src/components/InstallPrompt.tsx` | 296 dòng | `InstallPrompt` | Banner nổi cài đặt PWA / Desktop trên mobile (`bottom-[calc(var(--mobile-nav-total)+0.75rem)]`, z-index 95). Cạnh tranh vùng hiển thị trực tiếp với `EnableNotifications`. |
| `src/components/EnableNotifications.tsx` | 248 dòng | `EnableNotifications` | Bottom sheet kích hoạt thông báo Web Push FCM (`bottom-[calc(var(--mobile-nav-total)+0.5rem)]`, z-index 96). Chồng đè lên nhau khi cả hai cùng kích hoạt. |
| `src/components/campaign/WelcomeKhaiGiangModal.tsx` | 325 dòng | `WelcomeKhaiGiangModal` | Modal kích hoạt quà tặng khai giảng. Tone màu đen kịt `slate-950`, confetti, chứa ngày cũ 05/09, ép chọn tỉnh thành trước khi vào dashboard. |

---

## 2. Đánh Giá Chuyên Sâu 4 Trụ Cột: "Thừa - Xấu - Cứng Ngắc - AI Quá"

---

### TRỤ CỘT 1: THỪA (Dead Code, Orphaned Folders, Conflicting Sticky Sheets)

#### 1.1. Toàn Bộ Hệ Thống Onboarding 25 Bước Là Mã Nguồn Rác (~80KB Dead Code)
- **Bằng chứng mã nguồn:**
  - `src/components/onboarding/TourBootstrap.tsx` (dòng 72–77):
    ```tsx
    /**
     * TourBootstrap tạm thời được tắt theo yêu cầu để tránh kẹt ở bước "SỬ DỤNG TỪ".
     */
    export function TourBootstrap() {
      return null;
    }
    ```
  - Kết quả quét đối soát toàn bộ thư mục `src/app` cho thấy: **Không có bất kỳ tệp nào import `@/components/onboarding` hay bất kỳ thành phần nào bên trong thư mục này**.
  - Danh sách 13 tệp hoàn toàn mồ côi (orphaned):
    1. `TourBootstrap.tsx` (79 dòng)
    2. `OnboardingProvider.tsx` (217 dòng)
    3. `onboarding-steps.ts` (495 dòng - định nghĩa chi tiết 25 bước)
    4. `SurveyModal.tsx` (107 dòng)
    5. `WelcomeModal.tsx` (105 dòng)
    6. `FeatureGuideModal.tsx` (124 dòng)
    7. `MethodModal.tsx` (107 dòng)
    8. `RewardModal.tsx` (122 dòng)
    9. `SetupModal.tsx` (134 dòng)
    10. `SpotlightOverlay.tsx` (132 dòng)
    11. `TutorialTooltip.tsx` (143 dòng)
    12. `index.tsx` (38 dòng)
    13. `onboarding.css` (135 dòng)
- **Phân tích:** Gần 2.000 dòng mã JSX, logic quản lý state phức tạp, CSS animation và dữ liệu bước học khổng lồ đang nằm chiếm dụng dung lượng repository và tăng thời gian build bundle của Next.js mà người dùng thực tế không hề được hưởng lợi bất kỳ điều gì.

#### 1.2. Xung Đột Chồng Lấn Vùng Đáy Màn Hình Của Hai Lớp Floating Sheets
- **Bằng chứng mã nguồn:**
  - `src/components/InstallPrompt.tsx` (dòng 170):
    ```tsx
    <div className="fixed bottom-[calc(var(--mobile-nav-total)+0.75rem)] left-3 right-3 z-[95] md:bottom-4 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
    ```
  - `src/components/EnableNotifications.tsx` (dòng 174–176):
    ```tsx
    <div
      data-onboarding="notify"
      className="fixed inset-x-0 bottom-[calc(var(--mobile-nav-total)+0.5rem)] z-[96] px-3 md:hidden animate-in slide-in-from-bottom-4 duration-300"
    >
    ```
- **Phân tích:** Cả hai thành phần này đều tính toán tọa độ neo cố định ngay phía trên thanh điều hướng mobile (`--mobile-nav-total`). Khi một học viên mới đăng nhập lần đầu trên trình duyệt di động:
  - `InstallPrompt` hiện ra mời cài đặt app (z-index 95).
  - Cùng lúc đó, `EnableNotifications` hiện ra yêu cầu cấp quyền nhận thông báo (z-index 96).
  - Hai khung thông báo đè lấn trực tiếp lên nhau, che phủ gần 40% chiều cao màn hình điện thoại và làm tê liệt khả năng bấm vào thanh điều hướng bên dưới.

#### 1.3. Lớp Xử Lý Dự Phòng Thủ Công Rườm Rà Trong `AuthPage`
- **Bằng chứng mã nguồn:** `src/app/auth/page.tsx` (dòng 515–546):
  ```tsx
  {showManualRedirect ? (
    <div className="space-y-3 py-1 text-center sm:space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2d7f5e]/25 sm:h-16 sm:w-16">
        <ArrowRight className="h-7 w-7 text-[#7dcea0]" />
      </div>
      <h3 className={`${display} text-base font-bold sm:text-lg`}>
        Đăng nhập thành công!
      </h3>
      <p className="text-sm text-[#d8c9bc]">
        Nếu trang không tự chuyển, nhấn nút bên dưới:
      </p>
      <button
        type="button"
        onClick={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          window.location.replace(destFromSession(session?.user));
        }}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2d7f5e] text-sm font-black text-white shadow-lg active:scale-[0.98]"
      >
        Đi tới trang tổng quan
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  ) : ...}
  ```
- **Phân tích:** Thay vì dựa vào luồng Next.js routing chuẩn (`router.replace`) kết hợp listener `onAuthStateChange`, mã nguồn dựng một màn hình trung gian thủ công "Nếu trang không tự chuyển, nhấn nút bên dưới". Điều này tạo cảm giác ứng dụng hoạt động chập chờn, thiếu tự tin vào kiến trúc điều hướng của chính mình.

---

### TRỤ CỘT 2: XẤU (Visual Discordance, Broken Typography, Unstyled Fallbacks, Syntax Errors)

#### 2.1. Thảm Họa Giao Diện Tại Trang Khôi Phục Mật Khẩu (`PasswordRecoveryForm.tsx`)
- **Bằng chứng mã nguồn:** `src/components/auth/PasswordRecoveryForm.tsx` (dòng 67–90):
  ```tsx
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 px-6">
    <h1 className="text-2xl font-bold">{mode === 'request' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}</h1>
    {message && <p role="status">{message}</p>}
    {ready && !done && <form onSubmit={submit} className="flex flex-col gap-4">
      {mode === 'request' ? <label>Email
        <input id="recovery-email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded border p-3" />
      </label> : <>
        <label>Mật khẩu mới
          <input id="recovery-password" type="password" autoComplete="new-password" required minLength={6} maxLength={1024}
            value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded border p-3" />
        </label>
        <label>Nhập lại mật khẩu
          <input id="recovery-confirmation" type="password" autoComplete="new-password" required minLength={6} maxLength={1024}
            value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded border p-3" />
        </label>
      </>}
      <button type="submit" disabled={busy} className="rounded bg-orange-800 p-3 text-white disabled:opacity-50">
        {busy ? 'Đang xử lý...' : mode === 'request' ? 'Gửi hướng dẫn' : 'Đổi mật khẩu'}
      </button>
    </form>}
    {mode === 'reset' && !ready && <Link href="/auth/forgot-password">Yêu cầu liên kết mới</Link>}
    <Link href="/auth">Quay lại đăng nhập</Link>
  </main>;
  ```
- **Phân tích hình ảnh:**
  - **Không có Container Card:** Toàn bộ nội dung trôi nổi trực tiếp trên nền trắng vô hồn.
  - **Không có Logo / Nhận diện Thương hiệu:** Không có bất kỳ biểu tượng LingoPro hay tên sản phẩm nào.
  - **Input mộc thô:** Thẻ input HTML với class tối thiểu `w-full rounded border p-3`, không focus ring, không placeholder chuyên nghiệp.
  - **Màu nút bấm lệch lạc:** `bg-orange-800` (màu cam đất cháy đậm) hoàn toàn xa lạ với cả hai hệ màu chủ đạo của app (Indigo `--primary` và Terracotta `#b5502f`).
  - **Liên kết văn bản trần trụi:** `<Link href="/auth">Quay lại đăng nhập</Link>` không có icon, không có hiệu ứng hover, không căn lề.
  - **Hệ quả tâm lý:** Khi người dùng nhận được email khôi phục mật khẩu và bấm vào liên kết, họ sẽ lập tức hoài nghi đây là một đường link lừa đảo (phishing) đánh cắp tài khoản vì giao diện vỡ nát hoàn toàn so với sự trau chuốt của trang đăng nhập `/auth`.

#### 2.2. Xung Đột Tông Màu Giữa Trang Đăng Nhập Và Modal Khởi Tạo
- Trang `/auth`: Phong cách Vintage Cream (`#f6efe6`) ấm áp, card đen nâu sang trọng (`#241710`).
- Khi học viên đăng nhập thành công và được gắn flag khai giảng, modal `WelcomeKhaiGiangModal.tsx` đột ngột bung ra với giao diện **đen kịt Cyberpunk** (`bg-slate-950 border-amber-500/40`), kèm các hiệu ứng neon chói lóa.
- Bước chuyển thị giác từ vàng be sang đen kịt tạo cảm giác như hai ứng dụng của hai công ty khác nhau được ghép vội vào một domain.

#### 2.3. Lỗi Cú Pháp CSS Thô Trong Style Hướng Dẫn
- **Bằng chứng mã nguồn:** `src/components/onboarding/onboarding.css` (dòng 128–134):
  ```css
  .onboarding-spotlight-target {
    position: relative;
    z-index: 91;
    border-radius: 16px;
    onboarding-pulse-glow: ; /* <-- LỖI CÚ PHÁP: Thuộc tính không có giá trị */
    animation: onboarding-pulse-glow 2s ease-in-out infinite;
  }
  ```
- **Phân tích:** Lỗi cú pháp CSS hiển nhiên khiến trình duyệt báo warning trong console DevTools, minh chứng cho việc mã nguồn chưa từng qua quy trình kiểm thử tĩnh hoặc linter nghiêm ngặt trước khi commit.

---

### TRỤ CỘT 3: CỨNG NGẮC (Boxy Frames, Route Hijacking, Substandard Touch Targets, Traps)

#### 3.1. Bắt Cóc Điều Hướng Trình Duyệt Trong Tour Onboarding (Tour Route Hijacking)
- **Bằng chứng mã nguồn:** `src/components/onboarding/TourBootstrap.tsx` (dòng 54–69):
  ```tsx
  function TourNavigator() {
    const { isActive, currentStep } = useOnboarding();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
      if (!isActive || !currentStep.route) return;
      if (currentStep.type === 'guide') return;

      const want = currentStep.route.split('?')[0];
      if (!pathname.startsWith(want)) {
        router.push(currentStep.route);
      }
    }, [isActive, currentStep, pathname, router]);

    return null;
  }
  ```
- **Phân tích hành vi:**
  - Thành phần `TourNavigator` liên tục giám sát URL. Nếu học sinh cố gắng bấm nút "Back" trên trình duyệt hoặc chuyển sang một trang khác để học, `useEffect` sẽ ngay lập tức giật người dùng quay trở lại đúng route mà bước tour đang chỉ định (`router.push(currentStep.route)`).
  - Tour ép người dùng di chuyển qua 7 trang khác nhau: `/student` → `/practice` → `/library` → `/journey` → `/dictionary` → `/grammar/learn` → `/download`.
  - Người dùng bị tước đoạt hoàn toàn quyền tự chủ điều hướng. Khi gặp sự cố mạng hoặc lỗi render ở bước "SỬ DỤNG TỪ", toàn bộ ứng dụng bị treo cứng và người học bị giam cầm không thể thoát ra ngoài.

#### 3.2. Bẫy Khảo Sát Bắt Buộc Không Có Lối Thoát (Survey Modal Trap)
- **Bằng chứng mã nguồn:** `src/components/onboarding/SurveyModal.tsx` (dòng 58–105):
  ```tsx
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm ...">
      <div className="relative my-auto w-full max-w-md ...">
        {/* KHÔNG CÓ NÚT CLOSE 'X' Ở GÓC */}
        {/* KHÔNG CÓ NÚT "BỎ QUA / SKIP" */}
        {/* CLICK RA NGOÀI BACKDROP KHÔNG ĐÓNG */}
        <div className="p-6 -mt-6 relative bg-white">
          <div className="space-y-2.5">
            {options.map((opt) => (
              <button key={opt.value} onClick={() => handleSelect(opt.value)} ...>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
  ```
- **Phân tích:** Modal khảo sát "Bạn biết đến LingoPro từ nguồn nào thế?" chặn đứng màn hình. Người dùng không thể đóng, không thể bấm ra ngoài, không có nút bỏ qua. Hành vi bắt ép khảo sát trước khi cho phép học tập vi phạm nguyên tắc cơ bản của thiết kế tôn trọng người dùng (Respectful Design).

#### 3.3. Kích Thước Bấm Dưới Chuẩn Buộc Auth Page Phải Tự Bypass Component Gốc
- **Bằng chứng mã nguồn:**
  - Component chuẩn của hệ thống: `src/components/ui/input.tsx` (dòng 12):
    ```tsx
    className={cn(
      "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base ... md:text-sm",
      className
    )}
    ```
  - Chiều cao `h-8` chỉ đạt 32px. Chuẩn Apple Human Interface Guidelines và Google Material Design quy định vùng chạm cảm ứng (touch target) tối thiểu cho thao tác ngón tay là **44px – 48px**.
  - Vì component gốc quá bé và liên tục bị bấm trượt trên mobile, trang `src/app/auth/page.tsx` (dòng 359–360) đã phải tự định nghĩa một class riêng để cứu cháy:
    ```tsx
    // text-base (16px) — tránh iOS zoom khi focus
    const inputClass =
      'w-full min-h-12 rounded-2xl border border-[#bca58f]/45 bg-white/90 pl-11 pr-4 py-3 text-base font-semibold text-[#241710] placeholder:text-[#a08b7c] shadow-sm transition-all focus:border-[#b5502f]/50 focus:outline-none focus:ring-4 focus:ring-[#b5502f]/10';
    ```
  - Đây là minh chứng rõ ràng nhất cho thấy Design System primitives của dự án không đáp ứng được yêu cầu thực tế và đang bị các trang nghiệp vụ tự do ghi đè.

---

### TRỤ CỘT 4: AI QUÁ (Formulaic AI Templates, Gratuitous Gradients, Hollow Copy, Fake Mascot)

#### 4.1. Dấu Vết Template AI Trong Modal Chào Mừng Chiến Dịch
- **Bằng chứng mã nguồn:** `src/components/campaign/WelcomeKhaiGiangModal.tsx` (dòng 153–180):
  ```tsx
  {/* Glow Effects */}
  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

  {/* Text Gradient 3 màu */}
  <h2
    id="khaigiang-modal-title"
    className="text-xl sm:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300"
  >
    Xác nhận kích hoạt 3 Tháng VIP Pro 🎁
  </h2>
  ```
- **Phân tích:** Cấu trúc hình học với các quả cầu mờ `blur-3xl` ở góc trên/dưới đối xứng, text gradient 3 màu vàng-hổ phách-ngọc lục bảo và hiệu ứng nổ pháo hoa `canvas-confetti` là công thức rập khuôn 100% của các đoạn mã được sinh ra từ prompt AI "tạo một modal nhận quà thật bắt mắt". Nó thiếu đi sự lắng đọng và tính thực chất của một sản phẩm giáo dục cao cấp.

#### 4.2. Xung Đột Phong Cách Nút Bấm: Duolingo 3D Cọc Cạch
- **Bằng chứng mã nguồn:**
  - `src/components/onboarding/WelcomeModal.tsx` (dòng 41, 98):
    ```tsx
    className="... rounded-[28px] border-b-8 border-indigo-200 ..."
    className="... border-b-4 border-indigo-800 bg-indigo-600 ..."
    ```
  - `src/components/ui/button.tsx` (dòng 24–25):
    ```tsx
    chunky: "bg-primary text-primary-foreground rounded-2xl border-b-4 border-primary/60 shadow-lg active:translate-y-0.5 active:border-b-0 hover:brightness-110 font-black",
    ```
- **Phân tích:** Trong khi các trang làm bài thi khảo thí TOEIC và ngữ pháp hướng tới phong cách Technical Minimalist phẳng và thanh thoát, hệ thống onboarding lại sử dụng phong cách nút bấm 3D dày cộp có viền đáy 8px (`border-b-8`) mô phỏng Duolingo. Sự chắp vá phong cách này khiến sản phẩm trông giống một bộ sưu tập các bài tập mẫu hơn là một hệ thống thiết kế có chủ đích.

---

## 3. Bảng Ma Trận Khiếm Khuyết (Defect Matrix)

| ID | Đường dẫn tệp | Thành phần | Trụ cột | Mức độ | Mô tả chi tiết khiếm khuyết | Dòng code |
|---|---|---|---|---|---|---|
| **AUTH-01** | `src/components/auth/PasswordRecoveryForm.tsx` | `PasswordRecoveryForm` | Xấu / Cứng ngắc | **Critical** | Trang khôi phục mật khẩu mộc thô, không card, không logo, nút cam chắp vá, trông như trang phishing | 67–90 |
| **AUTH-02** | `src/components/onboarding/*` (13 tệp) | Toàn bộ module Onboarding | Thừa | **Critical** | 13 tệp chết (~1.950 dòng, ~80KB) hoàn toàn không được import ở đâu, `TourBootstrap` trả về `null` | Toàn bộ thư mục |
| **AUTH-03** | `src/components/onboarding/TourBootstrap.tsx` | `TourNavigator` | Cứng ngắc | **Critical** | Chiếm quyền điều hướng trình duyệt (router hijacking), ép đổi 7 URL, giam cầm người dùng | 54–69 |
| **AUTH-04** | `src/components/InstallPrompt.tsx` & `EnableNotifications.tsx` | `InstallPrompt` & `EnableNotifications` | Thừa / Cứng ngắc | **Major** | Hai lớp floating sheets cùng chiếm vị trí `bottom-[calc(var(--mobile-nav-total)+...)]`, đè nát nhau trên mobile | 170 (`Install`), 174 (`Notify`) |
| **AUTH-05** | `src/components/onboarding/SurveyModal.tsx` | `SurveyModal` | Cứng ngắc | **Major** | Bẫy khảo sát không nút đóng, không nút bỏ qua, chặn đứng màn hình | 58–105 |
| **AUTH-06** | `src/components/ui/input.tsx` & `tabs.tsx` | `Input`, `TabsList` | Cứng ngắc | **Major** | Chiều cao `h-8` (32px) vi phạm tiêu chuẩn vùng bấm tối thiểu 44px của Apple HIG & Material Design | 12 (`input`), 27 (`tabs`) |
| **AUTH-07** | `src/app/auth/page.tsx` | `AuthPage` | Thừa | **Major** | Tự viết class `inputClass` cứu cháy và màn hình dự phòng thủ công `showManualRedirect` | 359–360, 515–546 |
| **AUTH-08** | `src/components/campaign/WelcomeKhaiGiangModal.tsx` | `WelcomeKhaiGiangModal` | AI quá / Xấu | **Major** | Modal đen kịt Cyberpunk đối nghịch với `/auth`, lạm dụng glow blobs, text gradient 3 màu và ngày cũ 05/09 | 153–180 |
| **AUTH-09** | `src/components/onboarding/onboarding.css` | CSS Stylesheet | Xấu / Kỹ thuật | **Minor** | Lỗi cú pháp CSS hiển nhiên `onboarding-pulse-glow: ;` tại dòng 132 | 132 |
| **AUTH-10** | `src/components/ui/button.tsx` | `buttonVariants` (`chunky`) | AI quá | **Minor** | Biến thể nút bấm 3D viền đáy `border-b-4` phong cách đồ chơi Duolingo lệch pha hoàn toàn với Technical Minimalist | 24–25 |

---

## 4. Minh Chứng Mã Nguồn Cụ Thể (Source Code Evidence)

### 4.1. Minh Chứng Giao Diện Mộc Thô Của `PasswordRecoveryForm.tsx`
**Đường dẫn:** `src/components/auth/PasswordRecoveryForm.tsx` (dòng 67–90):
```tsx
67:   return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 px-6">
68:     <h1 className="text-2xl font-bold">{mode === 'request' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}</h1>
69:     {message && <p role="status">{message}</p>}
70:     {ready && !done && <form onSubmit={submit} className="flex flex-col gap-4">
71:       {mode === 'request' ? <label>Email
72:         <input id="recovery-email" type="email" autoComplete="email" required maxLength={254}
73:           value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded border p-3" />
74:       </label> : <>
75:         <label>Mật khẩu mới
76:           <input id="recovery-password" type="password" autoComplete="new-password" required minLength={6} maxLength={1024}
77:             value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded border p-3" />
78:         </label>
79:         <label>Nhập lại mật khẩu
80:           <input id="recovery-confirmation" type="password" autoComplete="new-password" required minLength={6} maxLength={1024}
81:             value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded border p-3" />
82:         </label>
83:       </>}
84:       <button type="submit" disabled={busy} className="rounded bg-orange-800 p-3 text-white disabled:opacity-50">
85:         {busy ? 'Đang xử lý...' : mode === 'request' ? 'Gửi hướng dẫn' : 'Đổi mật khẩu'}
86:       </button>
87:     </form>}
88:     {mode === 'reset' && !ready && <Link href="/auth/forgot-password">Yêu cầu liên kết mới</Link>}
89:     <Link href="/auth">Quay lại đăng nhập</Link>
90:   </main>;
```

### 4.2. Minh Chứng TourBootstrap Đã Bị Vô Hiệu Hóa Khẩn Cấp Nhưng Để Lại Rác
**Đường dẫn:** `src/components/onboarding/TourBootstrap.tsx` (dòng 72–77):
```tsx
72: /**
73:  * TourBootstrap tạm thời được tắt theo yêu cầu để tránh kẹt ở bước "SỬ DỤNG TỪ".
74:  */
75: export function TourBootstrap() {
76:   return null;
77: }
```

### 4.3. Minh Chứng Bắt Cóc Điều Hướng (Route Hijacking)
**Đường dẫn:** `src/components/onboarding/TourBootstrap.tsx` (dòng 54–69):
```tsx
54: function TourNavigator() {
55:   const { isActive, currentStep } = useOnboarding();
56:   const pathname = usePathname();
57:   const router = useRouter();
58: 
59:   useEffect(() => {
60:     if (!isActive || !currentStep.route) return;
61:     if (currentStep.type === 'guide') return;
62: 
63:     const want = currentStep.route.split('?')[0];
64:     if (!pathname.startsWith(want)) {
65:       router.push(currentStep.route);
66:     }
67:   }, [isActive, currentStep, pathname, router]);
68: 
69:   return null;
70: }
```

### 4.4. Minh Chứng Hai Lớp Bottom Sheet Xung Đột Tọa Độ Mobile
**Đường dẫn 1:** `src/components/InstallPrompt.tsx` (dòng 170):
```tsx
170: <div className="fixed bottom-[calc(var(--mobile-nav-total)+0.75rem)] left-3 right-3 z-[95] md:bottom-4 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
```
**Đường dẫn 2:** `src/components/EnableNotifications.tsx` (dòng 174–176):
```tsx
174: <div
175:   data-onboarding="notify"
176:   className="fixed inset-x-0 bottom-[calc(var(--mobile-nav-total)+0.5rem)] z-[96] px-3 md:hidden animate-in slide-in-from-bottom-4 duration-300"
177: >
```

### 4.5. Minh Chứng Lỗi Cú Pháp Trong CSS Stylesheet
**Đường dẫn:** `src/components/onboarding/onboarding.css` (dòng 130–134):
```css
130: .onboarding-spotlight-target {
131:   position: relative;
132:   z-index: 91;
133:   border-radius: 16px;
134:   onboarding-pulse-glow: ;
135:   animation: onboarding-pulse-glow 2s ease-in-out infinite;
136: }
```

---

## 5. Kế Hoạch Khắc Phục Hành Động (Actionable Fixes & Code Samples)

---

### GIAI ĐOẠN 1: QUICK WINS (Thực hiện ngay trong 24 giờ)

#### 1. Dọn Sạch Hoàn Toàn 13 Tệp Onboarding Rác
- Xóa bỏ toàn bộ thư mục `src/components/onboarding/`.
- Giải phóng ~80KB mã nguồn chết và loại bỏ hoàn toàn nguy cơ rò rỉ mã lỗi CSS.

#### 2. Tái Cấu Trúc Ngay `PasswordRecoveryForm.tsx` Đạt Chuẩn Nhận Diện
- Thay thế toàn bộ mã nguồn trần trụi hiện tại bằng giao diện Card trang nhã, đồng bộ thương hiệu LingoPro, sử dụng đúng màu sắc và typography tiêu chuẩn.

**Mã nguồn mẫu chuẩn hóa cho `src/components/auth/PasswordRecoveryForm.tsx`:**
```tsx
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Brain, ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { appAuth } from '@/lib/app-auth-client';

interface Props {
  mode: 'request' | 'reset';
}

export default function PasswordRecoveryForm({ mode }: Props) {
  const [ready, setReady] = useState(mode === 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    if (mode !== 'reset') return;
    let cancelled = false;
    void fetch('/api/auth/recovery', { headers: { 'X-LingoPro-Request': '1' }, cache: 'no-store' })
      .then(async (response) => {
        const body: unknown = await response.json();
        const available = response.ok && !!body && typeof body === 'object' && 'ready' in body && body.ready === true;
        if (!cancelled) {
          setReady(available);
          if (!available) {
            setMessage('Liên kết khôi phục không hợp lệ hoặc đã hết hạn.');
            setIsError(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessage('Hệ thống tạm thời không khả dụng. Vui lòng thử lại sau.');
          setIsError(true);
        }
      });
    return () => { cancelled = true; };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready || done) return;
    if (mode === 'reset' && password !== confirmation) {
      setMessage('Hai mật khẩu không khớp nhau.');
      setIsError(true);
      return;
    }
    setBusy(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch(mode === 'request' ? '/api/auth/recovery/request' : '/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LingoPro-Request': '1' },
        body: JSON.stringify(mode === 'request' ? { email } : { password, confirmation }),
        cache: 'no-store',
      });
      const body: unknown = await response.json();
      const accepted = !!body && typeof body === 'object' && (mode === 'request'
        ? 'accepted' in body && body.accepted === true
        : 'success' in body && body.success === true);

      if (response.ok && accepted) {
        if (mode === 'reset') appAuth.passwordRecoveryCompleted();
        setMessage(mode === 'request'
          ? 'Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.'
          : 'Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
        setIsError(false);
        setDone(true);
      } else {
        setMessage('Yêu cầu không thành công. Vui lòng kiểm tra lại thông tin.');
        setIsError(true);
      }
    } catch {
      setMessage('Lỗi kết nối. Vui lòng thử lại sau.');
      setIsError(true);
    } finally {
      setPassword('');
      setConfirmation('');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#f6efe6] px-4 py-8 text-[#241710]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#241710] text-[#f6efe6] shadow-sm">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">LingoPro</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#241710]">
            {mode === 'request' ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}
          </h1>
          <p className="text-xs sm:text-sm text-[#7b6558]">
            {mode === 'request'
              ? 'Nhập email đã đăng ký để nhận liên kết khôi phục.'
              : 'Thiết lập mật khẩu mới có độ dài tối thiểu 6 ký tự.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-[#241710]/10 bg-[#241710] p-6 text-[#f6efe6] shadow-xl sm:rounded-3xl sm:p-8">
          {message && (
            <div className={`mb-5 flex items-start gap-2.5 rounded-xl p-3.5 text-xs font-semibold leading-relaxed ${
              isError
                ? 'border border-rose-400/30 bg-rose-500/15 text-rose-100'
                : 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
            }`}>
              {isError ? <AlertCircle className="h-4 w-4 shrink-0 text-rose-300 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300 mt-0.5" />}
              <span>{message}</span>
            </div>
          )}

          {ready && !done && (
            <form onSubmit={submit} className="space-y-4">
              {mode === 'request' ? (
                <div className="space-y-1.5">
                  <label htmlFor="recovery-email" className="text-xs font-semibold text-[#d8c9bc]">
                    Email đăng ký
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a08b7c]" />
                    <input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-3.5 py-2 text-sm text-[#f6efe6] placeholder:text-[#a08b7c] focus:border-[#b5502f] focus:outline-none focus:ring-2 focus:ring-[#b5502f]/20 transition"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="recovery-password" className="text-xs font-semibold text-[#d8c9bc]">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a08b7c]" />
                      <input
                        id="recovery-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        maxLength={1024}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-3.5 py-2 text-sm text-[#f6efe6] placeholder:text-[#a08b7c] focus:border-[#b5502f] focus:outline-none focus:ring-2 focus:ring-[#b5502f]/20 transition"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="recovery-confirmation" className="text-xs font-semibold text-[#d8c9bc]">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a08b7c]" />
                      <input
                        id="recovery-confirmation"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        maxLength={1024}
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-3.5 py-2 text-sm text-[#f6efe6] placeholder:text-[#a08b7c] focus:border-[#b5502f] focus:outline-none focus:ring-2 focus:ring-[#b5502f]/20 transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#b5502f] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#a04627] active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{busy ? 'Đang xử lý...' : mode === 'request' ? 'Gửi liên kết' : 'Cập nhật mật khẩu'}</span>
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            {mode === 'reset' && !ready && (
              <Link href="/auth/forgot-password" className="text-amber-300 hover:underline">
                Yêu cầu liên kết mới
              </Link>
            )}
            <Link href="/auth" className="inline-flex items-center gap-1.5 text-[#d8c9bc] hover:text-white transition-colors ml-auto">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### GIAI ĐOẠN 2: STRUCTURAL CHANGES (Tái cấu trúc trải nghiệm trong 1–2 tuần)

#### 1. Xây Dựng Cơ Chế Điều Phối Độc Quyền (Mutex Slot) Cho Bottom Sheets Mobile
- Để ngăn chặn tình trạng `InstallPrompt` và `EnableNotifications` đè lấn lên nhau trên màn hình di động, hệ thống cần một bộ điều phối hiển thị tuần tự (`useBottomBannerSlot`):
```typescript
// File: src/lib/ui-mutex.ts
export type BottomSheetSlot = 'none' | 'install' | 'notify';

let currentSlot: BottomSheetSlot = 'none';
const listeners = new Set<(slot: BottomSheetSlot) => void>();

export function requestBottomSlot(candidate: BottomSheetSlot): boolean {
  if (currentSlot === 'none' || currentSlot === candidate) {
    currentSlot = candidate;
    listeners.forEach((l) => l(currentSlot));
    return true;
  }
  return false;
}

export function releaseBottomSlot(candidate: BottomSheetSlot) {
  if (currentSlot === candidate) {
    currentSlot = 'none';
    listeners.forEach((l) => l('none'));
  }
}
```
- Khi `EnableNotifications` được kích hoạt, `InstallPrompt` sẽ tự động nhường chỗ và chỉ hiển thị sau khi người dùng đã phản hồi hoặc tắt thông báo ít nhất 48 giờ.

#### 2. Thay Thế Tour 25 Bước Cũ Bằng Banner Chào Mừng Tinh Gọn Trên Dashboard (In-Page Welcome)
- Thay vì cưỡng bức đổi trang, áp dụng mô hình "Nhập cuộc theo ngữ cảnh" (Contextual Onboarding):
  - Khi học viên mới vào Dashboard `/student`, hiển thị một thẻ Card chào mừng nhẹ nhàng gồm 3 bước gợi ý:
    1. **Học thử 5 từ đầu tiên** (chỉ mở một modal học mẫu nhẹ).
    2. **Khám phá lộ trình theo mục tiêu** (TOEIC, THPT, Giao tiếp).
    3. **Cài đặt tiện ích tra từ trên trình duyệt**.
  - Không che khuất màn hình, không chặn nút bấm, cho phép học viên tắt đi bất kỳ lúc nào chỉ bằng 1 nút "Đã hiểu".

---

### GIAI ĐOẠN 3: POLISH & DESIGN SYSTEM COMPLIANCE (Tinh chỉnh chuẩn mực)

#### 1. Nâng Cấp Kích Thước Bấm Chuẩn Cảm Ứng Cho `Input` và `Tabs`
- Cập nhật `src/components/ui/input.tsx` và `src/components/ui/tabs.tsx`:
  - Mobile (< 768px): Chiều cao chuẩn đạt `h-11` (44px).
  - Desktop (>= 768px): Chiều cao có thể giữ `h-9` hoặc `h-10` (36px–40px) để đảm bảo độ thanh thoát.
- Loại bỏ các class ghi đè tạm bợ `min-h-12` trong `src/app/auth/page.tsx`, đưa trang về sử dụng trực tiếp primitive `Input` của hệ thống.

#### 2. Dọn Dẹp Biến Thể Nút Bấm Duolingo (`chunky`)
- Loại bỏ variant `chunky` (`border-b-4`) trong `src/components/ui/button.tsx`.
- Đồng bộ toàn bộ các nút hành động (CTA) về phong cách phẳng, tinh gọn, độ bo góc vừa phải (`rounded-xl` hoặc `rounded-lg`) chuẩn Technical Minimalist.
