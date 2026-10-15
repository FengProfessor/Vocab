# 35. Teacher-Facing Vocabulary Gap Map Specification

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Approved Conceptual UX & Dashboard Specification  
> **Target User**: Human Teacher, ESL Tutor, or Diagnostic Facilitator  
> **Glanceability SLA**: Teacher understands student's lexical profile in $< 5\text{ seconds}$  

---

## 1. The Anti-Flattening Principle (No Reductive Single Scores)

Educational dashboards frequently commit the fatal error of flattening multi-dimensional human competence into a single arbitrary percentage:
$$\text{Vocabulary Mastery} = 63\% \quad \text{❌ (DESTRUCTIVE REDUCTION)}$$

### Why a Single Score Is Useless to a Teacher:
A score of $63\%$ tells the teacher nothing actionable:
- Does the child know 63 words out of 100?
- Or do they know 100 words in reading, but $0\%$ in listening?
- Or do they know all nouns, but zero functional verbs?
- Or did they fail because the app presented ambiguous illustrations?

### The Multi-Dimensional Profile Approach:
The **Teacher Vocabulary Gap Map** never displays an aggregated percentage as its primary interface. It presents an **inspectable diagnostic heat map** categorized by functional clusters and evidence dimensions.

---

## 2. Conceptual Dashboard Layout (Wireframe Specification)

```
========================================================================================
LINGOPRO TEACHER COCKPIT — STUDENT: NGUYEN HOANG NAM (GRADE 6) — ID: STU-G6-0842
Diagnostic Profile: Pre-A1 False Beginner | Current Unit: Stage 0 (Lesson 003)
========================================================================================

[ 1. GLANCEABLE HEALTH BAROMETER ]
----------------------------------------------------------------------------------------
● SOLID (Consolidated):      38 Items   [====================                  ] 29%
◐ PARTIAL (Asymmetric Gaps): 18 Items   [==========                            ] 14%
○ UNKNOWN (To Teach):        54 Items   [============================          ] 42%
? UNCERTAIN (Need Recheck):  20 Items   [==========                            ] 15%

PRIMARY DIAGNOSTIC SIGNAL:
⚠️ Severe Functional Imbalance: 82% of School Nouns are Solid, but only 12% of Core
   Action Verbs are known. Student cannot assemble sentences due to lack of verbs.
⚠️ Auditory Coda Gap: Text recognition is 40% higher than Spoken recognition.

========================================================================================
[ 2. CLUSTER BREAKDOWN & EVIDENCE MATRIX ]
========================================================================================

A. CORE ACTION VERBS (Critical Focus)
----------------------------------------------------------------------------------------
Lemma       Status       Sound   Text    Recall   Chunk    Identified Gap / Action
play        ● SOLID        ✓       ✓       ✓        ✓      Solid communicative use
like        ● SOLID        ✓       ✓       ✓        ✓      Anchors "I like [X]" chunk
eat         ◐ PARTIAL      ✓       ✓       ✗        ?      Recall Gap: Whisper drill needed
drink       ◐ PARTIAL      ?       ✓       ✗        ?      Sound Gap: Recheck coda /ŋk/
want        ○ UNKNOWN      ✗       ✗       ✗        ✗      Introduce in Lesson 4
need        ○ UNKNOWN      ✗       ✗       ✗        ✗      Introduce in Lesson 4
know        ○ UNKNOWN      ✗       ✗       ✗        ✗      Introduce via classroom routine
swim        ◐ PARTIAL      ✓       ✓       ✓        ✗      Chunk Gap: Freezes in "I can swim"
run         ● SOLID        ✓       ✓       ✓        ✓      Kinetic action secure

B. SCHOOL & STUDY NOUNS (High Competence Zone)
----------------------------------------------------------------------------------------
Lemma       Status       Sound   Text    Recall   Chunk    Identified Gap / Action
bag         ● SOLID        ✓       ✓       ✓        ✓      Ready as anchor object
pen         ● SOLID        ✓       ✓       ✓        ✓      Ready as anchor object
book        ● SOLID        ✓       ✓       ✓        ✓      Ready as anchor object
ruler       ● SOLID        ✓       ✓       ✓        ✓      Ready as anchor object
pencil      ◐ PARTIAL      ✓       ✓       ✗        ✓      Boundary: Confuses with pen in recall
rubber      ? UNCERTAIN    ?       ?       -        -      Receptive check scheduled L-005
desk        ● SOLID        ✓       ✓       ✓        ✓      Solid spatial reference
board       ○ UNKNOWN      ✗       ✗       ✗        ✗      Scheduled for L-012

C. FUNCTIONAL & QUESTION WORDS (Major Communicative Bottleneck)
----------------------------------------------------------------------------------------
Lemma       Status       Sound   Text    Recall   Chunk    Identified Gap / Action
what        ◐ PARTIAL      ✓       ✗       ✗        ?      Decoding Gap: Can hear, cannot read
where       ○ UNKNOWN      ✗       ✗       ✗        ✗      High-priority question gap
this        ◐ PARTIAL      ✓       ✓       ?        ✗      Deictic Gap: Distance confusion
that        ○ UNKNOWN      ✗       ✗       ✗        ✗      Paired contrast needed with 'this'
help        ◐ PARTIAL      ✓       ?       ✗        ✓      Routine intact ("Help me, please")
please      ● SOLID        ✓       ✓       ✓        ✓      Politeness routine established

========================================================================================
[ 3. PRESCRIPTIVE ACTION RECOMMENDATIONS FOR NEXT LESSON (LESSON 004) ]
========================================================================================

1. DO NOT RE-TEACH SCHOOL NOUNS:
   Nam already knows bag, pen, book, and desk. Using class time to drill these nouns
   will bore him. USE these known nouns as passive carriers for new verb practice.

2. TARGET HIGH-GENERATIVE VERBS ('want', 'need'):
   Nam's primary sentence-building barrier is lack of action verbs. Prioritize
   introducing "want" and "need" via two-panel situational pictures.

3. ARTICULATORY CODA FOCUS:
   Nam frequently drops final consonants (/k/ in 'drink', /t/ in 'what'). Use the
   "Puff of air" mnemonic during warm-up micro-probes.
========================================================================================
```

---

## 3. Data Contract & State Transitions

The Teacher Vocabulary Map operates on top of the Layer B telemetry engine:

### Status State Machine:
```
      [ PROBE RESPONSE ]
              │
              ├─► All Dimensions Pass (Sound ✓, Text ✓, Recall ✓) ─────► ● SOLID
              │
              ├─► Mixed Results (e.g. Text ✓, Sound ✗) ────────────────► ◐ PARTIAL
              │                                                          (Classified into Gap Type)
              │
              ├─► Zero Evidence / Failed All Probes ────────────────────► ○ UNKNOWN
              │
              ├─► Conflicting Evidence / Stale (>14 Days) ──────────────► ? UNCERTAIN
              │
              └─► Instrument Flaw Suspected ────────────────────────────► ⚠️ INSTRUMENT_FLAG
                                                                         (Excluded from Learner State)
```

---

## 4. Diagnostic Alerts & Heuristic Rules for Teachers

The dashboard applies automated pedagogical heuristics to alert the teacher to systemic patterns:

| Heuristic Trigger | System Diagnostic Alert | Actionable Teacher Guidance |
|---|---|---|
| **Verbs $\le 20\%$ & Nouns $\ge 70\%$** | `SEVERE_FUNCTIONAL_IMBALANCE` | "Stop teaching concrete nouns. Focus 100% of instruction on high-utility action verbs (`want`, `like`, `have`)." |
| **Sound Accuracy $\le$ Text Accuracy - 30%** | `AUDITORY_DECODING_DEFICIT` | "Student is reading English with Vietnamese phonology. Increase acoustic listening exposure and word-final coda practice." |
| **Text Accuracy $\le$ Sound Accuracy - 30%** | `ORTHOGRAPHIC_DECODING_DEFICIT`| "Student has good conversational ears (games/cartoons) but struggles to read sight words. Use tactile letter-tile dragging." |
| **Recall $\le 25\%$ & Recognition $\ge 80\%$** | `PASSIVE_ACTIVE_ASYMMETRY` | "Normal beginner profile. Do not force high-pressure oral testing. Use low-stakes whisper rehearsal and choral repetition." |
| **Latency $> 12\text{s}$ across all probes** | `FOREIGN_LANGUAGE_ANXIETY_FREEZE`| "Student is second-guessing from fear of making a mistake. Lower task stakes, praise effort, and provide immediate teacher scaffolding." |
