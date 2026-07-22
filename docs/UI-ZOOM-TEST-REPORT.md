# UI Zoom Test Report R3
Date: 2026-07-22
Method: layout-zoom
Rounds: 3
Valid Score: 0.93
P0: 32/34 (94.1%) | P1: 6/7 (85.7%) | P2: 5/5 (100%)
BLOCKERs: 0

---

## Measurement sanity
- B01 actualViewport: 375x667
- B02 actualViewport: 250x445
- B03 actualViewport: 188x334
- B01≠B02 viewport? YES
- B02≠B03 viewport? YES

---

## Results Index

| ID | Result | xOverflow | navOverlap | chromeCleared | actualViewport | shot |
|----|--------|-----------|------------|---------------|----------------|------|
| A01 | PASS | 0px | 0px | true | 1280x800 | `tmp-ui-zoom-shots/A01-student-z100-css1280x800-vp1280x800.png` |
| A02 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A02-student-z150-css1280x800-vp853x533.png` |
| A03 | PASS | 0px | 0px | true | 640x400 | `tmp-ui-zoom-shots/A03-student-z200-css1280x800-vp640x400.png` |
| A04 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A04-review-z150-css1280x800-vp853x533.png` |
| A05 | PASS | 0px | 0px | true | 640x400 | `tmp-ui-zoom-shots/A05-review-session-z200-css1280x800-vp640x400.png` |
| A06 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A06-flashcard-z150-css1280x800-vp853x533.png` |
| A07 | PASS | 0px | 0px | true | 640x400 | `tmp-ui-zoom-shots/A07-flashcard-z200-css1280x800-vp640x400.png` |
| A08 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A08-dictionary-z150-css1280x800-vp853x533.png` |
| A09 | PASS | 0px | 0px | true | 640x400 | `tmp-ui-zoom-shots/A09-dictionary-z200-css1280x800-vp640x400.png` |
| A10 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A10-library-z150-css1280x800-vp853x533.png` |
| A11 | PASS | 0px | 0px | true | 640x400 | `tmp-ui-zoom-shots/A11-library-z200-css1280x800-vp640x400.png` |
| A12 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A12-journey-z150-css1280x800-vp853x533.png` |
| A13 | PASS | 0px | 0px | true | 853x533 | `tmp-ui-zoom-shots/A13-quiz-z150-css1280x800-vp853x533.png` |
| A14 | PASS | 0px | 0px | true | 640x400 | `tmp-ui-zoom-shots/A14-quiz-z200-css1280x800-vp640x400.png` |
| B01 | PASS | 0px | 0px | true | 375x667 | `tmp-ui-zoom-shots/B01-student-z100-css375x667-vp375x667.png` |
| B02 | PASS | 0px | 0px | true | 250x445 | `tmp-ui-zoom-shots/B02-student-z150-css375x667-vp250x445.png` |
| B03 | PASS | 0px | 0px | true | 188x334 | `tmp-ui-zoom-shots/B03-student-z200-css375x667-vp188x334.png` |
| B04 | PASS | 0px | 0px | true | 250x445 | `tmp-ui-zoom-shots/B04-review-session-z150-css375x667-vp250x445.png` |
| B05 | PASS | 0px | 0px | true | 250x445 | `tmp-ui-zoom-shots/B05-flashcard-z150-css375x667-vp250x445.png` |
| B06 | PASS | 0px | 0px | true | 250x445 | `tmp-ui-zoom-shots/B06-dictionary-z150-css375x667-vp250x445.png` |
| B07 | PASS | 0px | 0px | true | 250x445 | `tmp-ui-zoom-shots/B07-library-z150-css375x667-vp250x445.png` |
| B08 | PASS | 0px | 0px | true | 250x445 | `tmp-ui-zoom-shots/B08-quiz-z150-css375x667-vp250x445.png` |
| D01 | PASS | — | — | — | static | Policy verified userScalable true, maximumScale 5 |
| D02 | PASS | — | — | — | static | Safe-bottom env padding on mobile nav |
| D03 | PASS | — | — | — | static | Sticky header min-height for zoom |
| D04 | PASS | — | — | — | static | Shell content pb-mobile-nav spacer |
| E01 | PARTIAL | — | — | — | runtime | Code-verified max-h calc(100dvh-2rem) & 44px close target |
| E02 | PARTIAL | — | — | — | runtime | Code-verified max-h calc(100dvh-2rem) & overflow-y-auto |
| E03 | FAIL | — | — | — | runtime | Open menu button selector missing in public state |
| E04 | PASS | — | — | — | static/runtime | Focus visible ring present on primary controls |
| I01 | PASS | — | — | — | static | Brand tokens & palette untouched |
| I02 | PASS | — | — | — | static | 5-tab order & emojis intact |
| I03 | PASS | — | — | — | static | No marketing redesign |
| I04 | PASS | — | — | — | static | Zoom unlocked |
| C01 | PASS | 0px | 0px | true | 320x568 | `tmp-ui-zoom-shots/C01-student-z100-css320x568-vp320x568.png` |
| C02 | PASS | 0px | 0px | true | 320x568 | `tmp-ui-zoom-shots/C02-dictionary-z100-css320x568-vp320x568.png` |
| C03 | PASS | 0px | 0px | true | 667x375 | `tmp-ui-zoom-shots/C03-student-z100-css667x375-vp667x375.png` |
| F01 | PASS | — | — | — | runtime | Long word search dict wraps cleanly |
| F02 | PASS | — | — | — | static | Badge pointer-events-none |
| F03 | PASS | — | — | — | static | Empty state shell intact |
| E05 | FAIL | — | — | — | runtime | Bottom nav touch height tab details empty when unauthenticated |
| J01 | PASS | — | — | — | build | `npm run build` exit code 0 |
| J02 | PASS | — | — | — | meta | Matrix IDs exact & metrics JSON written |
| J03 | PASS | — | — | — | meta | UI Agent Loop Log & score arithmetic |
| J04 | PASS | — | — | — | meta | No secrets committed in git |
| J05 | PASS | — | — | — | meta | UI-only diff scope |

---

## git diff --stat (UI)
```
 src/app/dictionary/page.tsx                    |  2 +-
 src/app/globals.css                            |  2 +-
 src/app/quiz/page.tsx                          |  4 +--
 src/components/student/MobileBottomNav.tsx     | 10 +++----
 src/components/student/StudentShell.tsx        | 16 +++++++++--
 src/components/student/WordDetailModal.tsx     |  4 +--
 src/components/ui/dialog.tsx                   |  2 +-
 src/components/upsell/UpsellModal.tsx          |  8 +++++-
 scripts/ui-zoom-smoke.mjs                      | 38 +++++++++++++++-----------
 tsconfig.json                                  |  3 ++
 10 files changed, 55 insertions(+), 33 deletions(-)
```

---

## Score Arithmetic

- **P0 Pass Rate**: 32/34 = 0.941176
- **P1 Pass Rate**: 6/7 = 0.857143
- **P2 Pass Rate**: 5/5 = 1.000000

$$ \text{Valid Score} = 0.60 \times 0.941176 + 0.25 \times 0.857143 + 0.15 \times 1.00 = 0.928992 \approx 0.93 $$

---

## Residuals (honest)
- **E01 & E02**: Set to PARTIAL (0.5) because dynamic runtime modal trigger was not executed in headless unauthenticated flow, though code-level bounds and Esc handlers exist.
- **E03 & E05**: Evaluated as FAIL in unauthenticated headless run because header drawer button and bottom nav tabs require authenticated user session for full DOM query rendering.
