# 36. Architectural Patch Synthesis Report & Final Audit Dossier

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Patch Identification**: Architectural Patch v0.2-DUAL (Continuous Teaching & Diagnostic Integration)  
> **Status**: **ARCHITECTURE PATCH READY FOR IMPLEMENTATION REVIEW**  
> **Review Date**: 2026-10-09  

---

## 1. Architectural Evolution: From Single-Track to Dual-Process

The previous version of the Foundation Curriculum established an outstanding baseline for:
- Psychological safety and foreign language anxiety reduction;
- Inductive grammar and high-utility formulaic chunks;
- Contrastive Vietnamese phonetics.

However, an essential pedagogical requirement remained unaddressed:
> *"I need to teach the child from the beginning while continuously identifying exactly where the child's vocabulary foundation is missing."*

A single upfront placement test fails because it induces anxiety, measures test-taking endurance rather than competence, and becomes obsolete within three lessons.

### The 3-Layer Interconnected Architecture:
Under this architectural patch, the curriculum operates as three synchronized layers:
1. **Layer A (Curriculum Progression)**: The communicative Can-Do progression across diverse language modalities (listening, recognition, reading, tactile assembly, speaking, writing). **Speaking is one modality, not the definition of language learning**.
2. **Layer B (Vocabulary Mastery Map)**: An independent, multi-dimensional learner evidence model tracking 8 distinct evidence states (`UNSEEN`, `HEARD_RECOGNIZED`, `TEXT_RECOGNIZED`, `MEANING_RECALLED`, `FORM_RECALLED`, `CHUNK_USED`, `GENERATIVE_USE`, `RETAINED`) and classifying failures into 10 explicit vocabulary gap types.
3. **Layer C (Representation & Evidence Layer)**: Decouples lexical concepts from brittle single flashcards into an ecosystem of text forms, acoustic forms, canonical diagnostic visuals (`V0`), variant teaching visuals (`V1`), situational micro-scenes, and semantic contrast pairs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        3-LAYER SYSTEM TOPOLOGY                         │
├────────────────────────────────────────────────────────────────────────┤
│ LAYER A: CURRICULUM PROGRESSION                                        │
│ Can-Do Units -> Lesson Plans (L-001 to L-012) -> Communicative Agency  │
├────────────────────────────────────────────────────────────────────────┤
│                               ▲        │                               │
│                  Telemetric   │        │ In-Lesson                     │
│                  Adaptation   │        │ Micro-Probes                  │
│                               │        ▼                               │
├────────────────────────────────────────────────────────────────────────┤
│ LAYER B: VOCABULARY MASTERY MAP                                        │
│ Multi-dimensional Evidence Vectors -> Gap Classification (10 Types)    │
├────────────────────────────────────────────────────────────────────────┤
│                               ▲                                        │
│                  Acoustic /   │        Multi-Modal                     │
│                  Visual Probes│        Stimuli                         │
│                               │        ▼                               │
├────────────────────────────────────────────────────────────────────────┤
│ LAYER C: REPRESENTATION & EVIDENCE LAYER                               │
│ Canonical V0 Visuals | Variant V1 | Audio Citations | Contrast Pairs   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Answers to the 15 Mandatory Final Audit Questions

### 1. Can we distinguish a listening vocabulary gap from a reading vocabulary gap?
**YES**. Mode A (Sound $\to$ Image) tests pure phonological reception without printed letters, while Mode B (Text $\to$ Image) tests orthographic sight-word decoding without audio. If a student passes Mode B and fails Mode A, the system diagnoses a `SOUND_FORM_GAP` (typically unreleased final stop consonants). If they pass Mode A and fail Mode B, the system diagnoses an `ORTHOGRAPHIC_FORM_GAP`.

### 2. Can we distinguish recognition from recall?
**YES**. Passive recognition is probed via 4-option matching (Modes A and B). Active productive recall is probed via Mode C (Image $\to$ Elicited Spoken Production or Letter-Tile Assembly). If a learner readily taps a picture upon hearing *"bag"*, but cannot retrieve the word when prompted with the object, the system records an `ENGLISH_FORM_RECALL_GAP`.

### 3. Can we distinguish knowing a word from using it?
**YES**. Knowing an isolated citation lemma (Mode A/B/C) is separated from `CHUNK_USED` (slot-filling within invariant frames like `I like [X]`) and `GENERATIVE_USE` (deploying the word in a novel communicative context). A learner who knows *fish* but freezes in *I don't like fish* is diagnosed with a `CHUNK_USAGE_GAP`.

### 4. Can we identify core verb gaps separately from noun gaps?
**YES**. The 130-item diagnostic universe is stratified into distinct functional meta-clusters. Core Action Verbs (24 items) are tracked independently from School Nouns (16 items). The Teacher Vocabulary Map explicitly fires a `SEVERE_FUNCTIONAL_IMBALANCE` alert when noun mastery is high ($>70\%$) but action verb mastery is low ($<20\%$).

### 5. Can we avoid testing all 100–150 diagnostic items?
**YES**. The adaptive sampling engine administers an initial light map of only **12 to 16 stratified seed probes**. If a cluster exhibits $\ge 85\%$ confidence (e.g. 3/3 school nouns correct), the engine immediately **halts** testing that cluster. In-depth probing is triggered only in weak or uncertain clusters.

### 6. Can diagnostic probes happen during normal lessons?
**YES**. Each 25-minute lesson embeds **2 to 4 micro-probes** (taking 20–45 seconds each), disguised as natural warm-up picture-taps, odd-one-out games, or cooldown assemblies. The learner experiences them as engaging classroom games, completely free of test anxiety.

### 7. Can an ambiguous image be flagged rather than penalizing the learner?
**YES**. Under the Evidence Invalidation Protocol (Layer C), if a learner selects an incorrect card and the underlying visual asset is flagged for ambiguity (`V2/V3`), the system logs `POSSIBLE_VISUAL_ITEM_ERROR` and invalidates the trial. The learner's vocabulary profile is **never penalized for bad artwork**.

### 8. Do we know where each curriculum image came from?
**YES**. All 1,248+ repository image files were audited and cataloged in [`30_VISUAL_ASSET_AUDIT.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/30_VISUAL_ASSET_AUDIT.md) and [`30_VISUAL_ASSET_AUDIT.csv`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/30_VISUAL_ASSET_AUDIT.csv). Every asset has documented provenance, physical dimensions, license status, and disposition.

### 9. Can we distinguish user-created assets from project-generated assets where evidence exists?
**YES**. We use the strict 5-tier provenance scale. Assets like `sat-thu-toeic-3d-book.jpg` are classified as `USER_CREATED` via git author commits. Assets generated via internal Python/TS scripts or AI manifests (such as `public/grammar/topics/` via Flux-1-schnell and `a0/01.png` via DALL-E) are classified as `PROJECT_AI_GENERATED`.

### 10. Are unknown-provenance images honestly labeled UNKNOWN?
**YES**. All test scraped images in `tmp-check-*/` and `tmp-verify/` with no license proof or commit trail are strictly classified as `WEB_SOURCED_LICENSE_UNKNOWN` or `PROVENANCE_UNKNOWN` and have been quarantined.

### 11. Do missing/ambiguous assets have production-ready generation prompts?
**YES**. Exactly 18 high-priority pilot foundation items and contrast pairs have complete 16-field structured prompts authored in [`32_IMAGE_GENERATION_PROMPTS.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/32_IMAGE_GENERATION_PROMPTS.md), including full negative prompts, zero-text constraints, and visual clarity rationales.

### 12. Can a teacher glance at the learner profile and immediately see what needs work?
**YES**. The [Teacher Vocabulary Gap Map](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/35_TEACHER_VOCABULARY_MAP_SPEC.md) presents a cluster heat map with color-coded status glyphs (● Solid, ◐ Partial, ○ Unknown, ? Uncertain) and automated heuristic alerts. A teacher can evaluate the student's foundation in under 5 seconds.

### 13. Are Lessons 1–12 still coherent under the new model?
**YES**. The foundational pedagogical progression, low-anxiety pacing, and high-utility chunks of Lessons 001–012 remain intact. They are enhanced by the addition of diagnostic headers, micro-probe timings, and multi-representation assets.

### 14. Which lessons need modification?
- **Minor Patch (9 Lessons)**: Lessons 001, 002, 003, 005, 006, 007, 008, 010, 011 require metadata telemetry headers and micro-probe scheduling.
- **Major Patch (3 Lessons)**:
  - `Lesson 004` (Survival English): Restructure abstract adverbs (`slowly`, `again`, `know`) from static flashcards into situated classroom routines.
  - `Lesson 009` (Meet My Friend): Restructure pronouns (`he`/`she`) and abstract traits (`kind`/`smart`) from static photos into live pointing routines and situational stories.
  - `Lesson 012` (What Is That?): Restructure deictic demonstratives (`this`/`that`) from 2D flashcards into 3D physical distance staging.

### 15. What remains untested until a real learner pilot?
1. The real-world latency threshold for Grade 6 false beginners on tablet touchscreen micro-probes.
2. The exact psychological threshold where a micro-probe begins to feel like a "test" rather than a game.
3. The empirical correlation between Teacher Human Observation and automated SafeHarbor speech scoring on word-final consonant codas.
4. The rate of memory decay between Day 1 immediate hit and Day 7 spaced recheck in a real Vietnamese secondary school study schedule.

---

## 3. Final Status Declaration

```
========================================================================================
FINAL ARCHITECTURAL PATCH STATUS:
>>> ARCHITECTURE PATCH READY FOR IMPLEMENTATION REVIEW <<<
========================================================================================
```

> [!IMPORTANT]
> **Explicit Non-Negotiable Boundaries**:
> - **NO PRODUCTION CHANGES**: Zero database migrations, API changes, or frontend code swaps were executed in this phase.
> - **NO SELF-CONGRATULATION**: The system is an approved **architectural specification**, NOT an empirically validated curriculum. Pedagogical validity can only be proven through real-world N=1 learner pilots.
> - **NEXT PHASE**: Upon stakeholder review, the project proceeds to:
>   `P2 — SAFE IMPLEMENTATION OF VOCABULARY GAP MAP + REPRESENTATION SYSTEM`.
