# Test Infrastructure: Instant Hydration & Offline-First Study Engine

**Target Workspace**: `d:\Vibe\Vocab\web-app`
**Test Suite Directory**: `tests/offline/`
**Master Runner**: `npx tsx tests/offline/offline-study-engine.test.ts`
**TypeScript Validation**: `npx tsc --noEmit`
**Target Coverage**: 4-Tier Automated Verification Suite across Snapshot Cache, IndexedDB Study Queue, Review WAL, and Replay Reconnection
**Dependencies**: Zero external testing frameworks; executes natively in Node.js v20+ / TypeScript via `tsx`

---

## 1. Test Architecture & Design Philosophy

The Offline Study Engine test suite provides high-fidelity, contract-driven automated verification for the **Instant Hydration (Frame 0) & Offline-First Study Engine** milestone across the LingoPro Web/PWA application.

### Authoritative Reference Sources:
1. **`ORIGINAL_REQUEST.md` (Header `## 2026-10-12T15:59:51Z`)**:
   - **R1. Instant Frame 0 Dashboard Hydration**: Synchronous snapshot restoration (< 50ms) from Local Snapshot Cache, zero spinner/skeleton blocking, silent background SWR revalidation.
   - **R2. Offline Study Queue in IndexedDB (0ms Flashcard/Review)**: Native IndexedDB `lingopro_study_engine` prefetching 50–100 due & new words with translations, IPA, audio blobs, and examples; 0ms card opening; local FSRS recording and background sync.
   - **R3. PWA App Shell Caching & Service Worker Resiliency**: Unified Service Worker precache (`/offline.html`, manifest, icons) with graceful offline fallback and network-only API bypass.
   - **R4. Security Boundary Compliance**: Absolute zero JWT access/refresh token storage in `localStorage`, `sessionStorage`, or `IndexedDB` (Phase 2c BFF Session Vault invariant).
2. **`PROJECT.md` (`orchestrator_17`)**:
   - Specifications for M1 (`dashboard-snapshot-cache.ts`), M2 (`src/lib/offline/`), M3 (`firebase-messaging-sw`), and M4 (`tests/offline/`).
   - Defined schemas for stores: `study_words`, `offline_review_queue`, `audio_cache`, and `sync_metadata`.
   - CAS review deduplication via `reviewId` and `srs_review_events`.
3. **Explorer Research Reports**:
   - `orch17_survey_explorer_1\handoff.md`: Frame 0 cache retrieval, key regex `/^lp:(profile|gamification|teacher|word-summary|dashboard-words):/`, account switching isolation.
   - `orch17_survey_explorer_2\handoff.md`: Write-Ahead Log (WAL) queue status progression, CAS idempotency, audio blob caching.
   - `orch17_survey_explorer_3\handoff.md`: Unified Service Worker with single scope `/`, HttpOnly cookie architecture, pass-through API security.

---

## 2. Directory Layout & Module Structure

```
tests/offline/
└── offline-study-engine.test.ts   # Master 4-tier automated test suite covering Tiers 1–4
```

### Supporting Modules & Contracts:
- `src/lib/dashboard-snapshot-cache.ts`: Local Snapshot Cache engine for profile, gamification, and preview word counts.
- `src/lib/offline/types.ts`: TypeScript contracts for `OfflineStudyWord`, `OfflineReviewEvent`, `OfflineAudioRecord`, `OfflineSyncMetadata`.
- `src/lib/offline/db.ts`: Native Promise-based IndexedDB engine (`lingopro_study_engine`, v1).
- `src/lib/offline/study-queue.ts`: Prefetch and retrieval functions for study cards.
- `src/lib/offline/review-sync.ts`: Write-Ahead Log review queuing, status transitions, retry backoff, and CAS replay.
- `src/lib/offline/audio-cache.ts`: Audio blob caching, Object URL lifecycle management, and Web Speech fallback.

---

## 3. Four-Tier Test Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│             Tier 4: Real-World Simulated Offline Review Flows          │
│    (Prefetch -> Disconnect -> 10 Reviews -> Audio Play -> Reconnect)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Tier 3: Cross-Feature & WAL Sync Queuing              │
│    (WAL Event State Machine, Retry Counts, CAS Deduplication, Flush)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Tier 2: Boundary & Corner Cases                       │
│    (0 Words, Corrupted Cache, Audio Fallbacks, Adversarial/Unicode)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Tier 1: Feature Coverage                            │
│    (Local Snapshot Cache, Frame 0 Read/Write, Multi-Account Isolation) │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Tier 1: Feature Coverage (Local Snapshot Cache & Hydration Primitives)
- **T1.1: Local Snapshot Cache Storage & Retrieval**:
  - Tests writing `ShellProfile`, `UserGamification`, and preview `Word[]` to storage.
  - Verifies dual-tier persistence in both `localStorage` and `sessionStorage`.
  - Verifies `lp:last_user_id` pointer synchronization for instant cold-start lookup.
- **T1.2: Synchronous Frame 0 Retrieval (< 1ms)**:
  - Verifies `readLastProfileCache()`, `readLastGamificationCache()`, and `readLastDashboardWordsCache()` return synchronously within 1 execution tick without waiting for async `Promise` resolution.
- **T1.3: Multi-Account Isolation & Storage Purging**:
  - Verifies User A's cached profile and gamification are strictly isolated from User B.
  - Verifies `clearAccountCache()` regex `/^(lp:(profile|gamification|teacher|word-summary|dashboard-words):|lp:last_user_id$)/` cleanly wipes all cached data upon logout or account change.
  - Verifies User B never receives User A's cached state upon login.
- **T1.4: Zero JWT / Secret Credential Invariant**:
  - Verifies snapshot cache keys contain strictly non-sensitive display fields.
  - Verifies no `access_token`, `refresh_token`, or session secrets exist in browser storage.

---

### Tier 2: Boundary & Corner Cases (IndexedDB `study_words` & Data Integrity)
- **T2.1: Store Schema & Index Creation**:
  - Verifies database creation for `lingopro_study_engine` (v1) with stores: `study_words`, `offline_review_queue`, `audio_cache`, and `sync_metadata`.
  - Verifies compound and single indexes: `by_user`, `by_queue`, `by_due`, `by_status`, `by_created`.
- **T2.2: Batch Prefetching (50–100 Words)**:
  - Verifies prefetching batches of 50 due words and 25 new words into `study_words`.
  - Verifies accurate partitioning into `queueType: 'review'` and `queueType: 'new'`.
  - Verifies retrieval speed and index filtering by `userId`.
- **T2.3: Zero Words Boundary Condition**:
  - Verifies behavior when student has 0 due words and 0 new words: gracefully returns empty queue, 0 exceptions, no UI crashes.
- **T2.4: Corrupted Cache Resilience**:
  - Tests malformed JSON strings, null/undefined payloads, and missing mandatory properties in cache.
  - Verifies self-healing fallback to empty state without throwing runtime exceptions.
- **T2.5: Missing Audio & Network Failure Graceful Degradation**:
  - Verifies when audio blob is absent in `audio_cache`, system gracefully falls back to OS Web Speech API without halting the flashcard session.
- **T2.6: Special Characters & Unicode Escaping**:
  - Verifies high-fidelity storage and retrieval for words containing Vietnamese diacritics (`chữa cháy`, `học sinh`), French accents (`café`, `résumé`), apostrophes (`don't`, `o'clock`), hyphens (`well-known`), and adversarial inputs (HTML tags, SQL injection payloads, zero-width characters).

---

### Tier 3: Cross-Feature Combinations & WAL Review Sync
- **T3.1: Write-Ahead Log (WAL) Event Appending**:
  - Verifies rating a card immediately writes an immutable `OfflineReviewEvent` to `offline_review_queue` with `status: 'pending'`, `clientTimestamp`, and unique `reviewId`.
- **T3.2: Optimistic Local State Transition**:
  - Verifies card SRS state in `study_words` updates optimistically immediately upon rating without waiting for server network response.
- **T3.3: Status Transitions (`pending` -> `syncing` -> `synced`)**:
  - Verifies atomic lifecycle transition of queue events during sync replay attempts.
- **T3.4: Network Failure & Exponential Retry Counts**:
  - Verifies that when network push fails, event status remains `pending`, `retryCount` increments, and zero error toasts or blocking alerts are emitted.
- **T3.5: CAS Idempotency & Deduplication with `reviewId`**:
  - Verifies replay handling when server returns `'duplicate'` (request previously acknowledged before network drop): client marks event as `'synced'` and avoids double-awarding XP or corrupted state.
- **T3.6: Chronological Replay Order (FIFO)**:
  - Verifies queued events for sequential reviews are dispatched in exact chronological order (`createdAt ASC`) to maintain causal FSRS consistency.

---

### Tier 4: Real-World Scenarios (End-to-End Simulation)
- **T4.1: Complete Offline Review Lifecycle (Flight / Underground Mode)**:
  1. *Online Phase*: Student logs in, preloads 50 vocabulary words and audio pronunciation blobs.
  2. *Disconnect Phase*: Device goes offline (`navigator.onLine = false`, network disabled).
  3. *Study Phase*: Student launches `/review/session`, cards load in 0ms from IndexedDB. Student completes 10 card reviews across various quality ratings (`Again=0`, `Hard=3`, `Good=4`, `Easy=5`).
  4. *Audio Verification*: Audio plays seamlessly via Blob URLs from `audio_cache` with zero network access.
  5. *Queue Verification*: Exactly 10 reviews logged in WAL queue with `status: 'pending'`.
  6. *Reconnect Phase*: Network connection restores (`navigator.onLine = true`).
  7. *Replay Phase*: Sync engine flushes queue to server. All 10 events successfully synced and cleared.
- **T4.2: Intermittent Network Flapping During Review**:
  - Simulates network dropping and reconnecting repeatedly during active review sessions; ensures zero lost reviews, zero duplicate reviews, and seamless UI progression.

---

## 4. Key Behavioral & Security Invariants Enforced

1. **Frame 0 Hydration (< 50ms)**:
   - Dashboard loads non-empty profile, streak, and preview words synchronously on first render tick from Local Snapshot Cache.
2. **Offline-First Zero-Error UX**:
   - Network disconnections during flashcard/review sessions result in zero error toasts, zero broken audio playback, and zero progress loss.
3. **Write-Ahead Log (WAL) Integrity**:
   - Every review mutation is saved to IndexedDB before or alongside network attempts. Disconnections cannot cause data loss.
4. **Idempotent Background Replay**:
   - Every queued review mutation carries an immutable `reviewId`. Server CAS prevents duplicate reviews or double XP awards.
5. **Phase 2c BFF Session Vault Token-Free Invariant**:
   - No JWT `access_token` or `refresh_token` is ever stored in browser storage (`localStorage`, `sessionStorage`, or `IndexedDB`).

---

## 5. Verification Commands

```bash
# Execute the offline study engine test suite
npx tsx tests/offline/offline-study-engine.test.ts

# Run static TypeScript type check
npx tsc --noEmit
```
