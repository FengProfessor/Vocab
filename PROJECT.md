# Project: Rachel's English IPA Video Articulation Integration

## Architecture
This project integrates authentic, high-quality video demonstrations from Rachel's English (General American accent) into all 26 pronunciation lessons in `lessons-v1.json` and the roadmap `PhoneticArticulationWidget`. An interactive, lightweight YouTube IFrame player provides slow-motion playback, segment looping, and collapsible UI without disrupting practice drills.

```
[Pronunciation Data Layer: lessons-v1.json]
   │ 26 Lessons (A0–B2) with RachelVideoMeta:
   │ (youtubeVideoId, startSeconds, endSeconds, channelName, videoTip)
   ▼
[Security / CSP Layer: next.config.ts]
   │ Enables frame-src (youtube.com, youtube-nocookie.com)
   │ Enables script-src (youtube.com, s.ytimg.com)
   ▼
[Interactive IPA Video Player: InteractiveIpaVideoPlayer.tsx]
   │ Controls: 0.5x, 0.75x, 1.0x speeds, A-B segment loop, replay clip, collapse toggle
   │ Audio Coordination: silences app audio on play; pauses on drill audio/mic
   ├───► [/pronunciation/[id]] (Hero video in Learn phase, sticky collapsible in Drill phase)
   └───► [PhoneticArticulationWidget.tsx] (Tab switcher: Video vs 2D Sagittal diagram)
              │
              ▼
   [Seamless Transition to Minimal Pair Drills]
              │
              ▼
   [Roadmap Progress Sync: completeRoadmapStep(stepId)]
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | CSP YouTube Domain Enablement | Update `next.config.ts` to allow YouTube in `frame-src` and `script-src` | M1 | **DONE** | Survey Obs 1 |
| 2 | Pronunciation Video Types Schema | Create `src/types/pronunciation.ts` and update `src/lib/roadmap.ts` with `RachelVideoMeta` | M1 | **DONE** | ORIGINAL_REQUEST §R1 |
| 3 | 100% Rachel's English Catalog Mapping | Enrich all 26 lessons in `lessons-v1.json` with verified YouTube IDs, timestamps, and tips | M1 | **DONE** | ORIGINAL_REQUEST §R1 |
| 4 | Automated Data Integrity Validator | Script `scripts/validate-pronunciation-videos.ts` asserting format, IDs, timestamps, channel | M1 | **DONE** | Acceptance Criteria |
| 5 | Interactive IPA Video Player | Component `InteractiveIpaVideoPlayer.tsx` with YouTube IFrame API | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 6 | Variable Speed Controls | Dedicated buttons for 0.5x, 0.75x, and 1.0x playback rates | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 7 | A-B Segment Looping | Continuous loop between `startSeconds` and `endSeconds` | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 8 | Instant Replay Clip | One-click button to jump back to start of articulation demonstration | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 9 | Collapsible Toggle | Hide/show video smoothly to conserve screen space during drills | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 10 | Mobile & Desktop Responsive Design | Adaptive 16:9 aspect ratio, touch targets >= 44px, graceful fallback | M2 | **DONE** | Acceptance Criteria |
| 11 | Audio Coordination | Silence word audio when video plays; pause video when drill audio or mic activates | M2, M3 | **DONE** | Survey UI Obs 4 |
| 12 | Pronunciation Page Integration | Embed player in `/pronunciation/[id]` (Hero in Learn phase, collapsible in Drill phase) | M3 | **DONE** | ORIGINAL_REQUEST §R2, §R3 |
| 13 | Roadmap Articulation Widget Integration | Tab switcher (Video vs 2D Sagittal diagram) in `PhoneticArticulationWidget.tsx` | M3 | **DONE** | ORIGINAL_REQUEST §R2, §R3 |
| 14 | Multimodal Pedagogical Synthesis | Harmonize video with `whyHard`, `mouthTip`, and `minimalPairs` drill flow | M3 | **DONE** | ORIGINAL_REQUEST §R3 |
| 15 | Roadmap Progress Synchronization | Guarantee `completeRoadmapStep(stepId)` synchronizes step completion and awards XP | M3 | **DONE** | Acceptance Criteria |
| 16 | Comprehensive E2E Test Suite (Tiers 1-4) | Opaque-box tests for data schema, player controls, integration, and roadmap sync | E2E, M4 | **DONE** | Acceptance Criteria |
| 17 | Adversarial Hardening (Tier 5) | White-box edge cases: invalid timestamps, rapid speed switches, network errors | M4 | IN_PROGRESS | Acceptance Criteria |
| 18 | Forensic Integrity Audit | Static analysis and runtime validation ensuring authentic video IDs and genuine logic | M4 | IN_PROGRESS | Hard Constraint |

---

## Milestones
| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|--------|-------------|
| E2E | E2E Testing Track | Design test architecture, test runner, and test cases (Tiers 1-4); publish TEST_READY.md | none | **DONE** | `TEST_INFRA.md`, `tests/pronunciation/` (130/130 tests passing), `TEST_READY.md` |
| M1 | CSP Security & Video Catalog Standardization | Update `next.config.ts`, `src/types/pronunciation.ts`, enrich `lessons-v1.json` with 26 Rachel's English videos, update `src/lib/roadmap.ts`, validation script | none | **DONE** | `next.config.ts`, `src/types/pronunciation.ts`, `lessons-v1.json`, `src/lib/roadmap.ts`, `scripts/validate-pronunciation-videos.ts` (All 26/26 valid, 0 type errors, 198/198 journey tests pass) |
| M2 | Interactive IPA Video Player Component | Implement `InteractiveIpaVideoPlayer.tsx` with speed control, segment loop, replay, collapse toggle, responsive layout, audio coordination | M1 | **DONE** | `src/components/pronunciation/InteractiveIpaVideoPlayer.tsx` (130/130 pronunciation tests pass, 198/198 journey tests pass, 0 lint errors) |
| M3 | Page & Roadmap Widget Integration | Integrate player into `/pronunciation/[id]/page.tsx` and `PhoneticArticulationWidget.tsx`; coordinate audio with `stopWordAudio()` and drill transitions | M1, M2 | **DONE** | `src/app/pronunciation/[id]/page.tsx`, `src/components/journey/widgets/PhoneticArticulationWidget.tsx` (130/130 pronunciation tests pass, 198/198 journey tests pass, build succeeds) |
| M4 | Final Milestone: E2E Pass, Hardening & Audit | Pass 100% of E2E test suite (Tiers 1-4), adversarial test hardening (Tier 5), forensic integrity audit, build & typecheck | M1, M2, M3, E2E | IN_PROGRESS | 130/130 tests pass, build succeeds; 2 Reviewers, 2 Challengers, Forensic Auditor executing |

---

## Interface Contracts

### 1. `RachelVideoMeta` (`src/types/pronunciation.ts`)
```typescript
export interface RachelVideoMeta {
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number;
  channelName: "Rachel's English";
  videoTip: string;
  clipTitle?: string;
  mouthTipSummary?: string;
}
```

### 2. `PronunciationLesson` (`src/types/pronunciation.ts` & `src/lib/roadmap.ts`)
```typescript
export interface PronunciationLesson {
  id: string;
  level: string;
  title: string;
  ipa: string;
  whyHard: string;
  mouthTip: string;
  exampleWords: string[];
  drillType: 'minimal-pair' | 'stress' | 'intonation' | 'listening';
  minimalPairs: { a: string; b: string; note: string }[];
  video?: RachelVideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: "Rachel's English" | string;
  videoTip?: string;
}
```

### 3. `PhoneticArticulationProps` (`PhoneticArticulationWidget.tsx`)
```typescript
export interface PhoneticArticulationProps {
  ipa: string;
  mouthTip: string;
  whyHard: string;
  audioUrl?: string;
  minimalPairs: MinimalPairItem[];
  onComplete: (stats: { score: number; passed: boolean }) => void;
  video?: RachelVideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: string;
  videoTip?: string;
}
```

### 4. `InteractiveIpaVideoPlayerProps` (`InteractiveIpaVideoPlayer.tsx`)
```typescript
export interface InteractiveIpaVideoPlayerProps {
  video: RachelVideoMeta;
  ipa?: string;
  title?: string;
  compact?: boolean;
  autoPlay?: boolean;
  initialSpeed?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
}
```

---

## Code Layout
- Security Policy: `next.config.ts`
- Type Definitions: `src/types/pronunciation.ts`
- Pronunciation Data: `src/data/pronunciation/lessons-v1.json`
- Roadmap Client Lib: `src/lib/roadmap.ts`
- Validation Script: `scripts/validate-pronunciation-videos.ts`
- Player Component: `src/components/pronunciation/InteractiveIpaVideoPlayer.tsx`
- Lesson Page: `src/app/pronunciation/[id]/page.tsx`
- Articulation Widget: `src/components/journey/widgets/PhoneticArticulationWidget.tsx`
- Audio Library: `src/lib/audio.ts`
- E2E Test Suite: `tests/pronunciation/` (`run-all-pronunciation-tests.ts`, `tier1-feature-coverage.test.ts`, `tier2-boundary-corner.test.ts`, `tier3-cross-feature.test.ts`, `tier4-real-world-scenarios.test.ts`)
