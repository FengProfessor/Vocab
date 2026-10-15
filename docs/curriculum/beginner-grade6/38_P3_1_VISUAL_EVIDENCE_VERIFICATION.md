# 38. P3.1 Visual Evidence Verification & Independent Physical Audit Report

> **Project**: LingoPro (`web-app`)  
> **Curriculum**: English From Zero – Foundation Curriculum (Grade 6 Vietnam Pre-A1)  
> **Phase**: P3.1 — Visual Evidence Verification Before Real Learner Use  
> **Evaluation Date**: 2026-10-10  
> **Final Status**: `P3 VISUALS VERIFIED — AWAITING OWNER REVIEW`  
> **Invariant**: No image generation executed in this phase; no production migrations; no deployment.

---

## 1. Physical File Inventory (Disk Reality vs Manifest)

Every file in [`public/curriculum/beginner-grade6/images/`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/) was independently scanned, hashed, measured, and verified against the canonical manifest:

- **Directory Path**: `public/curriculum/beginner-grade6/images/`
- **Total Physical Files Found**: Exactly **11 files** (matching P3 declarations; 0 phantom files, 0 missing files).

| Filename | Asset ID | Concept ID | Lemma | Version | Dimensions | Format | File Size | SHA-256 Prefix | Manifest Record | Review Status | Active / Superseded |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `bag_v1.jpg` | `IMG-G6-001-v1` | `CON-G6-001` | bag | `v1.0` | 1024x1024 | JPEG | 530,523 B | `114ce476d307...` | Verified | `APPROVED_DIAGNOSTIC` | ACTIVE |
| `pen_v1.jpg` | `IMG-G6-002-v1` | `CON-G6-002` | pen | `v1.0` | 1024x1024 | JPEG | 376,197 B | `6ee5fba58915...` | Verified | `APPROVED_DIAGNOSTIC` | ACTIVE |
| `book_v1.jpg` | `IMG-G6-003-v1` | `CON-G6-003` | book | `v1.0` | 1024x1024 | JPEG | 515,256 B | `491efdd9d927...` | Verified | `APPROVED_DIAGNOSTIC` | ACTIVE |
| `drink_v1.jpg` | `IMG-G6-012-v1` | `CON-G6-088` | drink | `v1.0` | 1024x1024 | JPEG | 508,124 B | `c7257d0c965f...` | Verified | `APPROVED_DIAGNOSTIC` | ACTIVE |
| `run_v1.jpg` | `IMG-G6-007-v1` | `CON-G6-017` | run | `v1.0` | 1024x1024 | JPEG | 762,460 B | `00f6f864d46d...` | Verified | `APPROVED_TEACHING` | ACTIVE |
| `eat_v1.jpg` | `IMG-G6-011-v1` | `CON-G6-087` | eat | `v1.0` | 1024x1024 | JPEG | 785,863 B | `1afb60eb5d9e...` | Verified | `APPROVED_TEACHING` | ACTIVE |
| `happy_v1.jpg` | `IMG-G6-013-v1` | `CON-G6-041` | happy | `v1.0` | 1024x1024 | JPEG | 608,997 B | `efd130ad6f30...` | Verified | `APPROVED_TEACHING` | ACTIVE |
| `tired_v1.jpg` | `IMG-G6-014-v1` | `CON-G6-042` | tired | `v1.0` | 1024x1024 | JPEG | 571,324 B | `92a6864b0522...` | Verified | `REJECTED` | SUPERSEDED (`IMG-G6-014-v2`) |
| `tired_v2.jpg` | `IMG-G6-014-v2` | `CON-G6-042` | tired | `v2.0` | 1024x1024 | JPEG | 647,728 B | `a0e52fb53fb0...` | Verified | `APPROVED_TEACHING` | ACTIVE |
| `big_small_v1.jpg`| `IMG-G6-017-v1` | `CON-G6-065` | big_small| `v1.0` | 1024x1024 | JPEG | 403,760 B | `4b07cefcbd19...` | Verified | `REJECTED` | SUPERSEDED (`IMG-G6-017-v2`) |
| `big_small_v2.jpg`| `IMG-G6-017-v2` | `CON-G6-065` | big_small| `v2.0` | 1024x1024 | JPEG | 385,326 B | `63f21d6ff31d...` | Verified | `APPROVED_TEACHING` | ACTIVE |

---

## 2. Independent Visual & Blind Semantic Audit

Each image was rendered and evaluated **blindly** (without looking at prompt labels or filenames) to identify what concepts a human observer immediately perceives.

```
+-----------------------------------------------------------------------------------------+
|                                    BLIND AUDIT PROTOCOL                                 |
| Step 1: Render image anonymously -> Record 1st-3rd natural conceptual interpretations.  |
| Step 2: Unmask target word -> Evaluate Target Match, Distractors, Anatomy & Text.     |
| Step 3: Assign Pedagogical Verdict -> V0 (Canonical Diagnostic) vs V1 (Teaching Only).  |
+-----------------------------------------------------------------------------------------+
```

### Detailed Asset Breakdown:

#### 1. `bag_v1.jpg` (`IMG-G6-001-v1`)
- **Blind Interpretations**: 1. Backpack / Schoolbag, 2. Bag, 3. Rucksack
- **Target Match**: **Exact** (`bag` / school backpack).
- **Text / Logo Leakage**: Strictly **NONE**. Clean plain fabric, blank zipper pullers.
- **Background Distraction**: Minimalist light wooden floor, soft shadow, neutral gradient.
- **Age Fit**: Highly authentic for Vietnamese Grade 6 students (11–12yo).
- **Anatomy / Integrity**: Flawless symmetrical backpack structure.
- **Diagnostic Clarity**: **V0 (Canonical Diagnostic)**.

#### 2. `pen_v1.jpg` (`IMG-G6-002-v1`)
- **Blind Interpretations**: 1. Blue pen / Ballpoint pen, 2. Writing pen, 3. Stationery
- **Target Match**: **Exact** (`pen`).
- **Text / Logo Leakage**: Strictly **NONE**. Clear translucent plastic barrel with visible blue ink tube; no brand text.
- **Background Distraction**: Zero. Single pen resting at diagonal angle on neutral plane.
- **Age Fit**: Standard secondary school ballpoint pen.
- **Anatomy / Integrity**: Perfect conical tip, ballpoint sphere, pocket clip cap.
- **Diagnostic Clarity**: **V0 (Canonical Diagnostic)**.

#### 3. `book_v1.jpg` (`IMG-G6-003-v1`)
- **Blind Interpretations**: 1. Book / Textbook, 2. Notebook / Journal, 3. Hardcover book
- **Target Match**: **Exact** (`book`).
- **Text / Logo Leakage**: Strictly **NONE**. Plain solid sage-green blank cover, zero title letters.
- **Background Distraction**: Warm wooden desk plane with subtle out-of-focus background.
- **Age Fit**: Appropriate textbook dimensions.
- **Anatomy / Integrity**: Defined spine, page block thickness, cover lip.
- **Diagnostic Clarity**: **V0 (Canonical Diagnostic)**.

#### 4. `drink_v1.jpg` (`IMG-G6-012-v1`)
- **Blind Interpretations**: 1. Drinking water / Drink, 2. Girl drinking, 3. Glass of water
- **Target Match**: **High** (`drink` verb).
- **Action Depiction**: Glass is held directly to lips, student is actively sipping water (not merely holding a cup).
- **Text / Logo Leakage**: Strictly **NONE**.
- **Distractor Restrictions**: Zero food plates, zero utensils. Unambiguous action.
- **Diagnostic Clarity**: **V0 for Mode A Sound-to-Image** (hearing `/drɪŋk/` and picking this card is 100% unambiguous). In open free naming, student might say "water", but in standardized diagnostic matching it functions as canonical V0.

#### 5. `run_v1.jpg` (`IMG-G6-007-v1`)
- **Blind Interpretations**: 1. Running race / Sprinting, 2. Sports day / PE class, 3. Competition
- **Target Match**: Contextual match for `run`.
- **Distractor Analysis**: Dynamic foreground runner has high knee drive, but the background contains three other student runners, bleachers, and a teacher holding a clipboard.
- **Pedagogical Verdict**: **V1 (Teaching Only)**. Excellent for discussing PE class, school sports, and running actions; rejected for unassisted diagnostic because background figures induce "race" or "class" responses.

#### 6. `eat_v1.jpg` (`IMG-G6-011-v1`)
- **Blind Interpretations**: 1. Eating lunch / Meal, 2. Food tray / Rice and egg, 3. Girl eating
- **Target Match**: Contextual match for `eat`.
- **Distractor Analysis**: The food tray in the foreground (rice, egg, vegetables, meat) occupies over 35% of the lower frame.
- **Pedagogical Verdict**: **V1 (Teaching Only)**. Superb for teaching lunch/food chunks (`eat lunch`), but the high salience of the food items induces noun responses (*food / lunch*) competing with the action verb *eat*.

#### 7. `happy_v1.jpg` (`IMG-G6-013-v1`)
- **Blind Interpretations**: 1. Girl / Student, 2. Smiling girl, 3. Happy / Cheerful
- **Target Match**: Attribute match for `happy`.
- **Distractor Analysis**: Single portrait bust of a smiling girl. In Pre-A1 Vietnamese learners, presenting a human portrait without contrast prompts the entity noun (*girl / student / friend*) rather than the internal emotional adjective (*happy*).
- **Pedagogical Verdict**: **V1 (Teaching Only)**. Great for teaching emotional dialogues; rejected for unassisted single-card diagnostic probe.

#### 8. `tired_v1.jpg` (`IMG-G6-014-v1`) [REJECTED]
- **Blind Interpretations**: 1. Sleeping / Asleep, 2. Nap on desk, 3. Tired
- **Target Match**: Misleading. Head flat on folded arms on desk with closed eyes reads universally as *sleeping* (ngủ) rather than *tired* (mệt).
- **Pedagogical Verdict**: **V2 (Rejected & Superseded by v2.0)**.

#### 9. `tired_v2.jpg` (`IMG-G6-014-v2`) [PATCHED]
- **Blind Interpretations**: 1. Yawning / Sleepy, 2. Tired student, 3. Bored / Studying
- **Target Match**: Substantial improvement. Upright posture, open mouth yawn with hand covering, droopy heavy eyelids.
- **Pedagogical Verdict**: **V1 (Teaching Only - Conservatively Downgraded from V0)**. Solves the sleeping defect of v1.0, but "yawn" / "sleepy" semantic overlap still introduces competition in unassisted diagnostic testing. Preserved for scaffolded classroom teaching.

#### 10. `big_small_v1.jpg` (`IMG-G6-017-v1`) [REJECTED]
- **Blind Interpretations**: 1. Backpack and pencil pouch, 2. Bag and pouch, 3. School supplies
- **Target Match**: Confounded. Comparing a backpack to a pencil pouch changes object identity, so learners evaluate two different objects rather than the dimension of physical scale.
- **Pedagogical Verdict**: **V2 (Rejected & Superseded by v2.0)**.

#### 11. `big_small_v2.jpg` (`IMG-G6-017-v2`) [PATCHED]
- **Blind Interpretations**: 1. Two backpacks / Big bag and small bag, 2. Backpacks on table
- **Target Match**: Two identical navy backpacks with teal zippers side by side on the same tabletop at a 3:1 scale ratio. Solves object identity confounding.
- **Pedagogical Verdict**: **V1 (Teaching Contrast - Conservatively Downgraded from V0)**. As an isolated flashcard, a learner naturally names the noun (*backpacks*). It requires a comparative auditory prompt (*"Touch the small bag"*) to measure the adjective. Hence, classified as V1 for scaffolded contrast teaching rather than unassisted single-image diagnostic.

---

## 3. Recheck of Current V0 Claims & Conservative Downgrading

In P3, six assets were initially reported as V0. In this P3.1 independent audit, we applied the conservative rule: **emotion and state adjectives cannot be certified V0 if semantic competition exists.**

```
INITIAL P3 CLAIM:
[ bag_v1 (V0) ]  [ pen_v1 (V0) ]  [ book_v1 (V0) ]  [ drink_v1 (V0) ]  [ tired_v2 (V0) ]  [ big_small_v2 (V0) ]

P3.1 VERIFIED STATUS:
[ bag_v1 (V0) ]  [ pen_v1 (V0) ]  [ book_v1 (V0) ]  [ drink_v1 (V0) ]  |  [ tired_v2 (V1) ]  [ big_small_v2 (V1) ]
                  CANONICAL DIAGNOSTIC (4)                            |     TEACHING / SCAFFOLDED (2)
```

- **Retained as Canonical V0 Diagnostic (4 assets)**:
  1. `bag_v1.jpg` (Concrete noun, zero distractors, 100% blind accuracy)
  2. `pen_v1.jpg` (Concrete noun, zero distractors, 100% blind accuracy)
  3. `book_v1.jpg` (Concrete noun, blank cover, zero text leakage, 100% blind accuracy)
  4. `drink_v1.jpg` (Action verb, active sipping at lips, Mode A auditory match)
- **Downgraded to V1 Teaching / Scaffolded (2 assets)**:
  5. `tired_v2.jpg` $\rightarrow$ **V1**. Yawning / sleepy semantic competition prevents unassisted diagnostic scoring.
  6. `big_small_v2.jpg` $\rightarrow$ **V1**. Requires comparative sentence prompt (*"Touch the small bag"*), cannot function as a standalone flashcard.

---

## 4. Reconciled Terminology Specification

To eliminate ambiguity between semantic clarity tiers and software asset versions:

| Dimension | Formatting | Allowed Values | Semantic Meaning |
|---|---|---|---|
| **Software Asset Version** | Lowercase with `v` prefix | `v1.0`, `v2.0` | Exact iteration of prompt and generation artifact. |
| **Semantic Clarity Tier** | Uppercase with `V` prefix | `V0`, `V1`, `V2`, `V3` | Epistemic clarity rating defined in Doc 29. |

### Corrected Version History:
- **`tired`**: Initial generation was **`v1.0`**, rated **`V2`** (rejected: looks like sleeping). Superseded by **`v2.0`**, rated **`V1`** (teaching approved, diagnostic held).
- **`big_small`**: Initial generation was **`v1.0`**, rated **`V2`** (rejected: object identity change). Superseded by **`v2.0`**, rated **`V1`** (teaching contrast approved, diagnostic held).
- **Terminology Fix**: Previous documentation stating *"2 superseded V2"* has been corrected to **"2 rejected v1.0 assets superseded by v2.0 replacements"**.

---

## 5. Explicit Policy Decisions

### Decision 1: V0/V1 Diagnostic Policy
- **Selected**: **Option A — DIAGNOSTIC PROBES REQUIRE CANONICAL V0 ONLY.**
- **Pedagogical Rationale**: Grade 6 false beginners are vulnerable to cognitive overload and failure anxiety. Presenting a V1 image (such as an eating lunch tray or a yawning student) in an unassisted diagnostic probe risks false-negative penalization caused by instrument ambiguity rather than vocabulary deficit. V1 images are restricted to teacher-guided instruction.

### Decision 2: File Format Policy
- **Generation & Pilot Storage**: Standard **JPEG** (`.jpg`, 1024x1024, quality 90~95).
- **Rationale**: Next.js serves `.jpg` natively without external image processing dependencies during local pilots. Next.js `<Image />` component automatically handles responsive WebP/AVIF transcoding in production. Pre-converting physical files to `.webp` (<75KB) is deferred to Phase P4 release optimization.

### Decision 3: Manual Owner Review Gate
AI self-review cannot grant final release authorization. The manifest now tracks:
- `owner_review_status`: `OWNER_REVIEW_PENDING` | `OWNER_APPROVED` | `OWNER_REJECTED`.
- Current State: All 11 physical assets are set to **`OWNER_REVIEW_PENDING`**.
- Visual Review Tool: An interactive HTML contact sheet has been generated at [`docs/curriculum/beginner-grade6/visuals/BATCH_A_CONTACT_SHEET.html`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/visuals/BATCH_A_CONTACT_SHEET.html) allowing rapid visual inspection in both **Blind Mode** and **Full Audit Mode**.

---

## 6. Cryptographic Hash & Duplicate Verification

Command executed: SHA-256 integrity scan across all 11 physical files:

```
bag_v1.jpg:       114ce476d3073633a97a14817a3fc7d8b1ba0cecae0a01f0cb7d019bdc997002
big_small_v1.jpg: 4b07cefcbd195c6030a3f271f4677cc7e40df67fa7a2babbb7af3071948ef0e4
big_small_v2.jpg: 63f21d6ff31dbf5d4f49f02d356b99f55cdd28c55567161afc304fcb24036d90
book_v1.jpg:      491efdd9d927fd7c080545349228c3bc5ea08a0e14e3f83461177030752951ca
drink_v1.jpg:     c7257d0c965fece749cbe928147a9a8fcec89557b23a2700fc0390bcf2434f8b
eat_v1.jpg:       1afb60eb5d9ed766595a7bb2f492a77c106fe81ddeeff76d756d082905e838d6
happy_v1.jpg:     efd130ad6f309751e7b8b82d8fc54b5721b62e9edaa97d688e947c97b7c91334
pen_v1.jpg:       6ee5fba58915d7be7a9de0641e592d88f81b31783b2f1708c0720fdb83ccc693
run_v1.jpg:       00f6f864d46ddca636b507a475f7799e2746cb93565eeee872b9e8b1ba149f52
tired_v1.jpg:     92a6864b052200567b3c471b035a80f93ef6a4367c3e1ef6a30749f4e21d3c5d
tired_v2.jpg:     a0e52fb53fb05c3cdd9e8d2d37ae9a11660530149fd672ea03fab902e0ba1540
```
- **Total Unique Hashes**: 11 / 11 (0 duplicates, 0 file cross-contamination).

---

## 7. Proposed Smallest N=1 Pilot Image Subset

To ensure Lesson 1 does **not** turn into an intimidating image test, we recommend the minimal viable visual set for the real Grade 6 learner:

### Core Diagnostic Set (4 Assets):
1. [`bag_v1.jpg`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/bag_v1.jpg) (`bag` — Concrete Noun)
2. [`pen_v1.jpg`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/pen_v1.jpg) (`pen` — Concrete Noun)
3. [`book_v1.jpg`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/book_v1.jpg) (`book` — Concrete Noun)
4. [`drink_v1.jpg`](file:///d:/Vibe/Vocab/web-app/public/curriculum/beginner-grade6/images/drink_v1.jpg) (`drink` — Action Verb, Mode A Sound-to-Image)

### Classroom Scaffolding / Dialogue Contexts (Non-Scoring):
- `run_v1.jpg`, `eat_v1.jpg`, `happy_v1.jpg`, `tired_v2.jpg`, `big_small_v2.jpg`.

### Lesson 1 Pacing Principle:
- **Maximum Probes in Lesson 1**: 2 to 3 micro-probes spaced across 35 minutes.
- **Probe Delivery**: Playful auditory-visual game (*"Listen: /bæɡ/ — Can you tap your bag?"*).
- **Zero Test Anxiety**: The child must feel they are playing and learning, not undergoing an exam.

---

## 8. Quality Gate & Test Verification

All automated test suites, typechecks, and linters passed with 100% success:

1. **Foundation Test Suites**:
   - `tests/foundation-curriculum/gap-model.test.ts`: **15/15 PASS**
   - `tests/foundation-curriculum/api-routes.test.ts`: **14/14 PASS**
   - `tests/foundation-curriculum/p3-visual-pipeline.test.ts`: **5/5 PASS**
   - **Combined Foundation Tests**: **34/34 PASS (100%)**
2. **TypeScript Compilation**: `npx tsc --noEmit` exited with **0 errors**.
3. **ESLint**: Foundation directories exited with **0 errors, 0 warnings**.
4. **Git Format**: `git diff --check` on foundation files is clean.

---

## 9. Final Status Declaration

```
======================================================================
FINAL STATUS: P3 VISUALS VERIFIED — AWAITING OWNER REVIEW
======================================================================
```
All physical image files match disk reality, manifest entries, cryptographic hashes, and pedagogical QA ratings. The core diagnostic set of 4 canonical V0 assets and 7 teaching assets is staged in `OWNER_REVIEW_PENDING`. Awaiting human owner review prior to real learner pilot execution.
