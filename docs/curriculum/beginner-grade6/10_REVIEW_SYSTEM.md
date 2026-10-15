# 10. Spaced Review Architecture & Interleaved Retention Graph

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Authors**: Learning Science Specialist (Role D), Curriculum Architect (Role A), Synthesis Lead (Role L)  
> **Guiding Principle**: **IF AN ITEM IS NOT DELIBERATELY RECYCLED, IT CEASES TO EXIST IN WORKING MEMORY. No vocabulary or grammar element is ever abandoned after its initial introduction.**

---

## 1. The Multi-Tier Review Architecture

Retention for anxious beginners requires two synchronized review engines:
1. **Curricular Interleaving (Macro-Pedagogy)**: The deliberate reappearance of prior lexical items and syntax frames inside subsequent lesson dialogues and activities.
2. **Algorithmic Spacing (Micro-FSRS v5)**: The digital spaced retrieval schedule executed by LingoPro's native `ts-fsrs` engine across daily 5-minute micro-sessions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CURRICULAR RECYCLING SCHEDULE                         │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ Same Lesson       │ Immediate retrieval check (5–8 minutes after intake)     │
│ Next Lesson (N+1) │ Mandatory Warm-Up Retrieval (Minutes 3–8 of Lesson N+1)  │
│ 2–3 Lessons Later │ Subordinate slot insertion in novel communicative topic │
│ 1 Week Later      │ Formative Checkpoint & S-V-O Sentence Builder challenge │
│ 2–4 Weeks Later   │ Cross-topic thematic synthesis and story cloze reading  │
│ Stage Exit        │ Capstone transfer evaluation across entire skill set    │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 2. Macro Review Graph: Cross-Lesson Interleaving Map

The matrix below documents the explicit recycling pathway across the foundational units:

```
[L-001: Name / Age / I'm] ────────┬──► Recycled in L-002 (I like...)
                                  ├──► Recycled in L-005 (This is my bag)
                                  ├──► Recycled in L-007 (I'm tired/happy)
                                  └──► Recycled in L-009 (This is my friend)

[L-002: I like / don't like] ─────┬──► Recycled in L-003 (I can / can't)
                                  ├──► Recycled in L-008 (My favorite color is...)
                                  ├──► Recycled in L-011 (I have / don't have a pet)
                                  ├──► Recycled in L-021 (I play sports...)
                                  └──► Recycled in L-031 (I like X, but I don't like Y)

[L-003: I can / can't] ───────────┬──► Recycled in L-004 (Can you help me?)
                                  ├──► Recycled in L-015 (Can I have...?)
                                  ├──► Recycled in L-018 (Turn left / go straight)
                                  └──► Recycled in L-029 (Sorry, I can't)

[L-005: School items / This is] ──┬──► Recycled in L-006 (I have 3 pens)
                                  ├──► Recycled in L-010 (There is a bed...)
                                  ├──► Recycled in L-012 (What's this? / What's that?)
                                  ├──► Recycled in L-016 (The pen is on the table)
                                  └──► Recycled in L-037 (Global Success Unit 1 Bridge)

[L-006: Numbers 1–20 / Have] ─────┬──► Recycled in L-013 (My family has 4 people)
                                  ├──► Recycled in L-017 (It's 7 o'clock)
                                  ├──► Recycled in L-027 (It costs 15,000 VND)
                                  └──► Recycled in L-030 (How many pens do you have?)

[L-009: He / She / Friend] ───────┬──► Recycled in L-013 (He is my father)
                                  ├──► Recycled in L-014 (She has long hair)
                                  ├──► Recycled in L-022 (He is reading a book)
                                  └──► Recycled in L-040 (3rd person singular -s)
```

---

## 3. Prerequisite Dependency Graph

A student cannot jump arbitrarily between units without violating cognitive scaffolding:

```
[CD-001: Self Identity] ──► [CD-002: Likes & S-V-O] ──► [CD-003: Can / Can't]
                                     │                           │
                                     ▼                           ▼
[CD-005: Deixis (This is)] ◄─ [CD-006: Have & Plural]   [CD-004: Survival Help]
          │                          │
          ▼                          ▼
[CD-010: There is / are]    [CD-013: Family & Living]
          │                          │
          ▼                          ▼
[CD-016: Prepositions]      [CD-014: Appearance & Has]
          │                          │
          ▼                          ▼
[CD-025: Where is...?]      [CD-022: Present Continuous]
                                     │
                                     ▼
                            [CD-040: 3rd-Person -s Mastery]
```

---

## 4. Micro-Spaced FSRS v5 Parameter Calibration for Grade 6

LingoPro's native FSRS v5 engine (`src/lib/fsrs.ts`) is fine-tuned to ensure high retention without triggering homework dread:

```typescript
// Production FSRS Parameters calibrated for Grade 6 Foundation Track
export const GRADE6_FSRS_CONFIG = {
  request_retention: 0.92,       // Target 92% retrieval success rate
  maximum_interval: 180,         // Ceiling at 6 months (ensures seasonal recycling)
  enable_fuzz: true,             // Prevents cluster pile-ups on specific days
  enable_short_term: true,       // Enforces intra-day memory consolidation
  learning_steps: ['10m', '4h', '1d'],   // Step 1: 10m -> Step 2: 4h -> Step 3: 1d
  relearning_steps: ['10m', '30m'],      // Lapse recovery steps
};
```

### UX Translation for Student:
- When a student completes a lesson in class, their phone/tablet notifies them ~4 hours later with a **2-minute "Micro-Check"** (3 quick flashcard matches).
- Next morning, a **1-minute warm-up** confirms overnight memory consolidation before the interval expands to 3 days, then 7 days.

---

## 5. Automated Forgetting-Intervention Protocol

If a student's retention falls below $75\%$ on any foundational chunk:
1. **Do NOT demote the student or show a red warning**.
2. Seamlessly inject that item as the first "Flashcard 2.0" card in the warm-up of their next login session.
3. Automatically configure the Sentence Builder to supply 3 words instead of 5, providing temporary scaffolding until retrieval confidence is restored.

---
*Review System Certified by Role D (Learning Science) & Role J (LingoPro Product Engineer).*
