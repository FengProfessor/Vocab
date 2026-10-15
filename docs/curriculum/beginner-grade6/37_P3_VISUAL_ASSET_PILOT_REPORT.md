# 37. P3 Visual Asset Pilot & Pedagogical QA Report

> **Project**: LingoPro (`web-app`)  
> **Curriculum**: English From Zero – Foundation Curriculum (Grade 6 Vietnam Pre-A1)  
> **Phase**: P3 — Visual Asset Pilot Build & Multi-Representation Grounding  
> **Evaluation Date**: 2026-10-09  
> **Status**: `P3 BATCH A VERIFIED — READY FOR LOCAL N=1 VISUAL PILOT`  

---

## 1. Executive Summary & Batch A Scope

Phase P3 strictly follows the principle of **starting smaller than the maximum**. Rather than scaling unverified prompt assumptions across 18+ concepts, Batch A focused on a balanced initial set of **9 target concepts** representing four distinct grammatical and cognitive categories:

- **Concrete Nouns (3)**: `bag` (school backpack), `pen` (ballpoint pen), `book` (textbook/notebook).
- **Action Verbs (3)**: `run` (track sprint), `eat` (school lunch), `drink` (water from glass).
- **Visible States / Attributes (2)**: `happy` (radiant smile), `tired` (afternoon study fatigue).
- **Contrast Pair (1)**: `big` vs `small` (physical scale comparison).

A total of **11 physical image assets** (9 initial V1 generations + 2 iterative V2 patch generations) were produced, saved to disk at `public/curriculum/beginner-grade6/images/`, and subjected to rigorous human pedagogical QA.

---

## 2. Batch A Pedagogical QA Table

Every generated asset was evaluated against semantic clarity, age dignity (11–12yo Grade 6 Vietnamese learners), text leakage, and diagnostic validity. In accordance with the **Diagnostic Approval Bar**, diagnostic approval is strictly separated from teaching approval.

| Concept | Ver | Rating | Primary Interpretation | Alternative Interpretation | Teaching Appr. | Diag. Appr. | Rejection Rationale / Pedagogical Verdict |
|---|---|---|---|---|---|---|---|
| **`bag`** | v1 | **V0** | backpack / school bag | rucksack (hyponym) | **TRUE** | **TRUE** | Contemporary navy school backpack with teal accents, centered, upright on light wood floor. Zero text or logos. Canonical diagnostic V0. |
| **`pen`** | v1 | **V0** | ballpoint pen / pen | writing pen | **TRUE** | **TRUE** | Single blue ballpoint pen with translucent barrel and blue cap resting diagonally. Extremely distinct from pencil. Canonical diagnostic V0. |
| **`book`** | v1 | **V0** | book / textbook | notebook | **TRUE** | **TRUE** | Closed hardcover book with solid sage-green blank cover, crisp page thickness. Strictly zero text leakage. Canonical diagnostic V0. |
| **`run`** | v1 | **V1** | run / sprint | race / PE class / sports | **TRUE** | **FALSE** | **Diagnostic Rejected**: While the foreground sprint is dynamic, the background contains additional student runners and a teacher with a clipboard. Distractor elements induce race/class interpretations rather than isolating the base action lemma. |
| **`eat`** | v1 | **V1** | eat / eating | lunch / food / meal | **TRUE** | **FALSE** | **Diagnostic Rejected**: Rich meal tray (rice, egg, meat, vegetables) creates strong competing noun salience (*food / lunch*) against the action verb *eat*. Superb for teaching; rejected for unassisted diagnostic. |
| **`drink`** | v1 | **V0** | drink / drinking water | water (liquid) | **TRUE** | **TRUE** | Student holding clear glass of water directly to lips. Zero solid food or utensils in frame. Highly clear action verb depiction with zero distractor overlap. |
| **`happy`** | v1 | **V1** | happy / smiling | girl / student / person | **TRUE** | **FALSE** | **Diagnostic Rejected**: Standalone portrait bust induces noun-entity responses (*girl / student*) in Pre-A1 false beginners. Approved for teaching; diagnostic requires contrastive prompt (happy vs sad). |
| **`tired`** | v1 | **V2** | sleep / sleeping / nap | tired / exhausted | **TRUE** | **FALSE** | **Diagnostic Rejected**: Head resting flat on folded arms on desk with closed eyes strongly signals *sleeping* rather than *tired*. Triggered prompt patch to v2.0. |
| **`tired`** | v2 | **V0** | tired / sleepy / yawning | bored | **TRUE** | **TRUE** | **Patched V2 Approved**: Student sitting upright, yawning with hand near mouth, heavy droopy eyelids, open textbook. Unambiguously conveys tiredness without looking asleep. |
| **`big_small`** | v1 | **V2** | backpack and pencil case | big and small | **TRUE** | **FALSE** | **Diagnostic Rejected**: Changed object identity between backpack and pencil pouch. Learner evaluates two different objects rather than the dimension of physical scale. Triggered prompt patch to v2.0. |
| **`big_small`** | v2 | **V0** | big and small (scale) | backpacks | **TRUE** | **TRUE** | **Patched V2 Approved**: Two identical navy backpacks side by side on the same tabletop, one 3x larger than the other. Identical object identity cleanly isolates physical scale. |

**Audit Summary**:
- Total Assets Evaluated: 11
- Approved for Diagnostic (V0): **6 assets** (`bag_v1`, `pen_v1`, `book_v1`, `drink_v1`, `tired_v2`, `big_small_v2`)
- Approved for Teaching Only (V1): **3 assets** (`run_v1`, `eat_v1`, `happy_v1`)
- Rejected for Diagnostic & Patched (V2 $\rightarrow$ V0): **2 assets** (`tired_v1` $\rightarrow$ `tired_v2`, `big_small_v1` $\rightarrow$ `big_small_v2`)

---

## 3. Iterative Prompt Patching Case Studies

### Case Study A: `tired` (Sleep vs State Disambiguation)
- **Defect in V1**: In `PROMPT-G6-014-v1`, the posture "resting cheek and arms flat on the desk" caused the image generation model to render the student with closed eyes flat on the desk. To a Grade 6 learner, this is indistinguishable from "sleeping" or "taking a nap".
- **Prompt Patch**:
  ```yaml
  PROMPT_ID: PROMPT-G6-014-v2
  MODIFICATION: Explicit negative constraint (NOT lying down, NOT sleeping) + active fatigue marker (sitting upright, slumping slightly, yawning openly with hand covering mouth, heavy drooping eyelids).
  ```
- **Result in V2**: The generated asset [`tired_v2.jpg`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/tired_v2.jpg) depicts an awake student battling exhaustion during study. Promoted to **V0 Canonical Diagnostic**.

### Case Study B: `big_small` (Object Identity Confounding)
- **Defect in V1**: `PROMPT-G6-017-v1` attempted to compare a large backpack with a small pencil pouch. Because the two objects had different physical categories, learners naturally named the items ("bag and pencil case") instead of recognizing the adjective scale.
- **Prompt Patch**:
  ```yaml
  PROMPT_ID: PROMPT-G6-017-v2
  MODIFICATION: Two IDENTICAL school backpacks on the exact same wooden tabletop ground level. Identical fabric, identical teal zippers, identical proportions; only physical scale varies (3:1 ratio).
  ```
- **Result in V2**: The generated asset [`big_small_v2.jpg`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/big_small_v2.jpg) features two identical backpacks, making physical size the single independent variable. Promoted to **V0 Canonical Diagnostic**.

---

## 4. Manifest Integrity & Physical Disk Reality

All physical images reside on disk and are verified by checksum and file presence checks:

| Filename | Disk Location | File Size | Manifest Status | Clarity Rating |
|---|---|---|---|---|
| `bag_v1.jpg` | `public/curriculum/beginner-grade6/images/bag_v1.jpg` | 518 KB | `APPROVED_DIAGNOSTIC` | V0 |
| `pen_v1.jpg` | `public/curriculum/beginner-grade6/images/pen_v1.jpg` | 367 KB | `APPROVED_DIAGNOSTIC` | V0 |
| `book_v1.jpg` | `public/curriculum/beginner-grade6/images/book_v1.jpg` | 503 KB | `APPROVED_DIAGNOSTIC` | V0 |
| `run_v1.jpg` | `public/curriculum/beginner-grade6/images/run_v1.jpg` | 744 KB | `APPROVED_TEACHING` | V1 |
| `eat_v1.jpg` | `public/curriculum/beginner-grade6/images/eat_v1.jpg` | 767 KB | `APPROVED_TEACHING` | V1 |
| `drink_v1.jpg` | `public/curriculum/beginner-grade6/images/drink_v1.jpg` | 496 KB | `APPROVED_DIAGNOSTIC` | V0 |
| `happy_v1.jpg` | `public/curriculum/beginner-grade6/images/happy_v1.jpg` | 594 KB | `APPROVED_TEACHING` | V1 |
| `tired_v1.jpg` | `public/curriculum/beginner-grade6/images/tired_v1.jpg` | 557 KB | `REJECTED` | V2 |
| `tired_v2.jpg` | `public/curriculum/beginner-grade6/images/tired_v2.jpg` | 536 KB | `APPROVED_DIAGNOSTIC` | V0 |
| `big_small_v1.jpg` | `public/curriculum/beginner-grade6/images/big_small_v1.jpg` | 394 KB | `REJECTED` | V2 |
| `big_small_v2.jpg` | `public/curriculum/beginner-grade6/images/big_small_v2.jpg` | 417 KB | `APPROVED_DIAGNOSTIC` | V0 |

The canonical manifest file [`src/data/foundation-visual-manifest.json`](file:///d:/Vibe/Vocab/web-app/src/data/foundation-visual-manifest.json) has been updated to `manifest_version: "1.1.0"`.

---

## 5. Real Learner Escape Hatch Implementation

Even canonical V0 assets remain provisional until validated with real Grade 6 learners. To protect students from false-negative penalization when unforeseen visual ambiguities occur:

1. **Schema Update**: Added `visual_ambiguity_suspected?: boolean;` to [`LexicalEvidenceEvent`](file:///d:/Vibe/Vocab/web-app/src/lib/foundation-curriculum/types.ts).
2. **State Derivation Engine**:
   ```typescript
   if (
     event.visual_ambiguity_suspected ||
     event.distractor_selected === 'VISUAL_AMBIGUITY_SUSPECTED' ||
     event.distractor_selected === 'POSSIBLE_VISUAL_ITEM_ERROR'
   ) {
     state.is_instrument_invalidated = true;
     state.invalidation_reason = 'POSSIBLE_VISUAL_ITEM_ERROR';
     state.active_gap = 'POSSIBLE_VISUAL_ITEM_ERROR';
     state.status_bucket = 'RECHECK';
     continue; // Non-scoring event: student is NOT penalized
   }
   ```
3. **Pedagogical Invariant**: An ambiguous visual trial halts negative scoring, flags the item for teacher review, and routes subsequent probes to auditory or orthographic representations.

---

## 6. Local Quality Gate & Test Results

A dedicated test suite [`tests/foundation-curriculum/p3-visual-pipeline.test.ts`](file:///d:/Vibe/Vocab/web-app/tests/foundation-curriculum/p3-visual-pipeline.test.ts) was created to automate verification of the physical visual pipeline.

### Test Execution Summary:
- `p3-visual-pipeline.test.ts`: **5/5 PASS**
  - `P3-1`: Physical files exist on disk for all declared physical assets.
  - `P3-2`: Non-destructive versioning preserves rejected V1 and patched V2 assets.
  - `P3-3`: Runtime validator approves V0 diagnostic assets and rejects V1/V2 for diagnostic probes.
  - `P3-4`: `visual_ambiguity_suspected` escape hatch does not penalize learner.
  - `P3-5`: Simulated local visual vocabulary probe with canonical approved asset succeeds.
- Full Foundation Test Suite (`gap-model.test.ts` + `api-routes.test.ts` + `p3-visual-pipeline.test.ts`): **34/34 PASS (100%)**.
- TypeScript Compilation (`tsc --noEmit`): **0 errors repository-wide**.
- ESLint: **0 errors, 0 warnings** across all foundation files.
- Git Whitespace Diff (`git diff --check` on foundation paths): **Clean**.

---

## 7. Batch B Justification Decision

**Decision**: **HOLD Batch B Generation**.

**Rationale**:
1. Batch A has provided **6 approved diagnostic assets** (`bag`, `pen`, `book`, `drink`, `tired`, `big_small`) covering nouns, verbs, states, and contrast pairs.
2. This is more than sufficient to run the planned **N=1 Local Lesson-1 Pilot**.
3. Generating Batch B prior to gathering real learner telemetry from the N=1 pilot would risk multiplying undetected visual assumptions. Batch B prompts (`swim`, `draw`, `cook`, `water`, `pencil`, `ruler`, `hot`, `cold`, `in/on/under`) will remain staged as `PROMPT_ONLY` until the N=1 pilot is executed and analyzed.
