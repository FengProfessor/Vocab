# Project: LingoPro 3-Tier English Speaking Subsystem & Ingestion Pipeline

## Architecture
The LingoPro Speaking Subsystem provides an end-to-end, scientifically grounded speaking acquisition pathway for Vietnamese learners, spanning False Beginner (A0-A1), 3-Tier Curriculum (Beginner A1 / 0-3.0, Elementary A2-B1 / 3.0-5.0, Intermediate B1-B2 / 5.0-6.5), and AI Speaking Tutor.

```
                  ┌─────────────────────────────────────────┐
                  │    /student/speaking (Master Hub)       │
                  └────┬───────────────┬────────────────┬───┘
                       │               │                │
                       ▼               ▼                ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │ Foundation (A0)  │ │ 3-Tier Curriculum│ │ AI Speaking Tutor│
         │ (Preserved 100%) │ │ (/curriculum)    │ │ (24+ Scenarios)  │
         └──────────────────┘ └────────┬─────────┘ └──────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
         Phase 1: Beginner     Phase 2: Elementary   Phase 3: Intermediate
         (12 Lessons)          (10 Lessons)          (10 Lessons)
         - Final Consonants    - PREP / PEEL / 5W1H   - IELTS Part 2 Mindmap
         - Invariant Frames    - Cooking & Food §IV  - IELTS Part 3 Reflexes
         - 3-Beat Expansion    - Discourse Connectors- Abstract Arguments
                │                      │                      │
                └──────────────────────┼──────────────────────┘
                                       ▼
                     4-Stage Interactive Lesson Player
                     - Stage 1: Warm-up & Phonetics Drill
                     - Stage 2: Core Patterns & Chunks
                     - Stage 3: Guided Dialogue Practice
                     - Stage 4: SafeHarbor Speech Reflex
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
              DualSpeedAudioButton           SafeHarborRecorder
              (0.8x / 1.0x Pitch-Preserved)  (Levenshtein Fuzzy Engine)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F01: Foundation Architecture Preservation | Preserve legacy A0-A1 foundation types and datasets without touching existing files | M1 | codebase_audit |
| 2 | F02: Scalable Curriculum Type System | Define `SpeakingCurriculumLesson`, sections, and validation schemas in `src/types/speaking-curriculum.ts` | M1 | academic_curriculum_spec |
| 3 | F03: DRY Component Export Index | Export `DualSpeedAudioButton`, `SafeHarborRecorder`, `StageProgressNav` via `src/components/speaking/index.ts` | M1 | codebase_audit |
| 4 | F04: ELLLO.org Scraper | Ingest dialogues, audio streams, CEFR levels, and vocabulary from ELLLO | M2 | pipeline_design |
| 5 | F05: TalkEnglish.com Scraper | Ingest speech reflex pairs and audio from Basics, Regular, and Business tracks | M2 | pipeline_design |
| 6 | F06: YouTube Zero-Dependency Transcripts | Extract timed subtitles and oEmbed metadata without API keys via regex caption tracks | M2 | pipeline_design |
| 7 | F07: Ethical Crawler & Rate Limiter | Jittered delay (1.5-4s), User-Agent rotation, 429/503 exponential backoff | M2 | pipeline_design |
| 8 | F08: Deterministic Offline Fallback Seeds | Curated mock/seed JSONs for ELLLO, TalkEnglish, and YouTube with `--offline` support | M2 | pipeline_design |
| 9 | F09: Ingestion Normalizer & Catalog | Standardize crawled raw inputs into `src/data/speaking/ingested/` catalog | M2 | pipeline_design |
| 10| F10: Phase 1 Beginner Curriculum (12 lessons)| 0-3.0 IELTS: Final consonants (/s, z, ed, t, d, k/), invariant frames, daily routines | M3 | academic_curriculum_spec |
| 11| F11: Phase 2 Elementary Curriculum (10 lessons)| 3.0-5.0 IELTS: PREP/PEEL/5W1H, discourse connectors, Cooking & Food module (§IV) | M3 | academic_curriculum_spec |
| 12| F12: Phase 3 Intermediate Curriculum (10 lessons)| 5.0-6.5 IELTS: IELTS Part 2 (4-quadrant), Part 3 concession/categorization, advanced grammar | M3 | academic_curriculum_spec |
| 13| F13: 100% Vietnamese Explanation Layer | Contrastive linguistics and empathetic Vietnamese pedagogical instructions in all lessons | M3 | academic_curriculum_spec |
| 14| F14: Student Curriculum Hub UI | `/student/speaking/curriculum` overview with phase selectors, lesson cards, and progress | M4 | codebase_audit |
| 15| F15: Interactive 4-Stage Lesson Player | `/student/speaking/curriculum/[phaseId]/[lessonId]` running stages 1-4 with audio & recording | M4 | codebase_audit |
| 16| F16: Master Speaking Hub Integration | Unified portal at `/student/speaking` routing to Foundation, Curriculum, and AI Tutor | M4 | codebase_audit |
| 17| F17: Curriculum Data Integrity Test Suite | Verify 100% dataset schema conformity, zero TODO/placeholder, URL validation | M5 | codebase_audit |
| 18| F18: Crawler & Offline Fallback Test Suite | Automated verification of crawler parsing, offline mode, and rate-limiting | M5 | pipeline_design |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Architecture & Type Contracts | Create `src/types/speaking-curriculum.ts` and `src/components/speaking/index.ts` | none | DONE |
| 2 | M2: Data Ingestion & Crawling Pipeline | Implement `scripts/speaking/` (crawlers, seeds, normalizer, CLI) & output to `src/data/speaking/ingested/` | M1 | DONE |
| 3 | M3: 3-Tier Curriculum Digitization | Digitize 32 lessons (Phase 1, Phase 2 with Cooking, Phase 3) in `src/data/speaking/curriculum/` | M1 | DONE |
| 4 | M4: Interactive UI Integration | Build `/student/speaking/curriculum/` pages & update `/student/speaking/` hub | M1, M3 | DONE |
| 5 | M5: E2E Testing & Verification | Comprehensive test suite in `tests/speaking/speaking-master-e2e-runner.ts` & `tsc --noEmit` 0 errors | M1, M2, M3, M4 | DONE |

## Interface Contracts
### `src/types/speaking-curriculum.ts`
```typescript
export type SpeakingPhaseId = 'phase-1-beginner' | 'phase-2-elementary' | 'phase-3-intermediate';

export interface PhoneticDrillSection {
  titleVi: string;
  focusSound: string;
  vietnameseContrastiveTip: string;
  minimalPairs: Array<{
    wordA: string;
    wordB: string;
    ipaA: string;
    ipaB: string;
    meaningA: string;
    meaningB: string;
  }>;
  practiceSentences: Array<{
    sentence: string;
    phoneticTarget: string;
    vietnameseTranslation: string;
    audioUrl?: string;
  }>;
}

export interface CorePatternsSection {
  titleVi: string;
  vietnameseGrammarRule: string;
  formula: string;
  legoSlots: Array<{
    template: string;
    slots: Record<string, string[]>;
    examples: Array<{ en: string; vi: string }>;
  }>;
}

export interface GuidedDialogueSection {
  titleVi: string;
  contextVi: string;
  turns: Array<{
    speaker: 'A' | 'B';
    en: string;
    vi: string;
    audioUrl?: string;
    coreKeywords: string[];
  }>;
}

export interface SafeHarborEvaluationSection {
  titleVi: string;
  promptVi: string;
  targetSentence: string;
  acceptableVariations: string[];
  coreKeywords: string[];
  minimumPassingScore: number; // default 75
}

export interface SpeakingCurriculumLesson {
  id: string;
  phaseId: SpeakingPhaseId;
  order: number;
  titleEn: string;
  titleVi: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  targetBandIelts: string;
  estimatedMinutes: number;
  summaryVi: string;
  stage1Phonetics: PhoneticDrillSection;
  stage2CorePatterns: CorePatternsSection;
  stage3GuidedDialogue: GuidedDialogueSection;
  stage4SafeHarborEvaluation: SafeHarborEvaluationSection;
}
```

## Code Layout
- `src/types/speaking-curriculum.ts`: Type definitions for 3-tier curriculum & lessons.
- `src/types/speaking-foundation.ts`: Legacy foundation types (DO NOT MODIFY).
- `src/components/speaking/index.ts`: Unified export barrel for speaking UI components.
- `scripts/speaking/`:
  - `core/rate-limiter.ts`: Rate limiting & retry logic.
  - `core/http-client.ts`: Axios wrapper with user-agent pool.
  - `crawlers/crawl-elllo.ts`: ELLLO crawler.
  - `crawlers/crawl-talkenglish.ts`: TalkEnglish crawler.
  - `crawlers/crawl-youtube.ts`: YouTube transcript parser.
  - `normalizer.ts`: Standardize raw crawls into uniform JSON schema.
  - `seeds/`: High-fidelity deterministic seed JSONs for offline mode.
  - `ingest.ts`: Master ingestion CLI (`--source`, `--offline`, `--outDir`).
- `src/data/speaking/ingested/`: Normalized crawled lesson JSONs.
- `src/data/speaking/curriculum/`:
  - `phase-1-beginner/`: 12 lesson files + `index.ts`.
  - `phase-2-elementary/`: 10 lesson files (including `p2-l03-cooking-cuisine.ts`) + `index.ts`.
  - `phase-3-intermediate/`: 10 lesson files (IELTS Parts 2 & 3) + `index.ts`.
  - `index.ts`: Master catalog exporting all phases and lookup helpers.
- `src/app/student/speaking/`:
  - `page.tsx`: Updated Master Speaking Hub.
  - `curriculum/page.tsx`: Curriculum phase & lesson browser.
  - `curriculum/[phaseId]/[lessonId]/page.tsx`: 4-stage interactive lesson player.
- `tests/speaking/`:
  - `run-all-speaking-tests.ts`: Legacy test runner (157 tests preserved).
  - `curriculum-data-integrity.test.ts`: 3-tier curriculum verification.
  - `crawling-pipeline.test.ts`: Ingestion & offline seed verification.
