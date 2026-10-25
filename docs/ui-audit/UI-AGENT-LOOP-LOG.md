# UI Agent Loop Log

## Round 3 — Hardening & Valid Measurement

### Phase 0 — Bootstrap
- Updated `scripts/ui-zoom-smoke.mjs` according to Valid Spec M1-M5:
  - Removed hardcoded passwords; updated to `process.env.UI_TEST_EMAIL` / `UI_TEST_PASSWORD`.
  - Fixed mobile zoom calculation formula: `actualW = Math.round(cssWidth / z)`, `actualH = Math.round(cssHeight / z)`. Viewport dimensions differ across zoom levels (B01: 375x667, B02: 250x445, B03: 188x334).
  - Wired `touchMinPass` check into case pass evaluation for mobile viewports.
  - Replaced fake PASS on E01 and E02 with honest PARTIAL evaluation when runtime modal trigger is bypassed.
  - Used `waitUntil: 'domcontentloaded'` with 15s timeout fallbacks to prevent Puppeteer network timeouts on Next.js dev server.

### Phase 1 — Baseline Measure
- Runner executed 46 test matrix cases across Desktop (A01-A14), Mobile (B01-B08, C01-C03), Static/Policy (D01-D04, I01-I04, F02-F03, J01-J05), and Runtime/Interaction (E01-E05, F01).
- Viewport Sanity Verification:
  - B01 actualViewport: 375x667
  - B02 actualViewport: 250x445
  - B03 actualViewport: 188x334
  - `B01 != B02 != B03`: **YES** (Valid layout-zoom measurement confirmed).

### Phase 2 — Critique & Honest Residuals
1. **P0 Results**: 32 / 34 passed (Pass rate = 0.941). E01 & E02 marked PARTIAL (0.5), E03 marked FAIL (0.0).
2. **P1 Results**: 6 / 7 passed (Pass rate = 0.857). E05 marked FAIL (0.0) due to unauthenticated DOM state.
3. **P2 Results**: 5 / 5 passed (Pass rate = 1.000). `npm run build` completed exit code 0.
4. **No 1.00 claim**: Valid score is honestly computed as 0.93 without inflating unverified runtime cases.

### Phase 3 — Build & Verification
- `npm run build` executed successfully with exit code 0.
- All 25 viewport screenshots generated in `tmp-ui-zoom-shots/`.
- Full results written to `tmp-ui-zoom-results.json`.

### Phase 4 — Gate & Score Arithmetic
- **P0 Score**: $0.60 \times (32 / 34) = 0.5647$
- **P1 Score**: $0.25 \times (6 / 7) = 0.2143$
- **P2 Score**: $0.15 \times (5 / 5) = 0.1500$
- **Valid Score**: **0.93**

---

### Self-eval Checklist
- [x] Mobile zoom applies? (viewport differs across zoom levels: B01=375, B02=250, B03=188) **YES**
- [x] B02 shot not clone of B01? **YES**
- [x] No false min-w claim? **YES**
- [x] Onboarding dismissed? **YES**
- [x] Multi-assert used? **YES**
- [x] No fake PASS claimed? **YES**
