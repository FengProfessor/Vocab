# PROMPT → Antigravity · Gemini 3.6 Flash High

> Copy toàn bộ block `PROMPT START` → `PROMPT END` dán vào Antigravity.  
> Sau khi xong: báo lại PR/branch + file `docs/UI-ZOOM-TEST-REPORT.md` để Grok chấm điểm.

---

## PROMPT START

```
Bạn là senior frontend engineer + a11y QA cho repo LingoPro (Next.js App Router + Tailwind + shadcn).

## MỤC TIÊU
Tối ưu UI **giữ nguyên design hiện tại** (màu, typography, layout, brand, copy, flow).
Chỉ harden cho: zoom browser, font-size OS, viewport hẹp/rộng, overflow, safe-area, touch target, sticky/fixed clash.
Đây là **PASS kiểm thử**, không redesign.

## HARD CONSTRAINTS (NEVER)
1. KHÔNG redesign visual (không đổi palette, radius lớn, font family, hierarchy, tone copy).
2. KHÔNG đổi route, API, business logic, schema Supabase, env.
3. KHÔNG lock zoom: giữ `userScalable: true`, `maximumScale: 5` (layout.tsx).
4. KHÔNG thêm dependency mới trừ khi bắt buộc và giải thích.
5. KHÔNG đụng marketing redesign `/for-teachers` trừ bug layout/overflow rõ.
6. Ưu tiên CSS/layout fix nhỏ: `min-w-0`, `overflow`, `truncate`, `break-words`, `clamp`, flex/grid, padding bottom cho fixed nav, safe-area tokens đã có trong `globals.css`.
7. Diff tối thiểu — chỉ file UI liên quan.

## DESIGN TOKENS ĐÃ CÓ (dùng lại, đừng invent)
- CSS vars: `--safe-top/bottom/left/right`, `--header-h`, `--mobile-nav-h`, `--mobile-nav-total`
- Utilities: `.px-safe`, sticky header safe-area
- Mobile bottom nav: `MobileBottomNav` fixed `z-[90]`, `md:hidden`
- Viewport: device-width, initialScale 1, maximumScale 5, viewportFit cover

## PHẠM VI ƯU TIÊN (theo thứ tự)
P0 (học sinh core):
- `/student` (+ shell + MobileBottomNav)
- `/review`, `/review/session`
- `/flashcard`
- `/dictionary`
- `/library`
- `/journey` (+ checkpoint)
- `/quiz`, `/writing`, `/practice/codemix`
- Modal: WordDetail, Upsell, onboarding/dialog

P1:
- `/profile`, `/student/profile`, `/student/stats`, `/student/leaderboard`
- `/grammar`, `/grammar/learn`
- `/import`, `/upgrade`, `/hub`
- Demo: `/demo/vocab-drill`, `/demo/pack-practice`

P2 (chỉ fix bug vỡ):
- `/auth`, `/landing`, `/download`, teacher pages

## CHIẾN LƯỢC SỬA (cho phép)
- Fixed footer/header che nội dung → padding-bottom/top = nav + safe-area
- Text/button tràn khi zoom 150–300% → min-w-0, wrap, truncate có title, flex-wrap
- Horizontal scroll toàn page → tìm element min-width cứng / grid cột cố định / table
- Touch target < 44×44 → tăng hit area (padding) không đổi icon visual lớn quá
- Dialog/sheet tràn viewport khi zoom → max-h + overflow-y-auto + sticky footer action
- Input zoom iOS (font <16px) → đảm bảo input chính ≥16px trên mobile nếu đang <16
- Image/card vỡ aspect → object-cover + max-w-full
- Sticky + bottom nav đè nhau → z-index + offset nhất quán
- Dark mode contrast crash nếu token đã support — giữ parity, không invent theme mới

## DELIVERABLES (bắt buộc)
1. Code fixes (commit sạch, message imperative EN).
2. File mới: `docs/UI-ZOOM-TEST-REPORT.md` với:
   - Bảng kết quả từng test case (ID | viewport | zoom | page | before | after | PASS/FAIL | note | file:line nếu fix)
   - Tổng: % PASS P0 / P1
   - List residual risks (chưa fix vì out of scope)
   - Screenshot list (nếu chụp được): lưu `tmp-ui-zoom-shots/` tên `TC-xxx-page-zoom.png`
3. Lệnh verify đã chạy: `npm run build` (hoặc lint + typecheck nếu build lâu) — dán kết quả pass/fail.

## CÁCH CHẠY TEST
- Browser: Chrome DevTools (Desktop) + Device toolbar.
- Zoom: Ctrl/Cmd + `+` hoặc DevTools Rendering / page zoom 100/125/150/200/250/300%.
- Font: Windows Settings → Accessibility → Text size 100/125/150% (nếu được).
- Không cần E2E framework; manual checklist + note. Nếu có Playwright sẵn thì optional screenshot.

---

# BỘ TEST CASES (chấm điểm sau — PHẢI điền đủ)

Thang PASS: không horizontal scroll trang; primary CTA visible & tappable; text không đè/cắt mất nghĩa; fixed nav không che form submit; dialog đóng được; không layout shift nổ (CLS thô).

## A. ZOOM BROWSER (Desktop width 1280, rồi 1440)
| ID | Zoom | Page | Check |
|----|------|------|-------|
| A01 | 100% | /student | baseline layout ổn, nav 5 tab |
| A02 | 125% | /student | cards/stats không tràn X |
| A03 | 150% | /student | text wrap, CTA còn thấy |
| A04 | 200% | /student | scroll dọc OK, không double scrollbar X |
| A05 | 250% | /student | header/badge không đè title |
| A06 | 300% | /student | vẫn đọc được core info (tên, streak, CTA ôn) |
| A07 | 150% | /review | list session / due count không vỡ |
| A08 | 200% | /review | buttons full width wrap OK |
| A09 | 150% | /review/session | card + answer buttons không che nhau |
| A10 | 200% | /review/session | progress bar + footer action không overlap |
| A11 | 150% | /flashcard | card flip/area + controls trong viewport |
| A12 | 200% | /flashcard | không overflow X; nút biết/chưa biết tappable |
| A13 | 150% | /dictionary | search input + result list wrap |
| A14 | 200% | /dictionary | long word / IPA / meaning không tràn |
| A15 | 150% | /library | pack grid → stack/wrap, deep-link pack preview OK |
| A16 | 200% | /library | pack title dài không vỡ card |
| A17 | 150% | /journey | roadmap nodes/list scroll, không X-scroll |
| A18 | 200% | /journey | unit title + CTA |
| A19 | 150% | /quiz | question + options, option text dài wrap |
| A20 | 200% | /quiz | submit/next không bị nav che |
| A21 | 150% | /writing | textarea + tips |
| A22 | 200% | /writing | keyboard focus: content không kẹt dưới nav |
| A23 | 150% | /practice/codemix | editor/chips wrap |
| A24 | 200% | /demo/vocab-drill | B1/B2 panels không vỡ |
| A25 | 150% | WordDetail modal (từ /student hoặc dict) | max-h scroll, close X visible |
| A26 | 200% | WordDetail modal | image + meaning + examples stack |
| A27 | 150% | Upsell modal (nếu trigger được) | CTA + close |
| A28 | 200% | any Dialog/Sheet | focus trap + Escape + overlay click |
| A29 | 150% | /profile hoặc /student/profile | form fields không tràn |
| A30 | 200% | /upgrade | pricing cards stack, CTA visible |

## B. ZOOM + MOBILE VIEWPORT (iPhone SE 375×667, iPhone 14 390×844, Pixel 7 412×915)
| ID | Device | Zoom | Page | Check |
|----|--------|------|------|-------|
| B01 | 375 | 100% | /student | bottom nav 5 tab, không clip label |
| B02 | 375 | 150% | /student | content pad-bottom đủ, không che CTA |
| B03 | 375 | 200% | /student | tabs vẫn tappable (hit ≥44px) |
| B04 | 390 | 100% | /review | list OK |
| B05 | 390 | 150% | /review/session | answer row 2–3 nút wrap |
| B06 | 390 | 200% | /flashcard | controls không đè card text |
| B07 | 412 | 100% | /dictionary | search sticky/header OK |
| B08 | 412 | 150% | /dictionary | long EN+VI meaning wrap |
| B09 | 412 | 200% | /library | grid 1 cột, pack CTA |
| B10 | 375 | 150% | /journey | horizontal roadmap? nếu có → scroll container local, không body X |
| B11 | 375 | 200% | /quiz | options full width |
| B12 | 390 | 150% | /grammar | lesson list |
| B13 | 390 | 150% | /import | upload zone + instructions |
| B14 | 375 | 100% | landscape 667×375 | nav + content không vỡ nghiêm trọng |
| B15 | 375 | 150% | landscape | modal max-h fit |
| B16 | 390 | 100% | keyboard open giả lập (focus input dict) | input không bị keyboard/nav double-cover (best effort CSS) |
| B17 | 390 | 150% | /student/stats | charts/cards reflow |
| B18 | 412 | 150% | /student/leaderboard | table/list → cards or horizontal local scroll only |
| B19 | 375 | 200% | toast/sonner | không che nav + readable |
| B20 | 375 | 150% | onboarding tooltip nếu có | không tràn offscreen |

## C. EXTREME NARROW / WIDE
| ID | Viewport | Zoom | Check |
|----|----------|------|-------|
| C01 | 320×568 | 100% | /student + /dictionary không X-scroll |
| C02 | 320×568 | 150% | primary CTA vẫn reachable |
| C03 | 360×740 | 100% | bottom nav labels không truncate mất nghĩa (Home/Ôn/…) |
| C04 | 768×1024 tablet | 100% | md: breakpoint — bottom nav ẩn đúng, desktop layout |
| C05 | 768×1024 | 150% | sidebar/content (nếu có) không overlap |
| C06 | 1024×768 | 100% | library grid |
| C07 | 1280×800 | 150% | teacher `/teacher` nếu login được — table wrap |
| C08 | 1440×900 | 200% | student pages still usable |
| C09 | 1920×1080 | 100% | max-width container không stretch xấu (giữ design) |
| C10 | 280 CSS px (nếu simulate) | 100% | no crash; graceful degrade |

## D. SAFE-AREA / NOTCH / PWA (giả lập env)
| ID | Check |
|----|-------|
| D01 | `viewport-fit=cover` vẫn bật |
| D02 | bottom nav dùng safe-bottom (padding/height total) |
| D03 | sticky header không chui dưới notch (safe-top) |
| D04 | horizontal safe-left/right trên full-bleed buttons |
| D05 | landscape notch: content không bị cắt mép |
| D06 | fixed CTA + bottom nav: chỉ 1 lớp che, content có spacer |
| D07 | iOS home indicator: nav không dính sát 0px |

## E. TOUCH / A11Y (không đổi visual lớn)
| ID | Check |
|----|-------|
| E01 | Mọi tab bottom nav hit area ≥ 44×44 |
| E02 | Icon-only buttons có aria-label |
| E03 | Focus visible trên CTA chính (keyboard Tab) |
| E04 | Modal: focus move vào dialog, Esc closes |
| E05 | Contrast text chính vs bg không tệ hơn baseline (không hạ contrast) |
| E06 | `prefers-reduced-motion`: animation không block UI (nếu có motion nặng) |
| E07 | Zoom 200% + keyboard only: complete 1 flow ôn 1 thẻ |
| E08 | Screen reader thô: heading order trang /student không skip loạn (best effort) |
| E09 | Link/button không chỉ phân biệt bằng màu |
| E10 | Disabled button vẫn không gây layout jump |

## F. OVERFLOW / CONTENT STRESS
| ID | Data / action | Check |
|----|---------------|-------|
| F01 | Từ cực dài: `supercalifragilisticexpialidocious` search dict | break/wrap |
| F02 | Nghĩa VI dài 500+ chars | clamp + expand hoặc wrap, không tràn X |
| F03 | Pack title dài + badge HOT | card height ổn |
| F04 | 99+ badge due count | badge không vỡ nav |
| F05 | Empty state (0 due) | layout không sụp |
| F06 | Loading skeleton | cùng footprint approximate |
| F07 | Error state network | message + retry visible |
| F08 | Image 404 word card | placeholder, không vỡ grid |
| F09 | Table teacher wide columns | scroll local hoặc stack |
| F10 | Code-mix sentence 200 chars | chips wrap |
| F11 | IPA string dài | wrap |
| F12 | Multi-line example EN+VI | line-height không đè |
| F13 | Toast stack 3 messages | không che CTA |
| F14 | Dropdown trong scroll area | không clip sai (hoặc portal) |
| F15 | Sticky section header trong list | không đè bottom nav |

## G. INTERACTION FLOWS (zoom 150% mobile 390)
| ID | Flow | Check |
|----|------|-------|
| G01 | Student → Ôn → session 3 cards → back | nav state đúng |
| G02 | Dictionary search → open detail → TTS/add | buttons reachable |
| G03 | Library mở pack → preview → add (hoặc login gate) | modal OK |
| G04 | Journey mở unit | content scroll |
| G05 | Quiz 1 câu đúng/sai | feedback không đẩy layout vỡ |
| G06 | Flashcard biết/chưa | animation không overflow |
| G07 | Open profile edit display name | save button visible |
| G08 | Upsell trigger (free quota) nếu có | dismiss OK |
| G09 | Switch tab bottom nav ×5 nhanh | no layout flash broken |
| G10 | Rotate portrait↔landscape mid-session | recover layout |

## H. PERFORMANCE UI (nhẹ, quan sát)
| ID | Check |
|----|-------|
| H01 | /library scroll  pack list: không jank nặng do reflow fix |
| H02 | Không thêm blur/shadow filter nặng mới |
| H03 | Không infinite resize listener không debounce |
| H04 | Images có max-width 100% / sizes hợp lý nếu sửa img |

## I. REGRESSION DESIGN (MUST PASS)
| ID | Check |
|----|-------|
| I01 | Màu primary indigo / token gamification không đổi |
| I02 | MobileBottomNav emoji + 5 tab giữ nguyên order |
| I03 | Không đổi copy marketing chính |
| I04 | Light/dark (nếu toggle) không vỡ |
| I05 | Screenshot side-by-side 100% zoom: “trông như cũ”, chỉ bớt vỡ khi zoom |

## J. BUILD / CODE HEALTH
| ID | Check |
|----|-------|
| J01 | TypeScript strict: no new `any` |
| J02 | ESLint clean trên file đụng |
| J03 | `npm run build` pass |
| J04 | Không commit .env / secrets |
| J05 | Báo cáo liệt kê mọi file changed |

---

# SCORING RUBRIC (Grok sẽ chấm sau — bạn tự điền raw data)

- P0 tests (A + B core pages + D + G + I): trọng số 60%
- P1 (C, E, F): 25%
- P2 (H, J, residual): 15%
- Mỗi FAIL P0 trừ nặng; FAIL chỉ cosmetic P1 trừ nhẹ.

Công thức gợi ý trong report:
`score = 0.6*(passP0/totalP0) + 0.25*(passP1/totalP1) + 0.15*(passP2/totalP2)`

## OUTPUT FORMAT REPORT (`docs/UI-ZOOM-TEST-REPORT.md`)

```md
# UI Zoom Test Report — <date> — branch <name>

## Summary
- P0: x/y PASS
- P1: x/y PASS
- P2: x/y PASS
- Score: 0.xx
- Build: PASS/FAIL

## Changes
- file — 1 dòng lý do

## Results table
| ID | Result | Note | Fix |
|----|--------|------|-----|
| A01 | PASS | | |

## Residuals
- ...

## Screenshots
- tmp-ui-zoom-shots/...
```

## THỨ TỰ LÀM VIỆC
1. Audit nhanh P0 pages ở 375 + zoom 200% — list top 10 bugs.
2. Fix theo impact (overflow X, nav che CTA, modal, touch).
3. Chạy full checklist A–J (ít nhất P0 + sample P1).
4. Build + viết report.
5. Dừng — không scope creep feature mới.

Bắt đầu: audit P0 ngay, rồi patch nhỏ nhất đủ PASS.
```

## PROMPT END

---

## Ghi chú cho bạn (tapho) — sau khi Antigravity xong

Gửi Grok:
1. Branch / list file diff  
2. `docs/UI-ZOOM-TEST-REPORT.md`  
3. (Optional) `tmp-ui-zoom-shots/*`

Grok sẽ:
- Đối chiếu rubric score  
- Spot-check 10–15 TC quan trọng (A04, A12, B02, B06, C01, D02, E01, F01, G01, I01–I05)  
- Báo **tốt thật / chỉ pass giấy** + patch bổ sung nếu cần
