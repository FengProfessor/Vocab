# TEST INFRASTRUCTURE SPECIFICATION: PERFORMANCE & LOADING SPEED OPTIMIZATION
**Project**: LingoPro Web App Performance & Loading Speed Optimization (Next.js 16 App Router)  
**Document**: `TEST_INFRA.md`  
**Author**: E2E Test Writer Agent (`test_writer_perf`)  
**Scope**: Requirements R1, R2, R3, R4 & Features F1 through F13  
**Integrity Mode**: Development / Zero Functional Regression / Zero Downtime Atomic Swap  

---

## 1. Executive Summary & Quality Mission

The objective of this test infrastructure is to provide an authoritative, deterministic, opaque-box performance and regression verification framework for the LingoPro Web App. The platform is undergoing major performance refactoring to:
1. **R1**: Eliminate full-screen blocking `<Loader2>` spinners and achieve <300ms shell paints on `/student` with progressive hydration.
2. **R2**: Consolidate auth session, user profile, gamification stats, and vocabulary summary counts into a unified Single Source of Truth (`StudentProvider`), eradicating duplicate network round-trips.
3. **R3**: Decouple heavy multi-megabyte JSON datasets (`videos.json`, `catalog-v3.json`, `vocab-stages-v1.json`, `content-toeic-*.json`) from client JavaScript bundles, shaving >12MB of compiled JS off critical routes.
4. **R4**: Preserve 100% database schema safety, FSRS algorithm integrity, streak tracking, study mode functionality, and adherence to `GEMINI.md` zero-downtime deployment rules.

---

## 2. 4-Tier Test Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       4-TIER TEST ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Feature Coverage (F1 to F13)                                    │
│   - >=5 test cases per feature (65+ total tests)                        │
│   - Unit & contract verification for each component/functionality       │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases (>=5 per requirement)                   │
│   - High latency, empty states, 10k vocab items, 0 XP, corrupted cache  │
│   - Rapid route changes, 401 unauthenticated, offline fallback          │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Combinations (Pairwise Interactions)              │
│   - State sharing + progressive skeleton transition                     │
│   - Classroom scope switch + count re-fetch deduplication               │
│   - Catalog browsing + on-demand detail retrieval                       │
│   - Roadmap dynamic import + track toggling                             │
│   - TOEIC mock exam launch + anti-scraping on-demand explain            │
├─────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Real-World Scenarios (End-to-End User Workflows)               │
│   - Full student study session & FSRS review submission                 │
│   - Multi-tier bundle size reduction audit (>10MB eliminated)           │
│   - Guest learner video lookup without heavy JSON payload               │
│   - Zero-downtime atomic swap simulation & failure isolation            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tier 1: Feature Coverage Specification (F1 – F13)

Every feature defined in `PROJECT.md` is covered by at least 5 distinct test cases with clear inputs and derived expected outputs.

### Feature 1: Instant Dashboard Shell & Skeleton
*Target Files*: `src/app/student/loading.tsx`, `src/app/student/page.tsx`, `src/components/student/StudentDashboardSkeleton.tsx`
- **T1.1.1**: Verify `src/app/student/loading.tsx` does NOT render full-screen blocking `<PageLoading>` or spinning center circle.
- **T1.1.2**: Verify `src/app/student/loading.tsx` imports and renders `StudentDashboardSkeleton`.
- **T1.1.3**: Verify `StudentDashboardSkeleton` renders placeholder header, navigation sidebar, stats pill, and card grid.
- **T1.1.4**: Verify skeleton layout markup renders synchronously with paint latency < 300ms.
- **T1.1.5**: Verify accessibility attributes on skeleton components (`role="status"`, `aria-busy="true"`).

### Feature 2: Progressive Word Cards & Stats Hydration
*Target Files*: `src/app/student/page.tsx`, `src/components/ui/WordCardSkeleton.tsx`
- **T1.2.1**: Verify `page.tsx` mounts `<StudentShell>` immediately on Frame 1 without being gated by `{isLoading ? <Loader2 /> : ...}`.
- **T1.2.2**: Verify word card grid displays `WordCardSkeleton` placeholders while word API queries are inflight.
- **T1.2.3**: Verify SWR cache hydration: `readWordSummaryCache` immediately renders cached review and new word counts prior to network return.
- **T1.2.4**: Verify background resolution transitions seamlessly from skeleton cards to populated word cards with zero layout shift.
- **T1.2.5**: Verify empty word state displays friendly zero-word guidance rather than infinite spinning loader.

### Feature 3: Shell Header Non-Blocking State
*Target Files*: `src/components/student/StudentShell.tsx`
- **T1.3.1**: Verify `StudentShell.tsx` header action area does NOT contain `<Loader2 className="... animate-spin" />` during `isBootstrapping`.
- **T1.3.2**: Verify header renders cached gamification stats (streak, level) immediately when available from cache.
- **T1.3.3**: Verify header fallback placeholder retains balanced horizontal layout (`gap-1.5`, `h-8`) without content collapse.
- **T1.3.4**: Verify user profile avatar displays skeleton circle or initials fallback during bootstrap.
- **T1.3.5**: Verify teacher link (`/teacher`) and desktop actions mount gracefully upon role confirmation without layout jitter.

### Feature 4: Single Source of Truth (`StudentProvider`)
*Target Files*: `src/app/student/layout.tsx`, `src/components/student/StudentProvider.tsx`
- **T1.4.1**: Verify `src/components/student/StudentProvider.tsx` exports `StudentProvider` and `useStudentContext`.
- **T1.4.2**: Verify `StudentContextValue` satisfies contract: `{ session, profile, gamification, wordSummary, classrooms, isLoading, error, refreshSummary, refreshProfile }`.
- **T1.4.3**: Verify `src/app/student/layout.tsx` wraps all children in `<StudentProvider>`.
- **T1.4.4**: Verify `useStudentContext` throws descriptive error when invoked outside `StudentProvider`.
- **T1.4.5**: Verify `StudentProvider` triggers only one auth session lookup on mount and shares it across all consumers.

### Feature 5: Eradicate Duplicate Network Calls
*Target Files*: `src/app/student/page.tsx`, `src/components/student/StudentShell.tsx`
- **T1.5.1**: Verify `StudentShell.tsx` delegates `profiles` table query to `StudentProvider` rather than executing its own `supabase.from('profiles')`.
- **T1.5.2**: Verify `StudentShell.tsx` does NOT call `useGamification()` independently (consumed from `StudentContext`).
- **T1.5.3**: Verify `/api/words?summary=1` is requested at most once upon entering `/student`, eliminating the second fetch.
- **T1.5.4**: Verify `page.tsx` reuses `profile`, `gamification`, and `wordSummary` from context, reducing concurrent requests by >= 40%.
- **T1.5.5**: Verify real-time auth changes (`SIGNED_OUT`, `TOKEN_REFRESHED`) propagate through single listener to all consumers.

### Feature 6: Deduplicate Campaign Modals
*Target Files*: `src/app/student/page.tsx`, `src/components/student/StudentShell.tsx`
- **T1.6.1**: Verify `src/app/student/page.tsx` does NOT import or render `<UpgradeGiftModal />`.
- **T1.6.2**: Verify `<UpgradeGiftModal />` is mounted exclusively in `StudentShell.tsx` (or layout root).
- **T1.6.3**: Verify modal open state is not triggered twice upon user login or trial milestone.
- **T1.6.4**: Verify closing modal dismisses single instance cleanly without orphan overlay or scroll lock.
- **T1.6.5**: Verify modal localStorage dismiss key (`lingo_upgrade_gift_dismissed`) is respected.

### Feature 7: Listening Module Bundle Decoupling
*Target Files*: `src/lib/listening-utils.ts`, `src/data/listening/videos-index.json`, `src/app/practice/listening/page.tsx`
- **T1.7.1**: Verify `src/lib/listening-utils.ts` exists and exports pure helpers: `formatTime`, `parseTime`, `getVideoDifficulty`, `tokenizeSentence`, `findActiveCueIndex`.
- **T1.7.2**: Verify `src/lib/listening-utils.ts` has ZERO static imports of `videos.json` or `catalog-v3.json`.
- **T1.7.3**: Verify `/practice/listening/page.tsx` uses lightweight `videos-index.json` (~157KB) for catalog browsing.
- **T1.7.4**: Verify full video details and transcripts (>40KB each) are loaded on-demand per `videoId` via API or dynamic import.
- **T1.7.5**: Verify initial client bundle for `/practice/listening` does NOT include the 5.79MB chunk `2tr-5nvu4obnn.js`.

### Feature 8: Pack Reading Dead Code Elimination
*Target Files*: `src/app/practice/pack-reading/page.tsx`
- **T1.8.1**: Verify unused `resolvePack` import from `@/lib/vocab-catalog` is completely removed.
- **T1.8.2**: Verify AST inspection confirms no reference to `resolvePack` in `pack-reading/page.tsx`.
- **T1.8.3**: Verify client bundle for `/practice/pack-reading` no longer includes chunk `0ys5501lpi7q7.js` (3.72MB).
- **T1.8.4**: Verify pack reading exercises and passages continue to load properly via `/api/practice/pack-passage`.
- **T1.8.5**: Verify error handling if requested pack passage does not exist.

### Feature 9: Vocab Station Dead Code Elimination
*Target Files*: `src/app/practice/vocab-station/page.tsx`
- **T1.9.1**: Verify unused `getVocabTopic`, `getAllVocabTopics`, `VocabStageTopic`, `VocabStageItem` imports are removed.
- **T1.9.2**: Verify AST inspection confirms zero static references to `vocab-stages.ts` in `vocab-station/page.tsx`.
- **T1.9.3**: Verify client bundle for `/practice/vocab-station` no longer includes chunk `0jy6kv32yaopf.js` (1.49MB).
- **T1.9.4**: Verify 100 Foundation Verbs station exercises operate with 100% functional integrity.
- **T1.9.5**: Verify question progression and score submission remain completely functional.

### Feature 10: Journey Roadmap Code-Splitting
*Target Files*: `src/app/journey/page.tsx`, `src/components/journey/VocabRoadmapSection.tsx`
- **T1.10.1**: Verify `VocabRoadmapSection` in `src/app/journey/page.tsx` is dynamically imported (`next/dynamic`) with `{ ssr: false }`.
- **T1.10.2**: Verify initial client bundle for `/journey` does not package `vocab-stages-v1.json` (1.49MB savings).
- **T1.10.3**: Verify CEFR and THPT tracks load instantly without waiting for Vocab Roadmap chunk.
- **T1.10.4**: Verify expanding or scrolling to Vocab Roadmap progressively loads component and mounts correctly.
- **T1.10.5**: Verify error boundary catches and displays retry button if dynamic import fails.

### Feature 11: TOEIC Exam Static Fallback Decoupling
*Target Files*: `src/app/toeic/exam/[examId]/page.tsx`
- **T1.11.1**: Verify synchronous imports of `content-toeic-reading-v1.json` and `content-toeic-listening-v1.json` are eliminated from client code.
- **T1.11.2**: Verify client bundles no longer contain chunks `3ljbdqzo4u3i7.js` (1.02MB) and `1s05vyeg5p74c.js` (0.73MB).
- **T1.11.3**: Verify exam data is fetched via `/api/toeic/test` with cyber-defense sanitization (`stripSensitiveData`).
- **T1.11.4**: Verify Question Palette and question timer initialize seamlessly upon API response.
- **T1.11.5**: Verify anti-duplication tracking (`lingo_toeic_question_history`) continues to record answered questions.

### Feature 12: Database Schema & Zero Data Loss Protection
*Target*: Supabase Postgres Tables (`profiles`, `user_gamification`, `words`, `srs_progress`, `classrooms`, `enrollments`, `extension_tokens`, `daily_reading_exercises`)
- **T1.12.1**: Verify zero dropped tables: all 8 core tables exist with identical schema signatures.
- **T1.12.2**: Verify zero dropped columns in `profiles` (`id`, `full_name`, `email`, `role`, `avatar_url`, `plan`, `created_at`).
- **T1.12.3**: Verify zero dropped columns in `user_gamification` (`user_id`, `xp`, `streak`, `last_active`, `badges`).
- **T1.12.4**: Verify vocabulary words table retains `classroom_id`, `added_by`, and SRS link.
- **T1.12.5**: Verify `srs_progress` retains FSRS parameters: `stability`, `difficulty`, `interval`, `review_count`, `next_review_date`.

### Feature 13: Build, Type Safety & Zero-Downtime Verification
*Target*: Project root, `GEMINI.md`, Next.js build scripts
- **T1.13.1**: Verify `npx tsc --noEmit` exits with code 0 and 0 errors.
- **T1.13.2**: Verify `package.json` contains valid build and typecheck scripts.
- **T1.13.3**: Verify Next.js standalone build configuration in `next.config.ts`.
- **T1.13.4**: Verify GEMINI.md zero-downtime rules: out-of-place staging build and atomic directory swap (`.next.new -> .next`).
- **T1.13.5**: Verify failure isolation: failed builds in staging must abort before touching active service directory.

---

## 4. Tier 2: Boundary & Corner Cases Specification

Covers extreme conditions, error states, and edge inputs across all 4 requirements:

- **T2.1 (Empty State)**: User with 0 words and 0 reviews sees zero-word empty state without infinite loading.
- **T2.2 (Gamification Zero Boundary)**: New user with 0 XP and 0 streak renders Level 1 and 0-day streak with no division-by-zero or NaN in XP progress bar.
- **T2.3 (Extreme Vocabulary Size)**: User with 10,000+ words in personal classroom: summary endpoint aggregates counts cleanly without timeout.
- **T2.4 (High Latency / Slow 3G)**: 2000ms network delay: Instant App Shell and skeletons persist gracefully until resolution without error crash.
- **T2.5 (Corrupted Storage Cache)**: `sessionStorage` containing malformed JSON for `lp:word-summary:*` is safely caught, discarded, and replaced with fresh network data.
- **T2.6 (Expired SWR Cache)**: Cache older than TTL (`60_000ms`) is returned for instant paint and immediately revalidated in background.
- **T2.7 (Unauthenticated Redirection)**: Visiting `/student` with null session redirects cleanly to `/auth` without rendering dashboard shell.
- **T2.8 (401 Unauthorized Mid-Session)**: Token expiration during background fetch triggers graceful session refresh or redirect without unhandled promise rejection.
- **T2.9 (Non-Existent Video ID)**: Requesting invalid `videoId` on `/practice/listening/[videoId]` returns structured 404 error without crashing client player.
- **T2.10 (Offline / Disconnected Mode)**: Network disconnection shows offline toast indicator while preserving previously cached word summary and review counts.

---

## 5. Tier 3: Cross-Feature Combinations (Pairwise Interactions)

Covers complex interactions between independently optimized modules:

- **T3.1 (`StudentProvider` Cache + Skeleton Transition)**:
  - Interaction: Instant render of cached summary -> background network return -> smooth card hydration.
  - Expected: Zero flicker, counts update accurately if changed on server.
- **T3.2 (Classroom Scope Switch + Count Re-Fetch Deduplication)**:
  - Interaction: User switches from "Personal Vocabulary" to a specific classroom ID.
  - Expected: Triggers single scoped `/api/words?summary=1&classroomId=X` query; updates both Sidebar counts and Page card list simultaneously without double query.
- **T3.3 (Listening Catalog Search + On-Demand Detail Retrieval)**:
  - Interaction: Filtering videos by CEFR B1 in `videos-index.json` -> clicking video -> dynamic fetch of transcript details.
  - Expected: Search executes instantaneously against lightweight index; detail chunk is fetched only upon video selection.
- **T3.4 (Journey CEFR Track Toggle + Dynamic Roadmap Lazy Load)**:
  - Interaction: Navigating `/journey` between CEFR and THPT tracks, then scrolling down to trigger `VocabRoadmapSection` dynamic chunk load.
  - Expected: Track navigation has zero latency; roadmap chunk streams without stalling page interactions.
- **T3.5 (TOEIC Exam Launch + Anti-Scraping On-Demand Explain)**:
  - Interaction: Launching exam via decoupled `/api/toeic/test` -> answering questions -> requesting single-question explanation via `/api/toeic/explain`.
  - Expected: Exam loads sanitized data without bulk answers; explanation returns on-demand with valid HMAC session token.
- **T3.6 (Single Upgrade Modal + Pro Trial Coupon Flow)**:
  - Interaction: User hits Pro Trial milestone card -> single `<UpgradeGiftModal />` triggers -> user enters coupon `KHAIGIANG3M`.
  - Expected: Exact single modal interaction; coupon validated and subscription extended by 90 days.
- **T3.7 (Real-time Auth Sign-Out + Unified Context Purge)**:
  - Interaction: Supabase `SIGNED_OUT` event fires (e.g. from another browser tab).
  - Expected: `StudentProvider` immediately nullifies session, profile, and word summary, clearing storage cache and routing to `/auth`.

---

## 6. Tier 4: Real-World Scenarios (End-to-End User Workflows)

- **T4.1 (Complete Student Study Session)**:
  1. Student loads `/student`: Instant Shell & skeletons paint in <300ms.
  2. SWR cache renders cached review count (15 words due).
  3. Word list hydrates progressively; student clicks word card to open `WordDetailModal`.
  4. Student launches SRS Review, rates card "Good" (FSRS rating = 3).
  5. Stability and next review date update; gamification awards +10 XP.
  6. Exactly one summary revalidation occurs.
- **T4.2 (Guest Learner Zero-Bloat Video Session)**:
  1. Guest visits `/practice/listening`.
  2. Page renders in <200ms using `videos-index.json` (~157KB).
  3. No 5.79MB chunk is downloaded.
  4. Guest clicks video `v-001`; on-demand detail (~40KB) loads and video player plays with synchronized transcript.
- **T4.3 (Multi-Tier Bundle Size Reduction Verification)**:
  1. Measure client JS bundle size across 5 routes: `/practice/listening`, `/journey`, `/practice/pack-reading`, `/practice/vocab-station`, `/toeic/exam/[examId]`.
  2. Confirm cumulative client bundle reduction >= 10.0 MB minified JS compared to pre-optimization baseline.
- **T4.4 (Zero-Downtime Deployment & Atomic Swap Simulation)**:
  1. Simulate staging build in separate directory (`~/Vocab-build`).
  2. Verify active service directory (`lingopro.service`) remains 100% accessible during build.
  3. Simulate atomic swap (`.next.new -> .next`).
  4. Simulate build failure in staging: confirm staging aborts without affecting active production service.

---

## 7. Authoritative Sources & Expected Output Derivation

| Requirement | Metric / Contract | Authoritative Source | Verification Technique |
|-------------|-------------------|----------------------|------------------------|
| **R1** | Shell Paint Latency < 300ms | `ORIGINAL_REQUEST.md § 2026-09-15T02:42:02Z` | Synthetic layout render benchmark & AST check for non-blocking skeleton |
| **R1** | Eradication of `<Loader2>` | `PROJECT.md § Feature 1 & 3` | Static AST / Regex inspection of `loading.tsx`, `page.tsx`, `StudentShell.tsx` |
| **R2** | Zero Duplicate Network Queries | `PROJECT.md § Feature 4 & 5` | Network Interceptor tracking requests to `profiles`, `user_gamification`, `/api/words` |
| **R2** | `StudentContextValue` Contract | `PROJECT.md § Interface Contracts` | TypeScript interface reflection & runtime shape validation |
| **R3** | Chunk Offloading > 10MB | `explorer_survey_bundles/handoff.md` | Static file size & chunk manifest analysis |
| **R3** | Pure Listening Utils | `PROJECT.md § Interface Contracts` | Import graph analysis: zero imports of `videos.json` in `listening-utils.ts` |
| **R4** | Schema & FSRS Integrity | `src/lib/srs.ts`, Supabase Schemas | Schema signature equality & FSRS v5 formula matching |
| **R4** | Zero-Downtime Deployment | `GEMINI.md § Deployment Rules` | Staging build isolation & atomic swap sequence check |

---

## 8. Test Execution & Quality Gates

### Master Runner Command
```bash
npx tsx tests/perf-verification.test.ts
```

### Expected Output
- Color-coded TAP/spec output.
- Summary statistics for each tier (Tier 1, Tier 2, Tier 3, Tier 4).
- Requirement Traceability Matrix (R1, R2, R3, R4 status).
- Execution timing (<5s for complete suite).
- Baseline vs Target comparison mode.
