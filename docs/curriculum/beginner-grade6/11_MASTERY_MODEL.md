# 11. Multi-Modal Mastery Model & Competency Verification

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Authors**: Assessment Specialist (Role I), Learning Science Specialist (Role D), Synthesis Lead (Role L)  
> **Fundamental Theorem**: **A CORRECT MULTIPLE-CHOICE TAP IS NOT EVIDENCE OF ACQUISITION. True mastery is the ability to retrieve, articulate, and combine language autonomously under communicative demand.**

---

## 1. The 6-State Cognitive Mastery Model

Every lexical item, formulaic chunk, and syntax pattern progresses through 6 progressive cognitive states:

```
[STATE 0: UNSEEN]
       │
       ▼
[STATE 1: SEEN] ────────► Exposed to audio-visual input with L1 contextual anchor.
       │
       ▼
[STATE 2: RECOGNIZED] ──► Identifies meaning in 3-choice receptive quiz within 3 seconds.
       │
       ▼
[STATE 3: RECALLED] ────► Retrieves word/chunk from memory given a picture or cued prompt.
       │
       ▼
[STATE 4: USED] ────────► Assembles in S-V-O Builder or articulates aloud via SafeHarbor.
       │
       ▼
[STATE 5: RETAINED] ────► Retains item across ≥ 3 FSRS intervals (≥ 7 days elapsed).
       │
       ▼
[STATE 6: TRANSFERRED] ─► Spontaneously uses item in a new context or school textbook test.
```

---

## 2. State Transition & Verification Criteria Matrix

| Cognitive State | Operational Definition | Observable Behavioral Criterion | Verification Modality | LingoPro System Trigger |
|---|---|---|---|---|
| **State 1: SEEN** | Student has encountered the word/chunk with native audio at 0.8x and Vietnamese explanation. | Completed Flashcard 2.0 card review with audio playback played at least once. | Listening & Visual | `state = 0` (New in FSRS) |
| **State 2: RECOGNIZED** | Student can reliably match sound/word to picture or translation. | $\ge 2$ consecutive correct selections in 3-option multiple choice with response latency $< 3.5$s. | Receptive Reading / Listening | `state = 1` (Learning Step 1: 10m) |
| **State 3: RECALLED** | Student retrieves the item without seeing the English word on screen. | Selects correct Word Bank chip from mixed distractor pool to translate or fill sentence blank. | Guided Active Recall | `state = 1` (Learning Step 2: 4h) |
| **State 4: USED** | Student integrates item into a complete syntactic frame and speaks/writes it. | 1. Assembles complete S-V-O sentence using Sentence Builder.<br>2. Produces spoken utterance with $\ge 70\%$ SafeHarbor match. | Controlled Productive Output | `state = 1` (Learning Step 3: 1d) |
| **State 5: RETAINED** | Item has survived the forgetting curve across expanding time intervals. | Passes unannounced retrieval review after intervals of 1 day, 3 days, and 7 days with $\ge 85\%$ accuracy. | Delayed Spaced Retrieval | `state = 2` (Review, stability $> 7.0$) |
| **State 6: TRANSFERRED** | Student deploys the item in a novel communicative task or school test. | 1. Uses item in unscripted 4-turn AI/teacher dialogue.<br>2. Correctly answers school bridge test question. | Uncued Communicative Transfer | `mastery_score = 100`, Badge Unlocked |

---

## 3. Cognitive Decay & Relearning Protocol

Mastery is non-linear; memory decays without reinforcement.

```
                    [State 5: RETAINED]
                             │
                             ▼ (Failed FSRS Review)
                    [State 3: RECALLED]
                             │ (Immediate Relearning Step: 10m)
                             ▼
                    [Rapid 2-Minute Recovery Drill]
                             │ (Success)
                             ▼
                    [Restored to State 5 with Adjusted Difficulty]
```

### Decay Guardrails:
- When a student fails a previously mastered item, their score is **never reset to zero**.
- The system labels the item `Relearning` (`state = 3` in FSRS), triggering two rapid micro-steps (`10m`, `30m`).
- No public shaming, red alarms, or streak wipes are triggered. The app simply presents: *"Hãy cùng ôn lại từ quen thuộc này một chút nhé!"*

---

## 4. Multi-Modal Assessment Matrix (Beyond Multiple Choice)

Every stage checkpoint utilizes 5 distinct testing modalities to guarantee balanced development:

| Testing Modality | Engine Component | Cognitive Mechanism | Prevents What Failure Mode? |
|---|---|---|---|
| **Acoustic Discrimination** | Audio Ear-Check | Auditory phoneme boundary identification | Prevents producing swallowed endings and flat vowels. |
| **Receptive Matching** | Context Picture Tap | Semantic comprehension | Prevents lexical anxiety. |
| **S-V-O Sentence Builder** | Tactile Syntax Chips | Syntactic structural sequencing | Prevents word-by-word Vietnamese literal translation. |
| **SafeHarbor Reflex Voice** | Fuzzy Speech Engine | Oral motor articulatory execution | Prevents "silent English" and speaking freeze. |
| **Contextual Story Cloze** | Interactive Passage | Discourse-level integrative reading | Prevents isolated flashcard memorization. |

---

## 5. Programmatic Representation in LingoPro

The mastery state of each learner is recorded in Supabase PostgreSQL tables:

```sql
-- Representation in public.srs_progress
UPDATE public.srs_progress
SET 
  state = 2,                    -- FSRS Review state
  stability = 12.4,             -- Memory stability in days
  difficulty = 3.2,             -- Low friction
  review_count = review_count + 1,
  last_reviewed_at = NOW(),
  next_review_date = NOW() + INTERVAL '12 days'
WHERE user_id = $1 AND word_id = $2;

-- Representation in public.user_roadmap_steps
UPDATE public.user_roadmap_steps
SET 
  status = 'completed',
  score = 92,                   -- Continuous competency score
  completed_at = NOW()
WHERE user_id = $1 AND step_id = 'step-foundation-l002';
```

---
*Mastery Architecture Certified by Role I (Assessment Specialist) & Role J (LingoPro Product Engineer).*
