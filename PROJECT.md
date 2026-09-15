# Project: LingoPro Web App Performance & Loading Speed Optimization

## Architecture
- **Framework**: Next.js 16.2.9 App Router (React 19, standalone output, Turbopack).
- **Client/Server Split**:
  - `src/app/student/layout.tsx`: Houses `StudentProvider`, providing single-source-of-truth auth session, profile, gamification stats, and vocabulary summary.
  - `src/app/student/loading.tsx`: Instant App Shell skeleton (`StudentDashboardSkeleton`), paints in <150ms.
  - `src/app/student/page.tsx`: Removes blocking `{isLoading ? ... : ...}`, mounts immediately on Frame 1, progressively hydrating word cards and stats.
  - `src/components/student/StudentShell.tsx`: Consumes `StudentProvider` context, eliminating redundant network calls (`profiles`, `user_gamification`, `/api/words?summary=1`).
  - `src/lib/listening-utils.ts`: Pure helper functions with zero heavy data imports.
  - `src/data/listening/videos-index.json`: Lightweight metadata catalog (~146KB) for listening browse view.
  - `src/data/roadmap/vocab-topics-index.json`: Lightweight metadata catalog (~9.6KB) for vocab-station dropdown.
  - `src/lib/vocab-topics.ts`: Pure client helper for on-demand topic word loading via `/api/vocab/topic`.
  - `src/app/journey/page.tsx`: `VocabRoadmapSection` dynamically imported via `next/dynamic`.
  - `src/app/toeic/[part]/[ref]/page.tsx` & `src/app/toeic/exam/[examId]/page.tsx`: Decoupled heavy static JSON imports via dynamic imports and server API routes.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|:---:|
| 1 | Instant Dashboard Shell & Skeleton | Replace blocking `<PageLoading>` in `loading.tsx` and `<Loader2>` at `page.tsx:797` with `StudentDashboardSkeleton` (<300ms paint) | M1 | Survey (Dashboard Explorer) | **DONE** |
| 2 | Progressive Word Cards & Stats Hydration | Progressive loading state in `/student` page displaying skeleton placeholders while background promises resolve | M1 | Survey (Dashboard Explorer) | **DONE** |
| 3 | Shell Header Non-Blocking State | Replace header `<Loader2>` spinner in `StudentShell.tsx` with skeleton pill or cached gamification stats | M1 | Survey (Dashboard Explorer) | **DONE** |
| 4 | Single Source of Truth (`StudentProvider`) | Centralize `getSession`, `profiles`, `user_gamification`, and vocabulary counts into a unified context in `layout.tsx` | M2 | Survey (Dashboard Explorer) | **DONE** |
| 5 | Eradicate Duplicate Network Calls | Eliminate redundant `profiles`, `user_gamification`, and `/api/words?summary=1` fetches between `page.tsx` and `StudentShell.tsx` | M2 | Survey (Dashboard Explorer) | **DONE** |
| 6 | Deduplicate Campaign Modals | Remove duplicate `<UpgradeGiftModal />` in `page.tsx` (retaining single instance in `StudentShell.tsx`) | M2 | Survey (Dashboard Explorer) | **DONE** |
| 7 | Listening Module Bundle Decoupling | Extract `listening-utils.ts` and decouple `videos.json` (8.35MB raw / 5.79MB JS chunk `2tr-5nvu4obnn.js`) from initial client bundle | M3 | Survey (Bundle Explorer) | **DONE** |
| 8 | Pack Reading Dead Code Elimination | Remove unused `resolvePack` static import in `src/app/practice/pack-reading/page.tsx` (saving 3.72MB JS chunk `0ys5501lpi7q7.js`) | M3 | Survey (Bundle Explorer) | **DONE** |
| 9 | Vocab Station Decoupling | Decouple `vocab-stages-v1.json` (2.54MB raw / 1.49MB JS) using `vocab-topics-index.json` (~9.6KB) and `/api/vocab/topic` | M3 | Survey (Bundle Explorer) | **DONE** |
| 10 | Journey Roadmap Code-Splitting | Dynamically import `VocabRoadmapSection` in `src/app/journey/page.tsx` to offload 1.49MB chunk from initial load | M3 | Survey (Bundle Explorer) | **DONE** |
| 11 | TOEIC Exam & Part Practice Decoupling | Decouple `content-toeic-*.json` on `/toeic/exam/[examId]` and `/toeic/[part]/[ref]` via dynamic imports & `ToeicPlayerSkeleton` (saving >2.77MB JS) | M3 | Survey (Bundle Explorer) | **DONE** |
| 12 | Database Schema & Zero Data Loss Protection | Ensure Supabase Postgres tables (`profiles`, `user_gamification`, `words`, `srs_progress`) remain untouched with zero loss | M4 | Survey (Baseline Explorer) | **DONE** |
| 13 | Build, Type Safety & Zero-Downtime Verification | Validate `npx tsc --noEmit`, `npm run build`, all test suites pass, clean audit, and adhere to `GEMINI.md` zero-downtime rules | M4 | Survey (Baseline Explorer) | **DONE** |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|:---:|
| 1 | M1: Dashboard Progressive Shell & Skeleton | `loading.tsx`, `page.tsx`, `StudentDashboardSkeleton.tsx`, `StudentShell.tsx` header | none | **DONE** |
| 2 | M2: Single Source of Truth & Zero Duplicate Fetches | `layout.tsx`, `StudentProvider.tsx`, `StudentShell.tsx`, `page.tsx`, modal deduplication | M1 | **DONE** |
| 3 | M3: Decouple Heavy JSON Bundles from Client JS | Listening decoupling, pack-reading, vocab-station, journey, and TOEIC decoupling | none | **DONE** |
| 4 | M4: Comprehensive Verification, Testing & Zero Regressions | E2E performance validation, all 9 test suites (2,846+ tests), bundle size measurement, full build gate | M1, M2, M3 | **DONE** |

## Interface Contracts
### `StudentContext` (M1 ↔ M2)
```typescript
interface StudentContextValue {
  session: Session | null;
  profile: Profile | null;
  gamification: GamificationStats | null;
  wordSummary: WordSummary | null;
  classrooms: ClassroomItem[];
  isLoading: boolean;
  error: Error | null;
  refreshSummary: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### Listening Utilities (M3)
`src/lib/listening-utils.ts` exports pure functions:
- `formatTime(seconds: number): string`
- `parseTime(timeStr: string): number`
- `getVideoDifficulty(level: string): DifficultyLevel`
- Zero data imports from `videos.json` or `catalog-v3.json`.

### Vocab Topics Utilities (M3)
`src/lib/vocab-topics.ts` exports pure helpers:
- `getAllVocabTopicsIndex(): VocabTopicMeta[]`
- `getVocabTopicMeta(id: string): VocabTopicMeta | null`
- `loadVocabTopic(id: string): Promise<VocabStageTopic | null>`

## Code Layout
- `src/app/student/layout.tsx`: Student layout wrapping `StudentProvider`.
- `src/components/student/StudentProvider.tsx`: Context provider consolidating auth, profile, gamification, and counts.
- `src/components/student/StudentDashboardSkeleton.tsx`: Instant App Shell & cards skeleton component.
- `src/app/student/loading.tsx`: Next.js loading boundary rendering `StudentDashboardSkeleton`.
- `src/app/student/page.tsx`: Immediate Frame-1 mount of `StudentShell`.
- `src/components/student/StudentShell.tsx`: Shell consuming `StudentProvider` with graceful fallback.
- `src/lib/listening-utils.ts`: Lightweight pure utilities for listening module.
- `src/data/listening/videos-index.json`: Lightweight metadata catalog (~146KB) for listening browse view.
- `src/data/roadmap/vocab-topics-index.json`: Lightweight metadata catalog (~9.6KB) for vocab-station dropdown.
- `src/lib/vocab-topics.ts`: Pure client helper for on-demand topic word loading via `/api/vocab/topic`.
- `tests/perf-verification.test.ts`: E2E performance & regression verification suite.
