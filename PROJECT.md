# Project: TOEIC Technical Minimalist UI/UX & Full Dataset Unlocking (>15,000 Questions)

## Architecture
The TOEIC subsystem is transformed from a marketing-heavy prototype into an authoritative, distraction-free computer-based examination and practice platform (ETS/IIG standard). It unlocks the repository's full dataset of over 15,175 authentic questions across 28+ Full Tests (200Q) and 231 Part Practice Sets (Parts 1-7).

```
[Dataset Sources: crawlers/toeic/]
   ├── estudyme_data/full_tests/ (21 full tests × 200Q = 4,200 Qs)
   ├── estudyme_data/practice_parts/ (231 sets across 7 Parts = 7,549 Qs)
   └── toeic_data/ (20 Study4 tests = 3,426 Qs)
               │
               ▼
[Pre-built Lightweight Manifest: src/data/toeic/toeic-catalog-index.json (~78 KB)]
   │ Total Questions (>15,000), 28+ Full Tests list, 231 Part Practice Sets metadata
   │
   ├──► [/toeic] (Content-First 2-Tab Catalog: instant switch <20ms, zero lag)
   │       ├── Tab 1: Đề thi Full Test (200 câu - 120 phút)
   │       └── Tab 2: Luyện tập theo 7 Part (Part 1 to 7 set picker)
   │
   └──► Dynamic On-Demand Server Loader: src/lib/toeic-test-loader.ts & /api/toeic/test
           │ Adapts Estudyme & Study4 cards to ToeicUnifiedQuestion
           │ Strips sensitive keys on GET /api/toeic/test
           ▼
        [/toeic/exam/[examId]] (Distraction-Free Exam Room)
           ├── ToeicExamHeader (Compact 48px, monospace timer, clean submit)
           ├── ToeicSplitPane (2-column 1px border, flat option cards A/B/C/D, keyboard shortcuts)
           ├── ToeicQuestionPalette (Flat 5-column grid, monospace tabular-nums, 4-state encoding)
           ├── Dialog Modals (SubmitConfirmModal, ExamPauseModal, GuestSaveExamModal)
           └── ToeicScoreReportView (ETS-style score certificate, part diagnostics, review mode)
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | Pre-compiled Catalog Index | Generate `src/data/toeic/toeic-catalog-index.json` (~78 KB) indexing >15,175 questions, 28+ full tests, 231 practice sets | M1 | **DONE** | Survey Data §1.1-1.3 |
| 2 | Dynamic Universal Test Loader | Implement `loadAnyToeicTest(testId)` in `src/lib/toeic-test-loader.ts` with Estudyme card adapter and Study4 adapter | M1 | **DONE** | ORIGINAL_REQUEST §R3 |
| 3 | API Route Dynamic Resolution | Update `src/app/api/toeic/test/route.ts` & `submit/route.ts` to dynamically resolve tests on demand with zero client JS bloat | M1 | **DONE** | Survey Data §4.3 |
| 4 | Loader Defect Fixes & Slug Support | Fix `normalizeTestId` regex and string coercion, support `estudyme-test-*`, `estudyme-p*-set*`, `study4-*` slugs | M1 | **DONE** | Survey Tests §1.2 |
| 5 | Anti-AI Template Design Tokens | Standardize on 1px flat borders (`border-slate-200 dark:border-slate-800`), `rounded-sm`/`rounded-md` max, eliminate gradients, blur shadows, `rounded-2xl/3xl/full` | M2, M3 | **DONE** | ORIGINAL_REQUEST §R1 |
| 6 | Content-First Homepage Catalog | Overhaul `src/app/toeic/page.tsx`: header with >15,000 questions, eliminate all marketing hero/features/level fluff | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 7 | Tab 1: Đề Full Test (200 câu) | Instant catalog grid of 28+ full tests with specifications and direct "Vào thi" actions | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 8 | Tab 2: Luyện theo 7 Part | Instant Part 1-7 filter bar, displaying all 231 practice sets with question counts and time estimates | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 9 | Distraction-Free Exam Header | Compact 48px header in `ToeicExamHeader.tsx`, flat 1px border, monospace tabular countdown timer, no bounce/pulse | M3 | **DONE** | ORIGINAL_REQUEST §R4 |
| 10 | Flat Split-Pane Layout | 2-column layout in `ToeicSplitPane.tsx`, 1px borders, slim scrollbars, clean stimulus viewing | M3 | **DONE** | ORIGINAL_REQUEST §R4 |
| 11 | Flat Option Cards & Shortcuts | Option cards A/B/C/D with monospace badges, full click targets, keyboard shortcuts `A`, `B`, `C`, `D`, `ArrowLeft`, `ArrowRight`, `F` | M3 | **DONE** | ORIGINAL_REQUEST §R4 |
| 12 | Monospace 4-State Question Palette | 5-column flat matrix in `ToeicQuestionPalette.tsx`, `font-mono tabular-nums`, no `scale-105` jitter, crisp 4-state styling | M3 | **DONE** | ORIGINAL_REQUEST §R4 |
| 13 | Minimalist Dialog Modals | Technical minimalist overhaul of `SubmitConfirmModal.tsx`, `ExamPauseModal.tsx`, `GuestSaveExamModal.tsx` | M3 | **DONE** | Survey UI §4.3 |
| 14 | Technical Minimalist Score Report | Overhaul `ToeicScoreReportView.tsx` to an official ETS-style certificate, part breakdown, flat review mode | M3 | **DONE** | Survey UI §4.3 |
| 15 | E2E Test Suite Expansion | Create `catalog-integrity.test.ts`, `estudyme-loader.test.ts`, `ui-minimalist.test.ts`, update `run-all-toeic-tests.ts` | E2E | **DONE** | Survey Tests §4.2 |
| 16 | Final Verification & Hardening | 100% E2E test pass (Tiers 1-4), Tier 5 adversarial hardening, Forensic Integrity Audit, TypeScript & Next.js build | M4 | **DONE** | Project Pattern |

---

## Milestones
| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|--------|-------------|
| E2E | E2E Testing Track | Design & implement test suites for catalog integrity (>15,000 Qs), Estudyme adapter, UI minimalist rules, update runner, publish TEST_READY.md | none | **DONE** | `TEST_INFRA.md`, `tests/toeic/catalog-integrity.test.ts`, `tests/toeic/estudyme-loader.test.ts`, `tests/toeic/ui-minimalist.test.ts`, `TEST_READY.md` (219/219 PASS) |
| M1 | Data Loader & Catalog Index | Generate `toeic-catalog-index.json`, implement universal dynamic loader & adapters in `toeic-test-loader.ts`, update API routes | none | **DONE** | `src/data/toeic/toeic-catalog-index.json` (78KB, 15,175 Qs), `src/lib/toeic-test-loader.ts`, `src/app/api/toeic/test/route.ts`, `src/app/api/toeic/submit/route.ts` (16,554 stress assertions pass) |
| M2 | Content-First Homepage Catalog | Overhaul `/toeic` to Technical Minimalist: header with >15,000 Qs, 2-Tab layout (Full Test 200Q & 7-Part sets), zero marketing fluff | M1 | **DONE** | `src/app/toeic/page.tsx` (2-Tab layout, 28 full tests, 231 practice sets, 0 minimalist rule violations) |
| M3 | Distraction-Free Exam Room & Palette | Overhaul exam room components (`ToeicExamHeader`, `ToeicSplitPane`, `ToeicQuestionPalette`, modals, `ToeicScoreReportView`), keyboard shortcuts | M1, M2 | **DONE** | `src/app/toeic/exam/[examId]/page.tsx`, `src/components/toeic/*` (100% clean files, 0 style violations, full shortcuts) |
| M4 | Final Milestone: Full Pass, Hardening & Audit | 100% E2E test pass (Tiers 1-4), Tier 5 adversarial hardening, Forensic Auditor check, `npx tsc --noEmit`, `npm run build` | M1, M2, M3, E2E | **DONE** | 219/219 master tests pass, 44/44 adversarial checks pass, npm run build (135/135 pages) 0 errors, Forensic Auditor CLEAN verdict |

---

## Interface Contracts

### 1. `ToeicCatalogIndex` (`src/data/toeic/toeic-catalog-index.json`)
```typescript
export interface ToeicCatalogIndex {
  version: string;
  totalQuestions: number; // 15,175
  totalFullTests: number; // 41 (28 200Q tests)
  totalPracticeSets: number; // 231
  fullTests: ToeicCatalogTestItem[];
  practiceParts: Record<string, ToeicCatalogPracticeItem[]>; // "1" .. "7"
}
```

### 2. Universal Loader Interface (`src/lib/toeic-test-loader.ts`)
```typescript
export function loadAnyToeicTest(testId: string): ToeicUnifiedQuestion[];
export function getToeicCatalogIndex(): ToeicCatalogIndex;
export function stripSensitiveToeicData(questions: ToeicUnifiedQuestion[]): Partial<ToeicUnifiedQuestion>[];
```

### 3. Exam State & Palette Contract
```typescript
export interface ToeicQuestionPaletteProps {
  questions: ToeicClientQuestion[];
  currentIndex: number;
  userAnswers: Record<number, string>;
  flaggedQuestions: Record<number, boolean>;
  onSelectQuestion: (index: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}
```

---

## Code Layout
- Catalog Index & Metadata: `src/data/toeic/toeic-catalog-index.json`
- Test Loader & Adapters: `src/lib/toeic-test-loader.ts`
- API Routes: `src/app/api/toeic/test/route.ts`, `src/app/api/toeic/submit/route.ts`
- Homepage & Catalog: `src/app/toeic/page.tsx`
- Exam Room Page: `src/app/toeic/exam/[examId]/page.tsx`
- Exam Components:
  - Header: `src/components/toeic/ToeicExamHeader.tsx`
  - Split-Pane: `src/components/toeic/ToeicSplitPane.tsx`
  - Question Palette: `src/components/toeic/ToeicQuestionPalette.tsx`
  - Audio Player: `src/components/toeic/ToeicAudioPlayer.tsx`
  - Modals: `src/components/toeic/SubmitConfirmModal.tsx`, `ExamPauseModal.tsx`, `GuestSaveExamModal.tsx`
  - Score Report & Review: `src/components/toeic/ToeicScoreReportView.tsx`
- Test Suite: `tests/toeic/`
  - Master Runner: `tests/toeic/run-all-toeic-tests.ts`
  - Test Harness: `tests/toeic/test-harness.ts`
  - Tiers 1-5: `tier1-features.test.ts`, `tier2-boundary.test.ts`, `tier3-combinations.test.ts`, `tier4-scenarios.test.ts`, `tier5-adversarial.test.ts`
  - Dedicated Suites: `catalog-integrity.test.ts`, `estudyme-loader.test.ts`, `ui-minimalist.test.ts`, `challenger-1-adversarial.test.ts`, `challenger-1-r2-verification.test.ts`, `stress-loader.test.ts`, `stress-scoring.test.ts`
