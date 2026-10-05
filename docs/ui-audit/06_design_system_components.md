# Báo Cáo Kiểm Toán Toàn Diện UI/UX — Hệ Thống Thiết Kế, Tokens & Thành Phần Dùng Chung
**Mã tài liệu:** `docs/ui-audit/06_design_system_components.md`  
**Phân hệ kiểm toán:** Design System Primitives (`src/components/ui/`) | Tailwind CSS Tokens & `globals.css` | Touch Ergonomics & Apple HIG Compliance | Shared Feedback & Gamification Widgets  
**Kiểm toán viên:** Worker 2 (Study, Exam & Design System Auditor)  
**Tiêu chuẩn đối chiếu:** Apple Human Interface Guidelines (44px Minimum Touch Targets), Material Design 3 (48px Touch Targets), WCAG 2.1 AA Contrast Ratio (4.5:1 text, 3:1 UI controls), W3C Base UI Architecture, và Triết lý Technical Minimalist.  
**Ngày hoàn thiện:** 2026-10-04  

---

## 1. Phân Loại & Tổng Quan Phân Hệ (Design System & Primitives Inventory)

Hệ thống thiết kế (Design System) của LingoPro được xây dựng dựa trên ngăn xếp công nghệ: **Next.js App Router**, **Tailwind CSS v4** (`@import "tailwindcss"; @import "shadcn/tailwind.css"`), và thư viện nền tảng không giao diện **@base-ui/react** (cùng với Radix/Base primitives) kết hợp định nghĩa màu hiện đại **OKLCH** trong `src/app/globals.css`.

Tuy nhiên, qua kiểm toán trực tiếp toàn bộ 48 tệp trong `src/components/ui/` và các token nền tảng, chúng tôi phát hiện hệ thống thiết kế đang bị **phân mảnh nghiêm trọng giữa lý thuyết token và thực thi thực tế**. Nhiều thành phần gốc vi phạm quy chuẩn công thái học cơ bản trên thiết bị di động, nhập sai thư viện tiện ích, hoặc bị các trang nghiệp vụ tự do ghi đè (override) vô tổ chức.

### 1.1. Danh Mục Kiểm Kê Các Thành Phần Gốc (Design System Primitives Inventory)

| STT | Tệp Thành Phần (File Path) | Component Lõi | Vai Trò Kiến Trúc | Tình Trạng Kỹ Thuật & Vấn Đề Phát Hiện |
|:---:|---|---|---|---|
| 1 | `src/app/globals.css` | OKLCH Design Tokens | Nguồn sự thật (Source of Truth) về màu sắc và spacing | Định nghĩa Indigo sống động làm `--primary`, nhưng hầu hết các trang Landing/Marketing và Phễu tự đặt màu riêng biệt, phớt lờ token này. |
| 2 | `src/components/ui/input.tsx` | `Input` (Base UI) | Khung nhập liệu văn bản toàn app | **Lỗi công thái học nghiêm trọng**: Ép cứng chiều cao `h-8` (32px), vi phạm tiêu chuẩn 44px của Apple HIG. Các trang như `/auth` phải tự viết class cứu cháy `min-h-12`. |
| 3 | `src/components/ui/tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger` | Bộ chuyển đổi tab nội dung | `TabsList` bị ép cứng chiều cao `h-8` (32px), gây chật chội và khó bấm trúng trên màn hình cảm ứng di động. |
| 4 | `src/components/ui/button.tsx` | `Button`, `buttonVariants` | Nút bấm thao tác chính | Chứa biến thể `chunky` phong cách Duolingo 3D (`rounded-2xl border-b-4`) lệch pha hoàn toàn với ngôn ngữ phẳng của shadcn và exam engines. |
| 5 | `src/components/ui/progress.tsx` | `Progress`, `ProgressTrack` | Thanh hiển thị tiến độ học tập | Thanh `ProgressTrack` có chiều cao `h-1` (4px) mỏng manh như sợi chỉ, rất khó nhận biết trên màn hình điện thoại độ phân giải cao. |
| 6 | `src/components/ui/alert.tsx` | `Alert`, `AlertTitle`, `AlertDescription` | Hộp thông báo trạng thái | **Lỗi nhập khẩu (Import Bug)**: `import { cn } from "cn"` từ thư viện bên ngoài thay vì `@/lib/utils`, làm mất khả năng hợp nhất class `tailwind-merge`. |
| 7 | `src/components/ui/checkbox.tsx` | `Checkbox` (Base UI) | Hộp kiểm lựa chọn | **Lỗi nhập khẩu (Import Bug)**: Tiếp tục bị `import { cn } from "cn"` từ npm, tiềm ẩn nguy cơ xung đột class giao diện ngầm. |
| 8 | `src/components/ui/sonner.tsx` | `Toaster` (Sonner) | Trình hiển thị thông báo toast nổi | Khai báo class ảo `toast: "cn-toast"` không hề tồn tại trong bất kỳ tệp CSS nào của dự án. |
| 9 | `src/components/ui/WordCardSkeleton.tsx` | `WordCardSkeleton` | Khung xương tải thẻ từ vựng | **Sai phân vùng kiến trúc**: Component nghiệp vụ học từ vựng đặc thù bị ném vào thư mục `ui/` nguyên thủy; gán cứng `bg-white rounded-2xl` thiếu dark mode. |
| 10 | `src/components/campaign/UpgradeGiftModal.tsx` | `UpgradeGiftModal` | Modal quà tặng nâng cấp | **Mã rác (Dead Stub)**: Tệp 4 dòng chỉ trả về `return null;`, gây nhiễu cấu trúc codebase. |
| 11 | `src/components/gamification/Mascot.tsx` | `Mascot` | Linh vật động viên học tập | Chỉ là một thẻ bọc ký tự Emoji (`😊`, `🥳`) kèm hiệu ứng nảy `animate-bounce` sơ sài. |
| 12 | `src/components/gamification/DailyGoalRing.tsx` | `DailyGoalRing` | Vòng tiến độ mục tiêu ngày | Dùng màu cố định ngoài token hệ thống, kích thước vòng vẽ SVG thiếu responsive. |

---

## 2. Đánh Giá Chuyên Sâu 4 Trụ Cột: "Thừa - Xấu - Cứng Ngắc - AI Quá"

---

### 2.1. PILLAR 1: THỪA (Redundancy, Dead Code, Misplaced Domain Components & Ghost Classes)

#### 🔴 1.1. Thành Phần Nghiệp Vụ Bị Bỏ Quên Trong Thư Mục Primitives Nguyên Thủy
Trong cấu trúc thiết kế chuẩn của shadcn/ui, thư mục `src/components/ui/` là vùng đất độc quyền dành cho các **nguyên mẫu vô tri thức nghiệp vụ (dumb primitives)**: `button.tsx`, `dialog.tsx`, `input.tsx`, `dropdown-menu.tsx`.
Tuy nhiên, tệp `src/components/ui/WordCardSkeleton.tsx` (40 dòng mã) lại tồn tại ở đây:
```tsx
// Code Evidence: src/components/ui/WordCardSkeleton.tsx:9-25
function WordCardSkeletonItem() {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header: word + badge */}
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      {/* Translation */}
      <Skeleton className="h-4 w-full rounded" />
...
```
*Phân tích:* `WordCardSkeleton` chứa cấu trúc đặc thù của một thẻ từ vựng LingoPro (từ vựng, phiên âm IPA, huy hiệu thuộc tính, nút âm thanh). Đặt tệp này vào `src/components/ui/` làm ô nhiễm thư viện thành phần dùng chung và vi phạm nguyên lý tách biệt mối bận tâm (Separation of Concerns). Tệp này cần được chuyển về đúng thư mục `src/components/student/` hoặc `src/components/study/`.

#### 🔴 1.2. Stub Rỗng Vô Nghĩa Chiếm Chỗ Trong Dự Án
Tại `src/components/campaign/UpgradeGiftModal.tsx`:
```tsx
// Toàn bộ tệp 4 dòng:
export function UpgradeGiftModal() {
  return null;
}
```
Component này là tàn dư của một chiến dịch khuyến mãi cũ đã kết thúc. Nó không còn logic, không hiển thị gì nhưng vẫn nằm trong mã nguồn, khiến các lập trình viên khác khi tìm kiếm modal nâng cấp bị nhầm lẫn.

#### 🔴 1.3. Tham Chiếu Class CSS Ảo (Ghost CSS Class) Trong Toaster
Tại `src/components/ui/sonner.tsx:40-42`:
```tsx
toastOptions={{
  classNames: {
    toast: "cn-toast",
  },
}}
```
Sau khi quét toàn bộ mã nguồn của dự án (cả trong `globals.css`, `tailwind.css` và các file SCSS/CSS cục bộ), chuỗi class `cn-toast` **hoàn toàn không tồn tại ở bất kỳ đâu**. Đây là tàn tích sao chép từ một hướng dẫn cũ trên mạng, không mang lại bất kỳ hiệu ứng style nào nhưng tạo ra sự khó hiểu khi debug CSS.

---

### 2.2. PILLAR 2: XẤU (Visual Discordance, Token Bypass, Broken Contrast & Needle Progress)

#### 🟠 2.1. Token Nền Tảng Bị Phớt Lờ: Hỗn Loạn Màu Sắc Giữa Các Phân Hệ
Tại `src/app/globals.css:74`, dự án xác lập token màu sắc nhận diện thương hiệu chuẩn:
```css
--primary: oklch(0.511 0.262 276.966); /* Indigo sống động hiện đại */
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
```
Tuy nhiên, thay vì sử dụng lớp tiện ích Tailwind chuẩn `bg-primary`, `text-primary-foreground`, các màn hình lại tự tiện định nghĩa các màu sắc đối kháng:
1. **Trang chủ (`src/app/page.tsx`):** Dùng màu be cổ điển `#f6efe6`, chữ nâu đậm `#241710`, viền `#bca58f`, nút cam cháy `#b5502f`.
2. **Trang Landing Refero (`src/app/landing/page.tsx`):** Dùng màu xám lạnh Cool Slate `#f8fafc`, nút xanh dương `bg-blue-600`.
3. **Trang For-Teachers (`src/app/for-teachers/page.tsx`):** Dùng nền xanh rêu `#f7f8f2` và màu chanh dạ quang `#d7ff64`.
4. **Trang Nhận Quà / Khai Giảng (`src/app/nhan-qua/page.tsx`):** Dùng nền tối Cyberpunk `slate-950` và tím sẫm `indigo-950`.

*Hậu quả thị giác:* Hệ thống thiết kế của ứng dụng bị "vỡ trận". Khi một người dùng bấm từ trang chủ (vàng be) vào trang Đăng nhập (vàng be), rồi chuyển sang Dashboard (trắng/indigo), rồi bấm vào Luyện thi TOEIC (slate/đen), họ có cảm giác như đang sử dụng 4 trang web của 4 công ty hoàn toàn khác nhau được ghép vội lại.

#### 🟠 2.2. Thanh Tiến Độ Mỏng Như Sợi Chỉ (Needle Progress Bar)
Tại `src/components/ui/progress.tsx:29-39`:
```tsx
function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}
```
Chiều cao `h-1` tương đương vỏn vẹn **4 pixel**. Trên các màn hình di động độ phân giải cao (Retina, OLED 120Hz), thanh tiến độ 4px này trông như một sợi chỉ mờ nhạt. Khi giá trị tiến độ tăng (ví dụ học 3/10 từ), người dùng cực kỳ khó quan sát sự thay đổi của thanh này, làm mất đi hoàn toàn cảm giác khích lệ thị giác (visual reward) vốn là cốt lõi của ứng dụng học tập.

#### 🟠 2.3. Khuyết Tật Dark Mode Trong `WordCardSkeleton`
Tại `src/components/ui/WordCardSkeleton.tsx:9`:
```tsx
<div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
```
Component này áp đặt cứng `bg-white` mà không hề có `dark:bg-slate-900` hay dùng token chuẩn `bg-card text-card-foreground`. Khi ứng dụng bật Dark Mode và dữ liệu đang tải, màn hình bỗng nhiên lóe sáng trắng rực rỡ với các khối skeleton màu xám, tạo nên trải nghiệm cực kỳ nhức mắt cho người dùng học bài vào ban đêm.

---

### 2.3. PILLAR 3: CỨNG NGẮC (Rigidity, Substandard Touch Targets & Import Defects)

#### 🟡 3.1. Vi Phạm Nghiêm Trọng Chuẩn Vùng Bấm Apple HIG (32px vs 44px)
Đây là **khiếm khuyết công thái học nghiêm trọng nhất** của hệ thống giao diện:
- **`src/components/ui/input.tsx:11-14`**:
  ```tsx
  className={cn(
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none ... md:text-sm",
    className
  )}
  ```
- **`src/components/ui/tabs.tsx:26-27`**:
  ```tsx
  const tabsListVariants = cva(
    "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 ..."
  )
  ```

*Tiêu chuẩn đối chiếu:*
- **Apple Human Interface Guidelines (Touch & Gestures):** Vùng chạm tối thiểu trên màn hình cảm ứng là **44 x 44 pt** để ngón tay cái có thể tiếp xúc thoải mái mà không bấm trượt.
- **Google Material Design 3:** Vùng tương tác khuyến nghị tối thiểu là **48 x 48 dp**.

*Thực tế trong LingoPro:* `Input` và `TabsList` bị ép cứng chiều cao `h-8` (tương đương **32 pixel**). Kết quả là trên điện thoại di động:
1. Thí sinh gõ bàn phím ảo bấm trượt ô nhập liệu liên tục.
2. Để tự cứu mình, trang Đăng nhập (`src/app/auth/page.tsx:327`) đã buộc phải bỏ rơi component `Input` gốc và tự viết class đè:
   ```tsx
   const inputClass = 'w-full min-h-12 rounded-2xl border border-slate-200 ...'; // 48px
   ```
3. Nút bấm `Button` (`src/components/ui/button.tsx:29`) trên mobile lại có kích thước mặc định là `h-11` (44px). Việc nút bấm cao 44px trong khi ô input cao 32px khiến mọi form nhập liệu có nút Submit đứng cạnh Input bị lệch trục dọc một cách thô thiển.

#### 🟡 3.2. Lỗi Nhập Khẩu Thư Viện Tiện Ích `cn` (Tailwind Merge Defect)
Trong hai component thiết yếu:
- `src/components/ui/alert.tsx:3`: `import { cn } from "cn"`
- `src/components/ui/checkbox.tsx:4`: `import { cn } from "cn"`

Trong toàn bộ dự án LingoPro, hàm `cn` chuẩn được định nghĩa tại `src/lib/utils.ts` bằng cách kết hợp `clsx` và `tailwind-merge`:
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Tuy nhiên, `alert.tsx` và `checkbox.tsx` lại import từ gói npm `"cn"`. Gói này chỉ là hàm nối chuỗi đơn giản, **hoàn toàn không có thuật toán giải quyết xung đột class của Tailwind CSS**.
*Hậu quả tiềm ẩn:* Khi lập trình viên truyền `className="p-4"` vào một thẻ `Alert` (đã có sẵn class mặc định `px-2.5 py-2`), gói `cn` từ npm sẽ giữ nguyên cả hai class `px-2.5 py-2 p-4` trong DOM. Thứ tự áp dụng CSS lúc này phụ thuộc hoàn toàn vào vị trí xuất hiện trong file CSS bundle thay vì class ghi đè, dẫn đến lỗi vỡ giao diện ngẫu nhiên và khó lường.

#### 🟡 3.3. Xung Đột Hình Học: Nút Đồ Chơi 3D Duolingo Đối Kháng Với Giao Diện Phẳng
Tại `src/components/ui/button.tsx:24-25`:
```tsx
chunky:
  "bg-primary text-primary-foreground rounded-2xl border-b-4 border-primary/60 shadow-lg active:translate-y-0.5 active:border-b-0 hover:brightness-110 font-black",
```
Biến thể `chunky` là kiểu nút bấm dày cộm, có viền đáy 4px (`border-b-4`) mô phỏng nút đồ chơi 3D của Duolingo. Nút này được dùng tùy tiện ở một số chỗ như màn hình kết quả THPT (`src/app/thpt/[type]/[ref]/page.tsx:135`) và Onboarding cũ. Khi đặt cạnh các bảng biểu phẳng, viền mảnh tinh tế của hệ thống thi TOEIC hay Grammar, sự xuất hiện của nút 3D này tạo cảm giác chắp vá, thiếu nhất quán trong ngôn ngữ thiết kế.

---

### 2.4. PILLAR 4: AI QUÁ (Formulaic AI Tropes & Superficial Widget Templates)

#### 🟣 4.1. "Linh Vật" Đại Diện Chỉ Là Emoji Nhún Nhảy
Tại `src/components/gamification/Mascot.tsx:5-32`:
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
  return (
    <span
      role="img"
      aria-label={mood}
      className={`inline-block select-none ${SIZES[size]} ${moodClass} ${className}`}
    >
      {face}
    </span>
  );
}
```
*Phân tích:* Component được đặt tên hoa mỹ là `Mascot` (Linh vật thương hiệu), nhưng bên trong chỉ là một thẻ `<span>` bọc ký tự Emoji Unicode đơn điệu (`😊`, `🥳`, `😴`) kèm class `animate-bounce` co giật liên tục. Đây là sản phẩm kinh điển sinh ra khi lập trình viên prompt AI: *"Hãy tạo cho tôi một Mascot giống Duolingo cho app học tiếng Anh"*, và AI đã sinh ra một giải pháp đối phó sơ sài nhất có thể.

---

## 3. Bảng Ma Trận Khiếm Khuyết Hệ Thống Thiết Kế (Defect Matrix)

| ID | Đường Dẫn Tệp (File Path) | Thành Phần (Component) | Trụ Cột (Pillar) | Mức Độ | Dòng Mã | Mô Tả Khiếm Khuyết Chi Tiết |
|:---:|---|---|:---:|:---:|:---:|---|
| **D6-01** | `src/components/ui/input.tsx` | `Input` | **Cứng ngắc** | **Critical** | 11–14 | Ép cứng chiều cao `h-8` (32px) vi phạm nghiêm trọng chuẩn Apple HIG 44px; gây bấm trượt trên mobile. |
| **D6-02** | `src/components/ui/tabs.tsx` | `TabsList` | **Cứng ngắc** | **Major** | 27 | Ép cứng chiều cao ngang `group-data-horizontal/tabs:h-8` (32px), gây chật chội và khó bấm trên cảm ứng. |
| **D6-03** | `src/components/ui/alert.tsx` | `Alert` | **Cứng ngắc** / **Kỹ thuật** | **Major** | 3 | Import sai thư viện tiện ích: `import { cn } from "cn"` thay vì `@/lib/utils`, mất khả năng hợp nhất class Tailwind. |
| **D6-04** | `src/components/ui/checkbox.tsx` | `Checkbox` | **Cứng ngắc** / **Kỹ thuật** | **Major** | 4 | Import sai thư viện tiện ích: `import { cn } from "cn"` thay vì `@/lib/utils`. |
| **D6-05** | `src/app/globals.css` | Token `--primary` | **Xấu** | **Major** | 74 | Token chuẩn Indigo bị bỏ rơi; các trang tự do dùng màu be `#f6efe6`, xám Cool Slate `#f8fafc`, xanh chanh `#d7ff64`. |
| **D6-06** | `src/components/ui/progress.tsx` | `ProgressTrack` | **Xấu** | **Medium** | 31–38 | Chiều cao thanh tiến độ chỉ dày 4px (`h-1`), gần như vô hình trên màn hình điện thoại độ nét cao. |
| **D6-07** | `src/components/ui/WordCardSkeleton.tsx` | `WordCardSkeleton` | **Thừa** / **Xấu** | **Medium** | Toàn bộ 40 dòng | Component nghiệp vụ thẻ từ vựng bị đặt nhầm vào thư mục `ui/` nguyên thủy; gán cứng `bg-white` làm hỏng dark mode. |
| **D6-08** | `src/components/ui/button.tsx` | `buttonVariants` (`chunky`) | **Xấu** / **Cứng ngắc** | **Medium** | 24–25 | Biến thể nút đồ chơi Duolingo 3D (`rounded-2xl border-b-4`) xung đột với phong cách phẳng của ứng dụng. |
| **D6-09** | `src/components/campaign/UpgradeGiftModal.tsx` | `UpgradeGiftModal` | **Thừa** | **Minor** | 1–4 | Tệp stub rỗng 4 dòng chỉ trả về `return null;`, gây nhiễu cấu trúc mã nguồn. |
| **D6-10** | `src/components/ui/sonner.tsx` | `Toaster` | **Thừa** / **Kỹ thuật** | **Minor** | 41 | Tham chiếu class CSS ảo `cn-toast` không hề tồn tại trong dự án. |
| **D6-11** | `src/components/gamification/Mascot.tsx` | `Mascot` | **AI quá** | **Minor** | 5–32 | Giả lập linh vật bằng cách bọc Emoji Unicode vào hiệu ứng giật `animate-bounce` sơ sài. |

---

## 4. Minh Chứng Mã Nguồn Cụ Thể (Code Evidence & Line Inspections)

### 4.1. Minh Chứng Vi Phạm Chiều Cao Vùng Bấm 32px Trong `input.tsx`
**Tệp:** `src/components/ui/input.tsx` (Dòng 6–18)
```tsx
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}
```
*Ghi nhận:* Chiều cao `h-8` (32px) là quá nhỏ cho ngón tay người dùng. So sánh với `button.tsx:30` nơi nút bấm có kích thước `h-11` (44px) trên mobile, hai thành phần này hoàn toàn cọc cạch khi đứng cạnh nhau.

### 4.2. Minh Chứng Lỗi Import Tiện Ích `cn` Từ Gói NPM Ngoài
**Tệp 1:** `src/components/ui/alert.tsx` (Dòng 1–4)
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
```
**Tệp 2:** `src/components/ui/checkbox.tsx` (Dòng 1–6)
```tsx
"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"
```
*Ghi nhận:* Tất cả các tệp shadcn khác đều sử dụng `import { cn } from "@/lib/utils"`. Việc import trực tiếp từ `"cn"` gây mất tính năng lọc trùng class của `tailwind-merge`.

### 4.3. Minh Chứng Thanh Tiến Độ 4px Mỏng Manh
**Tệp:** `src/components/ui/progress.tsx` (Dòng 29–39)
```tsx
function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}
```
*Ghi nhận:* `h-1` chỉ dày 4px, khiến thanh tiến độ gần như chìm vào nền và không tạo được ấn tượng thị giác cho việc học tập.

### 4.4. Minh Chứng Nút Bấm Duolingo 3D Lệch Chuẩn
**Tệp:** `src/components/ui/button.tsx` (Dòng 23–26)
```tsx
        link: "text-primary underline-offset-4 hover:underline",
        chunky:
          "bg-primary text-primary-foreground rounded-2xl border-b-4 border-primary/60 shadow-lg active:translate-y-0.5 active:border-b-0 hover:brightness-110 font-black",
      },
```
*Ghi nhận:* Nút bấm kiểu 3D đồ chơi (`border-b-4`, `active:translate-y-0.5`) phá vỡ hoàn toàn định hướng Technical Minimalist và không thuộc về bộ quy chuẩn thiết kế phẳng hiện đại của ứng dụng.

---

## 5. Kế Hoạch Khắc Phục Hành Động (Actionable Remediation Plan)

---

### Giai Đoạn 1: Quick Wins (Sửa Lỗi Kỹ Thuật & Cứu Nguy Cảm Ứng Trong 1 Ngày)

#### 1. Nâng Chiều Cao `Input` và `TabsList` Lên Chuẩn Apple HIG (44px Mobile / 36px Desktop)
- **Mục tiêu:** Chấm dứt tình trạng bấm trượt ô nhập liệu và tab trên điện thoại.
- **Giải pháp:** Cập nhật `src/components/ui/input.tsx` và `src/components/ui/tabs.tsx`. Áp dụng responsive: trên mobile đạt chiều cao tối thiểu `h-11` (44px) với padding thoải mái, từ màn hình `md:` trở lên thu gọn về `md:h-9` (36px).

```tsx
// Code Sửa Mẫu: src/components/ui/input.tsx:11-15
// TRƯỚC:
className={cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none ... md:text-sm",
  className
)}

// SAU (Chuẩn Apple HIG 44px trên Mobile, thanh thoát 36px trên Desktop):
className={cn(
  "h-11 md:h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
  className
)}
```

```tsx
// Code Sửa Mẫu: src/components/ui/tabs.tsx:27
// TRƯỚC:
"group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 ..."

// SAU:
"group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-1 text-muted-foreground group-data-horizontal/tabs:h-11 md:group-data-horizontal/tabs:h-9 ..."
```

#### 2. Sửa Lỗi Nhập Khẩu `cn` Trong `alert.tsx` và `checkbox.tsx`
- **Mục tiêu:** Khôi phục năng lực hợp nhất class của `tailwind-merge`.
- **Giải pháp:** Sửa đổi dòng import trong cả 2 tệp:

```tsx
// Sửa đổi trong src/components/ui/alert.tsx và src/components/ui/checkbox.tsx:
// TRƯỚC:
import { cn } from "cn"

// SAU:
import { cn } from "@/lib/utils"
```

#### 3. Tăng Độ Dày Thanh Tiến Độ `ProgressTrack` Lên 8px (`h-2`)
- **Mục tiêu:** Làm rõ tiến độ học tập và tạo phản hồi thị giác tốt hơn.
- **Giải pháp:** Cập nhật `src/components/ui/progress.tsx`:

```tsx
// Code Sửa Mẫu: src/components/ui/progress.tsx:32-35
// TRƯỚC:
className={cn(
  "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
  className
)}

// SAU:
className={cn(
  "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-muted/80 shadow-inner",
  className
)}
```

#### 4. Dọn Dẹp Mã Rác & Ghost Class
- **Xóa tệp rỗng:** Xóa hoàn toàn `src/components/campaign/UpgradeGiftModal.tsx`.
- **Dọn class ảo:** Xóa dòng `toast: "cn-toast"` trong `src/components/ui/sonner.tsx:41`.
- **Di dời component:** Chuyển `src/components/ui/WordCardSkeleton.tsx` sang `src/components/student/WordCardSkeleton.tsx`, bổ sung class `dark:bg-slate-900`.

---

### Giai Đoạn 2: Tái Cấu Trúc Hệ Thống (Structural Token Harmonization)

#### 1. Áp Đặt Kỷ Luật Token Toàn Diện (Strict Global Token Enforcement)
- **Mục tiêu:** Xóa bỏ sự chia rẽ giữa 6 bảng màu marketing và ứng dụng chính.
- **Kế hoạch hành động:**
  - Quy định mọi trang trong `src/app/` (bao gồm `page.tsx`, `landing/`, `for-teachers/`, `challenge-landing/`, `privacy/`) phải tiêu thụ các biến màu ngữ nghĩa: `bg-background`, `text-foreground`, `bg-card`, `border-border`, và `bg-primary`.
  - Cấm sử dụng các mã màu hex fix cứng (`#f6efe6`, `#241710`, `#f8fafc`) tại các vùng chứa cấp root.

```
                    ┌─────────────────────────────────────────┐
                    │      src/app/globals.css Token SOT      │
                    │   --primary: oklch(0.511 0.262 276.966) │
                    └────────────────────┬────────────────────┘
                                         │
     ┌──────────────────┬────────────────┴────────────────┬──────────────────┐
     ▼                  ▼                                 ▼                  ▼
[ Landing Root ]    [ Auth & Onboarding ]         [ Study & Exam ]   [ Admin Portal ]
 bg-background       bg-background                 bg-background      bg-background
 text-foreground     text-foreground               text-foreground    text-foreground
 bg-primary          bg-primary                    bg-primary         bg-primary
```

#### 2. Chuẩn Hóa Biến Thể Nút Bấm: Loại Bỏ Biến Thể `chunky` 3D
- **Mục tiêu:** Làm sạch bộ biến thể nút bấm theo triết lý Technical Minimalist.
- **Kế hoạch hành động:**
  - Thay thế mọi vị trí đang dùng `variant="chunky"` bằng `variant="default"` kết hợp kích thước chuẩn `size="lg"` hoặc `size="default"`.
  - Gỡ bỏ định nghĩa `chunky` khỏi `buttonVariants` trong `src/components/ui/button.tsx`.

---

### Giai Đoạn 3: Tinh Chỉnh Thẩm Mỹ & Đồ Họa (Polish & Design System Maturity)

#### 1. Nâng Cấp Hệ Thống Mascot: Thay Ký Tự Emoji Bằng Vector SVG Tinh Tế
- **Mục tiêu:** Xây dựng nhận diện thương hiệu trưởng thành, tin cậy.
- **Giải pháp:**
  - Thay thế các emoji `😊`, `🥳` bằng bộ minh họa vector SVG tối giản (chú chim tri thức hoặc biểu tượng ngọn đuốc học thuật với phong cách line-art viền mảnh tinh tế).
  - Loại bỏ hiệu ứng `animate-bounce` gây giật mắt; thay bằng hiệu ứng thở nhẹ nhàng (`opacity transition` hoặc `subtle pulse`).

#### 2. Xây Dựng Thư Viện Storybook / Living Styleguide Nội Bộ
- Đóng gói toàn bộ các primitive `src/components/ui/` cùng tài liệu hướng dẫn về Spacing, Typography (Be Vietnam Pro & Geist Mono), và Bảng trạng thái màu sắc để toàn bộ đội ngũ lập trình viên tuân thủ nghiêm ngặt, ngăn chặn triệt để sự xuất hiện của các component "tự chế".

---

## 6. Tổng Kết & Điều Kiện Nghiệm Thu (Sign-off Criteria)

1. **Đạt Chuẩn Apple HIG 44px:** 100% các ô nhập liệu `Input` và bộ tab `TabsList` đạt chiều cao tối thiểu 44px trên thiết bị di động.
2. **0 Lỗi Import Thư Viện:** 100% các component trong `src/components/ui/` nhập khẩu `cn` từ `@/lib/utils`.
3. **Thanh Lọc Thư Mục Primitives:** Không còn bất kỳ component nghiệp vụ (domain skeleton) hay tệp stub rỗng nào tồn tại trong `src/components/ui/`.
4. **Độ Dày Tiến Độ Rõ Nét:** Thanh `ProgressTrack` đạt chiều cao tối thiểu 8px (`h-2`), tương phản sắc nét trên cả Light và Dark mode.
5. **Nhất Quán Ngôn Ngữ Thiết Kế:** Không còn biến thể nút bấm đồ chơi 3D `chunky`; toàn bộ app tuân thủ giao diện phẳng, sắc nét, trung tính và chuẩn mực theo phong cách Technical Minimalist.
