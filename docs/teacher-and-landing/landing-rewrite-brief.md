# BRIEF: Viết lại landing `/for-teachers` (Gia sư · Giáo viên · Trung tâm)

> Bạn (Gemini) là senior Next.js/React/Tailwind engineer. Đọc kỹ brief này rồi **sửa code thật** trong repo. KHÔNG hỏi lại, tự thực thi đến khi xong.

## File phạm vi (CHỈ 2 file)
1. `src/app/for-teachers/page.tsx` — server component (giữ `export const metadata`), viết lại theo IA mới.
2. `src/components/marketing/TeacherPilotClient.tsx` — thêm 2 client component mới: `AudienceTabs`, `FaqAccordion`. Giữ nguyên `PilotLink`, `CenterLeadForm`, `TeacherLandingTracker`, `Field`.

## LUẬT CỨNG (vi phạm = hỏng)
- KHÔNG đổi schema Supabase, billing, dependencies. KHÔNG thêm package mới. KHÔNG sửa `package.json`.
- KHÔNG sửa `src/lib/analytics.ts`. CHỈ dùng các event đã có: `teacher_landing_viewed`, `teacher_pilot_cta_clicked` (qua `PilotLink`). Tương tác tab/FAQ là UI state thuần — KHÔNG gọi `track()` với event mới.
- Mọi tương tác (tab, accordion, form) phải ở client component (`'use client'`) trong `TeacherPilotClient.tsx`. `page.tsx` GIỮ là server component để `metadata` hoạt động.
- TypeScript strict, KHÔNG `any`. Comment phức tạp bằng tiếng Việt.
- Chỉ dùng icon CÓ THẬT trong `lucide-react`. Dùng trong nhóm: `ArrowRight, BarChart3, BookOpenCheck, Brain, Check, CheckCircle2, ChevronDown, ChevronRight, CircleGauge, Clock3, GraduationCap, Layers3, LineChart, MessageCircle, MessageSquareText, School, ShieldCheck, Smartphone, Sparkles, Target, TrendingUp, UserRoundCheck, Users, WandSparkles, X, Zap`.
- Contract `PilotLink` (GIỮ NGUYÊN): props `{ plan: 'tutor'|'teacher_pro'|'center'; placement: string; href: string; className: string; children }`.
- Sau khi sửa: `npm run lint` phải pass (mình sẽ chạy lại). Viết code compile được.

## HỆ MÀU (Tailwind arbitrary values — giữ y hệt brand)
- Nền sáng: `#f7f8f2` · mực: `#17231d` · phụ: `#526057` `#657269` `#9caaa1`
- Accent lime: `#d7ff64` (shadow chunky `#b9df4d`) · teal: `#74cbb2` · cảnh báo: `#ff8069`/`#ff9c89` · xanh chữ nhấn: `#567600`
- Giữ phong cách chunky: nút chính `bg-[#17231d] text-white shadow-[0_12px_0_#b9df4d] hover:-translate-y-1`, bo góc lớn `rounded-[2rem]`.

## ❌ XÓA HẲN (P1 — quan trọng nhất)
- Toàn bộ section `id="kiem-dinh"` (Kế hoạch kiểm định 60 ngày, mảng `validationMetrics`, "Quy tắc quyết định giá").
- Mọi chữ "pilot" / "Giá pilot" / "kiểm định" trong COPY HIỂN THỊ. (Giữ key `tutor/teacher_pro/center` và `placement` string trong code + giữ href `?pilot=` vì auth dùng tham số đó — CHỈ bỏ chữ "pilot" ở text người dùng đọc.)
- Badge "Gói cần kiểm định trước" → đổi "Phổ biến nhất". Bỏ link nav `#kiem-dinh`, thêm link `#faq`.

## IA MỚI page.tsx (thứ tự section)
1. **Header sticky** (giữ): logo, nav `#giai-phap · #tinh-nang · #bang-gia · #faq`, CTA `Tạo lớp miễn phí`.
2. **Hero + AudienceTabs**: dùng `<AudienceTabs />` (client) — tab Gia sư / Giáo viên / Trung tâm, đổi headline+sub+3 bullet theo nhóm (nội dung ở mục "AudienceTabs" bên dưới). Bên phải giữ mockup dashboard hiện có. Dual CTA: `Tạo lớp miễn phí` (PilotLink plan=teacher_pro placement=hero) + `Xem bảng giá` (#bang-gia). Dòng trust: `Không cần thẻ · Hủy bất cứ lúc nào · Dữ liệu học sinh bảo mật`.
3. **Dải kết quả** (3 cột): sửa copy bỏ chữ "Mục tiêu" → lợi ích trực tiếp:
   - Clock3 — "Tiết kiệm 2–4 giờ/tuần" / "soạn bài, chấm và nhắc ôn thủ công"
   - Target — "1 dashboard" / "nắm tiến độ, độ chính xác và từ khó của cả lớp"
   - UserRoundCheck — "Nhắc ôn tự động" / "mỗi học sinh có lịch ghi nhớ riêng theo FSRS"
4. **So sánh "Cách làm hiện tại vs LingoPro"** (P5): bảng 2 cột, tiêu đề cột phải `Sheet + Quizlet + Zalo (cách cũ)`, cột trái `LingoPro`. Các hàng giữ nguyên 5 khả năng cũ. Thêm 1 câu: "LingoPro là lớp học tập (learning layer) — bổ sung cho phần mềm quản lý/điểm danh trung tâm đang dùng, không thay thế."
5. **Quy trình 3 bước** (giữ workflow array).
6. **Lưới tính năng** (giữ features array, id `#tinh-nang`).
7. **Mockup sản phẩm** (P4 — thêm): 3 card mô phỏng UI bằng CSS (KHÔNG ảnh thật, KHÔNG bịa screenshot): (a) "Học sinh thấy gì" — flashcard ôn từ, (b) "Giáo viên thấy gì" — dashboard lớp, (c) "Ngữ pháp" — bài tập có chấm. Tiêu đề section: "Thấy đúng những gì thầy cô và học sinh sẽ dùng." Mỗi card stylized UI mock đơn giản, nhãn rõ "Minh họa giao diện".
8. **Giá trị theo vai trò** (P2 — thêm): 3 card JTBD:
   - Gia sư 1:1/nhóm nhỏ: "Giảm 2–4 giờ soạn & chấm mỗi tuần. Giữ học viên bằng kết quả thấy được. HS được nhắc ôn tự động để buổi học không phải ôn lại từ cũ."
   - Giáo viên nhiều lớp: "Một dashboard nắm cả lớp. Thấy ai tụt TRƯỚC khi điểm rớt. Giao drill đúng lỗi thay vì giao đại trà."
   - Chủ trung tâm: "Chuẩn hóa chất lượng nhiều giáo viên. Báo cáo tiến độ cho phụ huynh. Onboarding đội ngũ. Bổ sung learning layer cho phần mềm CRM sẵn có."
9. **Bảng giá** (id `#bang-gia`, giữ 3 gói + plans array): sửa copy theo bảng dưới. Thêm dòng risk-reversal dưới grid giá: `Không cần thẻ · Hủy bất cứ lúc nào · Hỗ trợ tiếng Việt`. Nút gói center → text "Đặt lịch demo".
10. **Tư vấn trung tâm + form** (id `#tu-van-trung-tam`, giữ `<CenterLeadForm />`): thêm nút phụ "Chat Zalo tư vấn" (component `<ZaloButton />` hoặc link trực tiếp) bên cạnh, dùng icon `MessageCircle`. Link Zalo dùng hằng `const ZALO_URL = 'https://zalo.me/'` + comment `{/* TODO: thay link Zalo OA thật của LingoPro */}`.
11. **FAQ** (id `#faq`, P3 — thêm): `<FaqAccordion />` (client) với 8 câu ở mục "FAQ" bên dưới.
12. **CTA cuối** (giữ): thêm dòng trust nhỏ dưới nút: `Không cần thẻ · Dữ liệu học sinh bảo mật`.
13. **Footer** (giữ).

## Copy bảng giá — sửa
- `metadata`: giữ title, mở rộng description + thêm `keywords: ['phần mềm quản lý lớp học tiếng Anh','app học từ vựng cho học sinh','dashboard giáo viên tiếng Anh','FSRS','học từ vựng AI']` và `openGraph: { title, description, type:'website' }`.
- Tiêu đề section giá: "Giá minh bạch, hủy bất cứ lúc nào." (bỏ "để kiểm định").
- Phụ đề giá: bỏ câu "Đây là giá pilot 60 ngày..." → "Chọn gói theo quy mô lớp. Bắt đầu miễn phí, nâng cấp khi cần."
- plans note: tutor `"Ưu đãi early-access"` · teacher_pro `"Phù hợp nhất"` · center `"Báo giá theo quy mô"`.
- Badge featured: "Phổ biến nhất".
- Nút: tutor/teacher_pro = `Tạo lớp miễn phí` (href giữ `/auth?mode=signup&role=teacher&pilot=<key>`), center = `Đặt lịch demo` (href `#tu-van-trung-tam`).

## AudienceTabs (client, trong TeacherPilotClient.tsx)
- State `useState<'tutor'|'teacher'|'center'>('teacher')`. 3 nút tab pill. Đổi nội dung:
  - **tutor** (Gia sư): badge "Cho gia sư 1:1 & nhóm nhỏ" · H1 "Dạy sát từng em. Không cần thêm giờ." · sub "Giảm 2–4 giờ soạn và chấm mỗi tuần, giữ học viên bằng kết quả thấy rõ." · bullets: ["Nhắc học sinh ôn tự động theo FSRS","Thấy ngay từ/cấu trúc em đang yếu","Tạo lớp và mời học sinh trong vài phút"]
  - **teacher** (Giáo viên): badge "Cho giáo viên nhiều lớp" · H1 "Biết ai cần giúp, trước khi điểm rớt." · sub "Một dashboard cho mọi lớp — can thiệp đúng người, đúng lúc." · bullets: ["Dashboard tiến độ cả lớp theo thời gian thực","Phát hiện học sinh hụt nhịp sớm","Giao drill đúng lỗi thay vì đại trà"]
  - **center** (Trung tâm): badge "Cho trung tâm & chuỗi" · H1 "Chuẩn hóa chất lượng dạy trên mọi lớp." · sub "Theo dõi nhiều giáo viên, báo cáo cho phụ huynh, onboarding đội ngũ nhanh." · bullets: ["Bổ sung learning layer cho phần mềm CRM sẵn có","Báo cáo tiến độ gửi phụ huynh","Onboarding & hỗ trợ triển khai riêng"]
- Mỗi tab có dual CTA: chính = `PilotLink` plan tương ứng (tutor→tutor, teacher→teacher_pro, center→center) placement `hero_<tab>`; center CTA href=`#tu-van-trung-tam` text "Đặt lịch demo", 2 tab kia href=`/auth?mode=signup&role=teacher&pilot=<plan>` text "Tạo lớp miễn phí". CTA phụ luôn `Xem bảng giá` → `#bang-gia`.
- Render gọn, dùng đúng hệ màu sáng. Tab active: `bg-[#17231d] text-[#d7ff64]`; inactive: `bg-white border`.

## FaqAccordion (client)
- Mảng 8 `{q,a}` (dùng đúng nội dung này):
  1. "Học sinh có phải trả tiền không?" — "Không. Học sinh tham gia lớp miễn phí bằng mã lớp; chỉ tài khoản giáo viên/trung tâm mới có gói trả phí."
  2. "Có cần cài đặt phần mềm không?" — "Không. LingoPro chạy trên trình duyệt (PWA), thêm vào màn hình chính như một app. Có thêm Chrome Extension để tra & lưu từ khi đọc web."
  3. "Học sinh dùng trên điện thoại được không?" — "Được. Giao diện thiết kế mobile-first, học sinh học mọi lúc trên điện thoại."
  4. "Dữ liệu học sinh có an toàn không?" — "Có. Mỗi giáo viên chỉ thấy lớp của mình nhờ bảo mật theo dòng (RLS) ở tầng cơ sở dữ liệu. Chúng tôi không bán dữ liệu."
  5. "LingoPro khác Quizlet / Anki ở đâu?" — "LingoPro thêm lớp quản lý lớp học, AI làm giàu từ vựng và dashboard phát hiện học sinh tụt — những thứ Quizlet/Anki không có."
  6. "Có hỗ trợ tiếng Việt không?" — "Có. Toàn bộ sản phẩm và hỗ trợ đều bằng tiếng Việt."
  7. "Mất bao lâu để bắt đầu?" — "Vài phút: tạo lớp, gửi mã lớp, học sinh tham gia và bắt đầu học ngay."
  8. "Có thể hủy bất cứ lúc nào không?" — "Được, không ràng buộc hợp đồng."
- Accordion: mỗi item là `<button>` toggle `useState` index mở, icon `ChevronDown` xoay khi mở. Không gọi analytics.

## Sau khi xong
- In ra danh sách file đã sửa và tóm tắt ngắn các thay đổi.
- ĐỪNG chạy git commit. ĐỪNG xóa file khác.
