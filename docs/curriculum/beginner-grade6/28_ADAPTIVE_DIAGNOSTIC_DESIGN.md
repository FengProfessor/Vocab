# 28. Adaptive Vocabulary Diagnostic Engine & Micro-Probe Design

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Approved Assessment Engine Specification  
> **Mechanism**: Adaptive Stratified Sampling + Continuous Lesson-Embedded Micro-Probes  
> **Test Fatigue Target**: Zero Exhaustion (Maximum 12–16 items in intake; 2–4 micro-probes per lesson)  

---

## 1. The Anti-Exam Principle

A massive 100-to-150-question placement test administered to an 11–12-year-old false beginner who is already terrified of English guarantees three destructive outcomes:
1. **Acute Test Anxiety & Cognitive Shutdown**: Facing dozens of unknown words triggers learned helplessness (*"Con đã bảo là con không biết gì rồi mà"*).
2. **Artificial False Negatives**: A anxious student misclicks or gives up at item 20, invalidating items 21 through 100.
3. **Severe Administrative Drag**: Teachers spend the first 2 hours testing rather than establishing rapport, safety, and initial success.

### The Solution: Two-Tier Adaptive Diagnostics
- **Tier 1: The Initial Light Map (Intake)**: A gentle 5-minute, 12-to-16-item adaptive survey that establishes cluster-level baselines without grading or stress.
- **Tier 2: Continuous In-Lesson Micro-Probes**: 2 to 4 seamlessly embedded diagnostic checks per lesson, disguised as standard game-like warm-ups or review tasks.

```
                           DIAGNOSTIC ARCHITECTURE
                           
              [ INTAKE: INITIAL LIGHT MAP (12–16 Probes) ]
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
     Cluster Pass (≥ 80%)                      Cluster Fail / Uncertain
     "School Nouns = Solid"                    "Core Verbs = Weak"
              │                                         │
              ▼                                         ▼
     HALT Testing Cluster                      EXPAND Micro-Probes in Lessons
     (Do not test 15 more nouns)               (Probe specific verb boundaries)
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
             [ CONTINUOUS MICRO-PROBES IN LESSONS 1–12 ]
             * 2–4 Probes / Lesson (Warm-up / Review)
             * Low stakes, Zero anxiety, Invisible to learner
             * Continuously updates Layer B Vocabulary Map
```

---

## 2. Adaptive Sampling Algorithm (The Initial Light Map)

The 130-item diagnostic universe is organized into **4 Primary Functional Meta-Clusters**:
- **Meta-Cluster $\alpha$ (Action Verbs)**: 24 items
- **Meta-Cluster $\beta$ (School & Everyday Nouns)**: 32 items
- **Meta-Cluster $\gamma$ (Personal, Functional & Question Words)**: 16 items
- **Meta-Cluster $\delta$ (States, Relators & Prepositions)**: 26 items

### Phase 1: Stratified Seed Probe (12 Items Total)
The engine opens by administering exactly **3 representative anchor items** from each meta-cluster:

```
Meta-Cluster α (Verbs):         [play]     [eat]      [want]
Meta-Cluster β (Nouns):         [pen]      [book]     [water]
Meta-Cluster γ (Function):      [I/you]    [this]     [what]
Meta-Cluster δ (States/Preps):  [happy]    [big/small][on/under]
```

### Phase 2: Category Inference & Pruning
Based on the 3 seed responses, the engine calculates a **Cluster Confidence Score** ($C_{\text{cluster}}$):

$$C_{\text{cluster}} = \frac{\sum \text{Correct Seed Probes}}{3}$$

#### Scenario A: High Competence ($C_{\text{cluster}} = 1.0$, 3/3 Correct)
- **Inference**: High prior knowledge in this domain (e.g., student recognizes `pen`, `book`, `water`).
- **Engine Action**: **HALT IMMEDIATELY**. Do NOT probe the remaining 29 nouns in Cluster $\beta$.
- **Map Update**: Mark Cluster $\beta$ as `PROVISIONAL_SOLID` ($85\%$ confidence). Free up cognitive bandwidth for weaker areas.

#### Scenario B: Intermediate / Mixed ($C_{\text{cluster}} = 0.67$, 2/3 Correct)
- **Inference**: Boundary area.
- **Engine Action**: Administer **2 targeted branching probes** (e.g. test `like` and `run`).
- **Map Update**: Pinpoint exact threshold.

#### Scenario C: Low Competence / Freeze ($C_{\text{cluster}} \le 0.33$, 0–1/3 Correct)
- **Inference**: Deep foundational deficit (e.g., student fails `want`, `play`, `eat`).
- **Engine Action**: **HALT DEEPENING**. Do not administer harder verbs.
- **Map Update**: Mark Cluster $\alpha$ as `FOUNDATIONAL_GAP`. Flag for early inductive teaching in Lesson 2 and Lesson 3.

> [!IMPORTANT]
> **Total Intake Time**: 4 to 6 minutes.  
> **Total Items Encountered**: 12 to 16 maximum.  
> **Learner Experience**: Felt like a fast picture-matching matching game; zero red marks; zero failure anxiety.

---

## 3. Representation-Shifting Diagnostic Protocol

When a learner fails a probe, the engine **never** concludes that the word is unknown. It executes a **Representation Shift** to isolate the exact nature of the breakdown:

```
                       [ MODE A: SOUND → IMAGE ]
                            Learner fails /bʊk/
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       [ MODE B: TEXT → IMAGE ]             [ TEACHER PHONETIC CHECK ]
          Display word "book"                 Live spoken acoustic check
                     │                               │
        ┌────────────┴────────────┐                  └───────────────┐
        ▼                         ▼                                  ▼
      PASS                       FAIL                           Coda Dropped?
(Sound-Form Gap:          (True Lexical Gap:                 (Learner drops /k/;
 Can read, cannot hear)    Does not know word)                articulatory issue)
```

### Diagnostic Decision Tree:
1. **If Mode A Fails and Mode B Passes**:
   - Inferred Gap: `SOUND_FORM_GAP`.
   - Pedagogical Fix: Student does not need vocabulary explanation; they need phonological ear training on English word-final stops (`/k/`).
2. **If Mode A Passes and Mode C Fails**:
   - Inferred Gap: `ENGLISH_FORM_RECALL_GAP`.
   - Pedagogical Fix: Receptive mapping is solid; student needs whisper retrieval drills and low-pressure spoken elicitation.
3. **If Mode A Selects Category Foil**:
   - Inferred Gap: `MEANING_RECALL_GAP`.
   - Pedagogical Fix: Present paired visual contrast (`pen` vs `pencil`) to sharpen blurred boundaries.

---

## 4. Continuous In-Lesson Micro-Probes (Lessons 1–12)

Diagnostic assessment does not stop after day 1. It becomes a **continuous, invisible pulse** embedded directly in the regular 25-minute lesson flow:

```
┌────────────────────────────────────────────────────────────────────────┐
│               STANDARD 25-MINUTE LESSON EXECUTION FLOW                 │
├───────────────────┬────────────────────────────────────────────────────┤
│ Minute 00–05      │ Low-Anxiety Warm-up + MICRO-PROBE 1 (Recycled Item)│
│ Minute 05–12      │ Comprehensible Input & High-Utility Chunks         │
│ Minute 12–18      │ Guided Practice + MICRO-PROBE 2 (Uncertain Item)   │
│ Minute 18–22      │ Low-Stakes Assembly / Communicative Agency         │
│ Minute 22–25      │ Cooldown & MICRO-PROBE 3 (Delayed Retention Check) │
└───────────────────┴────────────────────────────────────────────────────┘
```

### Micro-Probe Guidelines:
1. **Frequency**: Exactly **2 to 4 micro-probes per lesson**.
2. **Duration**: 20 to 45 seconds each.
3. **Masking**: Probes are presented as natural classroom games:
   - *"Quick tap! Which picture did the teacher say?"* (Mode A)
   - *"Odd one out!"* (Contrast check)
   - *"Secret word box!"* (Mode C)
4. **Zero Penalty Tone**: If the learner misses a probe, the teacher or app provides an immediate neutral model: *"Aha! This is a pen! Let's listen together: pen."* Zero negative buzzers, zero red X icons, zero score deductions.

---

## 5. False Mastery Prevention & Spacing Rules

A single correct response during a lesson **does not prove acquisition**. It only proves short-term recency priming.

### Evidence Graduation Requirements:
To advance an item from `PROVISIONAL_PASS` to `CONFIRMED_MASTERY`, the system requires:
1. **Cross-Modality Verification**: Passing in at least two independent representations (e.g. `HEARD_RECOGNIZED` + `CHUNK_USED`).
2. **Spaced Delay Retention**: Passing a micro-probe administered $\ge 7\text{ days}$ after initial teaching.
3. **Variant Visual Robustness**: Correctly recognizing the concept when presented with an alternative image (`Variant V2`), ensuring the learner has not merely memorized a single flashcard drawing.

```
+--------------------------------------------------------------------------+
|                  VOCABULARY MASTERY ACCREDITATION GATE                   |
|                                                                          |
|  [Immediate Lesson Hit]  ──(Priming)──►  PROVISIONAL (Tentative)         |
|             │                                                            |
|             ├──► Check 1: Mode B (Text) or Mode C (Recall)               |
|             ├──► Check 2: Variant Visual V2 (Anti-Overfitting)           |
|             └──► Check 3: Spaced Delay (T + 7 Days)                      |
|                                                                          |
|  [All 3 Checks Satisfied] ────────────►  CONFIRMED RETAINED MASTERY      |
+--------------------------------------------------------------------------+
```
