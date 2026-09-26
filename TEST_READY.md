# TEST_READY: TOEIC Part 3 & Part 4 Overhaul Comprehensive E2E Test Suite

**Status**: READY (150 / 150 PASSED — 100% Pass Rate)  
**Execution Command**:
```bash
npx tsx tests/toeic/toeic-cluster-e2e.test.ts
```
**Typecheck Verification**:
```bash
npx tsc --noEmit
```
(Exit Code 0 — 0 TypeScript errors)

**Execution Duration**: ~338ms  
**Test File**: `tests/toeic/toeic-cluster-e2e.test.ts` (2,181 lines, 150 tests)  
**Helper Harness**: `tests/toeic/test-harness.ts`  
**Test Framework**: TypeScript native test runner with opaque-box assertion library  
**Authoritative References**:
- `ORIGINAL_REQUEST.md` (TOEIC Listening Part 3 & 4 Cluster overhaul specifications)
- `d:\Vibe\Vocab\web-app\.agents\orchestrator_toeic_5\PROJECT.md`
- `d:\Vibe\Vocab\web-app\.agents\orchestrator_toeic_5\TEST_INFRA.md`
- `d:\Vibe\Vocab\web-app\.agents\skills\standardized-exam-engine\SKILL.md`

---

## 1. Executive Test Summary

| Tier / Suite Name | Description | Minimum Required | Implemented & Verified | Pass Rate | Status | Duration |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **Tier 1: Feature Coverage** | Features 1 to 13 (5 tests per feature) | $\ge 65$ | **65** | **100%** | **PASS** | 162ms |
| **Tier 2: Boundary & Corner Cases** | Boundary conditions across all 13 features | $\ge 65$ | **65** | **100%** | **PASS** | 128ms |
| **Tier 3: Cross-Feature Combinations** | Pairwise and multi-feature interaction cascades | $\ge 15$ | **15** | **100%** | **PASS** | 24ms |
| **Tier 4: Real-World Exam Scenarios** | Full application-level workloads & attack simulations | $\ge 5$ | **5** | **100%** | **PASS** | 24ms |
| **TOTAL** | **Full 4-Tier Opaque-Box E2E Suite** | **$\ge 150$** | **150** | **100%** | **PASS** | **338ms** |

---

## 2. Feature Inventory Traceability Matrix (Features 1–13)

### F1. Audio 1:3 Alignment (R1)
- **Concept**: Single shared audio track per 3-question cluster (Part 3: Q32–Q70 = 13 tracks; Part 4: Q71–Q100 = 10 tracks).
- **Tier 1 Tests**:
  - `F1-1`: Part 3 question cluster resolution returns non-empty `audioUrl` and exactly 3 questions.
  - `F1-2`: Part 4 question cluster resolution returns non-empty `audioUrl` and exactly 3 questions.
  - `F1-3`: All 3 questions within cluster `c32-33-34` resolve to the exact identical audio URL.
  - `F1-4`: Audio URL path format conforms to `/audio/toeic/...` or CDN HTTPS URL.
  - `F1-5`: Sequential Part 3 audio cluster indices map accurately from `audio_p3_01` to `audio_p3_13`.
- **Tier 2 Boundaries**: `B1-1` to `B1-5` (Cluster index boundaries Q32, Q70, Q71, Q100, out-of-range Q101).

### F2. Zero Phase Shift (R1)
- **Concept**: Every question in a cluster plays the exact conversation or talk intended for it.
- **Tier 1 Tests**:
  - `F2-1`: Q32 plays dialogue 1 (`audio_p3_01`), never intro or Q31 audio.
  - `F2-2`: Q35 plays dialogue 2 (`audio_p3_02`), distinctly different from dialogue 1.
  - `F2-3`: Part 4 first cluster Q71 plays talk 1 (`audio_p4_01`).
  - `F2-4`: Part 4 last cluster Q98 plays talk 10 (`audio_p4_10`).
  - `F2-5`: All 3 questions in any cluster resolve to the same audio group index.
- **Tier 2 Boundaries**: `B2-1` to `B2-5` (Part 2 to Part 3 boundary Q31->Q32, Part 3 to Part 4 boundary Q70->Q71, Part 4 to Part 5 boundary Q100->Q101).

### F3. Graphic / Chart Metadata (R1)
- **Concept**: Questions referencing visual stimuli ("Look at the graphic...") have non-null `imageUrl`.
- **Tier 1 Tests**:
  - `F3-1`: Questions referencing visual graphics have non-null `imageUrl`.
  - `F3-2`: Non-graphic questions do not mandate `imageUrl`.
  - `F3-3`: Graphic image URL resolves to valid image asset path or CDN.
  - `F3-4`: Scanned image test questions retain crop image URLs for cluster.
  - `F3-5`: Graphic question retains both audio stimulus and visual graphic metadata simultaneously.
- **Tier 2 Boundaries**: `B3-1` to `B3-5` (False positive "graphic" text, malformed URLs, option prefix cleaning, isolated graphic in cluster, consecutive graphics).

### F4. Cluster Data Modeling (R2)
- **Concept**: `ToeicQuestionCluster` envelope schema containing `id`, `partNumber`, `clusterIndex`, `questionRange`, `audioUrl`, `imageUrl`, and `questions: ToeicUnifiedQuestion[]`.
- **Tier 1 Tests**:
  - `F4-1`: `ToeicQuestionCluster` contains all mandatory structural fields.
  - `F4-2`: Part 3 cluster questions array length is strictly 3.
  - `F4-3`: Part 4 cluster questions array length is strictly 3.
  - `F4-4`: `groupQuestionsIntoStimulusGroups` partitions 100 questions into 60 clusters + standalone items.
  - `F4-5`: Cluster partitioning preserves question ordering strictly without gaps or omissions.
- **Tier 2 Boundaries**: `B4-1` to `B4-5` (Partial question array, empty options, deep immutability, negative questionNumber, empty question list).

### F5. API Backward Compatibility (R2)
- **Concept**: `/api/toeic/test` and `/api/toeic/submit` endpoints operate seamlessly with cluster-aware clients and legacy clients.
- **Tier 1 Tests**:
  - `F5-1`: Sanitized test delivery strips `correctAnswer` and `explanation`.
  - `F5-2`: Sanitized questions retain cluster grouping fields (`clusterId`, `audioUrl`, `groupQuestionIds`).
  - `F5-3`: Client submitting answers dictionary calculates correct raw score.
  - `F5-4`: Submission response returns ETS scaled scores for listening (5–495) and reading (5–495).
  - `F5-5`: Submission response includes CEFR proficiency level (A1 to C1).
- **Tier 2 Boundaries**: `B5-1` to `B5-5` (Empty answers object, 1 of 3 answered, out-of-bound question numbers, unrecognized test fallback, extreme timeSpent).

### F6. Zero Bulk Leaks & Active Cyber Defense (R2)
- **Concept**: Canary honeypots, rate-limiting velocity checks, silent data poisoning, and invisible HMAC watermarking per `standardized-exam-engine` skill.
- **Tier 1 Tests**:
  - `F6-1`: Full test payload in exam mode contains zero `correctAnswer` values.
  - `F6-2`: Full test payload in exam mode contains zero explanation/transcript texts.
  - `F6-3`: Honeypot canary test IDs trigger active defense detection.
  - `F6-4`: Rapid bulk explain requests trigger rate velocity throttling.
  - `F6-5`: Invisible watermark embedding and extraction round-trip validates candidate session signature.
- **Tier 2 Boundaries**: `B6-1` to `B6-5` (Canonical canary test IDs set detection, <1.5s velocity threshold, expired HMAC tokens, truncated payload rejection, cross-session bot persistence).

### F7. ETS Barem Scoring Monotonicity (R2)
- **Concept**: Raw-to-scaled score mapping is strictly monotonically increasing and conforms to ETS official tables.
- **Tier 1 Tests**:
  - `F7-1`: Listening score is strictly monotonic ($raw_{k} \le raw_{k+1} \implies scaled_k \le scaled_{k+1}$).
  - `F7-2`: Reading score is strictly monotonic across all 0..100 raw points.
  - `F7-3`: Raw 0 maps to exactly 5 on listening and 5 on reading (total 10).
  - `F7-4`: Raw 100 maps to exactly 495 on listening and 495 on reading (total 990).
  - `F7-5`: Mid-range raw scores conform to canonical ETS curve (e.g. raw 50 -> 245-285).
- **Tier 2 Boundaries**: `B7-1` to `B7-5` (Raw 0 clamping, Raw 100 ceiling, negative raw clamping, raw >100 clamping, exact CEFR boundary score thresholds).

### F8. ETS Split-Pane 3-Question View (R3)
- **Concept**: Split-pane layout with Left: shared stimulus (audio player + graphic/passage/scanned crop), Right: vertical stack of all 3 questions visible simultaneously.
- **Tier 1 Tests**:
  - `F8-1`: Cluster view presents all 3 questions in a single pane simultaneously.
  - `F8-2`: Active question within cluster updates without hiding other 2 questions.
  - `F8-3`: Stimulus pane maintains shared audio controls while viewing all 3 questions.
  - `F8-4`: Navigating to next cluster advances all 3 questions together (e.g. Q32-34 -> Q35-37).
  - `F8-5`: Navigating to previous cluster retreats all 3 questions together (e.g. Q35-37 -> Q32-34).
- **Tier 2 Boundaries**: `B8-1` to `B8-5` (Long question stem >500 chars, multi-line options, 320px mobile viewport, missing stimulus fallback, rapid cluster toggling).

### F9. Dual Format Rendering (R3)
- **Concept**: Supports both standard digital full-text format and scanned physical booklet format (`ets-2024-01`).
- **Tier 1 Tests**:
  - `F9-1`: Full-text format renders clean text without scanned booklet artifacts.
  - `F9-2`: Scanned booklet format renders question crop image (`cropImageUrl`).
  - `F9-3`: Scanned booklet format renders compact (A)(B)(C)(D) radio bubbles.
  - `F9-4`: Scanned format includes image zoom lightbox trigger.
  - `F9-5`: Text format and scanned format handle identical cluster data structure seamlessly.
- **Tier 2 Boundaries**: `B9-1` to `B9-5` (Broken crop URL fallback, combined text+image coexistence, HTML entity decoding, Part 2 3-option items, zoom lightbox memory safety).

### F10. Audio Player Invariance (R4)
- **Concept**: Answering questions, selecting radio buttons, or toggling flags never pauses, stutters, or resets audio playback.
- **Tier 1 Tests**:
  - `F10-1`: Selecting option on Q32 while audio is playing does not change player status.
  - `F10-2`: Selecting option on Q33 while audio is playing does not reset currentTime.
  - `F10-3`: Answering all 3 questions in cluster preserves audio playback position.
  - `F10-4`: Toggling question flag does not disrupt audio playback.
  - `F10-5`: Rapid sequential answer selections do not cause audio play/pause churn.
- **Tier 2 Boundaries**: `B10-1` to `B10-5` (Undefined audio URL handling, idempotent play events, simultaneous answer selection, repeated answer changing A->B->C->D, answer deselect preservation).

### F11. Real Exam Audio Lock (R4)
- **Concept**: In real exam mode, each cluster audio track plays exactly once with seek bar disabled.
- **Tier 1 Tests**:
  - `F11-1`: In real exam mode, audio seek bar is disabled (`canSeek = false`).
  - `F11-2`: When cluster audio reaches end (`onEnded`), replay button is locked (`canReplay = false`).
  - `F11-3`: Attempting to call play() on completed cluster audio is rejected in real exam mode.
  - `F11-4`: In practice mode, seek bar and replay remain enabled (`canSeek = true`, `canReplay = true`).
  - `F11-5`: Audio lock state is tracked per cluster independently.
- **Tier 2 Boundaries**: `B11-1` to `B11-5` (Network buffer underrun handling, manual seek rejection, pause-resume lock preservation, immediate ended-event lock engagement, tab switching persistence).

### F12. Question Palette 3-Question Blocks (R5)
- **Concept**: Question palette visually groups Part 3 & 4 items into 3-cell blocks, reflecting aggregate cluster answered state.
- **Tier 1 Tests**:
  - `F12-1`: Palette renders Part 3 items in 3-question cluster blocks.
  - `F12-2`: Palette cluster block shows "incomplete" when 1 or 2 of 3 questions answered.
  - `F12-3`: Palette cluster block shows "complete" when all 3 questions answered.
  - `F12-4`: Palette cluster block shows "unanswered" when 0 questions answered.
  - `F12-5`: Clicking any question inside a cluster block jumps to that cluster.
- **Tier 2 Boundaries**: `B12-1` to `B12-5` (0% answered, 100% answered, all flagged, invalid jump indices, bulk restore from localStorage synchronization).

### F13. Review Mode Transcript & Cues (R5)
- **Concept**: Post-submission review mode presents full dialogue transcript with inline `(32)`, `(33)`, `(34)` answer cue badges.
- **Tier 1 Tests**:
  - `F13-1`: Review mode displays full conversation transcript for Part 3 cluster.
  - `F13-2`: Review mode displays talk script for Part 4 cluster.
  - `F13-3`: Transcript contains question cue badges matching cluster question numbers.
  - `F13-4`: Clicking cue badge highlights corresponding question.
  - `F13-5`: Review mode displays correct answer and detailed explanation for each cluster question.
- **Tier 2 Boundaries**: `B13-1` to `B13-5` (Missing cue badges fallback, multiple cue badges collision, missing explanation guidance, unattempted question review, speaker label formatting).

---

## 3. Tier 3: Cross-Feature Combinations Traceability Matrix

| ID | Features Combined | Interaction Tested | Status |
|:---|:---|:---|:---:|
| `T3-1` | F8 + F10 + F12 | Cluster navigation + Answer selection + Audio player invariance | **PASS** |
| `T3-2` | F11 + F12 + F7 | Real exam mode audio lock + Palette status update + Timer countdown | **PASS** |
| `T3-3` | F9 + F8 + F12 | Scanned image format + 3-Question split-pane selection + Flagging | **PASS** |
| `T3-4` | F3 + F1 + F5 | Graphic item metadata + Audio dialogue playback + Answer submission | **PASS** |
| `T3-5` | F6 + F4 + F13 | Zero Bulk Leaks delivery + Cluster resolution + On-demand explanation | **PASS** |
| `T3-6` | F8 + F11 + F13 | Practice mode cluster answer + Immediate explanation toggle + Audio replay | **PASS** |
| `T3-7` | F10 + F12 | Complete cluster answer (all 3 selected) + Palette cluster block status becomes complete | **PASS** |
| `T3-8` | F8 + F12 + F5 | Partial cluster answer (1/3 selected) + Exam autosave to localStorage + Restore session | **PASS** |
| `T3-9` | F1 + F2 | Audio 1:3 alignment + Zero phase shift across all 13 Part 3 clusters sequentially | **PASS** |
| `T3-10` | F1 + F2 | Audio 1:3 alignment + Zero phase shift across all 10 Part 4 clusters sequentially | **PASS** |
| `T3-11` | F6 + F5 + F7 | Honeypot canary trigger during cluster exam + Silent poisoned scoring response | **PASS** |
| `T3-12` | F5 + F7 + F13 | Full test submission + ETS barem scaled calculation + Review mode cue badge rendering | **PASS** |
| `T3-13` | F8 + F10 + F12 | Question palette jump between Part 3 cluster and Part 4 cluster + Stimulus swap | **PASS** |
| `T3-14` | F10 + F11 + F8 | Rapid answer switching across 3 questions while audio finishes + Audio lock engages | **PASS** |
| `T3-15` | F9 + F4 + F7 | Dual format mixed exam (Part 3 text + Part 4 scanned) + Barem scoring consistency | **PASS** |

---

## 4. Tier 4: Real-World Exam Workload Scenarios

### Scenario 1: Complete 100-Question Listening Simulation
- **Coverage**: F1, F2, F8, F10, F11, F12, F5, F7.
- **Workflow**: Candidate launches full 100-question listening test (`test-01`), plays Part 1 and Part 2 audio sequentially, enters Part 3 (13 clusters) and Part 4 (10 clusters), selects answers while audio plays without interruption, verifies palette reflects cluster status, submits test, and receives verified scaled score and CEFR level matching ETS barem.

### Scenario 2: Practice Mode Part 3 Cluster with Explanations
- **Coverage**: F4, F8, F10, F13, F6.
- **Workflow**: Learner opens Part 3 cluster `c38-39-40` in practice mode, listens to dialogue, answers 2 questions, requests on-demand explanation for Q38, verifies transcript with cue badge `(38)` displays without leaking answers for Q39 and Q40, then finishes cluster.

### Scenario 3: Scanned Image Exam (ETS 2024/2026 Test 01)
- **Coverage**: F3, F9, F8, F10, F12, F5.
- **Workflow**: Candidate opens test `ets-2024-01`, renders scanned image crop `Q32-34.png`, interacts with compact radio bubbles, toggles image zoom lightbox, flags Q33 for review, verifies palette shows flagged status, and completes submission.

### Scenario 4: Cyber Attack & Honeypot Scraping Simulation
- **Coverage**: F6 (Canary IDs, dump parameters, rapid explain velocity).
- **Workflow**: Bot scraper targets `/api/toeic/test?testId=canary-dump-test` and attempts bulk script dumps, triggers canary honeypot detection, gets quarantined, sends rapid bursts of explain requests (<100ms), triggers velocity limiter, and receives poisoned decoy answers while genuine candidate traffic remains unaffected.

### Scenario 5: Network Failure & Resume Session
- **Coverage**: F10, F12, F8, F5.
- **Workflow**: Candidate answers 45 questions across Parts 1-3, browser crashes or network drops, autosave state in localStorage is deserialized upon reconnect, cluster question answers and flags restored perfectly, timer resumes accurately, and final submission succeeds without data loss.

---

## 5. Key Architecture & Data Integrity Findings

1. **Crawler Realignment Dependency (M1 Tracking)**:
   - Analysis of `content-toeic-listening-v1.json` confirmed that legacy test `6852` has audio cutoff around Q46 and Q82 due to crawler boundaries.
   - Milestone M1 (Data Normalization & Asset Realignment) is actively addressing this via audio slicing and asset manifest consolidation.
   - Test suite incorporates robust fallback handling (`B10-1`) and authoritative validation against `ets-2024-01` which has 100% complete cluster audio (`c32-33-34` to `c98-99-100`) and crop assets.
2. **Canonical ETS Barem**:
   - Both listening and reading barems exhibit strictly monotonic progressions.
   - Clamping rules enforce $[5, 495]$ per section and total score $[10, 990]$.
3. **Active Defense Integration**:
   - Zero Bulk Leaks prevents leaking answers in exam delivery mode.
   - Canary IDs (`CANARY_TEST_IDS`) and velocity checking (`checkReadingVelocity`) are verified to successfully isolate and poison malicious scraping attempts without affecting legitimate users.

---

## 6. How to Reproduce

Execute the test suite at any time from repository root:
```powershell
npx tsx tests/toeic/toeic-cluster-e2e.test.ts
```

All 150 tests execute deterministically in $\le 400$ms with exit code 0.
