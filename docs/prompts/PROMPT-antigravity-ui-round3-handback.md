# PROMPT R3 → Antigravity · UI Zoom hardening (VALID measure only)

> **Copy toàn bộ block PROMPT START → PROMPT END** dán Antigravity (Agent mode, quyền terminal + browser).  
> Workspace: `D:\Vocab\web-app` (hoặc path monorepo tương đương).  
> Dev server: `npm run dev` → `http://localhost:3000` **trước** khi measure.  
> **Kết quả bắt buộc handback về phiên Grok hiện tại** (format §HANDBACK).

---

## PROMPT START

```
# IDENTITY
Bạn là autonomous frontend + QA agent cho LingoPro (Next.js App Router, Tailwind, shadcn).
Bạn vừa bị REJECT score 1.00 vì measurement invalid. Lần này: **đo đúng hoặc FAIL honest**.

# PRIMARY GOAL (đo được)
Đạt **Valid Score ≥ 0.85** theo rubric, với **VALID measurement** (định nghĩa cứng bên dưới).
Giữ visual design hiện tại (không redesign). Diff UI tối thiểu. Build xanh.

# CONTEXT — LỖI ĐÃ BỊ BẮT (BẮT BUỘC ĐỌC — ĐỪNG LẶP LẠI)

## Reject #1 (paper pass)
- Claim 100% PASS, gộp/đổi test ID, không screenshot, claim class không có trong diff.

## Reject #2 (automation pass — score 1.00 ảo)
1. **Mobile zoom VOID**: `vpWidth = isMobile ? width : width/zoom` → B02/B03 = B01 (ảnh identical).
2. Desktop “zoom” chỉ thu viewport; file name ghi 1280x800 trong khi setViewport 640 — OK nếu **ghi rõ method**, nhưng mobile phải cùng công thức.
3. **Chỉ assert xOverflow** → bỏ qua CTA che nav, touch 44, Esc, long text.
4. **Onboarding modal** che page → shot không đo UI thật.
5. Claim `min-w-[44px]` trong khi code chỉ `min-h-[44px] min-w-0`.
6. `overflow-x-hidden` trên dictionary có thể **giấu** overflow; không được dùng làm proof duy nhất nếu interactive bị clip.
7. Hardcode password trong script — dùng env `UI_TEST_EMAIL` / `UI_TEST_PASSWORD`.

Nếu lặp bất kỳ lỗi trên → **tự REJECT** score, không STOP SUCCESS.

---

# VALID MEASUREMENT SPEC (luật cứng)

## M1 — Zoom simulation (bắt buộc giống nhau mobile + desktop)
Dùng **MỘT** trong hai method; ghi rõ trong report:

### Method A — Layout zoom (khuyến nghị Puppeteer)
```js
const z = zoom / 100; // 1 | 1.5 | 2
await page.setViewport({
  width: Math.max(320, Math.round(cssWidth / z)),
  height: Math.max(480, Math.round(cssHeight / z)),
  deviceScaleFactor: z, // optional visual density
  isMobile,
  hasTouch: isMobile,
});
// Report field: method=layout-zoom, cssTarget=WxH, actualViewport=vpW x vpH, z=z
```
**CẤM** nhánh `isMobile ? width : width/z`. Mobile **cũng** chia cho z.

### Method B — True page scale (nếu hỗ trợ CDP)
```js
const client = await page.createCDPSession();
await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: z });
// viewport giữ cssWidth x cssHeight
```
Ưu tiên B nếu ổn định; không được thì A **đúng công thức**.

## M2 — Dismiss chrome trước measure
Mỗi test case, sau goto, **trước** metric + screenshot:
1. Dismiss onboarding / welcome / tour:
   - Click button/text chứa /i (Bỏ qua|Skip|Đóng|Xong|Bắt đầu)/ nếu visible
   - Hoặc set localStorage/sessionStorage keys app dùng (tìm trong code onboarding) rồi reload 1 lần
2. Đóng toast sonner nếu che CTA (best effort)
3. Log `chromeCleared: true/false` — nếu false, case **không được PASS** các check phụ thuộc UI (max PARTIAL, score partial 0.5 cho case đó)

## M3 — Multi-assert (PASS chỉ khi ALL required true)

Mỗi page case (A*, B*, C*):
| Key | Rule |
|-----|------|
| xOverflow | `documentElement.scrollWidth - clientWidth <= 1` |
| noBodyXScroll | same on `document.body` |
| navOverlap | Nếu có bottom nav fixed: primary CTA (hoặc main `a[href*="review"], button` đầu tiên visible) — bottom edge **không** nằm trong vùng nav top±2px bị che (intersect area = 0 với nav bbox). Nếu không tìm CTA → `navOverlap=n/a` không FAIL. |
| shot | file tồn tại size > 5KB |

Case E05 / B0x tabs:
| touchMin | mỗi tab link trong `[data-onboarding=mobile-nav]` hoặc `nav[aria-label*="Điều hướng"]` → height≥44 AND width≥40 (width 40 vì flex-1; height bắt buộc ≥44) |

Case E01/E02/E03 (runtime, không code-read):
| escWorks | mở UI → key Escape → panel/modal closed (display none / removed / aria-hidden) |

Case F01:
| longWord | type `supercalifragilisticexpialidocious` vào input search dict → xOverflow≤1 sau 500ms |

Case D01:
| zoomPolicy | đọc `src/app/layout.tsx` source: userScalable true, maximumScale≥5 |

## M4 — Evidence bắt buộc mỗi PASS
- Screenshot path + **actualViewport** + method + z
- Metrics JSON line: `{ id, xOverflow, navOverlap, chromeCleared, ... }`
- Code proof **chỉ** cho D/I static — không thay runtime cho A/B/C/E/F

## M5 — Anti-cheat
- CẤM `overflow-x-hidden` / `overflow: hidden` trên html/body/root **chỉ để** pass xOverflow mà không fix child. Nếu thêm overflow-x-hidden trên wrapper page: phải assert **không** clip focusable (check `document.elementFromPoint` trên mid of primary button vẫn là button/link).
- CẤM claim class không có trong `git diff`.
- CẤM đổi/gộp test ID.
- CẤM STOP SUCCESS nếu B02/B03 screenshot perceptual hash gần identical với B01 (tự so file size + dimensions + optional pixel diff; nếu |size delta|<2% và viewport actual giống nhau → FAIL measurement).

---

# SCOPE

## IN (được sửa)
- `src/app/globals.css`, layout tokens safe-area
- `MobileBottomNav.tsx`, `StudentShell.tsx`
- `dialog.tsx`, `WordDetailModal.tsx`, `UpsellModal.tsx`
- P0 pages UI classes: student, review, review/session, flashcard, dictionary, library, journey, quiz
- `scripts/ui-zoom-smoke.mjs` (viết lại cho VALID measure)
- `docs/UI-ZOOM-TEST-REPORT.md`, `docs/UI-AGENT-LOOP-LOG.md`
- `tmp-ui-zoom-shots/`, `tmp-ui-zoom-results.json`
- `tsconfig` exclude scratch/tmp nếu cần build
- puppeteer **đã có** — không cần thêm dep mới trừ thiếu

## OUT (cấm đụng trong task này)
- for-teachers pricing, API routes, audio race, supabase, marketing copy
- Commit secrets; hardcode password (env only)

## DESIGN KEEP
- 5 tab: Home · Ôn · Lộ trình · Kho · Tra từ + emoji
- Palette indigo / gamification tokens
- `userScalable: true`, `maximumScale: 5`

---

# TEST MATRIX (ID cố định — 46 cases)

## P0 (34) — weight 0.60

### A desktop cssTarget 1280×800
| ID | z | path |
|----|---|------|
| A01 | 100% | /student |
| A02 | 150% | /student |
| A03 | 200% | /student |
| A04 | 150% | /review |
| A05 | 200% | /review/session |
| A06 | 150% | /flashcard |
| A07 | 200% | /flashcard |
| A08 | 150% | /dictionary |
| A09 | 200% | /dictionary |
| A10 | 150% | /library |
| A11 | 200% | /library |
| A12 | 150% | /journey |
| A13 | 150% | /quiz |
| A14 | 200% | /quiz |

PASS A*: M2 chromeCleared + xOverflow + noBodyXScroll + shot. A13/A14 thêm mode toggle height≥44 nếu tìm thấy.

### B mobile cssTarget 375×667 — **zoom PHẢI áp dụng**
| ID | z | path |
|----|---|------|
| B01 | 100% | /student |
| B02 | 150% | /student |
| B03 | 200% | /student |
| B04 | 150% | /review/session |
| B05 | 150% | /flashcard |
| B06 | 150% | /dictionary |
| B07 | 150% | /library |
| B08 | 150% | /quiz |

PASS B*: như A* + navOverlap khi nav visible + actualViewport width = round(375/z) (±1) khi dùng Method A.

### D static/runtime
| ID | Check |
|----|-------|
| D01 | layout zoom policy |
| D02 | bottom nav safe-bottom (code: class/CSS var) |
| D03 | h-header-safe min-height not fixed height clipping |
| D04 | pb-mobile-nav on shell content when nav shown |

### E
| ID | Check |
|----|-------|
| E01 | WordDetail max-h + close≥44 + Esc (runtime nếu mở được; else code+manual note FAIL partial) |
| E02 | Dialog/Upsell max-h + Esc |
| E03 | StudentShell Esc closes drawer/profile (runtime: open menu then Esc) |
| E04 | :focus-visible ring exists on a primary control (code or runtime) |

### I design regression
| ID | Check |
|----|-------|
| I01 | tokens untouched |
| I02 | tab order+emoji |
| I03 | no marketing redesign |
| I04 | zoom unlock |

## P1 (7) — weight 0.25
| ID | Check |
|----|-------|
| C01 | 320×568 /student z100 — xOverflow0 + chromeCleared |
| C02 | 320×568 /dictionary z100 — xOverflow0; nếu overflow-x-hidden: elementFromPoint CTA OK |
| C03 | 667×375 landscape /student z100 — not broken + xOverflow0 |
| F01 | long word dict |
| F02 | badge pointer-events-none (code) + nav not broken |
| F03 | empty shell OK (best effort) |
| E05 | tabs height≥44 measured |

## P2 (5) — weight 0.15
| ID | Check |
|----|-------|
| J01 | npm run build exit 0 |
| J02 | report IDs exact + every A/B/C PASS has metrics JSON |
| J03 | loop log + score arithmetic |
| J04 | no secrets in git (script uses env) |
| J05 | git diff UI-scope only (list files) |

---

# SCORING

```
score = 0.60*(p0) + 0.25*(p1) + 0.15*(p2)
```
- PASS = 1, FAIL = 0, PARTIAL = 0.5 (chỉ khi chromeCleared false hoặc modal runtime blocked)
- **BLOCKER** (cap score ≤ 0.70): body X-scroll 375@z1.0/1.5 P0; zoom locked; build fail; B02 actualViewport === B01 actualViewport khi z khác nhau (measurement void)

**STOP SUCCESS** chỉ khi:
- score ≥ 0.85
- P0 ≥ 0.90
- 0 BLOCKER
- B02 actualViewport.width != B01 actualViewport.width (Method A) HOẶC pageScale khác (Method B)
- ≥ 20 screenshots after chrome clear
- `tmp-ui-zoom-results.json` có field `method`, `actualViewport`, `chromeCleared` cho mọi A/B/C

---

# AGENT LOOP (max 4 rounds)

## Round structure → append `docs/UI-AGENT-LOOP-LOG.md`

### Phase 0 — Bootstrap
- Đọc script cũ, **rewrite** `scripts/ui-zoom-smoke.mjs` theo VALID SPEC trước measure chính.
- Tìm cách dismiss onboarding trong codebase (`onboarding`, `FeatureGuide`, localStorage keys).
- Auth: `process.env.UI_TEST_EMAIL` + `UI_TEST_PASSWORD` (fallback skip login pages public nếu env thiếu — note limitation).

### Phase 1 — Baseline measure (VALID script, minimal extra product code)
- Run smoke → results JSON + shots
- List FAIL honestly
- Verify B01 vs B02 actualViewport differ

### Phase 2 — Critique
- Top FAIL root causes
- Patch plan ≤ 10 files

### Phase 3 — Execute patches
- Fix UI; re-run smoke
- `npm run build`

### Phase 4 — Gate
- Compute score; self-eval checklist:
  - [ ] Mobile zoom applies? (viewport or scale differs)
  - [ ] B02 shot not clone of B01?
  - [ ] No false min-w claim?
  - [ ] Onboarding dismissed?
  - [ ] Multi-assert not only xOverflow?
  - [ ] overflow-x-hidden audited?
- If fail gate → Round 2…

---

# SCRIPT REQUIREMENTS (`scripts/ui-zoom-smoke.mjs`)

Must:
1. Valid zoom M1
2. Dismiss chrome M2
3. Multi-assert M3
4. Write `tmp-ui-zoom-results.json` full
5. Shots: `tmp-ui-zoom-shots/{ID}-{slug}-z{zoom}-css{W}x{H}-vp{vpW}x{vpH}.png`
6. Exit code 1 if any BLOCKER
7. Print summary table + score hint
8. No hardcoded passwords

Optional: pixel compare B01/B02 file sizes warn if identical.

---

# DELIVERABLES

1. Patched UI + rewritten smoke script  
2. `docs/UI-ZOOM-TEST-REPORT.md` (format dưới)  
3. `docs/UI-AGENT-LOOP-LOG.md`  
4. `tmp-ui-zoom-shots/*` (≥20)  
5. `tmp-ui-zoom-results.json`  
6. Build exit code  
7. **§HANDBACK block** (copy nguyên văn vào chat Grok phiên này)

## REPORT FORMAT

```md
# UI Zoom Test Report R3
Date:
Method: layout-zoom | page-scale
Rounds:
Valid Score:
P0/P1/P2:
BLOCKERs:

## Measurement sanity
- B01 actualViewport: ...
- B02 actualViewport: ...
- B03 actualViewport: ...
- B01≠B02 viewport? YES/NO

## Results
| ID | Result | xOverflow | navOverlap | chromeCleared | actualViewport | shot |
|----|--------|-----------|------------|---------------|----------------|------|

## git diff --stat (UI)
## Score arithmetic
## Residuals (honest)
```

---

# §HANDBACK — OUTPUT CUỐI CÙNG CHO GROK (BẮT BUỘC)

Khi STOP (success hoặc budget), in **đúng block sau** để user paste vào phiên Grok:

```
### HANDBACK_GROK_UI_R3
valid_score: <0.xx>
p0: <a/b>
p1: <c/d>
p2: <e/f>
blockers: <0|list>
method: <layout-zoom|page-scale>
b01_viewport: <w x h>
b02_viewport: <w x h>
b03_viewport: <w x h>
viewport_diff_b01_b02: <yes|no>
chrome_clear_rate: <x/y>
shots_count: <n>
results_json: tmp-ui-zoom-results.json
report: docs/UI-ZOOM-TEST-REPORT.md
loop_log: docs/UI-AGENT-LOOP-LOG.md
build: <exit code>
diff_stat: |
  <paste git diff --stat for touched files>
top_fixes: |
  - file: reason
residuals: |
  - ...
self_eval: |
  - mobile_zoom_valid: yes/no
  - no_false_minw_claim: yes/no
  - multi_assert: yes/no
  - onboarding_dismissed: yes/no
### END_HANDBACK
```

User sẽ paste block này + (nếu cần) JSON vào Grok. Grok chấm lại — **không tự claim “Grok đã approve”**.

---

# START ORDER
1. Rewrite smoke script (VALID) first  
2. Baseline measure → prove B01≠B02 viewport  
3. Patch FAIL only  
4. Re-measure → score  
5. Build  
6. Write report + log + HANDBACK  

**Cấm** mở đầu bằng “Score 1.00”. Mở bằng baseline FAIL list + viewport sanity.
```

## PROMPT END

---

## Checklist cho bạn (tapho) trước khi chạy

```powershell
cd D:\Vocab\web-app
npm run dev
# terminal khác — nếu có user test:
$env:UI_TEST_EMAIL="..."
$env:UI_TEST_PASSWORD="..."
```

Sau Antigravity xong: **paste nguyên `### HANDBACK_GROK_UI_R3` … `### END_HANDBACK`** vào chat này (+ đính kèm report nếu dài).

## Grok sẽ chấm (phiên này)

1. `viewport_diff_b01_b02 == yes`  
2. Đọc `tmp-ui-zoom-results.json` + 3 shot B01/B02/B03  
3. `git diff` vs claim  
4. Spot-check E05 class, dictionary overflow, script zoom formula  
5. Valid score độc lập — không copy 1.00 của agent  
