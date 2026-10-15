# 07. Lexical Architecture & Vocabulary Engineering

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Authors**: Vocabulary & Phrase Specialist (Role F), Young Learner ESL Specialist (Role B), Synthesis Lead (Role L)  
> **Core Axiom**: **DO NOT BUILD A "BEGINNER 3,000 WORDS" MONOLITH. A child who knows 20 high-generative words and 10 invariant frames can communicate more than a child who memorized 500 isolated nouns.**

---

## 1. The Multi-Tier Lexical Architecture

Rather than treating vocabulary as an undifferentiated flat list of headwords, LingoPro categorizes vocabulary into 8 functional tiers:

```
                               ┌────────────────────────────────┐
                               │  TIER 1: FORMULAIC CHUNKS (35) │ (e.g. "I like...", "Can I have...")
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
┌──────────────────────────────┐                               ┌──────────────────────────────┐
│  TIER 2: HIGH-UTILITY VERBS  │ (25 Core Verbs)               │  TIER 3: SURVIVAL ARSENAL    │ (15 Classroom Phrases)
│  (like, have, play, want...) │                               │  ("Can you help me?", etc.)  │
└──────────────┬───────────────┘                               └──────────────┬───────────────┘
               │                                                              │
               └───────────────────────────────┬──────────────────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │ TIER 4: ANCHOR NOUNS (120)     │ (School, sports, room, food)
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │ TIER 5: DESCRIPTIVE ADJS (30)  │ (big, small, blue, happy)
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │ TIER 6: SPATIAL/TIME PREPS (15)│ (on, in, under, at, on Monday)
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │ TIER 7: CONNECTORS & DISCOURSE │ (and, but, because, first, then)
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │ TIER 8: RECEPTIVE INPUT TOKENS │ (Identified in listening/reading)
                               └────────────────────────────────┘
```

---

## 2. Mathematical Lexical Selection: The LingoPro Utility Index (LUI)

Every candidate word is evaluated through a strict multi-factor mathematical formula before admission into the Foundation Lexicon:

$$\mathbf{LUI} = \mathbf{U} \times \mathbf{A} \times \mathbf{G} \times \mathbf{F} \times \mathbf{T} \times \mathbf{R}$$

Where each factor is scored from 1 to 5:
- **$\mathbf{U}$ (Communicative Utility)**: Does this word solve an immediate real-life conversational need for an 11–12-year-old? (e.g., `help` = 5, `giraffe` = 1).
- **$\mathbf{A}$ (Age Relevance)**: Does it belong in the daily reality of a secondary school student? (e.g., `backpack` = 5, `briefcase` = 1, `diaper` = 1).
- **$\mathbf{G}$ (Generative Combinability)**: How many natural sentences can be formed by combining this word with other known items? (e.g., `like` generates 100+ sentences = 5; `ruler` generates 2 sentences = 2).
- **$\mathbf{F}$ (Frequency in Corpus & School Textbook)**: How frequently does it appear in MOET Global Success Units 1–3 and Cambridge Young Learners? (e.g., `play` = 5, `yacht` = 1).
- **$\mathbf{T}$ (Teachability & Concreteness)**: Can it be demonstrated through simple gestures, pictures, or tactile objects without a 5-minute abstract explanation? (e.g., `run` = 5, `justice` = 1).
- **$\mathbf{R}$ (Cross-Topic Recycling)**: Can this word reappear across multiple subsequent topics? (e.g., `have` appears in family, pets, school bags, meals = 5).

### Concrete Comparison:
- Word **"LIKE"**: $U(5) \times A(5) \times G(5) \times F(5) \times T(5) \times R(5) = \mathbf{15,625}$ $\rightarrow$ **Taught in Lesson 002**.
- Word **"TIGER"**: $U(2) \times A(3) \times G(1) \times F(2) \times T(4) \times R(1) = \mathbf{48}$ $\rightarrow$ **Deferred to secondary animal expansion**.

---

## 3. Productive vs. Receptive Lexicon Scope & Counting Rules

A critical error of traditional syllabi is demanding $100\%$ active recall for every single word introduced. LingoPro maintains a strict distinction and explicit counting methodology (detailed in `20_LEXICAL_COUNTING_SPEC.md`):

| Dimension | Receptive Lexicon (Listening & Reading) | Productive Lexicon (Speaking & Writing) |
|---|---|---|
| **Definition** | Words the student can comprehend when heard or read with visual/contextual support. | Words the student can autonomously retrieve, pronounce, and assemble into original sentences. |
| **Counting Unit** | Contextual Word Tokens / Sight Words. | **Base Lemmas (Headwords)**. Inflections (`-s`, `-ed`, `-ing`) do NOT inflate count. |
| **P0 Pilot Dataset Seed** | ~50 contextual exposures in listening dialogues. | **100 Core Lemmas** in `core-lexicon.csv` (14 active lemmas in Lessons 1–3). |
| **Full 42-Lesson Curriculum** | **Contextual exposures** across stories | **180–220 Core Lemmas + 35 Invariant Chunks** |
| **Initial Intake Per Lesson** | 4–6 items exposed in listening stories. | **Adaptive Range: 3–5 target lemmas** (adapts down to 2–3 if learner shows fatigue). |
| **Formulaic Chunks (`core-chunks.csv`)** | Counted as **independent communicative frames**, NOT as isolated words. | **35 Prefabricated Frames** across Stages 0–6. |

---

## 4. The 35 Core Generative Chunks

These 35 formulaic sequences constitute the foundational skeleton of the entire curriculum (cataloged in `docs/curriculum/beginner-grade6/chunks/core-chunks.csv`):

### 1. Identity & State Frames (Lessons 1–7)
1. `My name is [Name].`
2. `I'm [11 / 12] years old.`
3. `I'm a student.`
4. `I'm [happy / tired / hungry] today.`
5. `Are you okay?`

### 2. Preference & Agency Frames (Lessons 2, 8, 11)
6. `I like [Noun / V-ing].`
7. `I don't like [Noun / V-ing].`
8. `My favorite [color / sport / subject] is [X].`
9. `I love [my dog / music].`

### 3. Capability Frames (Lessons 3, 4)
10. `I can [base verb].`
11. `I can't [base verb].`
12. `Can you [base verb]?`

### 4. Classroom Survival & De-escalation Frames (Lesson 4)
13. `I don't know.`
14. `Can you help me?`
15. `Please speak slowly.`
16. `Please say it again.`
17. `How do you say [Vietnamese word] in English?`

### 5. Possession & Environmental Deixis Frames (Lessons 5, 6, 10, 12, 16)
18. `This is my [singular noun].`
19. `These are my [plural nouns].`
20. `I have [number / a] [nouns].`
21. `I don't have [a noun].`
22. `There is a [noun] on the [location].`
23. `There are [two nouns] in the [location].`
24. `Where is my [noun]?`
25. `It is on / under / in / next to the [noun].`

### 6. Interaction & Request Frames (Lessons 15, 17, 28, 29)
26. `Can I have [item], please?`
27. `I want to [eat / drink / play] [X].`
28. `What time is it? - It's [X] o'clock.`
29. `Do you like / have [X]? - Yes, I do. / No, I don't.`
30. `Let's [play football / go to the park]!`
31. `Great idea! / Sorry, I can't.`

### 7. Discourse & Explanation Frames (Lessons 31–36)
32. `I like [A], but I don't like [B].`
33. `I [action] because [reason].`
34. `On [Saturday], first I... Then I...`
35. `Really? That's cool!`

---

## 5. Cognitive Load Budget & Adaptive Intake Control

Cowan's working memory model demonstrates that immediate active attention holds only $4 \pm 1$ unchunked elements. However, **working memory capacity does not directly equate to a rigid, invariant formula for cumulative lesson vocabulary**. 

The allowable lexical intake per lesson depends dynamically on:
- **Concreteness & Imageability**: Concrete physical nouns (*ball, cat*) require less cognitive processing than abstract concepts (*time, week*).
- **Phonological Familiarity**: Words with similar international cognates (*pizza, football*) require fewer encoding resources than unfamiliar phonotactic structures.
- **Task Scaffolding**: Structured binary choices reduce retrieval load compared to open-ended recall.

### Adaptive Intake Guidelines:
- **Standard Initial Pilot Parameter**: 4–6 productive lemmas + 1–2 invariant chunks per 45-minute lesson.
- **Within-Activity Constraint**: No single exercise may introduce more than **2–3 new elements simultaneously** without prior rehearsal.
- **Adaptive Downward Calibration**: If the learner exhibits extended response latency ($>10$ seconds) or shows hesitation during guided practice, the teacher/app automatically throttles the productive target down to **2–3 core items**, shifting remaining words to receptive recognition.
- **Prior Item Recycling**: New syntactic slots are filled using previously mastered vocabulary (e.g. prepositions in Lesson 16 recycle familiar nouns from Lesson 5: `pen`, `bag`, `book`).

---

## 6. The Multi-Dimensional Evidence Model & Foundation Diagnostic Universe

As established in the Architectural Patch (Docs 26–29), vocabulary knowledge is never treated as a binary "Known vs Unknown" flag:

1. **Multi-Dimensional Evidence States**:
   - Each lexical entry tracks 8 parallel dimensions: `UNSEEN`, `HEARD_RECOGNIZED`, `TEXT_RECOGNIZED`, `MEANING_RECALLED`, `FORM_RECALLED`, `CHUNK_USED`, `GENERATIVE_USE`, and `RETAINED`.
   - See: [`26_VOCABULARY_GAP_MODEL.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/26_VOCABULARY_GAP_MODEL.md).
2. **Generative Power ($GP$) Over Noun Hoarding**:
   - The diagnostic universe (130 items) explicitly prioritizes high-generative functional verbs (`want`, `have`, `like`), question words (`what`, `where`), and prepositions over passive concrete noun bloat.
   - See: [`27_FOUNDATION_DIAGNOSTIC_UNIVERSE.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/27_FOUNDATION_DIAGNOSTIC_UNIVERSE.md).
3. **Adaptive Sampling & In-Lesson Micro-Probes**:
   - Replaces high-stakes placement exams with gentle 12–16 item intake sampling and 2–4 in-lesson micro-probes.
   - See: [`28_ADAPTIVE_DIAGNOSTIC_DESIGN.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/28_ADAPTIVE_DIAGNOSTIC_DESIGN.md).
4. **Multi-Representation Entities (Layer C)**:
   - A word is not a single flashcard. It connects to text forms, audio forms, canonical diagnostic visuals (`V0`), variant teaching visuals (`V1`), contextual frames, and contrast sets.
   - See: [`29_REPRESENTATION_MODEL.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/29_REPRESENTATION_MODEL.md).
5. **Teacher Vocabulary Gap Map**:
   - Provides an inspectable cluster heat map for teachers without reductive single scores.
   - See: [`35_TEACHER_VOCABULARY_MAP_SPEC.md`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/35_TEACHER_VOCABULARY_MAP_SPEC.md).

---
*Lexical Architecture Certified by Role F (Vocabulary Specialist) & Role D (Learning Science Specialist).*

