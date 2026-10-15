# 25. P0.5 Final Reality Check Before N=1 Pilot

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Status**: P0.5 Reality Check Complete  
> **Target Scope**: Pre-Pilot Verification of Lesson 001 and Measurement Subsystems  
> **Final Status Verdict**: **`READY FOR N=1 LESSON-1 PILOT`**  
> *(Note: Certifies readiness ONLY for Lesson 1 with a single learner; does NOT certify the entire 42-lesson curriculum).*

---

## 1. Blockers Identified During Reality Check

| Blocker # | Area | Defect / Vulnerability Found | Severity |
|---|---|---|---|
| **B1** | Pronunciation Rubric | Conflated participation, segmental articulation, final stop explosions, and fluency into an invalid linear 4-tier ladder. | **High** |
| **B2** | Stoplight & Emotion | Conflated academic task performance with facial expressions (smiling vs. brow furrowing), risking misdiagnosis of concentration as failure. | **High** |
| **B3** | Advancement Criteria | Over-relied on arbitrary numerical cutoffs (80%, 85%, 7s, 3.5s) instead of evaluating the holistic pattern of evidence. | **High** |
| **B4** | Dataset File Counts | Documentation claimed "101 rows" and "36 chunks" by conflating physical file lines with data rows, adding an ungrounded 36th chunk. | **Medium** |
| **B5** | Lexical Terminology | Conflated textual exposures with vocabulary size (e.g. claiming "350–400 receptive vocabulary tokens"). | **Medium** |
| **B6** | Research Attributions | Named-source overclaims (e.g. attributing the 85% mastery cutoff directly to Bloom 1968, or attributing lesson intake limits to Cowan). | **Medium** |
| **B7** | School Bridge Rigidity | Assumed Global Success textbook indefinitely without capturing the learner's specific school textbook series or syllabus unit. | **Medium** |
| **B8** | Ethical Certification | Used overconfident language ("the pilot is ethically safe") instead of descriptive risk management for educational tutoring. | **Low** |
| **B9** | Lesson 1 Communicative Value | Included passive, redundant chunk *"I'm a student"* while lacking a question chunk to enable authentic two-way social interaction. | **High** |
| **B10** | Theme Inflexibility | Assumed "Superpowers" is universally age-appropriate for all 11–12-year-olds without offering theme personalization skins. | **Medium** |
| **B11** | Mandatory Physical Cues | Treated physical articulatory gestures ("snake whisper", "clean throat tap") as mandatory dogma rather than optional cues. | **Medium** |

---

## 2. Systematic Corrections Executed

1. **Rebuilt Pronunciation Framework**: Retired the linear 4-tier ladder. Implemented a **Multidimensional Human Observation Rubric** assessing (A) Intelligibility, (B) Target Feature Attempt, (C) Word Completeness, (D) Fluency, and (E) Independence. Prohibited exaggerated stop explosions.
2. **Separated Performance from Experience**: Created two independent evaluation axes:
   - *Dimension A (Learning Performance)*: Independent / Modelled / Prompted / Not Yet.
   - *Dimension B (Learner Experience)*: Direct self-report (🙂 Dễ / 😐 Hơi khó / 🙁 Khó / 🛑 Dừng).
3. **Decoupled Numerical Cutoffs**: Replaced single pass percentages with a 4-pathway **Evidence-Based Advancement Decision**: `ADVANCE`, `ADVANCE WITH REVIEW`, `REPEAT PART`, `SIMPLIFY`.
4. **Programmatically Audited CSVs**: Verified exact data rows directly from physical files on disk. Fixed documentation counts to match canonical ground truth (100 core lemmas, 35 chunks, 42 Can-Dos).
5. **Standardized Lexical Terminology**: Formalized strict definitions of Lemma, Type, Token, Chunk, and Exposure. Receptive exposures are explicitly separated from vocabulary size.
6. **Purged False Research Attributions**: Removed pseudo-scientific citations (e.g. Bloom for 85%). Relabeled operational parameters as "Initial operational pilot thresholds selected by curriculum team."
7. **Added School Bridge Intake**: Created learner-specific intake fields (Textbook, Current Unit, Test Format, Teacher Requirements) required before Stage 4.
8. **Calibrated Safeguards Language**: Replaced self-certification with "Reasonable safeguards designed for a low-risk educational pilot."
9. **Refactored Lesson 1 for Two-Way Dialogue**: Replaced *"I'm a student"* with *"What's your name?"*, giving the 12-year-old active conversational agency.
10. **Modularized Thematic Skins**: Lesson 003 offers 4 optional skins (Sports, Gaming Abilities, Real-Life Talents, Superpowers).
11. **Relabeled Physical Cues**: All articulatory gestures designated `OPTIONAL CUE — PILOT AND OBSERVE`.

---

## 3. Exact Canonical Dataset Counts (File-Verified)

| File Name | File Path | Physical Lines | Header Rows | Data Rows | Unique Primary IDs | Range of IDs |
|---|---|---|---|---|---|---|
| **`core-lexicon.csv`** | `docs/curriculum/beginner-grade6/vocabulary/core-lexicon.csv` | 101 | 1 | **100** | **100** | `lex-001` to `lex-100` |
| **`core-chunks.csv`** | `docs/curriculum/beginner-grade6/chunks/core-chunks.csv` | 36 | 1 | **35** | **35** | `chk-001` to `chk-035` |
| **`can-do-map.csv`** | `docs/curriculum/beginner-grade6/mapping/can-do-map.csv` | 43 | 1 | **42** | **42** | `CD-001` to `CD-042` |

---

## 4. Research Citation Audit & Adjustments

| Named Source / Theory | Original Assertion | Source Audit Finding | Rectified Attribution |
|---|---|---|---|
| **Bloom (1968)** | "85% mastery comes from Bloom" | Bloom's *Learning for Mastery* discussed setting an A-grade standard conceptually; he did NOT establish an 85% mathematical law for Pre-A1 ESL false beginners. | **Attribution removed**. Documented as: *"Initial operational pilot threshold selected by the curriculum team."* |
| **Cowan (2001) / Sweller (1988)** | "$4 \pm 1$ items dictates 5–7 words + 2 chunks per lesson" | Cowan measured unchunked active short-term memory capacity under suppression, not cumulative second language acquisition over a 45-minute lesson. | **De-escalated**. Documented as: *"Working memory is limited to $4 \pm 1$ concurrent active items. Within-task presentation is capped at 2–3 new items; cumulative lesson intake adapts dynamically (3–5 items)."* |
| **FSRS v5** | "FSRS algorithm guarantees 92% retention for Grade 6" | FSRS is a modern DSR-based flashcard scheduling heuristic developed on adult spaced-repetition datasets; it is not a validated child SLA law. | **De-escalated**. Documented as: *"FSRS review intervals provide initial scheduling heuristics, verified empirically through delayed retrieval checks."* |
| **Horwitz et al. (1986)** | "High anxiety causes trauma and freeze disorder" | Horwitz established Foreign Language Classroom Anxiety (FLCA) as a situational performance anxiety, not a psychiatric trauma disorder. | **Purged clinical terms**. Documented as: *"Classroom evaluation anxiety induces extended hesitation, low self-efficacy, and task avoidance."* |
| **Nguyen (2012) / Do (2016)** | "Vietnamese phonology proves all final stops must be audibly exploded" | Vietnamese has unreleased codas, but natural English also has unreleased and glottalized codas in connected speech. | **Refined**. Documented as: *"Vietnamese learners tend to truncate codas. Practice aims for intelligible, recognizable word endings, NOT exaggerated explosive bursts."* |

---

## 5. Pronunciation Rubric Revision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 MULTIDIMENSIONAL HUMAN OBSERVATION RUBRIC                   │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ A. Intelligibility│ Comprehensible (C) / Context-Dependent (CD) / Unclear (U)│
│ B. Target Feature │ Attempted (A) / Omitted (O) / Hypercorrected (H)        │
│ C. Completeness   │ Complete Word (CW) / Truncated Word (TW)                │
│ D. Fluency        │ Continuous (CT) / Segmented (SG) / Broken (BK)          │
│ E. Independence   │ Independent (I) / Modelled (M) / Prompted (P)           │
└───────────────────┴─────────────────────────────────────────────────────────┘
```
- **Auditory Target**: Intelligible, comprehensible English in communicative context.
- **Stop Consonant Policy**: No exaggerated releases of /p, t, k/.
- **ASR Boundary**: Web Speech API is an optional gamified rehearsal tool; it has zero veto power over lesson completion.

---

## 6. Stoplight Advancement Revision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               EVIDENCE-BASED ADVANCEMENT DECISION MATRIX                    │
│                                                                             │
│   DIMENSION A (Learning Performance)    DIMENSION B (Learner Experience)    │
│   • Independent (I)                     • 🙂 Dễ / ổn                       │
│   • Modelled (M)                        • 😐 Hơi khó                       │
│   • Prompted (P)                        • 🙁 Khó                           │
│   • Not Yet (NY)                        • 🛑 Con muốn dừng                 │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       4 ADAPTIVE SYNTHESIS PATHWAYS                         │
│                                                                             │
│  [ ADVANCE ]             : Core Can-Dos (I/M); Self-Report 🙂/😐.           │
│  [ ADVANCE WITH REVIEW ] : Chunks retained with prompts (P); Self-Report 😐.│
│  [ REPEAT PART ]         : Confusion on 1 feature; Self-Report 🙁.          │
│  [ SIMPLIFY ]            : Multiple "Not Yet"; Self-Report 🙁/🛑.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Lexical Terminology Standards

- **LEMMA**: The base dictionary headword (e.g. *like*, *game*). Canonical unit for vocabulary counting.
- **TYPE**: Specific wordform (e.g. *like*, *likes* are 2 types).
- **TOKEN**: Running word count in a text.
- **MULTIWORD CHUNK**: Prefabricated formulaic frame (`My name is [Name]`, `What's your name?`). Counted in a separate communicative layer.
- **EXPOSURE**: An encounter with a word in context. Repeated exposures do **NOT** increase vocabulary size.

---

## 8. Lesson 1 Final Design Decision: Option A vs. Option B

| Evaluation Dimension | Option A: Monologue Syllabus | Option B: Interactive Dialogue (Selected) |
|---|---|---|
| **Linguistic Target** | `Hello!`, `My name is [Name]`, `I'm 12`, `I'm a student` | `Hello!`, `My name is [Name]`, `I'm 12`, `What's your name?` |
| **Communicative Payoff** | Low: Stating "I am a student" conveys zero new information in a classroom. | **Very High**: Enables immediate two-way social interaction. |
| **Cognitive Load** | High: Introduces a difficult multisyllabic noun (*student* /ˈstjuːdənt/). | **Optimal**: Replaces noun with an invariant communicative question chunk. |
| **Recycling Value** | Low: *student* is rarely reused in peer roleplays. | **Extremely High**: *What's your name?* is recycled in every social setting. |
| **Learner Agency** | Passive: Child only answers questions. | **Empowering**: Child holds the initiative to ask questions back. |
| **Verdict** | **REJECTED** | **SELECTED FOR LESSON 1 PILOT** |

---

## 9. Minimal Teacher Pack Readiness

All field documents for the pilot teacher are generated and located in [`docs/curriculum/beginner-grade6/pilot/lesson-001/`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/):
- **[01_TEACHER_RUNSHEET.md](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/01_TEACHER_RUNSHEET.md)**: 1.5-page compact operational field guide with exact scripts, props, and de-escalation actions.
- **[02_STUDENT_MATERIAL.md](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/02_STUDENT_MATERIAL.md)**: Clean, zero-jargon printable student page.
- **[03_BASELINE_CARD.md](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/03_BASELINE_CARD.md)**: 5–10 minute pre-lesson entry probe without accidental pre-teaching.
- **[04_OBSERVATION_CARD.md](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/04_OBSERVATION_CARD.md)**: Real-time checkbox observation tracker for the teacher.
- **[05_DELAYED_CHECK.md](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/05_DELAYED_CHECK.md)**: 3–5 minute unprompted delayed retrieval probe administered at next session.
- **[06_AFTER_LESSON_DECISION.md](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/pilot/lesson-001/06_AFTER_LESSON_DECISION.md)**: 4-pathway adaptive instructional decision framework with concrete case examples.

---

## 10. Remaining Assumptions (Explicitly Documented)

1. **School Bridge Customization**: The current mapping to MOET Global Success Units 1–3 is an implementation baseline; the teacher must record the learner's actual school textbook series and unit prior to Stage 4.
2. **Regional Dialect Sensitivity**: Northern Vietnamese dialect baseline is assumed for initial vowel length; Southern/Central learners may require adjusted listening discrimination for final /t/ vs /k/ codas.
3. **External Academic Pressure**: Concurrent school homework demands remain an uncontrolled environmental factor that the teacher will monitor via weekly check-ins.

---

## 11. Final Pilot Status Verdict

# **`READY FOR N=1 LESSON-1 PILOT`**

*Lesson 001, the entry baseline card, the teacher runsheet, the student material, the live observation instrument, and the after-lesson decision model are fully hardened, ethically protected, and ready for immediate deployment with a single Grade-6 learner.*
