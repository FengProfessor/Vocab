# PROMPT → Antigravity · Unify student sidebar (1 shell)

> Copy **PROMPT START → PROMPT END** dán AG (Agent mode).  
> Workspace: `D:\Vocab\web-app`.  
> Grok audit (2026-07-22): dashboard sidebar “mới” (emoji), feature pages dùng `StudentShell` (lệch list), **profile = sidebar Lucide cũ**.

---

## PROMPT START

```
# ROLE
Bạn là senior frontend engineer LingoPro (Next.js App Router, React, Tailwind).
Task: **thống nhất sidebar / nav học sinh = 1 nguồn**, không redesign brand, không đổi route business.

# PROBLEM (user-facing)
- `/student` (Dashboard) có sidebar **custom riêng** — emoji tile, list “mới”, user thấy OK.
- Bấm vào tính năng (journey, review, library, dict, grammar, import, quiz, …) → page dùng **`StudentShell`** — sidebar **khác list** (thêm Hub, luôn hiện Thống kê/BXH, có Đăng xuất icon Lucide, **không** có “Tham gia lớp”).
- `/student/profile` còn sidebar **thứ 3**: Lucide icons + label EN (Mini Quiz, Writing Practice, Import Words, Sign Out) → trông “cũ”.
→ Mỗi lần chuyển trang sidebar **nhảy style / nhảy mục** = cảm giác app không đồng nhất.

# GOAL
1. **Single source of truth** cho student desktop sidebar + mobile drawer.
2. Mọi page học sinh quan trọng dùng **cùng shell** (`StudentShell`) với **cùng navItems + cùng visual emoji tile**.
3. Xóa / ngừng render sidebar duplicate trên Dashboard và Profile.
4. Không đổi URL public, không redesign marketing, build xanh.

# NON-GOALS / NEVER
- KHÔNG redesign palette / marketing / for-teachers.
- KHÔNG đổi API, schema, audio pipeline, FCM.
- KHÔNG lock zoom.
- KHÔNG hardcode secrets.
- KHÔNG gộp WIP dirty ngoài scope (audio, for-teachers pricing, …).
- KHÔNG xóa bottom nav mobile 5 tab (MobileBottomNav) — giữ; chỉ thống nhất **desktop sidebar + drawer menu**.
- KHÔNG biến Hub immersive thành sidebar bắt buộc nếu product muốn hub full-bleed — xem ACCEPTANCE.

---

# CURRENT ARCHITECTURE (phải đọc trước khi sửa)

## Shell A — Dashboard only
- File: `src/app/student/page.tsx`
- Comment trong code: *"Sidebar dashboard (/student) — nav riêng, không dùng StudentShell"*
- `aside` fixed `w-[248px]` + `navItems` local (emoji + tile color)
- Có button **Tham gia lớp**, footer Pro / Nhóm / FB
- Active state BUG-ish: `active = item.href === '/student'` (chỉ đúng khi đang ở home)

## Shell B — StudentShell (canonical target)
- File: `src/components/student/StudentShell.tsx`
- Desktop aside + mobile drawer + header + optional MobileBottomNav
- `navItems` useMemo với `match(pathname)`, emoji tiles
- Có **Hub `/hub`** (👀 Thư viện) — Dashboard A **không** có
- Thống kê + BXH **luôn** trong list (Dashboard A chỉ khi `hasClass`)
- Footer: Pro, Nhóm, FB, **Đăng xuất** (Lucide LogOut)
- Props: `title`, `contentClassName`, `hideMobileNav`, `immersive` (tắt chrome)

## Shell C — Profile (OLD)
- File: `src/app/student/profile/page.tsx`
- Aside riêng: **Lucide** LayoutDashboard, BookOpen, Zap, Pencil, … label EN
- Mobile drawer tương tự — phải bỏ

## Pages already on StudentShell (verify, keep wrapping)
| Route | File | Notes |
|-------|------|--------|
| /journey | journey/page.tsx | |
| /review | review/page.tsx | |
| /review/session | review/session/page.tsx | hideMobileNav often |
| /flashcard | flashcard/page.tsx | hideMobileNav |
| /quiz | quiz/page.tsx | hideMobileNav |
| /writing | writing/page.tsx | hideMobileNav |
| /practice/codemix | practice/codemix/page.tsx | hideMobileNav |
| /grammar/learn | grammar/learn/page.tsx | + SECOND “tiến độ” panel — keep as content panel, NOT app nav |
| /library | library/page.tsx | |
| /dictionary | dictionary/page.tsx | |
| /import | import/page.tsx | |
| /student/leaderboard | student/leaderboard/page.tsx | |
| /hub | hub/page.tsx | immersive — no sidebar by design |
| /student/speaking | student/speaking/page.tsx | |

## Pages MUST migrate
| Route | Now | Target |
|-------|-----|--------|
| /student | Shell A inline | StudentShell + content only |
| /student/profile | Shell C Lucide | StudentShell + content only |

---

# DESIGN DECISIONS (chốt — đừng hỏi lại)

## D1 — Canonical nav = StudentShell list (sau khi align)
Export nav config ra file dùng chung:

**Tạo** `src/lib/student-nav.ts` (hoặc `src/components/student/student-nav.ts`):

```ts
export type StudentNavItem = {
  href: string;
  label: string;
  emoji: string;
  color: string;
  tile: string;
  /** true = ẩn khỏi mobile drawer (vì trùng bottom tab) */
  footerDup?: boolean;
  /** hiện khi đã join lớp */
  requiresClass?: boolean;
  match: (pathname: string) => boolean;
  onboardingId?: string;
};

export function buildStudentNavItems(opts: {
  classroomId?: string | null;
  hasClass: boolean;
}): StudentNavItem[]
```

### Menu order (chốt product)
1. Dashboard → `/student` 🏠  
2. Lộ trình → `/journey` 🗺️ (footerDup)  
3. Ôn tập → `/review` 📚 (footerDup; match review|flashcard|writing|quiz)  
4. Sử dụng từ / Đặt câu → `/practice/codemix` ✨  
5. Ngữ pháp → `/grammar/learn` 🎓  
6. Thư viện từ vựng → `/library` 📦 (footerDup)  
7. Tra từ điển → `/dictionary` 🔍 (footerDup)  
8. Nhập danh sách riêng → `/import` ➕  
9. Thống kê → `/student/profile#stats` 📊 **requiresClass**  
10. Bảng xếp hạng → `/student/leaderboard?class=…` 🏆 **requiresClass**  

### Hub `/hub`
- **KHÔNG** đưa vào primary list (Dashboard hiện không có; tránh “Thư viện” vs “Thư viện từ vựng” trùng tên).
- Nếu cần vào Hub: footer link nhỏ “Hub cộng đồng” **hoặc** giữ entry trong drawer only — **prefer: footer secondary link** `👀 Hub` dưới Pro/Nhóm, không chen primary list.
- `/hub` page vẫn `immersive` (không sidebar) — OK.

### Footer sidebar (mọi page shell)
- Nâng cấp Pro `/upgrade`
- Nhóm của tôi `/group`
- Nhóm live FB (external) — giữ URL hiện có
- **Tham gia lớp** button → mở join modal: hiện **chỉ Dashboard** có modal; trên shell:
  - Option A (preferred): callback prop `onJoinClass?: () => void` + Dashboard pass handler; pages khác Link `/student?join=1` hoặc mở modal nhẹ trong shell nếu logic join đã có sẵn
  - Option B: Link tới `/student` với query `?joinClass=1` + Dashboard đọc query mở modal
  - Chọn **B** nếu join modal nặng / gắn state Dashboard
- Đăng xuất: giữ 1 chỗ — **avatar dropdown** (như dashboard) **hoặc** footer; **không** vừa Lucide vừa emoji lộn xộn. Prefer: footer text/emoji 🚪 + `handleSignOut` (đã có shell).

### Visual
- Emoji tile 30×30 + rounded-[11px] + active `bg-[#eef0ff] text-[#4f46e5]` — **copy từ Dashboard / StudentShell hiện tại**, không Lucide cho primary nav.
- Width sidebar 248px, `md:pl-[248px]`, safe-area — giữ.

---

# IMPLEMENTATION STEPS (thứ tự)

## Step 0 — Audit
- Grep `fixed inset-y-0 left-0` + `StudentShell` + `navItems` trong `src/app/student` và shell.
- List file sẽ sửa.

## Step 1 — Extract `buildStudentNavItems`
- Implement `src/lib/student-nav.ts` theo D1.
- `StudentShell` import và dùng — **xóa** navItems useMemo duplicate trong shell.

## Step 2 — StudentShell polish
- Render nav từ shared config.
- Active = `item.match(pathname)` (profile#stats: match `/student/profile`).
- Mobile drawer: filter `!footerDup`.
- Footer: Pro, Group, FB, optional Hub secondary, Sign out.
- Join class: query `?joinClass=1` support documented; shell có thể có Link “Tham gia lớp” → `/student?joinClass=1`.
- Giữ props: title, hideMobileNav, immersive, contentClassName, children.
- Esc đóng drawer (đã có) — giữ.

## Step 3 — Migrate `/student` Dashboard
- Wrap content bằng `<StudentShell title="Dashboard" contentClassName="…">`.
- **Xóa** toàn bộ aside desktop + mobile drawer duplicate trong `student/page.tsx` (hàng trăm dòng nav).
- Giữ body dashboard (CTA, packs, heatmap, join **modal** state).
- `useSearchParams`: nếu `joinClass=1` → mở join modal + `router.replace` clear query.
- Loading state: vẫn có thể full-page spinner **hoặc** shell + skeleton; prefer shell sớm nếu auth OK.
- Không double padding: shell đã `md:pl-[248px]` + header.

## Step 4 — Migrate `/student/profile`
- Wrap `<StudentShell title="Hồ sơ của tôi">`.
- **Xóa** aside Lucide + mobile nav Lucide cũ.
- Content profile (form, stats sections) giữ nguyên.
- Active “Thống kê” khi hash `#stats` hoặc tab stats — match pathname `/student/profile` đủ.

## Step 5 — Smoke other pages
- Không cần rewrite; chỉ verify vẫn import StudentShell.
- Grammar: panel “Tiến độ” bên trong content — **không** đổi thành app sidebar; đảm bảo không nhầm với shell aside.

## Step 6 — Cleanup
- Không còn `LayoutDashboard` nav list trên profile.
- Grep: second full-width student aside outside StudentShell / teacher — teacher OK giữ.
- `npm run build`

---

# ACCEPTANCE

- [ ] `/student` desktop: sidebar emoji = **cùng component/code path** với `/library`, `/dictionary`, `/journey`
- [ ] `/student/profile`: **không** còn Lucide primary nav; cùng sidebar
- [ ] Chuyển Dashboard → Ôn tập → Thư viện → Dict → Profile → về Dashboard: **sidebar không đổi style/list** (chỉ active highlight đổi)
- [ ] Mobile: bottom 5-tab vẫn; hamburger drawer list consistent (footerDup ẩn đúng)
- [ ] Hub immersive vẫn full-bleed (no sidebar)
- [ ] `rg` không còn nav Lucide block trên profile
- [ ] `npm run build` exit 0
- [ ] Diff không đụng audio/for-teachers/API

---

# VERIFY MATRIX (manual hoặc puppeteer có login)

| # | Action | Expect |
|---|--------|--------|
| 1 | Open /student md+ | Sidebar emoji, list D1 |
| 2 | Click Lộ trình | Same sidebar, Lộ trình active |
| 3 | Click Ôn tập | Same sidebar |
| 4 | Click Thư viện từ vựng | Same |
| 5 | Click Tra từ điển | Same |
| 6 | Click Ngữ pháp | Same shell + grammar progress panel in content |
| 7 | Click Nhập list | Same |
| 8 | Avatar → Hồ sơ | Same sidebar, not Lucide |
| 9 | Mobile drawer | No dup of bottom tabs; same labels |
| 10 | /hub | No desktop sidebar (immersive) |

---

# DELIVERABLES

1. Code: `student-nav.ts` + StudentShell + student/page + profile/page (+ minor join query)
2. `docs/UI-SIDEBAR-UNIFY-REPORT.md`:
```md
# Sidebar Unify Report
## Before/After
## Files changed
## Nav final list
## Manual matrix
## Build
## Residuals
```
3. Handback:

```
### HANDBACK_GROK_SIDEBAR
build: <0|n>
single_source: <path to student-nav>
dashboard_uses_shell: yes|no
profile_uses_shell: yes|no
lucide_profile_nav_removed: yes|no
hub_immersive: yes|no
files: |
  <git diff --stat>
residuals: |
  - ...
### END_HANDBACK
```

# START
1. Read StudentShell + student/page sidebar + profile sidebar  
2. Extract nav  
3. Migrate dashboard + profile  
4. Build + report + handback  

**Cấm** claim “done” nếu profile vẫn Lucide nav hoặc dashboard vẫn aside duplicate.
```

## PROMPT END

---

## Gợi ý tapho

| | |
|---|---|
| Scope | ~3–5 file chính + extract nav |
| Risk | Dashboard layout padding double nếu wrap ẩu — AG phải cẩn thận |
| Sau AG | Paste `HANDBACK_GROK_SIDEBAR` vào Grok |

## Không nhét vào prompt này
- Full zoom score / sticky token (đã ship)
- Teacher sidebar
