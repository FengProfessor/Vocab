# Test Infrastructure & Strategy: DauTOEIC vs LingoPro Integration & Anti-Leak Rebranding

**Target Workspace**: `d:\Vibe\Vocab\web-app`  
**Master Test Suite**: `tests/toeic/run-all-toeic-tests.ts`  
**Dedicated Integration Suites**:
- `tests/toeic/anti-leak-whitelabel.test.ts`
- `tests/toeic/media-proxy-relay.test.ts`
- `tests/toeic/ets-pro-integration.test.ts`
**Runner Command**: `npx tsx tests/toeic/run-all-toeic-tests.ts`  
**Methodology**: 4-Tier Opaque-Box & Requirement-Driven Architecture  

---

## 1. Opaque-Box & Requirement-Driven Test Philosophy

The LingoPro test infrastructure strictly enforces an **opaque-box (black-box), requirement-driven testing paradigm**. The test suites treat internal implementation modules as units under test governed exclusively by:
1. Requirements specified in `ORIGINAL_REQUEST.md` (specifically `## 2026-10-05T01:50:23Z` R1 through R6 and Acceptance Criteria).
2. Interface contracts specified in `PROJECT.md` (§ Interface Contracts & § Code Layout).
3. The Standardized Exam Engine design principles (`standardized-exam-engine` skill): zero bulk leaks, on-demand explain, plausible data poisoning, invisible watermarking, split-pane Technical Minimalist UI, and standardized barem scoring.

### Core Guiding Principles:
- **Zero Dependence on Implementation Gimmicks**: Tests evaluate observable outputs, data contracts, and public API interfaces rather than private internal implementation details.
- **Strict Anti-Facade Rule**: No test passes vacuously without asserting real logic, actual binary responses, cryptographic transformations, or authoritative dataset integrity.
- **Progressive Testability**: During milestone execution, tests verify contracts progressively against both authoritative raw source datasets (`scripts/dautoeic/data/`) and target production catalogs/datasets, reporting precise actionable diagnostic feedback if pending worker deliverables are incomplete.
- **Hermetic Isolation**: Every test case initializes its own state, executes independently, does not rely on execution order, and operates without external network dependencies.
- **Adversarial Hardening**: Rigorous validation against SSRF vectors, token tampering, range manipulation, unicode steganography corruption, and competitor brand leaks.

---

## 2. Four-Tier Test Methodology

```
┌────────────────────────────────────────────────────────────────────────┐
│             Tier 4: Real-World Student Workload Scenarios              │
│       (Full 200Q ETS-PRO-01, Error Remediation, Bilingual Reading,     │
│        Year Selector Listening, Active Cyber Defense E2E)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Tier 3: Cross-Feature Integration                     │
│    (Pairwise Interaction: Flagged ETS-PRO -> Note Persistence ->       │
│     Bilingual Passage Collocation Lookup -> Proxy Audio Streaming)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Tier 2: Boundary & Corner Cases                       │
│    (Tampered Tokens, Empty Audio Range, Part 1 Prompt Standardization, │
│     Multi-Word Collocation Fallback, Edge Question Numbers Q1/100/200) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Tier 1: Feature Coverage                            │
│    (>=5 Tests Per Feature: Anti-Leak Clean State, Media Proxy Relay,   │
│     260 Listening Sets, Flagged History, 840 Bilingual Translations,   │
│     20 ETS-PRO Exams / 4,000 Questions, 8,504 Collocation Vocab)       │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (Core Functional Contracts)
Validates that every feature meets its baseline functional specification with $\ge 5$ test assertions per feature:
- **Feature 1 & 2: Media Proxy Relay & Encryption Helper**:
  - Deterministic AES-256 token generation and bi-directional resolution.
  - Whitelist validation permitting only authorized storage domains.
  - Streaming audio and image binaries with accurate MIME types (`audio/mpeg`, `image/jpeg`).
  - Cache header compliance: `Cache-Control: public, max-age=31536000, immutable`.
  - Zero 302 redirect compliance: direct byte streaming to eliminate server access log leaks.
- **Feature 4 & 5: Anti-Leak Clean State & Steganographic Watermarking**:
  - 0 occurrences of competitor identifiers (`dautoeic`, `dauenglish`, `odlnhfaygiotcyehuysw`, `crackv1t3q5`, `"Part 1 Đậu TOEIC"`).
  - Complete white-labeling of 20 exams under `Series Khảo Thí Chuẩn ETS Format` (`ETS-PRO-01` to `ETS-PRO-20`).
  - Embedding of invisible zero-width Unicode watermarks (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) encoding `LINGOPRO_ETSPRO_XX_QYY`.
  - Clean reversibility of watermarks without corrupting human-readable text.
- **Feature 6: 20 Full Exams & 4,000 Questions**:
  - Verification of exactly 20 tests with 200 questions each across Parts 1-7.
  - Verification of exactly 4,000 questions in total.
  - Zero-Bulk-Leak server-side grading contract (`ToeicClientQuestion` strips answers before submit).
- **Feature 7 & 8: 8,504 Collocation Vocabulary**:
  - Exactly 8,504 vocabulary items with 10,075 unique collocation phrases.
  - Verification of rich fields: `phrases`, `image_url`, `toeic_tip`, `meanings`.
- **Feature 9: ETS Year-Based Listening Hub**:
  - Verification of 260 listening sets spanning years 2019 to 2026.
  - Valid question counts, audio URLs, and part classification (Parts 1-4).
- **Feature 10 & 11: Flagged Question Review & Question History**:
  - `ToeicQuestionHistoryRecord` schema with `isFlagged` and `notes`.
  - Filter logic for `[🔖 Câu cần luyện lại]` separating flagged questions and mistakes.
- **Feature 12 & 13: Bilingual Whole-Passage Translation**:
  - Verification of `dich_nghia` passage translations across 840 passages in Part 6 and Part 7.
  - Alignment of bilingual translation with English passage stimuli.

### Tier 2: Boundary & Corner Cases (Resilience & Edge Conditions)
Stresses the system at input boundaries, malformed inputs, and unusual user actions ($\ge 5$ tests per feature):
- **Proxy Token Boundaries**: Corrupted hex strings, malformed IVs, altered payloads, and empty token handling.
- **Audio Range Requests**: Handling empty `Range: bytes=`, negative ranges, ranges exceeding file bounds, and standard byte chunks (`bytes=0-1023`).
- **Part 1 Prompt Standardization**: Validating that all Part 1 questions use standard ETS directions ("Mark your answer on your answer sheet") without proprietary prefixes.
- **Dictionary Lookup Edge Cases**: Single-word headwords vs multi-word collocations, punctuation stripping, case insensitivity, and nonexistent words.
- **Question Number Boundaries**: Boundary handling for Question 1 (LC start), Question 100 (LC end), Question 101 (RC start), Question 200 (RC end), and out-of-bounds numbers.

### Tier 3: Cross-Feature Combinations (Pairwise Interaction)
Verifies multi-module interactions across feature boundaries:
- **Pair 1: ETS-PRO Full Test + Flagged Review**: An imported `ETS-PRO` question answered incorrectly is flagged with a user note and retrieved in the review tab.
- **Pair 2: Bilingual Reading Passage + 1-Click Collocation Lookup**: Highlighting a collocation within a Part 7 bilingual passage triggers rich dictionary card with photo and TOEIC tip.
- **Pair 3: Flagged Question Review + Media Proxy Streaming**: Loading flagged Part 1/Part 3 questions streams audio and images exclusively through the proxy relay.
- **Pair 4: Bilingual Translation Toggle + Navigation State**: Navigating between questions in a multi-question reading cluster preserves the user's bilingual toggle setting.

### Tier 4: Real-World Student Workload Scenarios
Simulates authentic end-to-end user journeys from start to completion:
- **Scenario 1: Full 200-Question Exam Simulation on ETS-PRO-01**: Complete initialization, client-side zero-bulk-leak assertion, answer recording, server submission, and official ETS 10-990 barem score calculation.
- **Scenario 2: Remediation Workflow in `[🔖 Câu cần luyện lại]`**: Filtering flagged items and past mistakes, playing per-question audio, updating personal notes, and reviewing pedagogical explanations.
- **Scenario 3: Reading Comprehension Deep-Dive**: Reading a Part 7 multi-passage document, toggling bilingual translation, clicking interactive collocation phrases, and reviewing vocabulary.
- **Scenario 4: Intensive Listening Practice by Year**: Selecting ETS 2024 via the year selector, loading Part 3 sets, and playing dialogues via the backend media proxy relay.
- **Scenario 5: Active Cyber Defense in Real Exam Session**: Verifying complete omission of answers in pre-submission payloads, trap parameter rejection, and verified steganographic watermarks in post-submission review.

---

## 3. Feature Inventory Coverage Mapping

| Feature # | Feature Name | Test Suite | Tiers Covered | Pass/Fail Semantics |
|:---------:|:-------------|:-----------|:-------------:|:-------------------|
| F1 | Media Proxy Relay Endpoint | `media-proxy-relay.test.ts` | T1, T2, T3 | Passes if binary streams with HTTP 200/206, proper MIME, 1y Cache-Control, zero 302s, and SSRF rejected |
| F2 | Media Encryption & Helper | `media-proxy-relay.test.ts` | T1, T2 | Passes if AES-256 tokens are deterministic, bi-directionally reversible, and handle tampering gracefully |
| F3 | Core Type & Schema Extensions | `ets-pro-integration.test.ts` | T1 | Passes if `ToeicUnifiedQuestion`, `ToeicClientQuestion`, and `ExamDictResult` support all new fields |
| F4 | Anti-Leak & Rebranding | `anti-leak-whitelabel.test.ts` | T1, T2 | Passes if exactly 0 competitor tokens exist across all datasets, catalogs, and loader files |
| F5 | Steganographic Watermarking | `anti-leak-whitelabel.test.ts` | T1, T2, T4 | Passes if zero-width Unicode encodes `LINGOPRO_ETSPRO_XX_QYY` and preserves visible text integrity |
| F6 | Catalog & Loader Ingestion | `ets-pro-integration.test.ts` | T1, T2, T4 | Passes if 20 full exams (4,000 Qs) load with zero bulk leaks and calculate official ETS barem scores |
| F7 | Collocation Vocabulary Ingestion | `ets-pro-integration.test.ts` | T1, T2 | Passes if 8,504 vocabulary items and 10,075 collocations are verified with rich photos and tips |
| F8 | Rich Word Lookup Card | `ets-pro-integration.test.ts` | T1, T3, T4 | Passes if dictionary lookup delivers thumbnail image, collocation pills, and TOEIC exam tips |
| F9 | ETS Year-Based Listening Hub | `ets-pro-integration.test.ts` | T1, T4 | Passes if 260 listening sets span 2019-2026 with valid questions, audio, and part classification |
| F10 | Flagged Question & Note History | `ets-pro-integration.test.ts` | T1, T3 | Passes if `isFlagged` and `notes` persist and query cleanly in `ToeicQuestionHistoryRecord` |
| F11 | `[🔖 Câu cần luyện lại]` Review Mode | `ets-pro-integration.test.ts` | T1, T3, T4 | Passes if review tab filters flagged/mistakes and renders per-question audio and notes |
| F12 | Bilingual Reading Translation Toggle | `ets-pro-integration.test.ts` | T1, T3, T4 | Passes if 840 passages provide `dich_nghia` and toggle between English-only and bilingual views |
| F13 | Dual-Column Responsive Layout | `ets-pro-integration.test.ts` | T1, T3 | Passes if Split-Pane provides independent passage and question rendering with responsive layout |
| F14 | E2E Testing Suite (Tiers 1-4) | `run-all-toeic-tests.ts` | T1-T4 | Passes if all new integration suites register and execute cleanly with detailed metrics |

---

## 4. Pass / Fail Semantics

1. **Passing Criteria (`PASS`)**:
   - Every individual assertion (`expect(...).toBe(...)`, etc.) succeeds without throwing an exception.
   - All required quotas (e.g. 20 exams, 4,000 questions, 260 listening sets, 8,504 vocabulary items) are strictly satisfied.
   - Zero occurrences of forbidden tokens (`dautoeic`, `dauenglish`, `odlnhfaygiotcyehuysw`, `crackv1t3q5`, `"Part 1 Đậu TOEIC"`).
   - SSRF protection reliably blocks unauthorized IP ranges, schemes, and domains.
   - Process exits with code `0`.

2. **Failure Criteria (`FAIL`)**:
   - Any assertion throws an error or fails a schema contract.
   - Any competitor leak is detected.
   - An SSRF vulnerability or insecure redirect is identified.
   - Zero bulk leaks contract is violated (e.g. answer key exposed before submission).
   - Process exits with code `1`.

3. **Execution Command**:
   ```bash
   npx tsx tests/toeic/run-all-toeic-tests.ts
   ```
