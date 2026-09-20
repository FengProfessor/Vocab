# TEST_READY: Vocab Performance & Learning UX Optimization

**Status**: READY (125 / 125 PASSED — 100% Pass Rate)  
**Execution Command**:
```bash
npx tsx tests/perf/perf-ux-e2e.test.ts
```
**Test Target**: `tests/perf/perf-ux-e2e.test.ts`  
**Execution Time**: ~2600ms  
**Authoritative References**:
- `ORIGINAL_REQUEST.md` (Section ## 2026-09-19T16:00:20Z)
- `PROJECT.md` (`d:\Vibe\Vocab\web-app\.agents\orchestrator_vocab_perf_1\PROJECT.md`)

---

## 1. Executive Test Summary

| Tier | Category | Minimum Required | Implemented & Verified | Pass Rate | Status |
|:-----|:---------|:----------------:|:----------------------:|:---------:|:------:|
| **Tier 1** | Feature Coverage (F1 to F14) | >= 65 | **70** | 100% | **PASS** |
| **Tier 2** | Boundary & Corner Cases (8 Categories) | >= 20 | **40** | 100% | **PASS** |
| **Tier 3** | Cross-Feature Integration Flows | >= 10 | **10** | 100% | **PASS** |
| **Tier 4** | Real-World Workload Scenarios | >= 5 | **5** | 100% | **PASS** |
| **TOTAL** | **Full E2E Opaque-Box Suite** | **>= 100** | **125** | **100%** | **PASS** |

---

## 2. Requirement Traceability Matrix (R1, R2, R3)

### R1. Instant Summary & Counts (<100ms Latency)
- **F1: Sub-100ms Word Summary RPC & Endpoint** (`GET /api/words?summary=1`):
  - Standard JSON response schema: `{ total, newCount, dueCount, reviewDueCount, classroomId }`.
  - Latency verified under 100ms (<50ms on warm RAM cache).
  - Skips heavy 6-bucket distribution when `levels=1` is omitted; calculates 6-bucket distribution when `levels=1` requested.
  - Tests: `T1.F1.1` – `T1.F1.5`.
- **F2: Summary Cache Invalidation**:
  - `POST /api/words` invalidates `wsum:${userId}:*` server RAM cache.
  - `DELETE /api/words` and `POST /api/words/srs` trigger cache invalidation.
  - Client storage SWR keys (`lp:word-summary:${userId}`) purged by `invalidateWordSummaryCache`.
  - Tests: `T1.F2.1` – `T1.F2.5`.
- **F3: Fallback Scope Isolation**:
  - Words and `srs_progress` scoped strictly by `classroom_id`.
  - Zero cross-classroom word or due count leakage.
  - Personal classroom auto-resolved when `classroomId` omitted.
  - Tests: `T1.F3.1` – `T1.F3.5`.
- **F4: Unified Student Navigation Badges**:
  - `StudentShell` and `StudentProvider` share uniform cached word summary data.
  - Deduplicated queries: consecutive switches within 60s TTL do not trigger network calls.
  - Stale cache triggers single background revalidation while displaying cached count immediately.
  - Tests: `T1.F4.1` – `T1.F4.5`.

### R2. Fast Session Start & Audio Synchronization
- **F5: Fast Session Start (New Words)**:
  - `GET /api/words?filter=new` uses direct DB indexed selection rather than scanning 15,000 rows in server memory.
  - Returns strictly unstudied words (`review_count = 0`) ordered chronologically (`created_at` DESC).
  - Clamped batch limit (bounds 1..50).
  - Tests: `T1.F5.1` – `T1.F5.5`.
- **F6: SRS Due Queue Ordering**:
  - Priority queue places `review_count > 0 AND next_review_date <= now()` ahead of unstudied words.
  - Earlier due dates prioritized within the due segment.
  - Future cards (`next_review_date > now`) strictly excluded.
  - Tests: `T1.F6.1` – `T1.F6.5`.
- **F7: Session Batch Limits & Request Normalization**:
  - Normalizes limits to upper bounds (max 50 for new, max 100 for review).
  - Normalizes invalid or negative limit parameters.
  - Requested ID filtering bounded to max 20 UUIDs.
  - Tests: `T1.F7.1` – `T1.F7.5`.
- **F8: Audio Promise & Playback Tracking**:
  - `speak()` returns `Promise<void>` resolving upon audio completion.
  - `silenceSpeech()` and `stopSpeak()` advance epoch to prevent race conditions and overlapping voices.
  - Tests: `T1.F8.1` – `T1.F8.5`.
- **F9: Correct Answer Audio Synchronization**:
  - Correct verdict awaits `playWordWithBuffer(word, 400)` before auto-advancing card.
  - Pronunciation is never cut off mid-word during transitions.
  - Tests: `T1.F9.1` – `T1.F9.5`.
- **F10: Error State Manual Pause**:
  - Wrong / close answer (`verdict !== 'correct'`) halts auto-advance timer.
  - Displays correction and allows replaying audio pronunciation.
  - Requires user manual confirmation (Enter, Space, or "Tiếp theo" button) to advance.
  - Tests: `T1.F10.1` – `T1.F10.5`.

### R3. Fast Lookup & Instant Save
- **F11: Multi-Tier Client Dictionary Cache**:
  - L1 Memory Map (<5ms) -> L2 SessionStorage (<15ms) -> L3 Remote Global Dict (<100ms).
  - Morphological lemma expansion (e.g. "running" -> "run", "stopped" -> "stop").
  - Case-insensitive key matching.
  - Tests: `T1.F11.1` – `T1.F11.5`.
- **F12: Zero-DB Saved Status Check**:
  - Instant local cache / localStorage check with 0 network calls.
  - Synchronous Frame 0 popover rendering with accurate saved icon.
  - Cross-component synchronization via `lingo_word_saved` event.
  - Tests: `T1.F12.1` – `T1.F12.5`.
- **F13: Universal Optimistic Save UI**:
  - Instant UI toggle to "Saved" in <10ms synchronously.
  - Asynchronous background save dispatch.
  - Automatic rollback on 403 quota exhaustion with upsell modal trigger.
  - Automatic rollback and notification on network failure.
  - Tests: `T1.F13.1` – `T1.F13.5`.
- **F14: Streamlined Server Word Save**:
  - Concurrent duplicate check and quota resolution via `Promise.all`.
  - Duplicate saves return existing `wordId` without double-counting quota.
  - Free tier quota enforced at 200 words; Pro tier unlimited.
  - Background AI enrichment dispatch (`skipAI` option).
  - Tests: `T1.F14.1` – `T1.F14.5`.

---

## 3. Tier 2: Boundary & Corner Cases (40 Tests)

1. **B1: Empty Word Lists** (5 tests):
   - Zero word library returns integer 0 counts without `NaN`.
   - Empty review and new sessions return empty data arrays cleanly.
   - Whitespace and empty word inputs rejected with 400.
2. **B2: Zero Due Words** (5 tests):
   - All cards scheduled in future produces `reviewDueCount: 0`.
   - Empty due review session displays "Hết bài cần ôn" celebration state.
   - Time zone transitions do not trigger false due alerts.
3. **B3: Large Word Volume Stress** (5 tests):
   - 1,000+ words summary computes under 50ms.
   - Candidate slicing limits in-memory processing to <100 items.
   - 500+ lookups execute without memory degradation.
4. **B4: Offline / Network Delay** (5 tests):
   - 1500ms delay serves stale SWR cache immediately (<5ms).
   - Offline lookups served from local cache.
   - Restricted storage modes fail silently without crashing.
   - Speech synthesis falls back to local voice when CDN unavailable.
5. **B5: Concurrent Duplicate Saves** (5 tests):
   - Concurrent save requests create exactly 1 database entry.
   - Re-saving existing word preserves remaining quota.
   - UI button debouncing blocks double submissions.
6. **B6: Quota Boundary (200 Words Limit)** (5 tests):
   - Word 199/200: succeeds, remaining = 1.
   - Word 200/200: succeeds, remaining = 0.
   - Word 201/200: rejected with HTTP 403 `FREE_WORD_LIMIT`.
   - Existing word review at quota limit permitted.
   - Pro upgrade unlocks unlimited saves immediately.
7. **B7: Inflected Lemmas & Irregular Verbs** (5 tests):
   - Levenshtein matching on irregular forms.
   - Suffix stripping and double-consonant handling.
   - Compound words and contractions preserved.
8. **B8: Rapid Enter/Space Keystrokes** (5 tests):
   - Feedback lock timer (300ms) blocks accidental double-skip.
   - Rapid Space presses do not duplicate score.
   - Advance function is idempotent.

---

## 4. Tier 3: Cross-Feature Integration Flows (10 Tests)

- **T3.1**: Save Word -> Summary Count Increment -> Appears in Review Session -> Audio Buffer Played -> Summary Due Decrements.
- **T3.2**: Quota Exhaustion (200 limit) -> Optimistic Saved (<50ms) -> Server 403 -> UI Rollback & Upsell -> Summary Count Intact.
- **T3.3**: Batch Dictionary Lookups -> Cache Populated -> Multi-Save -> Summary Invalidated.
- **T3.4**: Review Session Mixed Answers (Correct buffers audio; Wrong pauses for Enter confirmation).
- **T3.5**: Inflected Word Lookup -> Base Lemma Reused -> Personal Classroom Summary Isolated.
- **T3.6**: Offline Dictionary Lookup -> Local Queue -> Reconnect Sync Dispatched.
- **T3.7**: Partial Session Completion (5 of 10) -> Dashboard Due Decrements Accurately.
- **T3.8**: Rapid Card Advances -> In-flight Utterance Cancelled -> Zero Audio Overlap.
- **T3.9**: Switching Classroom Context -> Zero Cross-Classroom Leakage.
- **T3.10**: Cross-Tab Storage Event -> Immediate UI Synchronization.

---

## 5. Tier 4: Real-World Workload Scenarios (5 Tests)

- **T4.1**: **Typical Daily Learner Session**:
  - Open Dashboard (<100ms instant SWR summary paint).
  - Search 3 new words (<100ms each) and instantly save with optimistic UI.
  - Complete 10-card review session (8 correct with full audio buffer, 2 wrong with manual pause).
  - Return to dashboard with exactly 2 due cards remaining.
- **T4.2**: **Free-to-Pro Upgrade Transition Journey**:
  - Hits 200 words quota -> 403 received -> optimistic rollback -> upgrades to Pro -> retry succeeds -> summary updates to 201.
- **T4.3**: **Commuter Flaky Network Journey**:
  - Local dictionary cache hit (<10ms) in subway tunnel -> ratings queued offline -> background sync on reconnect with zero data loss.
- **T4.4**: **Intensive Vocabulary Cramming Journey**:
  - 20 words saved in rapid succession; optimistic UI maintains 60fps (<16ms per frame).
- **T4.5**: **Multi-Classroom Partitioning Journey**:
  - Student with Teacher Classroom and Personal List reviews cards; counts remain cleanly partitioned.

---

## 6. Verification Method

To execute the test suite:
```powershell
npx tsx tests/perf/perf-ux-e2e.test.ts
```

All 125 assertions execute with informative logging, timing diagnostics, and zero external network dependencies.
