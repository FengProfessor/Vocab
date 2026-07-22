# PROMPT → Antigravity · UI P0 sticky + layers + residual harden

> Copy **PROMPT START → PROMPT END** dán AG (Agent mode, terminal + edit code).  
> Workspace: `D:\Vocab\web-app` (hoặc monorepo path tương đương).  
> **Đã ship:** commits UI harden + smoke (nav 44, modal max-h, quiz wrap, auth-wall smoke).  
> **Task này:** sửa residual **P0/P1** Grok audit — **không redesign**, không claim 100% zoom matrix.

---

## PROMPT START

```
# ROLE
Bạn là senior frontend engineer LingoPro (Next.js App Router, Tailwind, shadcn).
Làm **patch UI hardening residual** theo backlog Grok đã audit. Không redesign. Không scope creep.

# CONTEXT (đã xong — ĐỪNG làm lại / đừng “re-score 1.00”)
Đã merge/commit gần đây:
- MobileBottomNav: min-h-[44px], badge pointer-events-none, truncate labels
- StudentShell: Esc đóng drawer/profile
- dialog / WordDetailModal / UpsellModal: max-h-[calc(100dvh-2rem)] overflow-y-auto, close ≥44
- quiz: mode toggle min-h 44, break-words options
- dictionary: min-w-0 + overflow-x-hidden wrapper (chỉ mitigation)
- globals: .h-header-safe dùng min-height (không height cố định)
- scripts/ui-zoom-smoke.mjs: layout-zoom + auth-wall FAIL

**Đừng** viết lại full zoom matrix 46 case. **Đừng** claim score 1.00. Task hẹp = backlog dưới.

# PRIMARY GOAL
1. Xóa magic `top-[62px]` → token sticky dưới header an toàn khi zoom/header min-height.
2. Giảm chồng layer fixed mobile (Install / Notif / Test Firebase dev).
3. Harden dictionary text dài (definition/IPA) bằng min-w-0 + break-words, không chỉ overflow-x-hidden.
4. Header dashboard mobile bớt chật khi hẹp/zoom (chip progress).
5. `npm run build` pass; diff tối thiểu; báo cáo honest.

# NON-GOALS / NEVER
- KHÔNG redesign palette, copy marketing, for-teachers pricing, audio race, API/schema.
- KHÔNG lock zoom (giữ userScalable true, maximumScale ≥ 5).
- KHÔNG hardcode password / commit .env.
- KHÔNG đụng WIP dirty ngoài scope: for-teachers, audio.ts, import flow marketing, checkpoint API — trừ khi file đó **cũng** có `top-[62px]` (chỉ đổi sticky token, không đổi business).
- KHÔNG thêm dependency mới.
- KHÔNG gộp commit với grammar/lingo-town untracked.

---

# BACKLOG (thứ tự bắt buộc)

## P0-1 — Sticky offset token (BẮT BUỘC)

### Vấn đề
`.h-header-safe` = `min-height: calc(var(--header-h) + var(--safe-top))` — zoom/OS font → header **cao hơn 62px**.
Nhiều page con dùng `sticky top-[62px]` → chui dưới header / khe hở sai.

### Việc
1. Trong `src/app/globals.css` (gần `.h-header-safe`):
   - Thêm CSS variable nếu cần, ví dụ:
     `--header-offset: calc(var(--header-h) + var(--safe-top));`
   - Thêm utility:
     ```css
     .top-header-safe {
       top: calc(var(--header-h) + var(--safe-top));
     }
     ```
   - (Tuỳ chọn Tailwind) nếu project dùng @utility — giữ consistent với file hiện có.

2. **Grep toàn `src/`** pattern: `top-[62px]`, `top-[62]`, magic 62 liên quan sticky header.
   File đã biết (verify + fix hết match):
   - `src/app/dictionary/page.tsx`
   - `src/app/quiz/page.tsx`
   - `src/app/writing/page.tsx`
   - `src/app/import/page.tsx`
   - `src/app/grammar/learn/page.tsx`
   - Bất kỳ file khác grep ra

3. Thay bằng class `top-header-safe` **hoặc** `style`/`className` dùng cùng calc token — **không** để magic 62.

4. Acceptance:
   - `rg "top-\[62px\]" src` → **0 match** (hoặc chỉ comment/docs nếu có).
   - Header shell + sub-sticky không overlap khi zoom browser 150% (manual note OK).

## P0-2 — Fixed layers mobile (BẮT BUỘC, dev-safe)

### Vấn đề
Stack:
- MobileBottomNav z-90 bottom
- InstallPrompt z-95 `bottom-[calc(var(--mobile-nav-total)+…)]`
- EnableNotifications z-96 tương tự
- layout.tsx Test Firebase z-9999 bottom-right (dev only)
→ che CTA / form, đặc biệt mobile + dev.

### Việc
1. `src/app/layout.tsx` — nút Test Firebase (NODE_ENV !== production):
   - **Ưu tiên A:** chỉ render trên path `/test-fcm` HOẶC khi `?debugFcm=1`
   - **Ưu tiên B (nếu A khó):** hạ z-index ≤ 40, `bottom` cao hơn nav+prompts, opacity/size nhỏ, `aria-label`, không che center CTA
   - Không hiện production (giữ guard NODE_ENV)

2. `EnableNotifications` + `InstallPrompt`:
   - Nếu **cả hai** show cùng lúc: chỉ show 1 (ưu tiên notif permission default > install) — logic đơn giản trong 1 trong 2 component hoặc cờ sessionStorage `lingopro_prompt_slot`
   - Đảm bảo `bottom` luôn `calc(var(--mobile-nav-total) + …)` — không `bottom-0` đè nav
   - z-index: nav 90 < prompts ≤ 96; không ai ≥ 9999 trừ portal modal

3. Acceptance:
   - Production: zero Test Firebase FAB
   - Dev: FAB không đè bottom nav tabs; hoặc ẩn trừ debug route
   - Không 2 bottom sheets full-width cùng lúc nếu tránh được

## P1-3 — Dictionary long text (NÊN)

File: `src/app/dictionary/page.tsx` (+ component con nếu tách)

1. Các block: definition, IPA, example, synonym chips:
   - `min-w-0`, `break-words` / `overflow-wrap-anywhere` nơi text user/API
   - Flex row có text: parent `min-w-0`, text `flex-1 min-w-0`
2. Giữ search input `text-base` (16px) mobile — chống iOS auto-zoom
3. Không dựa mỗi `overflow-x-hidden` root; nếu giữ hidden root = last resort + comment ngắn
4. Sticky sub-header: đã dùng `top-header-safe` từ P0-1

## P1-4 — Dashboard header mobile chật (NÊN)

File: `src/app/student/page.tsx` (header ~ dòng sticky h-header-safe)

1. Hàng phải: streak / XP / bell / avatar — zoom 150% dễ chật
2. Fix tối thiểu (chọn 1–2, không redesign):
   - Ẩn XP pill sớm hơn: chỉ `md:flex` hoặc gộp streak+xp 1 chip trên mobile
   - Đảm bảo title `Dashboard` + menu `touch-target` không bị co < 44px hit
   - `gap` nhỏ hơn trên mobile (`gap-1`) đã có — tinh chỉnh nếu cần
3. **Không** đổi order 5-tab bottom nav / emoji

## P1-5 — (Optional) Quiz/Writing sticky đã cover bởi P0-1
Chỉ verify sau replace token.

---

# OUT OF SCOPE (ghi residuals, không code)
- Smoke full 46-case score
- Login automation (UI_TEST_EMAIL) — optional note
- Gộp student/page shell với StudentShell
- Teacher tables, hub multiplayer, lingo-town
- Dirty WIP: for-teachers, audio.ts, library copy marketing

---

# IMPLEMENTATION RULES
- TypeScript strict, không `any` mới
- `const` trước `let`
- Comment VI chỉ logic khó; class Tailwind giữ style hiện có
- Diff nhỏ, file list rõ
- Sau patch: `rg "top-\[62px\]" src` + `npm run build`

# VERIFY CHECKLIST (làm + ghi report)

## Automated / CLI
- [ ] `rg "top-\[62px\]" src` → 0
- [ ] `npm run build` exit 0
- [ ] `git diff --stat` chỉ file UI liên quan

## Manual (dev server localhost:3000 — login nếu được)
- [ ] /dictionary: sticky sub-header không chui dưới shell header @ zoom 150%
- [ ] /quiz: tương tự
- [ ] /student mobile width 375: header không vỡ X-scroll; bottom nav tappable
- [ ] Dev: Test Firebase không đè 5 tab (hoặc ẩn)
- [ ] Bật notif prompt + install (nếu trigger được): không double full-bleed

## Evidence
Viết `docs/UI-P0-STICKY-LAYERS-REPORT.md`:
```md
# UI P0 Sticky + Layers Report
Date:
## Changes
- file — why
## Grep
top-[62px] count: 0
## Build
exit: 0
## Manual checks
| Check | Result | Note |
## Residuals
## Diff stat
```

# DELIVERABLE CUỐI — paste cho Grok

```
### HANDBACK_GROK_UI_P0
build: <0|code>
top62_remaining: <n>
files_changed: |
  <git diff --stat>
layers: <what changed for TestFirebase / prompts>
dictionary_breakwords: <yes|partial|no>
dashboard_header: <yes|partial|no>
report: docs/UI-P0-STICKY-LAYERS-REPORT.md
residuals: |
  - ...
### END_HANDBACK
```

# START ORDER
1. Grep `top-[62px]` → list file
2. Add `.top-header-safe` + replace all
3. layout Test Firebase + prompt stack
4. dictionary break-words
5. student header mobile
6. build + report + HANDBACK

Bắt đầu bằng grep output, không bằng “done 100%”.
```

## PROMPT END

---

## Gợi ý tapho

| | |
|---|---|
| Model | Flash High / Pro |
| Trước khi chạy | `npm run dev` optional (manual check) |
| Sau AG | Paste `HANDBACK_GROK_UI_P0` vào Grok |
| Không | Nhét thêm “full zoom score 0.85” vào prompt này — task đã tách |

## Map backlog ↔ file

| ID | Files chính |
|----|-------------|
| P0-1 | `globals.css`, dictionary, quiz, writing, import, grammar/learn, + grep |
| P0-2 | `layout.tsx`, `EnableNotifications.tsx`, `InstallPrompt.tsx` |
| P1-3 | `dictionary/page.tsx` |
| P1-4 | `student/page.tsx` |
