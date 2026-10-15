# 18. LingoPro Architectural Integration & 3-Phase Pilot Implementation Plan

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Authors**: LingoPro Product/Data Engineer (Role J), Curriculum Architect (Role A), Synthesis Lead (Role L)  
> **Golden Principle**: **PILOT BEFORE SCALE. NEVER MASS-GENERATE CONTENT OR DEPLOY SCALED RELEASES BEFORE EMPIRICAL EVIDENCE IS CAPTURED FROM REAL HUMAN LEARNERS.**

---

## 1. Zero-Disruption Architectural Integration

The Foundation Curriculum integrates into LingoPro's existing codebase strictly following our **Additive Non-Destructive Engineering Principles**:

```
                                  ┌───────────────────────────────┐
                                  │      LingoPro Client App      │
                                  └──────────────┬────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
    ┌──────────────────────────────┐                            ┌──────────────────────────────┐
    │ Existing Tracks (PRESERVED)  │                            │ NEW FOUNDATION TRACK         │
    │ - 'cefr' (A0-B2 Adult/Gen)   │                            │ - Track ID: 'grade6-fdn'     │
    │ - 'thpt' (Lớp 10-12)         │                            │ - 42 Mastery Units           │
    │ - 'toeic' (450-800)          │                            │ - Stages 0 to 6              │
    └──────────────┬───────────────┘                            └──────────────┬───────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │   Existing DB Tables (NO DDL) │
                                  │   - public.user_roadmap       │
                                  │   - public.user_roadmap_steps │
                                  │   - public.srs_progress       │
                                  └───────────────────────────────┘
```

### Technical Integration Details:
1. **Zero Database Migrations Required**:
   - `public.user_roadmap` stores `track: text` and `level_id: text`. A student enrolled in this curriculum will simply have `track = 'grade6-fdn'` and `level_id = 'stage-0'`.
   - `public.user_roadmap_steps` stores `(user_id, step_id, status, score)`. Step IDs follow the convention `step-g6fdn-l001` through `step-g6fdn-l042`.
2. **Deterministic Static Data Assets**:
   - Stored in `src/data/curriculum/grade6-foundation/`:
     - `catalog-v1.json`: The complete 42-unit structural catalog.
     - `core-lexicon.json`: 200 productive items + IPA + audio bindings.
     - `core-chunks.json`: 35 invariant formulaic frames.
3. **Module Registration in `src/lib/roadmap.ts`**:
   - Register `'grade6-fdn'` in `RoadmapTrack` type.
   - Register stages `'stage-0'` through `'stage-6'` in `RoadmapLevelId`.
   - Backward compatibility guarantee: zero impact on existing TOEIC, THPT, or CEFR learners.

---

## 2. The 3-Phase Empirical Pilot Protocol

We strictly reject the industry anti-pattern of generating 1,000 lessons and releasing them blindly. We mandate a rigorous 3-stage validation pipeline:

```
[PHASE 1: N = 1 SINGLE-LEARNER PROBE]
├── Cohort: 1 Vietnamese 6th grader matching Persona A ("Minh")
├── Scope: Lessons 001 to 006 (Stage 0)
├── Methodology: Direct ethnographic observation, screen recording, biometric voice analysis
└── Exit Gate: Learner voluntarily speaks 3 personal sentences without anxiety.
         │
         ▼ (PASS)
[PHASE 2: N = 10 MICRO-COHORT LAB]
├── Cohort: 10 Grade 6 students across Personas A, B, and C
├── Scope: Lessons 001 to 012 (Stages 0 & 1)
├── Methodology: Classroom observation, teacher prompt ratio tracking, 7-day FSRS audit
└── Exit Gate: ≥ 85% complete all 12 lessons; ≥ 80% FSRS retention after 7 days.
         │
         ▼ (PASS)
[PHASE 3: N = 50 CONTROLLED CLASSROOM PILOT]
├── Cohort: 2 secondary school classes (1 pilot class, 1 control class)
├── Scope: Lessons 001 to 042 (Full Foundation & School Bridge)
├── Methodology: Periodic 15-minute school test comparison; longitudinal affective tracking
└── Exit Gate: Pilot class achieves ≥ 1.5-point higher average on school midterm exam.
```

---

## 3. Empirical Pilot Observation Metrics

During the pilot, the following learning-first metrics outrank vanity engagement numbers (clicks, streaks, XP):

| Metric Category | Observable Instrument | Target Benchmark | Failing Indicator (Triggers Redesign) |
|---|---|---|---|
| **A. Affective Safety** | 3-point emoji mood rating before and after each session. | $\ge 90\%$ report "Comfortable / Happy" after lesson. | $> 15\%$ report "Anxious / Frustrated" after session. |
| **B. Response Latency** | Milliseconds from visual prompt display to initial speech/chip action. | Mean latency $< 3.5$ seconds by Lesson 004. | Mean latency $> 8.0$ seconds (signals cognitive freeze). |
| **C. Pronunciation Intelligibility** | SafeHarbor speech matching engine score. | Mean match $\ge 75\%$ on target final consonants (/s, z, t, k/). | Mean match $< 60\%$ (signals swallowed sounds). |
| **D. Teacher Prompting Ratio** | Number of teacher hints required per student utterance. | Drops from $1.8$ hints (L-001) to $< 0.3$ hints (L-006). | Student requires continuous verbal prompting to proceed. |
| **E. Voluntary Oral Output** | Count of unprompted conversational utterances during communicative task. | $\ge 2$ spontaneous utterances per session. | Complete silence unless directly prompted. |
| **F. 7-Day Delayed Retention** | Unannounced FSRS retrieval pass 7 days after initial lesson. | $\ge 85\%$ accuracy on core chunks. | $< 70\%$ retention (signals premature pacing). |
| **G. School Bridge Transfer** | Score on simulated 15-minute Grade 6 school test. | $\ge 7.0 / 10$ average score. | $< 5.0 / 10$ average score. |

---

## 4. Definition of Done (DoD) Checklist

The foundational curriculum is certified **DONE** when and only when all following criteria are satisfied:

- [x] **Repo Forensics Complete**: `REPO_PEDAGOGY_AUDIT.md` produced and verified against live codebase.
- [x] **Research Basis Grounded**: `01_RESEARCH_EVIDENCE.md` cites peer-reviewed SLA, cognitive psychology, and MOET specs.
- [x] **Learner Model Established**: `02_LEARNER_PROFILE.md` and `03_DIAGNOSTIC.md` operationalize low-stakes intake.
- [x] **Pedagogical Core Defined**: `04_PEDAGOGICAL_PRINCIPLES.md` details the 10-step sequence and Confidence Ladder.
- [x] **Competency Framework Formalized**: `05_CAN_DO_FRAMEWORK.md` maps all 42 observable outcomes.
- [x] **Scope & Sequence Established**: `06_SCOPE_AND_SEQUENCE.md` maps lessons, vocabulary load, and pacing.
- [x] **Sub-Systems Engineered**: Vocabulary (07), Grammar (08), Pronunciation (09), Review (10), Mastery (11).
- [x] **Operational Guides Produced**: Lesson Template (12), School Bridge (13), Style Guide (14), Teacher Guide (15), Parent Guide (16).
- [x] **Adversarial Red-Team Certified**: `17_RED_TEAM_REPORT.md` remediates 25 failure modes and validates 3 personas.
- [x] **First 12 Lessons Executable**: Full lesson plans `lesson-001.md` through `lesson-012.md` written in complete detail.
- [x] **Machine-Readable Datasets Created**: `core-lexicon.csv`, `core-chunks.csv`, `can-do-map.csv` validated for schema and zero placeholders.
- [x] **Pedagogical Manifesto Enforced**: `docs/pedagogy/BEGINNER_LEARNING_RULES.md` permanently records MUST/NEVER rules for future AI agents.

---
*Implementation & Pilot Architecture Certified by Role J (Data Engineer) & Role L (Synthesis Lead).*
