# E2E Test Infra: LingoPro Speaking Subsystem & Ingestion Pipeline

## Test Philosophy
- Opaque-box, requirement-driven testing derived from `ORIGINAL_REQUEST.md` and `Speaking_Research_Report.md`.
- Zero tolerance for regressions to legacy False Beginner (A0-A1) foundation tests (157 tests in `tests/speaking/run-all-speaking-tests.ts`).
- Dual testing framework: Data integrity / schema compliance + Offline pipeline simulation + SafeHarbor Levenshtein voice scoring oracle.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinations + Real-World Application Scenarios.

## Feature Inventory & Coverage Mapping
| # | Feature | Source (requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|---------------------|:----------------:|:-----------------:|:---------------------:|
| 1 | F01: Foundation Preservation | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 2 | F02: Scalable Curriculum Types | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 3 | F03: DRY Component Index | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ |
| 4 | F04: ELLLO Scraper & Parser | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 5 | F05: TalkEnglish Scraper | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 6 | F06: YouTube Zero-Dep Transcripts | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 7 | F07: Ethical Rate Limiter | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 8 | F08: Offline Deterministic Seeds | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 9 | F09: Ingestion Normalizer | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ |
| 10| F10: Phase 1 Beginner (12 lessons) | ORIGINAL_REQUEST § R3 | 12 | 5 | ✓ |
| 11| F11: Phase 2 Elementary (10 lessons) | ORIGINAL_REQUEST § R3 | 10 | 5 | ✓ |
| 12| F12: Phase 3 Intermediate (10 lessons) | ORIGINAL_REQUEST § R3 | 10 | 5 | ✓ |
| 13| F13: 100% Vietnamese Explanation Layer | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ |
| 14| F14: Student Curriculum Hub UI | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 15| F15: Interactive 4-Stage Player | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 16| F16: Master Speaking Hub Router | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 17| F17: Data Integrity & Zero Placeholder | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |
| 18| F18: Offline Ingestion Test Runner | ORIGINAL_REQUEST § R4 | 5 | 5 | ✓ |

## Test Architecture
- **Legacy Foundation Runner**: `tests/speaking/run-all-speaking-tests.ts` (157 unit/e2e/adversarial tests).
- **Curriculum Integrity Suite**: `tests/speaking/curriculum-data-integrity.test.ts` (validates all 32 lessons for types, CEFR levels, audio URLs, non-empty Vietnamese explanations, and zero TODO/placeholder words).
- **Crawling Pipeline Suite**: `tests/speaking/crawling-pipeline.test.ts` (validates rate limiter, backoff formula, seed data conformity, and offline ingestion execution).
- **Master Test Runner**: `tests/speaking/run-speaking-master-test.ts` executing all suites sequentially and asserting 0 failures.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | False beginner completes Phase 1 final consonants /s/ vs /z/ & SafeHarbor test | F01, F02, F10, F13, F15 | High |
| 2 | Elementary student learns cooking terminology & describes recipe with PREP | F02, F11, F13, F15 | High |
| 3 | Intermediate student delivers IELTS Part 2 cue card speech with 4-quadrant notes | F02, F12, F13, F15 | High |
| 4 | Offline CI/CD pipeline ingests seeds without network access | F07, F08, F09, F18 | High |
| 5 | Master Speaking Hub routes student across Foundation, Curriculum, and AI Tutor | F01, F14, F15, F16 | Medium |

## Coverage Thresholds
- Tier 1: >=5 tests per feature (or 1 per lesson for curriculum content: 32 lessons verified).
- Tier 2: Boundary value validation (empty input guards, Levenshtein tolerance thresholds, rate limiter max backoff caps).
- Tier 3: Pairwise validation between player UI, audio button, and SafeHarbor recorder.
- Tier 4: 5 end-to-end user workflows.
- All tests must pass with exit code 0 and `npx tsc --noEmit` must report 0 errors.
