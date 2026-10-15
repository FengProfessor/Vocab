# Project: VNU Test Bậc 3 (ULIS - ĐHQGHN) Comprehensive Quality Assurance, Interactive Dictionary & Test Suite Remediation

## Architecture
- **Data Layer (`src/data/vnu-bac-3/`)**:
  - `ulis-sample-test-01.json`: Official ULIS sample test with 4 sections: Reading (25 Qs), Listening (20 Qs), Writing (2 tasks), Speaking (2 parts). (AUDITED & REMEDIATED)
  - `cambridge-pet-equiv-01.json`: Standardized Cambridge PET B1 equivalent test 1. (AUDITED & REMEDIATED)
  - `cambridge-pet-equiv-02.json`: Standardized Cambridge PET B1 equivalent test 2. (AUDITED & REMEDIATED)
  - `vnu-bac-3-catalog.json`: Exam registry with metadata, timing, and question counts.
- **Audio Assets (`public/audio/vnu-bac3/`)**:
  - `sample-01/listening-part{1,2,3}.mp3` (GENERATED, >850KB, valid ID3v2.4 headers)
  - `equiv-01/listening-part{1,2,3}.mp3` (GENERATED, >850KB, valid ID3v2.4 headers)
  - `equiv-02/listening-part{1,2,3}.mp3` (GENERATED, >850KB, valid ID3v2.4 headers)
  - `pet-01/` & `pet-02/` (COMPATIBILITY ALIASES)
- **Player & Engine (`src/components/vnu-bac-3/`, `src/lib/vnu-bac-3/`)**:
  - `VnuAudioPlayer.tsx`: Audio player with loading state, duration display, error banner with retry, volume control, practice speed switcher, and ULIS 2-play limit.
  - `VnuExamRoom.tsx`: Master exam room controller managing timer, state, 4-skill switching, local storage.
  - `VnuSplitPane.tsx`: Left pane (reading text / audio player / writing prompts / speaking cues), Right pane (questions / writing editor with word counter vs minWords / speaking notes). Interactive dictionary lookup enabled via `ExamInteractiveText` during review/explanation.
  - `VnuQuestionPalette.tsx`: 4-skill palette (Reading, Listening, Writing, Speaking) with draft/notes status tracking.
  - `scoring.ts`: Decoupled scoring engine (Reading 25 Qs -> 10.0, Listening 20 Qs -> 10.0, combined score >= 6.0 without < 2.0).
- **Navigation & Integration (`src/app/`)**:
  - `src/app/vstep/page.tsx`: Prominent Technical Minimalist banner directing learners to `/vnu-bac-3`.
  - `src/app/vnu-bac-3/`: Dedicated testing and practice portal.
  - `src/app/api/vnu-bac-3/`: Secure exam delivery API with Zero Bulk Leaks defense.
  - `src/app/api/vstep/submit/route.ts`: VSTEP exam submission route with authenticated persistence to `user_roadmap_assessments` (`track: 'vstep'` with `'cefr'` fallback).
- **Rate Limiting & Security (`src/lib/`)**:
  - `src/lib/distributed-rate-limit.ts`: Upstash Redis distributed rate limiting with non-production test bypass (`TSX_TEST='1'` or `NODE_ENV='test'`).
- **Verification Harness (`tests/`)**:
  - `tests/vnu-bac-3/`: `scoring.test.mjs`, `security.test.mjs`, `forensic-audit.mjs`, `quality-e2e.test.mjs`.
  - `tests/toeic/run-all-toeic-tests.ts`: Master runner covering 24 test suites (510 tests), including collocation dictionary and word family clusters.
  - `tests/exam/vstep-vnu-toeic-persistence.test.ts`: Cross-exam submission metadata and schema persistence verification.
  - `tests/grammar/run-all-grammar-tests.ts`: Curriculum test runner across 87 lessons and canonical `/grammar` route.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Pedagogical Audit & Key Alignment | 135 MCQs and 12 Writing/Speaking tasks audited, Q21 grammar fix, Q23 text align | M1 | Survey & R1 (DONE) |
| 2 | Sample Answers for Writing | High-quality sample answers for Task 2 in equiv-01 and equiv-02 | M1 | Survey & R1 (DONE) |
| 3 | Listening Vocabulary Notes | Add high-utility vocabulary notes with IPA and Vietnamese meaning for Listening | M1 | Survey & R1 (DONE) |
| 4 | Quality Audit Report | Publish comprehensive markdown report at `docs/vnu-bac-3/QUALITY_AUDIT_REPORT.md` | M1 | Survey & R1 (DONE) |
| 5 | Audio Pipeline & Generation | Generate 9 realistic English neural MP3 files (>20KB, valid headers) via edge-tts & ffmpeg | M2 | Survey & R2 (DONE) |
| 6 | Audio URL Alignment & Aliasing | Align JSON audio URLs to `equiv-01`/`equiv-02` and ensure `pet-01`/`pet-02` compatibility | M2 | Survey & R2 (DONE) |
| 7 | VnuAudioPlayer Enhancement | Loading spinner, accurate duration, error handling banner, 2-play limit | M2 | Survey & R2 (DONE) |
| 8 | Writing Interactive UI | Prompts, real-time word counter vs minWords, localStorage drafts, sample answer toggle | M3 | Survey & R3 (DONE) |
| 9 | Speaking Interactive UI | Social questions, Cue Cards & follow-ups, outline notes textarea with localStorage | M3 | Survey & R3 (DONE) |
| 10 | 4-Skill Question Palette & Nav | Palette tabs for Reading, Listening, Writing, Speaking; active section switching | M3 | Survey & R3 (DONE) |
| 11 | Decoupled Scoring Invariance | Preserve 100% Reading (25->10) and Listening (20->10) scoring algorithm | M3 | Survey & R3 (DONE) |
| 12 | Navigation Banner on /vstep | Prominent banner/card on `/vstep` directing users to `/vnu-bac-3` | M4 | Survey & R4 (DONE) |
| 13 | Comprehensive Quality E2E Suite | Automate test suite `tests/vnu-bac-3/quality-e2e.test.mjs` verifying audio, 4-skills, APIs, UI | M4 | Survey & R4 (DONE) |
| 14 | Full Test Suite & TSC Verification | Execute scoring, security, forensic-audit, quality-e2e, and npx tsc --noEmit | M4 | Survey & R4 (DONE) |
| 15 | VNU Bậc 3 Interactive Dictionary | Integrate `ExamInteractiveText` in `VnuSplitPane.tsx` for reading, prompts, tapescripts, options during review | M5 | Survey & R1 (DONE) |
| 16 | Test Environment Rate Limiter Bypass | Support `TSX_TEST === '1'` / `NODE_ENV === 'test'` in `distributed-rate-limit.ts` when Redis is absent | M5 | Survey & R2 (DONE) |
| 17 | TOEIC Master Runner & Dictionary Suites | Integrate suites 23 & 24 into `run-all-toeic-tests.ts`, export `runDictionaryMeaningsFamilyTests` | M5 | Survey & R3.1 (DONE) |
| 18 | VSTEP Submit Persistence Metadata | Persist with `track: 'vstep'` and `'cefr'` fallback in `src/app/api/vstep/submit/route.ts` | M5 | Survey & R3.2 (DONE) |
| 19 | Grammar Test Suite 87 Lessons Alignment | Update grammar tests for 87 curriculum lessons, `order_index <= 62`, and canonical `/grammar` route | M5 | Survey & R4 (DONE) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Pedagogical Content Audit & JSON Remediation | F1, F2, F3, F4: Audit all 135 MCQs + 12 tasks, fix Q21/Q23, add Task 2 sample answers, add listening vocab, publish QUALITY_AUDIT_REPORT.md | none | DONE |
| 2 | Realistic MP3 Generation & Audio Player Upgrade | F5, F6, F7: Generate 9 MP3 files, align paths, upgrade VnuAudioPlayer.tsx | M1 | DONE |
| 3 | Exam Room 4-Skill Interactive UI Upgrade | F8, F9, F10, F11: Upgrade VnuExamRoom, VnuSplitPane, VnuQuestionPalette for Writing & Speaking, preserve scoring | M1 | DONE |
| 4 | Navigation Banner & E2E Quality Verification | F12, F13, F14: Add /vstep banner, write tests/vnu-bac-3/quality-e2e.test.mjs, verify all test suites & tsc | M2, M3 | DONE |
| 5 | Interactive Dictionary & Test Suite Remediation | F15, F16, F17, F18, F19: Implement R1-R4, pass 100% of VNU Bậc 3, TOEIC master runner, VSTEP persistence, and Grammar tests | M4 | DONE |

## Interface Contracts
### VnuSplitPane ↔ ExamInteractiveText
- `ExamInteractiveText`: `{ text?: string; enabled?: boolean; as?: 'span' | 'p' | 'div' }`
- Enabled condition: `Boolean(isReviewMode || showReviewModal || explanation)`
- Option button: Click guard ignores events when `target.closest('.exam-lookup-trigger')` is clicked, preventing accidental button re-selection while permitting popover dictionary lookup.
### Distributed Rate Limiting
- `checkRateLimitAsync(key, limit, windowMs)`: In non-production test mode (`process.env.NODE_ENV !== 'production' && (process.env.TSX_TEST === '1' || process.env.NODE_ENV === 'test')`) without Redis, returns `{ allowed: true, remaining: limit, resetIn: windowMs }`.
- In production (`process.env.NODE_ENV === 'production'`) without Redis, strictly throws `RateLimitUnavailableError`.
### VSTEP Submission Persistence
- `src/app/api/vstep/submit/route.ts`: Inserts exam record to `user_roadmap_assessments` with `{ ...payload, track: 'vstep' }`, retrying with `{ ...payload, track: 'cefr' }` if database error occurs.
### Grammar Test Harness
- Live curriculum: 87 lessons across 62 topics (`order_index <= 62`). Canonical route: `/grammar`.

## Code Layout
- `src/components/vnu-bac-3/VnuSplitPane.tsx`
- `tests/vnu-bac-3/quality-e2e.test.mjs`
- `src/lib/distributed-rate-limit.ts`
- `tests/toeic/explain-regression.test.ts`
- `tests/toeic/anti-duplication.test.ts`
- `tests/exam/dictionary-meanings-family.test.ts`
- `tests/toeic/run-all-toeic-tests.ts`
- `src/app/api/vstep/submit/route.ts`
- `tests/grammar/tier1-feature-coverage.test.ts`
- `tests/grammar/tier4-curriculum-scenarios.test.ts`
- `tests/grammar/run-all-grammar-tests.ts`
