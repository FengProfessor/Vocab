# Test Infrastructure Documentation: Rachel's English Video Integration for IPA Pronunciation

## 1. Test Philosophy & Architecture

The Rachel's English IPA Video Integration test infrastructure is built on strict **opaque-box, requirement-driven, zero-facade verification**. Every test validates observable runtime behavior, data schemas, security configurations, and interface contracts against specifications defined in `ORIGINAL_REQUEST.md` (2026-09-06T04:30:59Z), `PROJECT.md`, and authoritative survey findings.

### Core Principles
1. **Opaque-Box & Requirement-Driven**: Tests assert against observable interface contracts, DOM/URL specifications, mathematical timestamp constraints, and audio coordination behavior rather than private implementation details.
2. **Authoritative Expected Output**: Expected outputs are derived directly from the canonical 26-lesson Rachel's English video catalog, the YouTube IFrame API specification, and Next.js Content Security Policy requirements.
3. **No Facade Tests**: Tests do not use placeholder assertions (`expect(true).toBe(true)`). Each assertion inspects concrete state properties, boundary limits, and mathematical contracts.
4. **Self-Contained & Isolated**: Tests set up their own state, mock browser and player environments cleanly, clean up after execution, and run deterministically without execution order dependencies.
5. **Zero External Framework Overhead**: Built using a lightweight, native TypeScript test harness executable via `npx tsx tests/pronunciation/run-all-pronunciation-tests.ts`.

---

## 2. Feature Inventory Coverage

The test suite provides exhaustive coverage across all 3 key requirements (R1–R3), security policies, and all 18 inventoried features from `PROJECT.md`:

| # | Feature Ref | Feature Description | Module / File Under Test | Test Tier Coverage |
|---|:-----------:|:--------------------|:-------------------------|:-------------------|
| 1 | **CSP** | CSP YouTube Domain Enablement | `next.config.ts` | Tier 1 (T1.1.1–T1.1.5), Tier 2 (B8.2) |
| 2 | **SCHEMA** | Pronunciation Video Types Schema (`RachelVideoMeta`) | `src/types/pronunciation.ts`, `src/lib/roadmap.ts` | Tier 1 (T1.2.1–T1.2.5), Tier 2 (B1, B5, B6) |
| 3 | **CATALOG** | 100% Rachel's English Catalog Mapping (26 Lessons) | `src/data/pronunciation/lessons-v1.json` | Tier 1 (T1.3.1–T1.3.6), Tier 2 (B1–B3), Tier 4 (S1–S5) |
| 4 | **VALIDATOR** | Automated Data Integrity Validator | `scripts/validate-pronunciation-videos.ts` | Tier 1 (T1.3.1–T1.3.5), Tier 2 (B1–B6) |
| 5 | **PLAYER** | Interactive IPA Video Player Embed & URL Construction | `src/components/pronunciation/InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.4.1–T1.4.5), Tier 2 (B1, B8), Tier 3 (X7) |
| 6 | **SPEED** | Variable Playback Speed Controls (0.5x, 0.75x, 1.0x) | `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.5.1–T1.5.5), Tier 2 (B4), Tier 3 (X2), Tier 4 (S2) |
| 7 | **LOOP** | A-B Segment Looping Mechanism | `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.6.1–T1.6.5), Tier 2 (B2, B3, B7), Tier 3 (X2) |
| 8 | **REPLAY** | Instant Replay Articulation Clip Button | `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.7.1–T1.7.5), Tier 2 (B7), Tier 3 (X2) |
| 9 | **COLLAPSE** | Collapsible Toggle & Layout Preservation | `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.8.1–T1.8.5), Tier 2 (B7), Tier 3 (X3, X4) |
| 10 | **RESPONSIVE**| Mobile & Desktop Responsive Design (16:9, >=44px) | `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.4.3, T1.8.4), Tier 2 (B7.1) |
| 11 | **AUDIO** | Audio Coordination (`stopWordAudio()` & pause) | `src/lib/audio.ts`, `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.9.1–T1.9.5), Tier 3 (X1, X6) |
| 12 | **PAGE** | Pronunciation Page Integration (`/pronunciation/[id]`) | `src/app/pronunciation/[id]/page.tsx` | Tier 1 (T1.8, T1.9), Tier 3 (X4, X5), Tier 4 (S1–S5) |
| 13 | **WIDGET** | Roadmap Articulation Widget (Video vs 2D Diagram Tab) | `src/components/journey/widgets/PhoneticArticulationWidget.tsx` | Tier 1 (T1.2.5), Tier 3 (X6) |
| 14 | **PEDAGOGY**| Multimodal Pedagogical Synthesis (`whyHard`, `mouthTip`) | `lessons-v1.json`, `InteractiveIpaVideoPlayer.tsx` | Tier 1 (T1.3.5), Tier 4 (S1–S4) |
| 15 | **ROADMAP** | Roadmap Progress Synchronization (`completeRoadmapStep`)| `src/lib/roadmap-client.ts`, `/pronunciation/[id]/page.tsx` | Tier 1 (T1.10.1–T1.10.5), Tier 3 (X5), Tier 4 (S5) |
| 16 | **E2E** | Comprehensive E2E Test Suite (Tiers 1-4) | `tests/pronunciation/run-all-pronunciation-tests.ts` | All Tiers |
| 17 | **HARDENING**| Adversarial Boundary Hardening | `tests/pronunciation/tier2-boundary-corner.test.ts` | Tier 2 (B1–B8) |
| 18 | **AUDIT** | Forensic Integrity Audit & Catalog Validation | `tests/pronunciation/tier1-feature-coverage.test.ts` | Tier 1 (T1.3), Tier 2 (B6) |

---

## 3. Four-Tier Test Methodology

The test suite is organized into 4 progressive tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 1: Feature Coverage (≥5 test cases per inventoried feature)       │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases (Mathematical, Temporal, Adversarial)  │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Combinations (Pairwise, State, Audio Collision)  │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Real-World Scenarios (End-to-End Multimodal Learner Flows)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (`tests/pronunciation/tier1-feature-coverage.test.ts`)
- **CSP Enablement**: Verifies `frame-src` allows `youtube.com` and `youtube-nocookie.com`, and `script-src` allows `youtube.com` and `s.ytimg.com`.
- **Type Definitions & Schema**: Verifies `RachelVideoMeta` interface contracts, invariant channel branding, and dual-compatibility flat properties in `PronunciationLesson`.
- **26-Lesson Catalog**: Verifies 100% completeness, 11-char video IDs, valid timestamps, non-empty tips, and 1:1 correspondence with CEFR roadmap nodes (`sp-*`).
- **Player Embed Construction**: Verifies privacy-enhanced embed URL parameters (`enablejsapi=1`, `playsinline=1`, `rel=0`, `controls=1`, `modestbranding=1`, `origin`).
- **Speed Controls**: Dedicated buttons for 0.5x, 0.75x, and 1.0x with pitch preservation.
- **A-B Looping**: 150ms interval polling, seek to start on boundary reach, state change `ENDED` fallback.
- **Instant Replay**: Seeks back to `startSeconds` and plays without resetting user settings.
- **Collapsible Toggle**: Smooth hide/show, compact bar in drill phase, layout preservation.
- **Audio Coordination**: Invokes `stopWordAudio()` on video play, pauses video when drill audio or mic activates.
- **Roadmap Sync**: Validates `completeRoadmapStep` call with `stepId`, passing score verification, and XP award.

### Tier 2: Boundary & Corner Cases (`tests/pronunciation/tier2-boundary-corner.test.ts`)
- **Video ID Anomalies**: Rejects 10-char, 12-char, special character, and whitespace IDs.
- **Timestamp Boundaries**: Handles `start === 0`, rejects `start < 0`, rejects `start >= end`.
- **Duration Boundaries**: Enforces minimum 15s and maximum 180s clip duration.
- **Speed Rate Edge Cases**: Clamps out-of-range rates, disallows 0 or negative rates.
- **Tip Text Integrity**: Rejects empty strings, whitespace, and sub-20 character tips; handles Unicode Vietnamese tones.
- **Channel Invariance**: Rejects alternative channels or typos.
- **Rapid User Interaction**: Rapid expand/collapse toggling, rapid play/pause, rapid replay spamming.
- **Error Fallbacks**: Handles missing video metadata or iframe network blocking with graceful fallback.

### Tier 3: Cross-Feature Combinations (`tests/pronunciation/tier3-cross-feature.test.ts`)
- **Audio Collision Prevention**: Video play interrupts TTS/mp3; drill audio/mic pauses video; video resumes from preserved timestamp.
- **Speed Changes During Loop**: Switching speeds (0.5x, 0.75x) while loop is active does not breach segment boundaries.
- **Collapse Persistence**: Collapsing video maintains playback state, timestamp, and speed settings.
- **Phase Transitions**: Learn phase hero video collapses into compact sticky bar in Drill phase without hiding drill choices A and B.
- **Deep-Link Roadmap Integration**: `/pronunciation/[id]?roadmapStep=...` loads correct lesson, renders video, and syncs progress on completion.
- **Widget Tab Switching**: Switching between Video tab and 2D Sagittal diagram tab in `PhoneticArticulationWidget` without audio bleed.
- **Dual Representation**: Backward compatibility supporting both structured `video` object and flat fields.

### Tier 4: Real-World Scenarios (`tests/pronunciation/tier4-real-world-scenarios.test.ts`)
- **Scenario 1 (A0 Beginner)**: Word stress basics & final stop consonants (`word-stress-basics`, `final-stops-ptk`).
- **Scenario 2 (A1 Elementary)**: Vowel contrast `/iː/` vs `/ɪ/` with 0.5x slow-mo shadowing (`vowel-i-long-short`).
- **Scenario 3 (B1 Intermediate)**: Schwa neutral posture & connected speech linking (`schwa`, `linking`).
- **Scenario 4 (B2 Advanced)**: Diphthong glides & affricate voicing contrasts (`diphthongs`, `ch-j`).
- **Scenario 5 (Capstone Journey)**: End-to-end flow from roadmap click through learn phase, slow-mo review, collapsible drill, and roadmap progression (+15 XP).

---

## 4. Test Directory Layout

```
tests/pronunciation/
├── test-harness.ts                     # TestRunner, assertions, player simulator, catalog oracle, validators
├── tier1-feature-coverage.test.ts      # Tier 1: ≥5 tests per feature (51 tests total)
├── tier2-boundary-corner.test.ts       # Tier 2: Boundary & corner cases (35 tests total)
├── tier3-cross-feature.test.ts         # Tier 3: Cross-feature interactions & audio coordination (16 tests)
├── tier4-real-world-scenarios.test.ts  # Tier 4: Real-world learner user flows (15 tests)
└── run-all-pronunciation-tests.ts      # Master test runner executing Tiers 1-4 with metrics
```

---

## 5. Test Runner Invocation

### Run All Pronunciation Tests
```bash
npx tsx tests/pronunciation/run-all-pronunciation-tests.ts
```

### Supporting Verification Commands
```bash
# Validate 26 pronunciation video catalog entries
npx tsx scripts/validate-pronunciation-videos.ts

# TypeScript compilation check
npm run typecheck
```

---

## 6. Coverage & Pass Thresholds

| Metric | Threshold Required | Design Target |
|:-------|:------------------:|:-------------:|
| **Total Test Count** | ≥ 80 tests | ≥ 110 tests |
| **Tier 1 (Feature Coverage)** | ≥ 30 tests | ≥ 50 tests |
| **Tier 2 (Boundary & Corner)** | ≥ 25 tests | ≥ 30 tests |
| **Tier 3 (Cross-Feature)** | ≥ 10 tests | ≥ 15 tests |
| **Tier 4 (Real-World Scenarios)** | ≥ 8 tests | ≥ 12 tests |
| **Pass Rate** | 100% (0 failures) | 100% |
| **Lesson Catalog Coverage** | 26 / 26 (100%) | 26 / 26 (100%) |
| **Execution Duration** | < 5000ms | < 1000ms |
