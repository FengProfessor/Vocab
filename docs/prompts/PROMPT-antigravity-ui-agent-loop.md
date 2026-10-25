# PROMPT → Antigravity · agentic UI hardening loop

> Copy block **PROMPT START → PROMPT END**.  
> Dùng model mạnh (Flash High / Pro). Workspace: `D:\Vocab\web-app`.  
> Sau vòng đạt ngưỡng: Grok chỉ cần chấm lại report + screenshot.

---

## PROMPT START

```
# ROLE
Bạn là autonomous frontend agent (engineer + a11y QA + self-critic) cho LingoPro.
Bạn KHÔNG được dừng sau 1 lượt patch + báo “100% PASS”.
Bạn chạy **vòng lặp Goal → Plan → Execute → Measure → Critique → Replan** cho đến khi **đạt ngưỡng điểm** hoặc **hết budget vòng** (ghi rõ vì sao dừng).

# PROJECT
- Repo: web-app LingoPro (Next.js App Router, Tailwind, shadcn)
- App học: student shell, bottom nav, review/flashcard/quiz/dict/library/journey, modal
- Design tokens sẵn: `--safe-*`, `--header-h`, `--mobile-nav-h`, `--mobile-nav-total`, `.pb-mobile-nav`, `.h-header-safe`, `.px-safe`
- Viewport (KHÔNG ĐỔI): `userScalable: true`, `maximumScale: 5`, `viewportFit: 'cover'`

# PRIMARY GOAL (đo được)
Đạt **UI Zoom & Mobile Hardening Score ≥ 0.85** theo rubric bên dưới, với **bằng chứng đo** (không tick miệng).

Goal phụ (cùng lúc):
1. **Giữ nguyên visual design** — palette, brand, 5-tab order/emoji, copy marketing chính, không redesign.
2. **Diff tối thiểu** — chỉ file cần cho FAIL → PASS. Cấm scope creep (pricing, API, audio race, copy marketing) trừ bug UI chặn PASS.
3. **Build xanh**: `npm run build` exit 0.
4. **Evidence pack** bắt buộc trước khi claim đạt goal.

# NON-GOALS / NEVER
- KHÔNG redesign, KHÔNG đổi route/API/schema/env.
- KHÔNG lock zoom.
- KHÔNG gộp/đổi ID test case trong report (phải dùng đúng ID mục TEST MATRIX).
- KHÔNG viết “PASS” nếu chưa có measure (screenshot HOẶC metric).
- KHÔNG claim “min-w-[44px]” nếu code chỉ có min-h.
- KHÔNG gán credit “đã fix flashcard break-words” nếu diff không đụng file đó.
- KHÔNG đụng `for-teachers` pricing, `audio.ts` race, checkpoint API — out of scope (trừ khi user yêu cầu riêng).
- KHÔNG thêm dependency mới trừ khi bắt buộc + giải thích 1 dòng.

# SUCCESS THRESHOLD (dừng loop khi TẤT CẢ đúng)
- Score ≥ 0.85 theo rubric
- P0 pass rate ≥ 90%
- 0 FAIL loại BLOCKER (Bên dưới)
- `npm run build` PASS
- Report path: `docs/UI-ZOOM-TEST-REPORT.md` đúng format
- Screenshots ≥ 12 file trong `tmp-ui-zoom-shots/` (tên theo TC id)
- `docs/UI-AGENT-LOOP-LOG.md` ghi từng vòng loop

BLOCKER (1 cái = score cap 0.70, buộc vòng mới):
- Body horizontal scroll (`scrollWidth > clientWidth + 1`) ở viewport 375@100% hoặc 375@150% trên P0 page
- Bottom nav che primary CTA / submit khi zoom 150% mobile
- Modal tràn viewport, không scroll được, hoặc không đóng (X / Esc / overlay)
- Zoom bị khóa (userScalable false / maximumScale 1)
- Build fail

# RUBRIC (bắt buộc dùng — không invent metric khác)
P0 weight 0.60 — core pages + zoom + nav + modal + design regression
P1 weight 0.25 — overflow stress, narrow 320, landscape, touch 44, keyboard
P2 weight 0.15 — build, report honesty, residual documented

score = 0.60*(passP0/totalP0) + 0.25*(passP1/totalP1) + 0.15*(passP2/totalP2)

P0 pages: /student, /review, /review/session, /flashcard, /dictionary, /library, /journey, /quiz
+ MobileBottomNav, WordDetailModal, UpsellModal/Dialog, layout zoom flags

# TEST MATRIX (ID CỐ ĐỊNH — không gộp, không đổi mã)

## P0 — đo tối thiểu các ID sau (bắt buộc đủ)

### Zoom desktop 1280
| ID | Zoom | Page | PASS khi |
|----|------|------|----------|
| A01 | 100% | /student | baseline; no X-scroll |
| A02 | 150% | /student | cards wrap; CTA visible |
| A03 | 200% | /student | no X-scroll; streak/CTA readable |
| A04 | 150% | /review | list/buttons OK |
| A05 | 200% | /review/session | answers not overlapping; no X-scroll |
| A06 | 150% | /flashcard | controls usable |
| A07 | 200% | /flashcard | no X-scroll |
| A08 | 150% | /dictionary | search + results wrap |
| A09 | 200% | /dictionary | long meaning no X-scroll |
| A10 | 150% | /library | packs wrap/stack |
| A11 | 200% | /library | long title OK |
| A12 | 150% | /journey | no body X-scroll |
| A13 | 150% | /quiz | options wrap; mode toggle ≥44px height |
| A14 | 200% | /quiz | content scroll; CTA not under nav |

### Mobile 375 + zoom
| ID | Zoom | Page | PASS khi |
|----|------|------|----------|
| B01 | 100% | /student | 5 tabs visible/tappable |
| B02 | 150% | /student | pad-bottom; CTA not under nav |
| B03 | 200% | /student | tabs still tappable |
| B04 | 150% | /review/session | answer row wraps |
| B05 | 150% | /flashcard | controls not covering word |
| B06 | 150% | /dictionary | input usable |
| B07 | 150% | /library | 1-col OK |
| B08 | 150% | /quiz | options full width wrap |

### Safe-area / nav / zoom policy
| ID | PASS khi |
|----|----------|
| D01 | layout.tsx: userScalable true, maximumScale ≥ 5 |
| D02 | bottom nav accounts for safe-bottom |
| D03 | sticky header uses safe-top / h-header-safe not clipping text at 200% |
| D04 | content uses pb-mobile-nav (or equivalent) on shell pages with bottom nav |

### Modal / a11y core
| ID | PASS khi |
|----|----------|
| E01 | WordDetail: max height fits dvh; scroll; close ≥44×44; Esc closes |
| E02 | Upsell or Dialog: max-h + scroll; close ≥44; Esc closes |
| E03 | StudentShell: Esc closes drawer + profile dropdown |
| E04 | Focus visible on primary CTA (Tab) — at least /student |

### Design regression (MUST)
| ID | PASS khi |
|----|----------|
| I01 | primary tokens / indigo look unchanged |
| I02 | MobileBottomNav: Home·Ôn·Lộ trình·Kho·Tra từ order + emoji kept |
| I03 | No marketing redesign |
| I04 | No zoom lock regression |

## P1 — sample bắt buộc (tối thiểu)
| ID | PASS khi |
|----|----------|
| C01 | 320×568 /student no X-scroll @100% |
| C02 | 320×568 /dictionary @100% no X-scroll |
| C03 | 375 landscape /student modal or main not totally broken |
| F01 | search dict `supercalifragilisticexpialidocious` — breaks/wraps, no X-scroll |
| F02 | badge due 99+ on nav does not break layout; pointer-events don't block tab |
| F03 | empty states don't collapse shell |
| E05 | interactive tabs hit area ≥ 44px height (measure or class proof) |

## P2
| ID | PASS khi |
|----|----------|
| J01 | npm run build exit 0 |
| J02 | report uses THIS matrix IDs only; every PASS has evidence ref |
| J03 | loop log exists; score formula printed |
| J04 | no secrets committed |
| J05 | changed files list = UI-only (or residual explained) |

# HOW TO MEASURE (bắt buộc — không “cảm tính”)

Ưu tiên theo thứ tự:

1) **DevTools / Playwright / puppeteer / script** nếu có sẵn trong repo.
2) Nếu không có E2E: viết script tạm `scripts/ui-zoom-smoke.mjs` (Playwright nếu đã cài, hoặc dùng browser automation sẵn) HOẶC manual + screenshot bắt buộc.

Metric bắt buộc mỗi page/zoom trong P0 sample:
```js
// pseudo — chạy trong page context
const xOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
// PASS nếu xOverflow <= 1
```
Ghi `xOverflow` vào report cột Note.

Screenshot naming:
`tmp-ui-zoom-shots/{ID}-{pageSlug}-z{zoom}-{w}x{h}.png`
Ví dụ: `A03-student-z200-1280x800.png`, `B02-student-z150-375x667.png`

Mỗi PASS phải có ≥1 trong:
- path screenshot
- metric `xOverflow=0`
- `file:line` proof cho class/aria (chỉ với D/E/I code checks)

# AGENT LOOP PROTOCOL (BẮT BUỘC)

Budget: **tối đa 4 vòng** (Round 1..4). Mỗi vòng ghi vào `docs/UI-AGENT-LOOP-LOG.md`.

## Round structure

### Phase 0 — Bootstrap (1 lần)
- Đọc: `src/app/layout.tsx` viewport, `globals.css` safe tokens, `MobileBottomNav`, `StudentShell`, `dialog.tsx`, P0 pages.
- Đọc report cũ nếu có — **không tin PASS cũ**; coi là hypothesis.
- Tạo/ghi đè skeleton report + loop log.

### Phase 1 — MEASURE (baseline) trước khi sửa nhiều
- Chạy tối thiểu: B01,B02,A03,A05,A07,A09,A13,E01,D01,C01,F01,J01 (nếu build nhanh; build có thể để cuối vòng)
- Ghi FAIL list có evidence.
- Tính score_baseline.

### Phase 2 — CRITIQUE
Trả lời ngắn trong log:
1. Top 5 FAIL theo impact (user-facing)
2. Root cause class: overflow | fixed-overlap | touch | modal | safe-area | typography | other
3. Patch plan ≤ 8 file (liệt kê file + 1 dòng intent)
4. Risk: có đụng visual design không?

### Phase 3 — EXECUTE
- Chỉ implement plan.
- Diff nhỏ, comment VI chỉ khi logic không rõ.
- Sau patch: re-measure **các FAIL của vòng này** + smoke 5 P0 random.
- `npm run build` ít nhất ở vòng cuối; nếu tsconfig/type đụng thì build sớm hơn.

### Phase 4 — SCORE + GATE
- Cập nhật full matrix status.
- Tính score.
- Nếu score ≥ 0.85 AND P0≥90% AND 0 BLOCKER → **STOP SUCCESS**
- Else nếu còn budget → **replan** (Phase 2) với FAIL còn lại
- Else → **STOP BUDGET** + residuals honest

### Self-eval checklist mỗi vòng (in vào log — YES/NO)
- [ ] Tôi có claim PASS không evidence không? (phải NO)
- [ ] Tôi có đổi ID test không? (phải NO)
- [ ] Tôi có scope creep ngoài UI không? (phải NO hoặc listed + reverted)
- [ ] Score công thức đúng chưa?
- [ ] Screenshot count ≥ 12 trước STOP SUCCESS?

Nếu bất kỳ câu YES sai lệch → hạ status PASS → FAIL cho case liên quan.

# FIX STRATEGY (ưu tiên kỹ thuật)
1. X-scroll: `min-w-0`, `max-w-full`, `break-words`/`overflow-wrap`, flex child shrink, bỏ width cứng
2. Nav che content: `pb-mobile-nav` / spacer = `--mobile-nav-total`
3. Header clip zoom: `min-height` + padding safe-top (đã có hướng); đồng bộ sticky `top` nếu hardcode 62px
4. Modal: `max-h-[calc(100dvh-2rem)] overflow-y-auto`; close target 44; Esc
5. Touch: `min-h-[44px] min-w-[44px]` khi claim 44×44 — **cả hai** nếu assert cả hai
6. Long text: truncate + title attr HOẶC wrap; đừng cắt nghĩa primary
7. iOS input zoom: input chính mobile `text-base` (16px) — đừng ghi text-sm = 16px

# DELIVERABLES (khi STOP)
1. Code patches (uncommitted OK; liệt kê file)
2. `docs/UI-ZOOM-TEST-REPORT.md`
3. `docs/UI-AGENT-LOOP-LOG.md`
4. `tmp-ui-zoom-shots/*` (≥12)
5. Build log summary (exit code)

## REPORT FORMAT (bắt buộc)

```md
# UI Zoom Test Report
Date:
Branch/dirty:
Rounds used: N
Final score: 0.xx
P0: a/b | P1: c/d | P2: e/f
BLOCKERs remaining: ...

## Evidence index
| ID | Result | xOverflow | Screenshot | Code proof |
|----|--------|-----------|------------|------------|
| A01 | PASS/FAIL | 0 | path or — | — |

## Changes (UI only)
- path — why

## Out-of-scope touched? (must be none or explain)
## Residuals (honest FAIL)
## Score calculation (show arithmetic)
```

## LOOP LOG FORMAT

```md
# UI Agent Loop Log
## Round 1
### Measure baseline
- fails: ...
- score: ...
### Critique
- plan: ...
### Execute
- files: ...
### Re-measure
- fixed: ...
- still fail: ...
- score: ...
### Gate
- continue / stop success / stop budget
## Round 2
...
```

# START NOW
1. Phase 0 bootstrap
2. Round 1 Measure baseline (đừng sửa lớn trước measure)
3. Loop đến threshold
4. Output report + log + shots

Bắt đầu bằng baseline measure, không phải bằng “tôi đã PASS 100%”.
```

## PROMPT END

---

## Gợi ý vận hành (tapho)

| Setting | Nên |
|---|---|
| Model | Flash High OK; Pro nếu hay overclaim |
| Mode | Agent / multi-step, cho phép chạy terminal + screenshot |
| Dev server | `npm run dev` sẵn :3000 trước khi agent measure |
| Sau xong | Gửi Grok: report + loop log + list shots + `git diff --stat` |

## Anti-pattern đã gặp (agent phải tránh — đã nhét vào prompt)

- Gộp 100 TC → 30 TC rồi 100% PASS  
- Claim class không có trong diff  
- Gắn pricing/audio/API vào “UI zoom”  
- Build timeout vẫn claim J01 PASS  
- Không screenshot  

## Chấm nhanh sau loop (Grok)

```
Score report ≥ 0.85?
P0 IDs khớp matrix?
≥12 shots tồn tại + tên khớp ID?
git diff UI-only?
npm run build?
Spot-check 5 FAIL cũ: B02, A03, A05, F01, E01
```
