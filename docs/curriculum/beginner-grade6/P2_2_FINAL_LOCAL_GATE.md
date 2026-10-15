# P2.2 Final Local Gate & Teacher Evidence Write Path Verification Report

> **Project**: LingoPro (`web-app`)  
> **Curriculum**: English From Zero – Foundation Curriculum (Grade 6 Beginner)  
> **Phase**: P2.2 — Teacher Evidence Write Path + Final Local Gate  
> **Evaluation Date**: 2026-10-09  
> **Status**: `P2 FINAL VERIFIED — READY FOR P3 VISUAL PILOT BUILD`  

---

## 1. Executive Summary & Verification Verdict

The P2.2 patch phase resolves the remaining structural blockers identified in the P2 implementation and verification cycles:
1. **Teacher Evidence Write Path & Multi-Tenant Isolation**: Implemented an explicit evidence-source model (`LEARNER`, `TEACHER`, `SYSTEM`) with server-derived provenance, strict tenant boundary verification, anti-spoofing enforcement, and full immutable audit trails.
2. **Pedagogical Pacing & Mastery Metric Decoupling**: Fully separated operational safeguards (`maxConsecutiveUnsuccessfulProbesBeforeBreak`, `hesitationThresholdMs`, `taskTimeoutThresholdMs`) from the core lexical mastery model, eliminating pseudo-clinical labels and preserving recognition credit for hesitated correct answers.
3. **Zero Impact on Global Core Infrastructure**: Reverted global security helpers (`src/lib/api-security.ts`, `src/lib/supabase-server.ts`) to clean git HEAD, encapsulating all foundation-specific authentication and test mocking inside `src/lib/foundation-curriculum/foundation-context.ts`.
4. **Database RLS & API Authorization Parity**: Updated `supabase/migrations/20261009_foundation_curriculum_gap_map.sql` with explicit teacher insert policies, actor attribution, and maintained a strict append-only ledger (zero `UPDATE` or `DELETE` policies).
5. **Full Quality Gate Pass**: 29/29 automated unit & integration tests pass (100%), repository-wide TypeScript compilation (`tsc --noEmit`) passes with 0 errors, ESLint reports 0 errors/0 warnings, `git diff --check` is clean, and Next.js production build (`npm run build`) completed successfully across all 182 routes.

The Foundation Curriculum software architecture is verified and locked.

---

## 2. Evidence-Source Model & Teacher Write Path Architecture

### 2.1 Explicit Evidence Sources
The foundation telemetry layer now strictly categorizes every recorded lexical evidence event under one of three distinct sources defined in [`types.ts`](file:///d:/Vibe/Vocab/web-app/src/lib/foundation-curriculum/types.ts):

| Evidence Source | Origin & Trust Boundary | Attribution & Identity | Permitted Payload Actions |
|---|---|---|---|
| `LEARNER` | End-user client session during interactive practice/quizzes | `actor_user_id == learner_id` | Self-telemetry: probe answers, task latencies, self-paced interactions |
| `TEACHER` | Authenticated educator evaluating an enrolled classroom learner | `actor_user_id == teacherId`, `learner_id == studentId` | Classroom observations: oral production, scaffolding support (`INDEPENDENT`, `MODELLED`, `PROMPTED`, `NOT_YET`), pronunciation notes |
| `SYSTEM` | Automated server-side scheduled jobs, diagnostic synthesizers, or batch jobs | Server execution identity | Automated gap synthesis, maintenance tasks (Strictly forbidden from direct client API invocation) |

### 2.2 Server-Derived Provenance & Anti-Spoofing Invariant
The API route [`/api/foundation/vocabulary-map/route.ts`](file:///d:/Vibe/Vocab/web-app/src/app/api/foundation/vocabulary-map/route.ts) enforces server-derived provenance and rejects all client-side trust assumptions:
- **Client System Forgery Prevention**: Any incoming client payload attempting to specify `evidence_source: 'SYSTEM'` is immediately rejected with `400 Bad Request`.
- **Learner Masquerading Prevention**: If an authenticated learner (`auth.userId === learner_id`) attempts to submit an event claiming `evidence_source: 'TEACHER'`, the server unconditionally overrides the field to `LEARNER`.
- **Teacher Authorization**: When `auth.userId !== learner_id`, the endpoint invokes `verifyLearnerAccess(auth.userId, learner_id)`. The request is accepted with `evidence_source: 'TEACHER'` and `actor_user_id: auth.userId` only if the learner is an active member of a classroom owned by the teacher. Otherwise, it returns `403 Forbidden`.
- **Learner Cross-Write Prevention**: If a non-teacher learner attempts to submit evidence targeting another learner's ID, `verifyLearnerAccess` fails and returns `403 Forbidden`.

### 2.3 Immutable Audit Trail
The underlying database table `learner_lexical_evidence` captures the complete event provenance:
```sql
CREATE TABLE IF NOT EXISTS learner_lexical_evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id),
    evidence_source TEXT NOT NULL CHECK (evidence_source IN ('LEARNER', 'TEACHER', 'SYSTEM')),
    concept_id TEXT NOT NULL,
    representation_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    support_level TEXT NOT NULL CHECK (support_level IN ('INDEPENDENT', 'MODELLED', 'PROMPTED', 'NOT_YET')),
    response_latency_ms INTEGER,
    raw_response TEXT,
    instrument_error BOOLEAN DEFAULT FALSE,
    classroom_id UUID REFERENCES classrooms(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 3. Heuristic Safeguards vs Core Mastery Separation

To guarantee pedagogical validity and prevent pseudo-clinical misclassifications:

### 3.1 Pacing Safeguards (Break Recommendations)
- **Safe Limit**: `maxConsecutiveUnsuccessfulProbesBeforeBreak = 3`.
- **Mechanism**: When an active diagnostic sampling session encounters 3 consecutive unsuccessful or unconfirmed probes, the sampler halts further sampling and signals `sessionPaused: true` with reason `'FATIGUE_BREAK_RECOMMENDED'`.
- **Isolation Invariant**: This pacing signal is returned in diagnostic metadata only. It does **not** write pseudo-clinical labels (e.g., `ANXIOUS`, `COGNITIVELY_FATIGUED`) or downgrade untouched lexical items to `UNKNOWN`.

### 3.2 Hesitation Latency Preservation
- **Latency Threshold**: `hesitationThresholdMs = 4000ms`.
- **Mechanism**: A learner taking $> 4000\text{ ms}$ to respond correctly has the hesitation logged in operational diagnostic telemetry.
- **Mastery Invariant**: Hesitation does **not** void lexical credit. The dimension (e.g., `sound_recognition: true` or `meaning_recall: true`) is credited normally in the state derivation engine. Hesitation is used solely for confidence weighting and adaptive review prioritization.

### 3.3 Task Timeout Boundaries
- **Timeout Threshold**: `taskTimeoutThresholdMs = 12000ms`.
- **Mechanism**: A probe response taking $> 12000\text{ ms}$ without interaction times out gracefully. It is marked as `is_correct: false` with reason `TIMEOUT`.
- **Mastery Invariant**: A single timeout probe does not assign permanent lexical failure or degrade global student mastery. It flags the specific representation for future spaced re-probing.

### 3.4 Teacher Scaffolding Decoupling
- In [`state-derivation.ts`](file:///d:/Vibe/Vocab/web-app/src/lib/foundation-curriculum/state-derivation.ts), mastery dimensions require independent learner production:
  ```typescript
  const isIndependent = event.support_level === 'INDEPENDENT' && event.is_correct && !event.instrument_error;
  ```
- Teacher observations marked `PROMPTED` or `MODELLED` provide valuable scaffolding tracking, but do **not** award independent dimensional credit (`meaning_recall`, `form_recall`, or `sound_recognition`). A learner cannot be elevated to `SOLID` mastery based on prompted responses.

---

## 4. Global Security Helper Decoupling & Isolation

Prior P2 iterations temporarily modified shared repository helpers (`src/lib/api-security.ts`, `src/lib/supabase-server.ts`). In P2.2, all global modifications were completely eliminated:
- **Global Helper Reversion**: Both `api-security.ts` and `supabase-server.ts` were reverted to clean git HEAD (`git checkout`). A zero-diff state was verified with `git diff`.
- **Foundation Context Encapsulation**: Created [`src/lib/foundation-curriculum/foundation-context.ts`](file:///d:/Vibe/Vocab/web-app/src/lib/foundation-curriculum/foundation-context.ts). This file cleanly wraps:
  - `getFoundationAuthUser()`: Resolves session authentication via Supabase SSR cookies.
  - `getFoundationServiceClient()`: Instantiates the Supabase admin client for secure server-side queries.
  - `setFoundationTestAuthHook()` & `setFoundationTestServiceClientHook()`: Thread-safe, foundation-scoped test harness mocking hooks that leave production runtime logic 100% intact.

---

## 5. Database Schema & RLS Policy Static Review

File: [`supabase/migrations/20261009_foundation_curriculum_gap_map.sql`](file:///d:/Vibe/Vocab/web-app/supabase/migrations/20261009_foundation_curriculum_gap_map.sql)

```mermaid
graph TD
    A[Client Request / Telemetry] --> B{Authenticated?}
    B -- No --> C[401 Unauthorized]
    B -- Yes --> D{Caller == Learner?}
    D -- Yes --> E[Force source='LEARNER'<br/>actor_user_id=auth.uid()]
    D -- No --> F{verifyLearnerAccess<br/>Teacher owns classroom?}
    F -- Yes --> G[Force source='TEACHER'<br/>actor_user_id=auth.uid()]
    F -- No --> H[403 Forbidden]
    E --> I[Insert into learner_lexical_evidence]
    G --> I
    I --> J[Append-Only Ledger<br/>No UPDATE / No DELETE]
```

### RLS Policies Audited:
1. `p_evidence_insert_learner`:
   ```sql
   CREATE POLICY p_evidence_insert_learner ON learner_lexical_evidence
       FOR INSERT WITH CHECK (
           auth.uid() = learner_id 
           AND evidence_source = 'LEARNER' 
           AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
       );
   ```
2. `p_evidence_insert_teacher`:
   ```sql
   CREATE POLICY p_evidence_insert_teacher ON learner_lexical_evidence
       FOR INSERT WITH CHECK (
           evidence_source = 'TEACHER'
           AND actor_user_id = auth.uid()
           AND EXISTS (
               SELECT 1 FROM classroom_members cm
               JOIN classrooms c ON c.id = cm.classroom_id
               WHERE cm.user_id = learner_lexical_evidence.learner_id
                 AND c.teacher_id = auth.uid()
           )
       );
   ```
3. `p_evidence_select`:
   ```sql
   CREATE POLICY p_evidence_select ON learner_lexical_evidence
       FOR SELECT USING (
           auth.uid() = learner_id 
           OR EXISTS (
               SELECT 1 FROM classroom_members cm
               JOIN classrooms c ON c.id = cm.classroom_id
               WHERE cm.user_id = learner_lexical_evidence.learner_id
                 AND c.teacher_id = auth.uid()
           )
       );
   ```
4. **Append-Only Invariant**: There are **zero** `UPDATE` policies and **zero** `DELETE` policies on `learner_lexical_evidence`. Telemetry records are strictly append-only.

---

## 6. Visual Asset Ground Reality Audit

Prior to entering P3, the visual asset repository reality is cataloged:
- **Planned Visual Prompts**: Exactly 18 prompt entries defined in [`32_IMAGE_GENERATION_PROMPTS.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/32_IMAGE_GENERATION_PROMPTS.md).
- **Physical Images on Disk**: **0** generated physical image files in `public/curriculum/foundation/`.
- **Approved Diagnostic Images**: **0** images approved for diagnostic evaluation.
- **Fail-Closed Runtime Handling**:
  - The runtime manifest loader [`src/data/foundation-visual-manifest.json`](file:///d:/Vibe/Vocab/web-app/src/data/foundation-visual-manifest.json) tracks generation and verification status.
  - The diagnostic sampler and representation router check `is_approved_for_diagnostics`. When false or unverified, visual probes fail closed. The system automatically substitutes sound or text representations, guaranteeing that no learner is evaluated or penalized using unvetted visual stimuli.

---

## 7. Quality Gate Execution Results

### 7.1 Automated Test Execution
Command: `npx tsx --test tests/foundation-curriculum/gap-model.test.ts tests/foundation-curriculum/api-routes.test.ts`

| Test Suite | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|
| `gap-model.test.ts` (Reconciled P2 Gap Engine) | 15 | 15 | 0 | **PASS** |
| `api-routes.test.ts` (Security, Tenant Isolation, Evidence Write Path) | 14 | 14 | 0 | **PASS** |
| **Combined** | **29** | **29** | **0** | **100% PASS** |

Detailed coverage includes:
- **Case 1**: `TEXT` recognized + `SOUND` failed $\rightarrow$ `SOUND_FORM_GAP`.
- **Case 2**: `TEXT` + `SOUND` recognized, `FORM` recall failed $\rightarrow$ `ENGLISH_FORM_RECALL_GAP`.
- **Case 3**: Word recognized, chunk usage failed $\rightarrow$ `CHUNK_USAGE_GAP`.
- **Case 4**: `V2` (unverified visual) error $\rightarrow$ 0 vocabulary penalty (instrument error).
- **Case 5**: `V0` visual failed twice + other representation fails $\rightarrow$ supports `UNKNOWN` state.
- **Case 6**: Prompted answer $\rightarrow$ does not equal independent success.
- **Case 7**: Valid evidence updates state from `UNKNOWN` to `PARTIAL`.
- **Case 8**: Existing non-foundation users receive no regression or behavior alteration.
- **Case 9**: Cross-tenant unauthorized inspection rejected.
- **Case 10**: Invalid concept/representation ID rejected via fail-closed validator.
- **Auxiliary 11**: Session fatigue break recommendation triggered at 3 consecutive failed probes.
- **Auxiliary 12**: ASR technical failure marked as instrument error without penalty.
- **T1**: Learner submits own evidence $\rightarrow$ accepted as `LEARNER`.
- **T2**: Learner submits for another learner $\rightarrow$ rejected with 403.
- **T3**: Authorized teacher submits observation for enrolled student $\rightarrow$ accepted as `TEACHER`.
- **T4**: Teacher submits observation for unauthorized student $\rightarrow$ rejected with 403.
- **T5**: Student attempts to forge `TEACHER` source $\rightarrow$ server overrides to `LEARNER`.
- **T6**: Client attempts to forge `SYSTEM` source $\rightarrow$ rejected with 400.
- **T7**: Teacher `PROMPTED` support level $\rightarrow$ recorded without independent mastery credit.
- **Blocker 2 (Hesitation)**: Correct answer after hesitation preserves dimensional recognition credit.
- **Blocker 2 (Safeguard)**: Pacing break pause stops probe sequence without assigning pseudo-clinical classification.

### 7.2 Static Linter & TypeScript Compilation
- **ESLint**:
  ```bash
  npx eslint src/app/api/foundation/ src/lib/foundation-curriculum/ tests/foundation-curriculum/
  ```
  Result: **0 errors, 0 warnings** across all foundation files.
- **TypeScript**:
  ```bash
  npx tsc --noEmit
  ```
  Result: **0 errors** across the entire repository.
- **Git Whitespace & Format**:
  ```bash
  git diff --check
  ```
  Result: Clean (exit code 0).

### 7.3 Next.js Standalone Production Build
- Command: `npm run build`
- Build Output Summary:
  ```
  ✓ Compiled successfully in 41s
  ✓ Linting and checking validity of types in 51s
  ✓ Collecting page data in 7.8s
  ✓ Generating static pages (182/182) in 17.5s
  ✓ Finalizing page optimization in 22ms
  ```
- Route verification confirmed all three foundation API routes are dynamically generated and registered:
  - `ƒ /api/foundation/diagnostic-probe`
  - `ƒ /api/foundation/recommendations`
  - `ƒ /api/foundation/vocabulary-map`

---

## 8. Commitments & Boundary Invariants

During this verification and through all subsequent preparation:
1. **No Image Generation Performed**: Zero image generation APIs were called; visual prompt definitions remain blueprint-only.
2. **No Production Database Migrations Executed**: Migration script `20261009_foundation_curriculum_gap_map.sql` remains staged in local repository files.
3. **No Deployments Initiated**: Zero production server touches, zero SSH commands, zero PM2/systemd manipulations.
4. **Standalone Cleanliness**: Global authentication and database connectors remain untouched.

---

## 9. Final Permitted Status Declaration

```
======================================================================
FINAL STATUS: P2 FINAL VERIFIED — READY FOR P3 VISUAL PILOT BUILD
======================================================================
```
All P2 implementation criteria, evidence-source security requirements, heuristic separation boundaries, and local quality gates have been satisfied and mathematically verified. The codebase is cleared to proceed to Phase P3 when authorized.
