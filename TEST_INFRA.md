# Test Infrastructure Specification: Video Learning & Vocabulary Redesign

**Module**: Video Immersion Hub Redesign (`/practice/listening` & `/practice/listening/[videoId]`)  
**Track**: E2E Testing Track Orchestration  
**Status**: Authoritative Test Infrastructure & Quality Gate Document  
**Workspace Root**: `d:\Vibe\Vocab\web-app`  
**Date**: 2026-09-08  

---

## 1. Executive Summary & Architecture

This document formalizes the automated test infrastructure for the **Video Learning & Vocabulary Redesign** project on LingoPro (`/practice/listening`). The platform transitions from a dense paginated grid into a modern, distraction-free horizontal shelf immersion experience featuring:
1. **Horizontal Shelf Rows**: Catalog organized into 7 distinct life topics (`daily_life`, `social_conversations`, `workplace`, `travel`, `food_shopping`, `science_tech_health`, `culture`).
2. **"3 Video Đề Xuất Hôm Nay" Shelf**: Top-priority daily recommendation engine delivering exactly 3 curated videos every day using deterministic calendar-date PRNG seeding (Mulberry32) and multi-pass topic/level diversity.
3. **Smart Queue Reordering**: Dynamically migrates completed videos (`percent >= 90%` or YouTube `ENDED`) to the tail of each topic shelf, promoting unwatched and in-progress content to the front while maintaining stable ordering.
4. **Minimalist Player Immersion**: Streamlined 2-column layout (Left: Video Player, Right: Real-time Synchronized Transcript) that completely removes cluttered exercise tabs, cloze dictation, comprehension quizzes, and distracting gamification modals during viewing.
5. **Precision Subtitle Sync & Seek-on-Click**: Sub-second synchronization via $O(\log N)$ binary search, 1.2s hysteresis buffer across natural pauses, and authentic YouTube captions with zero synthetic template strings.

---

## 2. Test Philosophy & Design Standards

### 2.1 Opaque-Box & Requirement-Driven Testing
All tests interact exclusively through public interface contracts and observable state transitions:
- Data loaders and catalog query methods (`getListeningVideosIndex`, `getListeningVideoById`).
- Recommendation and queue algorithms (`getDailyRecommendedVideos`, `reorderShelfVideos`).
- Watch state persistence methods (`getVideoWatchProgress`, `saveVideoWatchProgress`, `getAllVideoWatchProgress`, `isVideoCompleted`, `getVideoWatchStatus`).
- Browser event dispatching (`lingo_listening_watch_updated`).
- DOM layout contracts and localStorage state keys.

### 2.2 Authoritative Expected Output Derivations (Zero Facade)
Expected outputs are derived strictly from formal mathematical properties, deterministic pseudo-random seeds, and documented specifications:
- **Date Seed Derivation**:
  $$\text{Seed} = \left| \sum_{i=0}^{L-1} ((\text{hash} \ll 5) - \text{hash} + \text{charCodeAt}(i)) \mid 0 \right|$$
  Seed for `2026-09-08` produces reproducible pseudo-random streams via the Mulberry32 algorithm.
- **Completion Invariant**:
  $$\text{Completed} = \text{wasCompleted} \lor (\text{percent} \ge 90) \lor (\text{playerState} == 0)$$
  Once a video achieves completion, subsequent backward seeks or rewinds will **never** unmark completion (Sticky Completion Invariant).
- **Queue Partitioning Tiering**:
  $$\text{Tier}(v) = \begin{cases} 
  0 & \text{if in-progress (when inProgressFirst is true) or unwatched} \\ 
  1 & \text{if unwatched (when inProgressFirst is true) or in-progress} \\ 
  2 & \text{if completed} 
  \end{cases}$$
  Ties within identical tiers are broken by original catalog index: $\text{OrigIndex}(a) - \text{OrigIndex}(b)$.

### 2.3 Independence & Isolation
Every test is fully isolated. Tests operating with web storage utilize `setupMockBrowserEnvironment()` and `teardownMockBrowserEnvironment()`, preventing state pollution across test boundaries.

---

## 3. Four-Tier Requirement-Driven Test Suite

The test suite is organized into 4 distinct verification tiers totaling **53 automated tests** in `tests/listening/e2e-video-redesign.test.ts`, plus 97 baseline regression tests in `tests/listening/run-all-listening-tests.ts` (150 total tests).

```
tests/listening/
├── test-harness.ts                   # Zero-dependency test runner, matchers & browser mocks
├── e2e-video-redesign.test.ts        # Redesign E2E Suite (53 tests across 4 tiers)
├── tier1-feature-coverage.test.ts    # Baseline Feature tests (23 tests)
├── tier2-boundary-corner.test.ts     # Baseline Boundary tests (36 tests)
├── tier3-cross-feature.test.ts       # Baseline Cross-feature tests (26 tests)
├── tier4-real-world-scenarios.test.ts# Baseline Scenarios (12 tests)
└── run-all-listening-tests.ts        # Master runner aggregating all 150 tests
```

### Tier 1: Feature Coverage (33 Tests)
Verifies each feature independently with $\ge 5$ test cases per feature:

| Feature | Scope | Test IDs | Requirements Covered |
|---|---|---|---|
| **Shelf Grouping** | Partitioning 200 videos across 7 topics (`daily_life`, `social_conversations`, `workplace`, `travel`, `food_shopping`, `science_tech_health`, `culture`), catalog depth ($\ge 15$/topic), localized badges, card metadata, and mutual exclusivity. | `F1.1` – `F1.5` (5 tests) | R1 |
| **Daily Recommendation** | Exactly 3 recommendations, deterministic Mulberry32 PRNG reproducibility, 3 distinct topics, multi-level diversity (A2/B1/B2), unwatched priority, and exhausted candidate fallback. | `F2.1` – `F2.6` (6 tests) | R1, R3 |
| **Queue Reordering** | Completed video moves to tail, unwatched videos remain front, stable relative ordering (zero UI jitter), multi-completion batching, `inProgressFirst` option, and 0-completed identity preservation. | `F3.1` – `F3.6` (6 tests) | R1 |
| **Watch Status & Persistence** | $\ge 90\%$ completion threshold, $<90\%$ non-completion, sticky completion invariant, YouTube ENDED event completion, status classification (`unwatched`, `in_progress`, `completed`), and localStorage roundtrip. | `F4.1` – `F4.6` (6 tests) | R3 |
| **Minimalist Player Focus** | 2-column layout (player + synced transcript), elimination of 4-tab bar, absence of distracting gamification modals during playback, focus mode persistence, and playback controls (speed, seek). | `F5.1` – `F5.5` (5 tests) | R2 |
| **Subtitle Sync & Seeking** | Sub-second sync ($O(\log N)$ binary search), 1.2s hysteresis buffer across silences, authentic caption verification (0% template strings), click-to-seek contract, and non-blocking word tokenization. | `F6.1` – `F6.5` (5 tests) | R2 |

### Tier 2: Boundary & Corner Cases (8 Tests)
Exercises extreme values, temporal boundaries, and corrupted environments:
- `B1`: Empty watch map (`{}`) maintains 100% original catalog order and marks all videos unwatched.
- `B2`: 100% completed catalog gracefully falls back to recommend 3 diverse videos deterministically without throwing.
- `B3`: Exact 90% threshold precision ($89.4\%$ is uncompleted, $90.0\%$ is completed, $90.5\%$ is completed).
- `B4`: Midnight date transition (`2026-09-08` $\to$ `2026-09-09`) alters hash seed and produces distinct recommendations.
- `B5`: Backward seek across cues (cue 8 $\to$ cue 1) updates active index immediately without hysteresis lag.
- `B6`: Rapid scrub and extreme timestamps ($-100s, 0s, 999999s, \text{NaN}, \infty$) handle safely without throwing.
- `B7`: Empty shelf (`[]`) and single-item shelf (`[v]`) reordering handle smoothly.
- `B8`: Corrupted localStorage JSON payloads recover gracefully with safe `null` fallbacks.

### Tier 3: Cross-Feature Combinations (8 Tests)
Validates pairwise interactions and concurrent state transitions:
- `C1`: Daily Recommendation + Shelf Queue Reordering (completing a daily recommendation moves it to the tail of its shelf while other recommendations remain near the front).
- `C2`: Subtitle click-to-seek to tail segment triggers auto-completion save.
- `C3`: Sticky completion invariant + subtitle rewinding (seeking to 0.0s preserves completion).
- `C4`: Midnight date rollover + in-progress state retention (new recommendations generated while in-progress progress remains intact).
- `C5`: Multi-topic shelf isolation (completing videos in Topic A does not alter order in Topic B).
- `C6`: Queue reordering with mixed statuses (`[in-progress, unwatched, completed]`).
- `C7`: Minimalist player + Subtitle hysteresis during video pause (active cue remains highlighted during pause).
- `C8`: Multi-video progress storage isolation (multiple simultaneous video watch states remain strictly independent).

### Tier 4: Real-World Scenarios (4 Tests)
Simulates complete learner workflows from start to finish:
- `S1: Complete Learner Full-Day Session`: Learner opens daily 3 recommendations $\to$ watches Video 1 to $95\%$ $\to$ rewinds to 15s to repeat sentence $\to$ returns to library to see 1/3 daily goal achieved and Video 1 moved to shelf tail $\to$ reloads page and confirms state persistence.
- `S2: Multi-Topic Exploration and Shelf Navigation`: Learner explores shelves, starts Workplace video ($45\%$), starts Travel video ($92\%$), and verifies correct queue positions across both shelves.
- `S3: Deep Immersion Listening Session`: Learner navigates through 5 consecutive cues via click-to-seek, verifying sub-second timing and active cue alignment without audio pause desync.
- `S4: Catalog Mastery & Recommendation Fallback`: Power user with 100% completed catalog browses shelves safely with completed cards grouped at tail, receiving 3 fallback recommendations with full topic diversity.

---

## 4. Test Execution & Verification

### 4.1 Running the Video Redesign E2E Suite Standalone
```bash
npx tsx tests/listening/e2e-video-redesign.test.ts
```
*Expected Result*: 53 tests passed in <500ms with exit code 0.

### 4.2 Running the Master Listening Test Suite
```bash
npx tsx tests/listening/run-all-listening-tests.ts
```
*Expected Result*: 150 tests passed across all suites (Tier 1: 23, Tier 2: 36, Tier 3: 26, Tier 4: 12, Redesign E2E: 53) with exit code 0.

### 4.3 Typecheck Compilation Integrity
```bash
npm run typecheck
```
*Expected Result*: 0 type errors across all test and source files.

---

## 5. Traceability Matrix

| Requirement Code | Description | Automated Verification Suite |
|:---:|---|---|
| **R1.1** | Horizontal shelf rows grouped by 7 life topics | `F1.1` – `F1.5`, `C5`, `S2` |
| **R1.2** | Top priority "3 Video Đề Xuất Hôm Nay" shelf | `F2.1` – `F2.6`, `B2`, `B4`, `C1`, `S1`, `S4` |
| **R1.3** | Smart queue reordering (completed moved to tail) | `F3.1` – `F3.6`, `B1`, `B7`, `C1`, `C6`, `S1`, `S2` |
| **R2.1** | Minimalist player layout (2-column, no exercise tabs) | `F5.1` – `F5.5`, `S1` |
| **R2.2** | Authentic YouTube captions without template strings | `F6.3` |
| **R2.3** | Subtitle sync ($O(\log N)$), 1.2s hysteresis & click-to-seek | `F6.1`, `F6.2`, `F6.4`, `F6.5`, `B5`, `B6`, `C2`, `C7`, `S3` |
| **R3.1** | Watch progress schema, $\ge 90\%$ rule & sticky completion | `F4.1` – `F4.6`, `B3`, `C3`, `C8`, `S1` |
| **R3.2** | LocalStorage persistence & session reload recovery | `F4.6`, `B8`, `C4`, `S1` |
