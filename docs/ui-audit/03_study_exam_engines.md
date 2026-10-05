# Báo Cáo Kiểm Toán Toàn Diện UI/UX — Phân Hệ Học Tập, Luyện Tập & Khảo Thí Chuẩn Hóa
**Mã tài liệu:** `docs/ui-audit/03_study_exam_engines.md`  
**Phân hệ kiểm toán:** Study & Practice Engines | Standardized Exam Runners (TOEIC, VSTEP, THPT) | Diagnostic & Lead Magnet Funnels  
**Kiểm toán viên:** Worker 2 (Study, Exam & Design System Auditor)  
**Tiêu chuẩn đối chiếu:** Standardized Exam Engine Blueprint (`standardized-exam-engine` skill), Apple Human Interface Guidelines (44px Touch Targets), WCAG 2.1 AA Contrast, và Tôn chỉ Technical Minimalist.  
**Ngày hoàn thiện:** 2026-10-04  

---

## 1. Phân Loại & Tổng Quan Phân Hệ (Route Inventory & Component Architecture)

Hệ thống học tập, luyện tập và khảo thí của LingoPro bao gồm 2 nhóm lõi: **Động cơ học tập tương tác (Study & Practice Engines)** và **Phòng thi mô phỏng chuẩn hóa (Standardized Exam Simulation Engines)**. Qua rà soát chi tiết mã nguồn, phân hệ này hiện có 14 tuyến đường App Router (`src/app/`) cùng hàng chục component giao diện chuyên sâu.

### 1.1. Bảng Danh Mục Kiểm Kê Tuyến Đường (Route & Component Inventory)

| STT | Nhóm Phân Hệ | Tuyến Đường (Route) | Tệp Nguồn Trọng Yếu | Độ Dài Tệp | Vai Trò & Hiện Trạng Kiến Trúc |
|:---:|---|---|---|:---:|---|
| 1 | **Practice Hub** | `/practice` | `src/app/practice/page.tsx` | 140 dòng | Hub tổng hợp 8 chế độ học; bị co hẹp `max-w-lg` trên desktop và dùng palette 8 màu cầu vồng tùy tiện. |
| 2 | **Mini Games** | `/practice/games` | `src/app/practice/games/page.tsx`<br/>`EnglishGameSession.tsx` | 99 dòng + con | 6 mini-game từ vựng & ngữ pháp; banner gradient AI lòe loẹt, điểm số lưu `localStorage` riêng tách rời XP tổng. |
| 3 | **Vocab Station** | `/practice/vocab-station` | `src/app/practice/vocab-station/page.tsx` | **1,581 dòng** | Trang nguyên khối (monolithic) khổng lồ chứa Flashcard 2.0, Cloze, Sentence Pattern, Match Game. |
| 4 | **Video Listening** | `/practice/listening/[videoId]` | `src/app/practice/listening/[videoId]/page.tsx`<br/>`SyncedTranscript.tsx` | 543 dòng | Luyện nghe chép chính tả & đồng bộ phụ đề video; bị co cụm khung hiển thị, thiếu linh hoạt responsive. |
| 5 | **Grammar Hub** | `/grammar` | `src/app/grammar/page.tsx`<br/>`GrammarReferenceTable.tsx` | 806 dòng | Cây lộ trình ngữ pháp; phân cấp bộ lọc phức tạp, chưa liên kết mượt mà với runner làm bài. |
| 6 | **Grammar Practice** | `/grammar/practice` | `src/app/grammar/practice/page.tsx`<br/>`PedagogicalFeedbackPanel.tsx` | **1,060 dòng** | Phòng thực hành ngữ pháp; bị phản ứng ngược sang phong cách brutalist cực đoan `rounded-none` thô ráp. |
| 7 | **FSRS Review** | `/review/session` | `src/app/review/session/page.tsx`<br/>`ExampleWithSub.tsx` | **1,138 dòng** | Động cơ ôn tập ngắt quãng FSRS chính; dính gamification emoji thú cưng (`🦁🦊🐼`), chuyển thẻ giật cục. |
| 8 | **Legacy Flashcard** | `/flashcard` | `src/app/flashcard/page.tsx`<br/>`LearnMode.tsx` | 939 dòng | **Hệ thống trùng lặp hoàn toàn**: hàng đợi SRS song song và hệ thống streak/gamification độc lập. |
| 9 | **TOEIC Catalog** | `/toeic` | `src/app/toeic/page.tsx` | **1,849 dòng** | Danh mục đề thi ETS; chứa thuật toán băm FNV-1a sinh số liệu lượt thi giả mạo và 4 thẻ thống kê vanity rỗng. |
| 10 | **TOEIC Split-Pane** | `/toeic/exam/[examId]` | `src/app/toeic/exam/[examId]/page.tsx`<br/>`ToeicSplitPane.tsx` | **1,046 + 1,399 dòng** | Phòng thi 2 cột chuẩn ETS; tách đề và câu hỏi độc lập, nhưng trên mobile/tablet bị cuộn dọc mất dấu văn bản. |
| 11 | **TOEIC Legacy Card** | `/toeic/[part]/[ref]` | `src/app/toeic/[part]/[ref]/page.tsx` | 447 dòng | **Runner song song xung đột**: giao diện 1 cột dạng thẻ, văn bản đọc bị ép cứng 288px, mobile chia lưới 2x2 vỡ phom. |
| 12 | **VSTEP Monolith** | `/vstep/exam/[examId]` | `src/app/vstep/exam/[examId]/page.tsx` | **1,459 dòng** | **Trùng lặp mã nghiêm trọng**: tự code lại toàn bộ Audio Player, Timer, Question Palette và Barem CEFR. |
| 13 | **THPT Quiz Runner** | `/thpt/[type]/[ref]` | `src/app/thpt/[type]/[ref]/page.tsx` | 213 dòng | Trình làm bài thi THPT Quốc gia; sử dụng nút bấm Duolingo 3D `chunky` và icon emoji tiệc tùng lệch chuẩn khảo thí. |
| 14 | **Lead Magnet Funnel** | `/sat-thu-toeic-listening` | `src/components/lead-magnet/LeadMagnetClient.tsx`<br/>`BookCover3D.tsx` | 528 dòng + con | Phễu tiếp thị giật gân trá hình bài thi thử; từ ngữ thổi phồng ("15 bẫy sát thủ", "quà 699k"), cầu sáng ambient giả tạo. |

---

## 2. Đánh Giá Chuyên Sâu 4 Trụ Cột: "Thừa - Xấu - Cứng Ngắc - AI Quá"

---

### 2.1. PILLAR 1: THỪA (Redundancy, Clutter, Duplicate Runners & Dead Systems)

#### 🔴 1.1. Vấn Nạn 4 Hệ Thống Flashcard Độc Lập Chạy Song Song Xung Đột
Trong một nền tảng học từ vựng thống nhất, nhóm kiểm toán phát hiện **4 hệ thống flashcard được xây dựng hoàn toàn độc lập**, sử dụng các nguồn dữ liệu, trạng thái lưu trữ và thuật toán tính điểm khác nhau:
1. **FSRS Unified Session** (`src/app/review/session/page.tsx`, 1,138 dòng): Hệ thống ôn tập chính thức sử dụng thuật toán FSRS (Free Spaced Repetition Scheduler), gọi API `/api/words` và RPC đồng bộ tiến trình học viên.
2. **Legacy Flashcard & LearnMode** (`src/app/flashcard/page.tsx`, 939 dòng): Hệ thống flashcard cũ vẫn đang hoạt động ngầm, tự fetch `api/words?filter=review`, duy trì thuật toán SRS riêng, tự tính điểm XP cục bộ qua `XP_BY_QUALITY` và render giao diện lật thẻ 3D riêng.
3. **Vocab Station Flashcard 2.0** (`src/app/practice/vocab-station/page.tsx:580-680`): Tự cài đặt một trình lật thẻ 3D cho 100 động từ bất quy tắc/cốt lõi với các nút phát âm `handlePlayAudio` chậm 0.75x riêng, không ghi nhận ngược lại tiến trình FSRS của tài khoản.
4. **TOEIC Lesson Flashcards** (`src/components/toeic/learn/ToeicLessonFlashcards.tsx`, 401 dòng): Trình học flashcard lý thuyết TOEIC độc lập, lưu danh sách từ đã thuộc vào `localStorage.getItem('lingo_toeic_fc_mastered')`.

*Hệ quả:* Học viên học một từ ở Vocab Station hay TOEIC Flashcard nhưng ra Dashboard vẫn bị báo "Chưa thuộc" do không đồng bộ FSRS. Đội ngũ kỹ sư phải bảo trì 4 cụm mã nguồn cho cùng một tác vụ lật thẻ học từ.

#### 🔴 1.2. Hai Trình Làm Đề TOEIC Không Tương Thích Cùng Hoạt Động
- Khi học viên truy cập từ danh mục bài thi chính (`/toeic`), app mở runner hiện đại `ToeicSplitPane.tsx` (giao diện 2 cột chuẩn thi máy ETS, có palette câu hỏi, kiểm soát audio 1 lần nghe).
- Nhưng khi học viên đi theo lộ trình Journey (`/journey`), app lại điều hướng sang `src/app/toeic/[part]/[ref]/page.tsx` — một runner đơn cột cổ lỗ sĩ, không có Question Palette, không có Split-Pane, và ép khung đọc hiểu vào một hộp cuộn bé tí tẹo 288px.
- Sự tồn tại song song của 2 runner gây phân mảnh trải nghiệm học viên nghiêm trọng: cùng một câu hỏi ETS Part 7 nhưng ở 2 trang giao diện hiển thị hoàn toàn khác nhau.

#### 🔴 1.3. Trùng Lặp 1,459 Dòng Mã Trong Runner VSTEP (`vstep/exam/[examId]`)
Thay vì kế thừa các thành phần khảo thí đã hoàn thiện trong TOEIC (`ToeicSplitPane`, `ToeicAudioPlayer`, `ToeicExamHeader`, `ToeicQuestionPalette`), tệp `src/app/vstep/exam/[examId]/page.tsx` tự dựng lại từ đầu:
- Trình phát Audio Player CDN (dòng 816–870) với các nút tốc độ `0.75x`, `1.0x`, `1.25x`, `1.5x`.
- Trình đếm ngược thời gian và tự động nộp bài (dòng 178–204).
- Bảng Question Palette dạng modal (dòng 645–660).
- Bảng quy đổi điểm CEFR B1/B2/C1 và chứng chỉ điểm số (dòng 700–800).
Việc sao chép này lãng phí hơn 800 dòng mã và gây lệch chuẩn giao diện giữa hai kỳ thi trọng điểm.

#### 🔴 1.4. Bốn Thẻ Thống Kê Phù Phiếm (Vanity Stat Cards) Làm Tắc Nghẽn Header TOEIC
Tại `src/app/toeic/page.tsx:550-591`, ngay dưới banner tiêu đề là 4 thẻ thống kê cố định: "Kho Câu Hỏi: 3,700 câu", "Đề Full Test: 20 đề", "Phần Thi: 7 Parts", "Thang Điểm: 10–990 điểm". Các thẻ này chiếm tới ~200px chiều cao màn hình trên desktop mà không đem lại giá trị thao tác nào cho thí sinh đang cần tìm đề thi.

---

### 2.2. PILLAR 2: XẤU (Visual Discordance, Typography Clashes & Palette Chaos)

#### 🟠 2.1. Ma Trận Màu Cầu Vồng 8 Sắc Tùy Tiện Tại Hub Luyện Tập (`/practice`)
Tại `src/app/practice/page.tsx:12-100`, 8 chế độ luyện tập được gán 8 bộ màu sắc đối kháng nhau một cách vô căn cứ:
- Sân chơi game: `violet-200 / bg-violet-50/70 / text-violet-950`
- 100 Động từ: `amber-300 / bg-amber-50/90 / text-amber-950`
- Thi thử TOEIC: `blue-200 / bg-blue-50/70 / text-blue-950`
- Quiz nhớ nhanh: `amber-200 / bg-amber-50/70 / text-amber-950`
- Đặt câu: `violet-200 / bg-violet-50/70 / text-violet-900`
- Luyện đọc: `teal-200 / bg-teal-50/70 / text-teal-900`
- Luyện nghe: `sky-200 / bg-sky-50/70 / text-sky-900`
- Dịch câu: `indigo-200 / bg-indigo-50/70 / text-indigo-900`

Đặc biệt, các thẻ như TOEIC, Quiz nhớ nhanh, Đặt câu, Luyện đọc **hoàn toàn không khai báo class dark mode** (`dark:bg-...`, `dark:text-...`). Khi người dùng bật chế độ tối, toàn bộ app chuyển sang nền tối nhưng các thẻ này vẫn giữ nguyên nền trắng nhờ nhờ `bg-blue-50/70`, chữ xanh thẫm `text-blue-950`, gây chói mắt và phá vỡ độ tương phản thị giác.

#### 🟠 2.2. Biểu Tượng Cảm Xúc Avatar Khổng Lồ Kiểu Trẻ Em Mầm Non
Tại `src/app/practice/page.tsx:121-125`:
```tsx
<span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl text-white shadow-xs ${m.badge}`}>
  {m.emoji}
</span>
```
Các icon emoji `🎮`, `🌟`, `🎯`, `⚡`, `✨`, `📖` được bọc trong các khối bo tròn khổng lồ kích thước 56x56px (`h-14 w-14`). Phối thức này khiến màn hình hub của một ứng dụng luyện thi cho người lớn trông giống như một phần mềm giáo dục trẻ mầm non.

#### 🟠 2.3. Bố Cục Lưới 2x2 Lệch Lạc Trên Mobile Của Trình Đọc TOEIC Cũ
Tại `src/app/toeic/[part]/[ref]/page.tsx:364-366`:
```tsx
{/* Options — 2x2 Grid (1 2 / 3 4) on Mobile */}
<div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">
```
Mã nguồn chủ đích ép 4 phương án lựa chọn thành 2 cột (`grid-cols-2`) trên điện thoại di động. Do độ dài văn bản của các phương án trong Part 5 và Part 6 không đồng đều (phương án A dài 1 dòng, phương án B dài 3 dòng), các nút bấm bị méo mó, cao thấp cọc cạch, viền nút xô lệch nhau, tạo nên một giao diện vô cùng nham nhở.

#### 🟠 2.4. Bẫy Khung Đọc 288px (Letterboxing) Chen Chúc Bài Đọc Part 7
Cũng tại `src/app/toeic/[part]/[ref]/page.tsx:353`:
```tsx
<CardContent className="p-4 whitespace-pre-line text-sm leading-relaxed max-h-72 overflow-y-auto">
```
Một bài đọc đoạn ba (Triple Passage) dài 400–500 từ của đề thi ETS Part 7 bị ép cứng trong một khung thẻ có chiều cao tối đa chỉ 288px (`max-h-72`). Thí sinh phải liên tục dùng ngón tay vuốt một vùng cuộn siêu nhỏ để đọc từng mẩu thông tin, trong khi không gian màn hình bên dưới bị bỏ trống.

---

### 2.3. PILLAR 3: CỨNG NGẮC (Rigidity, Ergonomics, Broken Touch Targets & Whiplash)

#### 🟡 3.1. Phản Ứng Ngược Brutalist Cực Đoan (`rounded-none`) Trong Module Ngữ Pháp
Sau một đợt refactor trước đây nhằm loại bỏ phong cách bo tròn quá đà, module thực hành ngữ pháp (`src/app/grammar/practice/page.tsx`) đã bị đẩy sang một thái cực đối lập thô cứng:
- Thẻ câu hỏi: `border border-border p-6 bg-card rounded-none` (dòng 882)
- Ô nhập câu trả lời: `px-4 py-3 rounded-none font-mono text-sm` (dòng 950)
- Nút xác nhận: `px-6 py-3 font-mono text-xs uppercase tracking-wider font-semibold rounded-none` (dòng 955)
- Thẻ phương án: `w-full text-left p-4 border rounded-none font-mono text-sm` (dòng 968)

Mọi thành phần trong phòng học ngữ pháp đều bị triệt tiêu góc bo về 0px sắc lẹm, kết hợp font chữ máy đánh chữ in hoa (`font-mono uppercase`). Khi người học chuyển từ Dashboard hay Flashcard (`rounded-2xl`, font sans) sang Ngữ pháp, họ gặp hiện tượng **sốc thẩm mỹ (aesthetic whiplash)** như đang bị văng sang một ứng dụng terminal dòng lệnh từ thập niên 1990.

#### 🟡 3.2. Thanh Tua Audio Dưới Chuẩn Cảm Ứng (Touch Target Failure)
Tại `src/components/toeic/ToeicAudioPlayer.tsx:312-321`:
```tsx
<input
  type="range"
  min={0}
  max={duration || 100}
  step={0.1}
  value={currentTime}
  onChange={handleSeek}
  className="h-1.5 w-full cursor-pointer appearance-none rounded-xs bg-slate-200 accent-slate-900 dark:bg-slate-700 dark:accent-slate-100"
/>
```
Thanh tua âm thanh trong chế độ luyện tập chỉ dày vỏn vẹn 6px (`h-1.5`), không có padding mở rộng vùng chạm. Trên màn hình điện thoại hoặc máy tính bảng, đầu ngón tay người dùng (trung bình 44x44px theo Apple HIG) hoàn toàn không thể chạm trúng thanh tua này một cách chính xác để nghe lại một câu thoại quan trọng.

#### 🟡 3.3. Bẫy Xếp Chồng Dọc (Vertical Scrolling Trap) Của Split-Pane Trên Tablet/Mobile
Tại `src/components/toeic/ToeicSplitPane.tsx:1035-1048`:
```tsx
<div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
  <section
    className={`${
      isPart5 ? 'hidden lg:flex' : ... : 'flex flex-col shrink-0 max-h-[50vh] sm:max-h-[52vh] overflow-y-auto'
    } lg:col-span-6 xl:col-span-7 lg:max-h-none lg:h-full lg:overflow-hidden border-b lg:border-b-0 lg:border-r ...`}
  >
```
Trên màn hình nhỏ hơn 1024px (`< lg`), Split-Pane tự động hạ cấp thành ngăn xếp dọc (`flex-col`). Đối với các bài nghe Part 3, 4 có hình ảnh hoặc Part 7 có bài đọc, phần đề thi bị giới hạn ở 50% màn hình trên (`max-h-[50vh]`) và 3 câu hỏi trắc nghiệm nằm ở 50% màn hình dưới. Thí sinh phải liên tục cuộn lên để đọc tài liệu rồi lại cuộn xuống để bấm chọn đáp án, gây ức chế tâm lý nặng nề trong khi làm bài thi có bấm giờ.

#### 🟡 3.4. Chuyển Thẻ Đột Ngột Gây Mỏi Mắt Trong Phiên Ôn Tập FSRS
Tại `src/app/review/session/page.tsx:488-525` (`goNext`): Khi học viên bấm đánh giá từ (Again / Hard / Good / Easy), hàm `goNext` lập tức cắt âm thanh cũ bằng `stopWordAudio()` và render ngay lập tức từ tiếp theo vào DOM mà không hề có bất kỳ chuyển động chuyển cảnh (transition/fade) nào. Việc chữ và câu ví dụ bị giật đổi đột ngột 50–100 lần trong một phiên học gây mỏi mắt và căng thẳng thị giác cho người học.

---

### 2.4. PILLAR 4: AI QUÁ (Formulaic AI Templates, Fake Social Proof & Sensationalist Tropes)

#### 🟣 4.1. Bịa Đặt Số Liệu Thống Kê Người Dùng Bằng Thuật Toán Băm FNV-1a
Tại `src/app/toeic/page.tsx:201-246`:
```tsx
function hashStringFnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function getTestSocialMeta(test: ToeicCatalogTestItem, index: number): TestSocialMeta {
  // Deterministic calculation based on index and test id to prevent hydration mismatch
  // Generates organic-looking attempt numbers in the realistic 21.000 - 34.000 range
  const h1 = hashStringFnv1a(test.id);
  const h2 = hashStringFnv1a(test.title);

  const tierBonus = index < 3 ? 6800 : index < 8 ? 4200 : index < 16 ? 2400 : 800;
  const baseAttempts = 21250 + tierBonus;
  const spread = Math.abs((h1 ^ (h2 * 31))) % 6780;
  const attemptCount = baseAttempts + spread;

  const avgScore = 638 + (h1 % 43); // 638 - 680
  ...
}
```
*Phân tích:* Đây là một **hành vi ngụy tạo số liệu trực tiếp trong mã nguồn**. Để tạo cảm giác ứng dụng có hàng trăm nghìn lượt thi sôi động, hàm `getTestSocialMeta` dùng thuật toán băm FNV-1a để "chế" ra số lượt thi từ 21,250 đến 34,800 lượt cho mỗi đề, đồng thời bịa ra điểm trung bình từ 638 đến 680/990. Điều này vi phạm nghiêm trọng tính minh bạch học thuật của nền tảng và gieo rắc sự thiếu tin cậy khi người học phát hiện ra con số này không có thực.

#### 🟣 4.2. Màn Hình Kết Quả FSRS Dùng Icon Thú Cưng Trẻ Con Cho Thí Sinh Trưởng Thành
Tại `src/app/review/session/page.tsx:743-748`:
```tsx
<div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 font-sans">
  <div className="text-7xl">{acc >= 80 ? '🦁' : acc >= 60 ? '🦊' : '🐼'}</div>
  <h1 className="text-3xl font-black text-slate-900">
    {isFreeReview ? 'Xong lượt ôn tự do!' : `Xong phiên ${sessionTitle}!`}
  </h1>
  <Card className="w-full max-w-sm rounded-3xl border border-slate-200 p-6 shadow-lg">
```
Sau khi hoàn thành 50 câu ôn tập FSRS căng thẳng, màn hình chúc mừng hiện ra một con sư tử `🦁`, cáo `🦊` hoặc gấu trúc `🐼` to 72px (`text-7xl`) đặt trên nền gradient tím pastel `from-indigo-50 via-white to-violet-50` cùng thẻ card tròn vo `rounded-3xl shadow-lg`. Một sinh viên đại học hoặc người đi làm ôn thi TOEIC 800+ sẽ cảm thấy giao diện này quá trẻ con và không nghiêm túc.

#### 🟣 4.3. Báo Cáo Điểm Số Cố Định Rập Khuôn (Static Canned Feedback Matrix)
Tại `src/components/toeic/ToeicScoreReportView.tsx:71-117`, đối tượng `PART_FEEDBACK` chứa các câu nhận xét mẫu cố định cho từng Part:
- Part 1 Cao: *"Phản xạ nghe tranh rất nhạy bén! Bạn nhận diện tốt chủ thể hành động..."*
- Part 1 Trung bình: *"Khả năng quan sát tranh tương đối ổn, cần chú ý thêm bẫy về thì bị động..."*
- Part 1 Thấp: *"Cần củng cố từ vựng mô tả hành động con người, đồ vật công sở..."*
- Tương tự cho Part 2 đến Part 7.

Dù thí sinh làm sai vì bẫy từ vựng hay sai vì không nghe kịp tốc độ, báo cáo chỉ kiểm tra tỷ lệ phần trăm đúng/sai của Part đó rồi hiển thị nguyên xi 1 trong 3 câu văn soạn sẵn. Đây là chẩn đoán giả lập (pseudo-diagnostics), không hề phân tích sâu vào dạng bẫy mà thí sinh thực sự mắc phải.

#### 🟣 4.4. Phễu Bán Hàng Giật Gân Thổi Phồng Tại `sat-thu-toeic-listening`
Tuyến đường `/sat-thu-toeic-listening` và component `LeadMagnetClient.tsx` vi phạm trực tiếp yêu cầu của dự án (loại bỏ từ ngữ giật tít "sát thủ", "ăn trọn điểm", "chiến thắng tuyệt đối"):
- Khẩu hiệu: *"Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC"* (dòng 160)
- Giật tít bẫy: *"Bẻ gãy 15 bẫy sát thủ phòng thi"* (dòng 167)
- Định giá ảo giác: *"Bên Trong Gói Quà Tặng 699,000đ Có Gì?"* (`OfferStackSection.tsx:85`), *"Quà Tặng 699,000đ → 0đ"* (`EmailOptinCard.tsx:149`).
- Hiệu ứng AI template kinh điển:
  ```tsx
  {/* src/components/lead-magnet/LeadMagnetClient.tsx:142-144 */}
  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
  <div className="absolute top-40 right-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl" />
  ```
  Kết hợp với bìa sách 3D nhấp nháy liên tục huy hiệu `animate-bounce` (`BookCover3D.tsx:56`). Toàn bộ phễu này giống như một trang web bán khóa học làm giàu đa cấp hơn là một ấn phẩm sư phạm của một nền tảng giáo dục nghiêm túc.

---

## 3. Bảng Ma Trận Khiếm Khuyết (Defect Matrix)

| ID | Đường Dẫn Tệp (File Path) | Thành Phần (Component) | Trụ Cột (Pillar) | Mức Độ | Dòng Mã | Mô Tả Khiếm Khuyết Chi Tiết |
|:---:|---|---|:---:|:---:|:---:|---|
| **D3-01** | `src/app/toeic/page.tsx` | `getTestSocialMeta` | **AI quá** / **Thừa** | **Critical** | 201–246 | Dùng thuật toán băm FNV-1a để sinh lượt thi giả (21k–34k) và điểm trung bình giả mạo. |
| **D3-02** | `src/app/flashcard/page.tsx`<br/>`src/app/flashcard/LearnMode.tsx` | `FlashcardPage`<br/>`LearnMode` | **Thừa** | **Critical** | Toàn bộ 939 dòng | Module flashcard song song thừa thãi; trùng lặp logic FSRS và XP với `/review/session`. |
| **D3-03** | `src/app/vstep/exam/[examId]/page.tsx` | `VstepExamPage` | **Thừa** / **Cứng ngắc** | **Critical** | 816–870,<br/>178–204,<br/>645–660 | Monolith 1,459 dòng tự viết lại Audio Player, Timer, Question Palette và Barem CEFR thay vì dùng chung. |
| **D3-04** | `src/components/lead-magnet/LeadMagnetClient.tsx` | `LeadMagnetClient`<br/>`BookCover3D` | **AI quá** / **Thừa** | **Critical** | 142–168,<br/>223,<br/>56 (BookCover) | Phễu bán hàng giật tít ("15 bẫy sát thủ", "quà 699k"), 3 khối cầu mờ `blur-3xl` và sách 3D `animate-bounce`. |
| **D3-05** | `src/app/toeic/[part]/[ref]/page.tsx` | `ToeicPracticeRunner` | **Thừa** / **Xấu** | **Major** | 353,<br/>364–380 | Runner TOEIC cũ: khung đọc bị ép 288px (`max-h-72`), phương án mobile bị chia lưới 2x2 lệch lạc. |
| **D3-06** | `src/components/toeic/ToeicSplitPane.tsx` | `ToeicSplitPane` | **Cứng ngắc** | **Major** | 1035–1048 | Trên màn hình `< lg`, Split-Pane bị xếp chồng dọc ép thí sinh cuộn lên cuộn xuống liên tục. |
| **D3-07** | `src/components/toeic/ToeicAudioPlayer.tsx` | `ToeicAudioPlayer` | **Cứng ngắc** | **Major** | 312–321 | Thanh tua audio mỏng 6px (`h-1.5`) không có hitbox mở rộng, vi phạm vùng chạm 44px của Apple HIG. |
| **D3-08** | `src/app/grammar/practice/page.tsx` | `GrammarPracticePage` | **Cứng ngắc** / **Xấu** | **Major** | 882, 950,<br/>955, 968 | Phong cách brutalist cực đoan `rounded-none`, font monospace typewriter in hoa gây sốc thẩm mỹ. |
| **D3-09** | `src/app/practice/page.tsx` | `PracticeHubPage` | **Xấu** / **Cứng ngắc** | **Major** | 12–100,<br/>106 | Khung hiển thị bị co hẹp `max-w-lg` trên desktop; 8 màu cầu vồng hỗn loạn, thiếu hoàn toàn dark mode. |
| **D3-10** | `src/components/toeic/learn/ToeicLessonFlashcards.tsx` | `ToeicLessonFlashcards` | **Thừa** | **Major** | 45–56 | Trình flashcard thứ tư độc lập; tự ghi nhận từ đã thuộc vào key `localStorage` riêng biệt. |
| **D3-11** | `src/app/toeic/page.tsx` | `ToeicCatalogHeader` | **Thừa** | **Medium** | 550–591 | 4 thẻ thống kê rỗng (3,700 câu, 20 đề, 7 parts, 10-990) chiếm diện tích lớn ở đầu trang. |
| **D3-12** | `src/app/review/session/page.tsx` | `ReviewSessionPage` | **AI quá** | **Medium** | 743–748 | Màn hình hoàn thành dùng emoji thú cưng to 72px (`🦁🦊🐼`) và card bóng đổ `rounded-3xl` trẻ con. |
| **D3-13** | `src/components/toeic/ToeicScoreReportView.tsx` | `ToeicScoreReportView` | **Thừa** / **AI quá** | **Medium** | 71–117 | Bảng nhận xét tĩnh `PART_FEEDBACK` lặp lại khuôn mẫu cố định, không chẩn đoán đúng lỗi thực tế. |
| **D3-14** | `src/app/practice/games/page.tsx` | `EnglishGamesPage` | **AI quá** | **Medium** | 75–78 | Hero banner gradient tím hồng rực rỡ (`indigo -> violet -> fuchsia`) với vòng tròn viền 30px trang trí rỗng. |
| **D3-15** | `src/app/thpt/[type]/[ref]/page.tsx` | `ThptPlayerPage` | **Xấu** / **Cứng ngắc** | **Medium** | 130–136 | Phòng thi tốt nghiệp THPT dùng nút bấm đồ chơi `variant="chunky"` và emoji tiệc tùng `🎉`. |
| **D3-16** | `src/app/review/session/page.tsx` | `ReviewSessionPage` | **Cứng ngắc** | **Minor** | 488–525 | Chuyển thẻ từ vựng giật cục đột ngột, thiếu hiệu ứng làm dịu mắt (fade/slide transition). |

---

## 4. Minh Chứng Mã Nguồn Cụ Thể (Code Evidence & Line Inspections)

### 4.1. Minh Chứng Thuật Toán Băm Số Liệu Giả Mạo (FNV-1a)
**Tệp:** `src/app/toeic/page.tsx` (Dòng 201–222)
```tsx
function hashStringFnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function getTestSocialMeta(test: ToeicCatalogTestItem, index: number): TestSocialMeta {
  // Deterministic calculation based on index and test id to prevent hydration mismatch
  // Generates organic-looking attempt numbers in the realistic 21.000 - 34.000 range
  const h1 = hashStringFnv1a(test.id);
  const h2 = hashStringFnv1a(test.title);

  // Top tests (e.g. ETS 01, 02, 03) naturally attract higher attempts (~32k - 34k)
  // Others distribute organically between ~22k - 29k
  const tierBonus = index < 3 ? 6800 : index < 8 ? 4200 : index < 16 ? 2400 : 800;
  const baseAttempts = 21250 + tierBonus;
  const spread = Math.abs((h1 ^ (h2 * 31))) % 6780;
  const attemptCount = baseAttempts + spread;

  const avgScore = 638 + (h1 % 43); // 638 - 680
```
*Nhận định kiểm toán:* Chú thích mã nguồn thừa nhận trực tiếp việc tạo ra con số "trông có vẻ tự nhiên" (`Generates organic-looking attempt numbers`). Cần thanh trừng triệt để.

### 4.2. Minh Chứng Phá Vỡ Lưới Phương Án Trên Mobile
**Tệp:** `src/app/toeic/[part]/[ref]/page.tsx` (Dòng 352–367)
```tsx
      {/* Passage / Context */}
      {q.context && (
        <Card className="border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="p-4 whitespace-pre-line text-sm leading-relaxed max-h-72 overflow-y-auto">
            <ExamInteractiveText text={stripHtmlTags(q.context)} enabled={revealed} />
          </CardContent>
        </Card>
      )}

      {/* Question */}
      <h1 className="text-base font-bold leading-relaxed">
        <ExamInteractiveText text={stripHtmlTags(q.prompt)} enabled={revealed} />
      </h1>

      {/* Options — 2x2 Grid (1 2 / 3 4) on Mobile */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">
```
*Nhận định kiểm toán:* `max-h-72` (288px) bóp nghẹt bài đọc, kết hợp với `grid-cols-2` trên mobile khiến các ô phương án có chiều cao không bằng nhau, chữ bị tràn và đè lên viền nút.

### 4.3. Minh Chứng Thanh Tua Audio Siêu Mảnh Dưới Chuẩn Apple HIG
**Tệp:** `src/components/toeic/ToeicAudioPlayer.tsx` (Dòng 311–321)
```tsx
              // Interactive seek slider in Practice Mode
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-xs bg-slate-200 accent-slate-900 dark:bg-slate-700 dark:accent-slate-100"
              />
```
*Nhận định kiểm toán:* `h-1.5` chỉ tương đương 6px. Người dùng di động không thể chạm ngón tay vào thanh trượt này mà không ấn nhầm vào các nút khác.

### 4.4. Minh Chứng Trùng Lặp Audio Player Trong VSTEP Monolith
**Tệp:** `src/app/vstep/exam/[examId]/page.tsx` (Dòng 830–852)
```tsx
                    {/* Speed Selector Pills */}
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700/60 p-0.5 rounded-md text-[11px]">
                      {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            playbackSpeed === speed
                              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <audio
                    key={currentAudioSrc}
                    ref={audioRef}
                    src={currentAudioSrc}
                    onLoadStart={() => {
```
*Nhận định kiểm toán:* Tệp này dài tới 1,459 dòng chỉ vì phải tự viết lại toàn bộ thẻ `<audio>` và bộ nút điều khiển tốc độ mà `ToeicAudioPlayer.tsx` đã xử lý hoàn hảo.

### 4.5. Minh Chứng Phong Cách Brutalist Lệch Pha Của Ngữ Pháp
**Tệp:** `src/app/grammar/practice/page.tsx` (Dòng 882, 950–969)
```tsx
<div className="border border-border p-6 bg-card rounded-none">
...
<input
  type="text"
  value={typedAnswer}
  onChange={(e) => setTypedAnswer(e.target.value)}
  disabled={!!selected}
  placeholder="Nhập câu trả lời của bạn..."
  className="flex-1 border border-border bg-card px-4 py-3 rounded-none font-mono text-sm focus:outline-none focus:border-foreground"
/>
...
let optClass =
  'w-full text-left p-4 border rounded-none transition-colors flex items-start justify-between gap-4 font-mono text-sm ';
```
*Nhận định kiểm toán:* `rounded-none` ở khắp mọi nơi tạo cảm giác thô ráp, cứng nhắc, lạc lõng hoàn toàn so với thiết kế tổng thể của LingoPro.

---

## 5. Kế Hoạch Khắc Phục Hành Động (Actionable Remediation Plan)

---

### Giai Đoạn 1: Quick Wins (Dọn Rác Thị Giác & Khắc Phục Trong 1–2 Ngày)

#### 1. Xóa Bỏ Hoàn Toàn Thuật Toán Băm Số Liệu Ảo `getTestSocialMeta`
- **Mục tiêu:** Trả lại dữ liệu thật và uy tín học thuật cho danh mục đề thi TOEIC.
- **Giải pháp:** Xóa bỏ `hashStringFnv1a` và `getTestSocialMeta` tại `src/app/toeic/page.tsx`. Thay thế bằng siêu dữ liệu thực tế: Thời gian làm bài (`120 phút`), Số câu hỏi (`200 câu`), và Số câu học viên đã từng làm trong đề này (từ `localStorage` hoặc profile).

```tsx
// Code Refactor: src/app/toeic/page.tsx
// TRƯỚC:
<span className="font-mono text-xs text-slate-500">
  {meta.attemptCount.toLocaleString('vi-VN')} lượt thi
</span>

// SAU (Dữ liệu thật, sạch sẽ, chuẩn Technical Minimalist):
<div className="flex items-center gap-3 font-mono text-xs text-slate-500 dark:text-slate-400">
  <span className="flex items-center gap-1">
    <Clock className="h-3.5 w-3.5" /> 120 phút
  </span>
  <span>•</span>
  <span className="flex items-center gap-1">
    <FileText className="h-3.5 w-3.5" /> 200 câu hỏi
  </span>
  {userExamStatus?.isCompleted && (
    <>
      <span>•</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
        Đã nộp: {userExamStatus.score}/990
      </span>
    </>
  )}
</div>
```

#### 2. Sửa Lỗi Lưới Phương Án Mobile & Khung Đọc 288px
- **Mục tiêu:** Xử lý ngay lỗi vỡ giao diện trên điện thoại tại `src/app/toeic/[part]/[ref]/page.tsx`.
- **Giải pháp:**
  - Chuyển `grid-cols-2` thành `grid-cols-1` trên mobile.
  - Tăng `max-h-72` lên `max-h-[50vh]` hoặc bỏ giới hạn với nút xem thêm/thu gọn rõ ràng.

```tsx
// Code Fix: src/app/toeic/[part]/[ref]/page.tsx:366
// TRƯỚC:
<div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">

// SAU:
<div className="grid grid-cols-1 gap-2.5">
```

#### 3. Mở Rộng Vùng Chạm Tua Âm Thanh Đạt Chuẩn Apple HIG 44px
- **Mục tiêu:** Cho phép học viên chạm tua lại audio dễ dàng trên điện thoại.
- **Giải pháp:** Bọc thẻ `<input type="range">` trong container có padding dọc tối thiểu `py-3` để mở rộng vùng bấm cảm ứng lên 44px, đồng thời tăng kích thước thanh hiển thị lên `h-2` (8px).

```tsx
// Code Fix: src/components/toeic/ToeicAudioPlayer.tsx:311-321
<div className="relative flex min-h-[44px] items-center py-2.5">
  <input
    type="range"
    min={0}
    max={duration || 100}
    step={0.1}
    value={currentTime}
    onChange={handleSeek}
    aria-label="Tua thời gian phát âm thanh"
    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 transition-all dark:bg-slate-700 dark:accent-slate-100"
  />
</div>
```

#### 4. Dọn Rác Tiếp Thị Giật Tít Tại `sat-thu-toeic-listening`
- **Mục tiêu:** Chuẩn hóa văn phong học thuật, loại bỏ yếu tố AI lừa dối.
- **Giải pháp:**
  - Đổi tiêu đề: *"Bách Khoa Thực Chiến: Sát Thủ Bài Nghe TOEIC"* → *"Cẩm Nang Chiến Thuật Khảo Thí Bài Nghe TOEIC (ETS 2024–2026)"*.
  - Bỏ cụm từ *"15 bẫy sát thủ"* → *"15 Dạng Bẫy Thường Gặp"*.
  - Xóa bỏ các claim *"Gói quà 699,000đ → 0đ"*, 3 khối cầu mờ `blur-3xl`, và hiệu ứng `animate-bounce` trên bìa sách.

---

### Giai Đoạn 2: Tái Cấu Trúc Hệ Thống (Structural Unification)

#### 1. Hợp Nhất 4 Hệ Thống Flashcard Về Duy Nhất Một Lõi FSRS
- **Mục tiêu:** Chấm dứt tình trạng phân mảnh tiến trình học viên.
- **Kế hoạch hành động:**
  - Khai tử tuyến đường `/flashcard`: Chuyển hướng 301 vĩnh viễn (hoặc `redirect()`) từ `/flashcard` sang `/review/session`.
  - Di chuyển các tính năng hay của Vocab Station (ví dụ: phát âm chậm 0.75x, phân tích mẫu câu S-V-O) vào component dùng chung `ExampleWithSub.tsx` trong `/review/session`.
  - Kết nối `ToeicLessonFlashcards` với API lưu tiến trình SRS chung thay vì lưu lén lút vào `localStorage`.

```
                  ┌────────────────────────────────────────┐
                  │      CORE FSRS ENGINE (/api/words)     │
                  └───────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   [ /review/session ]                             [ Modal Flashcard Nhúng ]
   - Hàng đợi SRS toàn diện                        - ToeicLessonFlashcards
   - Đa phương thức (cloze, listen, MCQ)           - VocabStation Quick Mode
   - Đồng bộ Cloud Profile 100%                    - Cùng gọi chung hook FSRS
```

#### 2. Khai Tử Runner TOEIC Cũ — Hợp Nhất Với `ToeicSplitPane`
- **Mục tiêu:** Toàn bộ đề thi TOEIC trong app đều dùng chung một giao diện Split-Pane chuẩn ETS.
- **Kế hoạch hành động:**
  - Cập nhật các bước trong Lộ trình `/journey` để trỏ trực tiếp sang `/toeic/exam/[examId]?part=part5` thay vì trỏ sang `/toeic/[part]/[ref]`.
  - Đánh dấu deprecate và xóa bỏ tệp `src/app/toeic/[part]/[ref]/page.tsx`.

#### 3. Trích Xuất Bộ Khung Khảo Thí Dùng Chung (`ExamSplitPane` & `ExamAudioPlayer`)
- **Mục tiêu:** Cắt giảm 800+ dòng mã trùng lặp trong VSTEP Runner.
- **Kế hoạch hành động:**
  - Trừu tượng hóa `ToeicSplitPane.tsx` thành `ExamSplitPane.tsx` nằm trong `src/components/exam/`.
  - Chuyển `ToeicAudioPlayer.tsx` thành `ExamAudioPlayer.tsx`.
  - Tái cấu trúc `src/app/vstep/exam/[examId]/page.tsx` để tái sử dụng các component này, loại bỏ toàn bộ logic audio và layout tự viết.

---

### Giai Đoạn 3: Tinh Chỉnh Thẩm Mỹ & Trải Nghiệm Khảo Thí (Polish & Technical Minimalist)

#### 1. Làm Mềm Phong Cách Brutalist Trong Ngữ Pháp
- **Mục tiêu:** Đồng bộ giao diện Ngữ pháp với triết lý Technical Minimalist của LingoPro.
- **Giải pháp:** Thay thế `rounded-none` thô ráp bằng `rounded-sm` (4px) hoặc `rounded-md` (6px), viền mảnh `border-slate-200 dark:border-slate-800`, giữ vững sự nghiêm túc, khoa học nhưng không còn cảm giác gắt gỏng như máy tính cổ.

#### 2. Tối Ưu Hóa Split-Pane Cho Màn Hình Di Động (Bottom Sheet Stimulus Tab)
- **Mục tiêu:** Xóa bỏ hoàn toàn "bẫy cuộn dọc" trên tablet và điện thoại.
- **Giải pháp:** Trên màn hình `< lg`, cung cấp thanh chuyển đổi linh hoạt dạng Segmented Tabs cố định ở đỉnh màn hình: `[ 📄 Bài Đọc (Part 7) ]` và `[ ❓ Câu Hỏi (1/3) ]`. Người dùng có thể vuốt ngang hoặc bấm tab để xem trọn vẹn văn bản đọc hoặc chuyển sang chọn đáp án mà không bị mất dấu nội dung.

#### 3. Thay Thế Linh Vật Thú Cưng Bằng Đồng Hồ Năng Lực Chuẩn CEFR
- **Mục tiêu:** Trưởng thành hóa giao diện chúc mừng sau khi hoàn thành ôn tập FSRS.
- **Giải pháp:** Thay icon sư tử `🦁` / gấu trúc `🐼` bằng một vòng tròn phần trăm độ chính xác tối giản (`AccuracyMeter`) kèm huy hiệu năng lực ước tính (ví dụ: `TOEIC Equivalent: 750+` hoặc `CEFR B2 Target`), tạo động lực học thuật chân chính cho người học.

---

## 6. Tổng Kết & Điều Kiện Nghiệm Thu (Sign-off Criteria)

1. **Không Còn Số Liệu Giả Mạo:** 100% số lượt thi và điểm số hiển thị trên toàn app phải đến từ cơ sở dữ liệu thật hoặc siêu dữ liệu bài thi được xác thực.
2. **Loại Bỏ Hoàn Toàn 3 Hệ Thống Flashcard Thừa:** Toàn bộ luồng ôn tập quy tụ về `/review/session`.
3. **Thống Nhất Trình Khảo Thí:** TOEIC và VSTEP chia sẻ chung bộ động cơ Split-Pane và Audio Player chuẩn hóa.
4. **Vượt Qua Chuẩn Công Thái Học Cảm Ứng:** 100% các nút điều khiển âm thanh và thanh trượt tua đạt vùng bấm tối thiểu 44x44px theo Apple HIG.
5. **Đồng Bộ Visual Harmony:** Toàn bộ các module học tập, luyện tập và khảo thí tuân thủ triết lý Technical Minimalist: tinh tế, điềm đạm, không bóng đổ lòe loẹt, không gradient AI sáo rỗng.
