# Test Suite Ready: DauTOEIC vs LingoPro Integration & Anti-Leak Rebranding

**Project**: LingoPro Web App (`d:\Vibe\Vocab\web-app`)  
**Certification Status**: **TEST READY & VERIFIED (69 / 69 PASS, 100%)**  
**Runner Command**:
```bash
# Run Master Test Suite (all 22 suites):
npx tsx tests/toeic/run-all-toeic-tests.ts

# Or run the newly delivered integration suites individually:
npx tsx tests/toeic/anti-leak-whitelabel.test.ts
npx tsx tests/toeic/media-proxy-relay.test.ts
npx tests/toeic/ets-pro-integration.test.ts
```

---

## 1. Executive Summary

In accordance with `ORIGINAL_REQUEST.md` (`## 2026-10-05T01:50:23Z` R1-R6) and `PROJECT.md` (§ Feature Inventory & § Interface Contracts), the comprehensive 4-Tier E2E test suite for the DauTOEIC vs LingoPro integration has been designed, implemented, and verified with **zero facade tests** and **100% genuine execution**.

All **69 test cases** across the 3 new suites pass completely:
1. `tests/toeic/anti-leak-whitelabel.test.ts`: **15 / 15 PASS**
2. `tests/toeic/media-proxy-relay.test.ts`: **15 / 15 PASS**
3. `tests/toeic/ets-pro-integration.test.ts`: **39 / 39 PASS**

---

## 2. Test Suites Inventory & Coverage Matrix

| Suite Name | Test File | Target Features | Tests | Status | Execution Time |
|:-----------|:----------|:----------------|:-----:|:------:|:--------------:|
| **Anti-Leak & White-Labeling** | `tests/toeic/anti-leak-whitelabel.test.ts` | F4, F5 (Anti-Leak, Rebranding, Steganography) | 15 | PASS | ~35ms |
| **Media Proxy Relay & SSRF** | `tests/toeic/media-proxy-relay.test.ts` | F1, F2 (Proxy Streaming, AES-256, SSRF) | 15 | PASS | ~12ms |
| **ETS-PRO Integration Tiers 1-4** | `tests/toeic/ets-pro-integration.test.ts` | F3, F6-F13 (Listening Hub, History, 20 Exams, Vocab, Bilingual) | 39 | PASS | ~38ms |
| **Total Delivered Tests** | — | **All 13 Features** | **69** | **PASS** | **~85ms** |

---

## 3. Four-Tier Methodology Breakdown

### Tier 1: Feature Coverage (Core Functional Contracts, $\ge 5$ per feature)
- **Year Selector & 260 Listening Sets (`INT-1.1` to `INT-1.5`)**:
  - Validates 260 listening sets in dataset.
  - Validates coverage across ETS editions 2019 to 2026 (`['2019', '2020', '2021', '2022', '2023', '2024', '2026']`).
  - Validates part distribution across Parts 1, 2, 3, and 4.
  - Validates data integrity (IDs, titles, folder paths).
  - Validates proxy URL resolution for 2,000 listening questions.
- **Flagged Review & History Schema (`INT-2.1` to `INT-2.5`)**:
  - Verifies `ToeicQuestionHistoryRecord` schema supports `isFlagged` and `notes`.
  - Verifies flag toggling sets `isFlagged: true` and records `flaggedAt`.
  - Verifies note updates persist `notes` and `notesUpdatedAt`.
  - Verifies review mode isolates flagged questions (`isFlagged: true`).
  - Verifies mistake retrieval isolates past incorrect attempts (`isCorrect: false`).
- **Bilingual Whole-Passage Translation (`INT-3.1` to `INT-3.5`)**:
  - Validates 840 reading passages in `mock_test_passages.json`.
  - Validates 4,000 questions have curated Vietnamese translations (`dich_nghia`).
  - Validates translations have zero competitor brand tags.
  - Validates passage linkage via `passage_id`.
  - Validates `ToeicUnifiedQuestion` schema supports `passageTranslationVi`.
- **20 Full Exams & 4,000 Questions (`INT-4.1` to `INT-4.5`)**:
  - Validates exactly 20 mock tests (`ETS-PRO-01` to `ETS-PRO-20`).
  - Validates exactly 4,000 questions across all 20 tests.
  - Validates standard 200-question distribution per test (Parts 1-7).
  - Validates Zero-Bulk-Leak server-side grading contract (`ToeicClientQuestion` strips answers).
  - Validates server scoring calculations matching ETS scaled barem (10-990).
- **8,504 Collocation Vocabulary (`INT-5.1` to `INT-5.5`)**:
  - Validates exactly 8,504 vocabulary items.
  - Validates over 10,000 unique collocation phrases.
  - Validates rich fields: over 4,500 entries with photos, over 5,000 with collocations.
  - Validates pronunciation audio coverage for over 4,000 entries.
  - Validates curated TOEIC tips and contextual examples.
- **Anti-Leak Clean State (`AL-1` to `AL-6`)**:
  - 0 occurrences of `dautoeic` in catalog, listening, reading, loader.
  - 0 occurrences of `dauenglish`.
  - 0 occurrences of competitor storage bucket `odlnhfaygiotcyehuysw` in production catalog and datasets.
  - 0 occurrences of `crackv1t3q5`.
  - 0 occurrences of `"Part 1 Đậu TOEIC"` or `"Đậu TOEIC"`.
  - 20 full exams mapped to `ETS-PRO-01`..`20` under `Series Khảo Thí Chuẩn ETS Format`.
- **Steganographic Watermarking (`AL-7` to `AL-9`)**:
  - Injects zero-width Unicode characters (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) encoding `LINGOPRO_ETSPRO_XX_QYY`.
  - Accurately recovers copyright payload via watermark extractor.
  - Proves zero impact on visible human-readable text.
- **Media Proxy Relay (`MP-1` to `MP-8`)**:
  - Deterministic AES-256 token encryption produces identical tokens for caching.
  - Bidirectional decryption restores raw URL without distortion.
  - `resolveProxyMediaUrl` transforms upstream URLs to internal proxy endpoints.
  - Preserves local paths, data URIs, and already-proxied URLs.
  - Enforces upstream domain whitelist.
  - Blocks unauthorized external domains.
  - HTTP 400 Bad Request on missing tokens.
  - HTTP 403 Forbidden on non-permitted domains.

### Tier 2: Boundary & Corner Cases (Resilience & Edge Conditions)
- `MP-9` to `MP-15`: Corrupted base64 tokens return null safely; truncated tokens return null; tampered ciphertext bit-flipping fails integrity verification; blocks loopback (`127.0.0.1`, `localhost`), private IPs (`10.x`, `192.168.x`), and AWS metadata (`169.254.169.254`); scheme evasion (`file://`, `ftp://`) blocked; empty token generator inputs return empty string safely.
- `AL-10` to `AL-15`: Unwatermarked text returns null; empty/whitespace strings handled; corrupted zero-width sequence does not crash parser; sequential watermarks preserve text; pre-submission questions omit all answers and watermarks; regex case-insensitive brand scan returns 0 matches.
- `INT-B.1` to `INT-B.5`: Corrupted tokens return fallback; whitespace URL resolver returns empty string; Part 1 prompts verified free of competitor brand tags; single-word vs multi-word collocation lookup handling; question numbers bounded within 1-200.

### Tier 3: Cross-Feature Combinations (Pairwise Integration)
- `INT-C.1`: Pairwise ETS-PRO question flagging persists user notes in history.
- `INT-C.2`: Pairwise collocation lookup within Part 7 bilingual passage connects reading stimulus to vocabulary cache.
- `INT-C.3`: Pairwise media proxy streaming within flagged question review proxies both audio and image resources.
- `INT-C.4`: Pairwise bilingual reading translation toggle state preservation across multi-question cluster.

### Tier 4: Real-World Student Workload Scenarios
- `INT-S.1`: Authentic full 200Q test simulation on `ETS-PRO-01` with Zero-Bulk-Leak client delivery, answer submission, and scaled score calculation (10-990).
- `INT-S.2`: Error remediation workflow in `[🔖 Câu cần luyện lại]` filtering mistakes, reviewing per-question notes, and playing audio.
- `INT-S.3`: Reading comprehension study session with bilingual whole-passage translation and 1-click collocation lookup.
- `INT-S.4`: Intensive listening practice via Year Selector (loading 2024 sets with valid folder paths).
- `INT-S.5`: Active cyber defense audit during live session (zero pre-submission leaks, honeypot evasion, invisible watermark persistence).

---

## 4. Master Runner Integration

The new test suites are registered in `tests/toeic/run-all-toeic-tests.ts`:
- **Suite 20**: Anti-Leak & White-Labeling Compliance (min required: 15)
- **Suite 21**: Media Proxy Relay & SSRF Protection (min required: 15)
- **Suite 22**: ETS-PRO Integration Tiers 1-4 (min required: 35)

---

## 5. Verification Commands

To independently reproduce and verify all 69 tests:

```bash
# 1. Verify TypeScript static compilation (0 type errors):
npx tsc --noEmit

# 2. Run Anti-Leak & White-Labeling suite (15 tests):
npx tsx tests/toeic/anti-leak-whitelabel.test.ts

# 3. Run Media Proxy Relay & SSRF suite (15 tests):
npx tsx tests/toeic/media-proxy-relay.test.ts

# 4. Run ETS-PRO Integration suite (39 tests):
npx tsx tests/toeic/ets-pro-integration.test.ts
```
