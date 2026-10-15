# 26. Multi-Dimensional Vocabulary Gap & Evidence Model (Layer B)

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Architectural Patch Specification (Layer B: Learner Vocabulary Mastery Map)  
> **Audience**: Curriculum Engineers, Pedagogical Researchers, Diagnostic Engine Architects  

---

## 1. The Core Pedagogical Problem: Beyond "Known vs. Unknown"

Traditional vocabulary apps, flashcard algorithms, and placement tests treat lexical knowledge as a crude binary:
$$\text{State} \in \{\text{KNOWN}, \text{UNKNOWN}\}$$

In a binary model:
- If a learner selects a wrong image or fails to speak a word within 3 seconds, the word is marked **UNKNOWN** and placed at the beginning of a drill queue.
- If a learner taps the correct image in a 4-choice quiz, the word is marked **KNOWN** or **100% MASTERED**.

### Why This Fails Catastrophically for Grade 6 False Beginners:
An 11–12-year-old Vietnamese false beginner rarely has a completely blank lexical slate, nor do they possess fully rounded mastery:
1. A student may recognize the printed letters **`b-o-o-k`** on a page (*Orthographic Recognition*), but when hearing the native spoken chunk `/bʊk/` with an unreleased stop coda, they cannot map the sound to meaning (*Auditory Lexical Gap*).
2. A student may instantly understand `/swɪm/` when spoken, but freeze completely when asked to retrieve the word to fill the blank *"I can _____."* (*Productive Recall Gap*).
3. A student may recite the isolated translation *"eat = ăn"*, but fail to recognize or produce it in a natural communicative frame (*Chunk Usage Gap*).
4. A student may select an incorrect picture not because they do not know the word, but because the illustration itself was semantically ambiguous (*Visual Item Error*).

> [!IMPORTANT]
> **The Foundational Principle**:  
> We do not merely ask: **"What does the child not know?"**  
> We must diagnose: **"In what specific way does the child not know it?"**

---

## 2. Multi-Dimensional Evidence States (Non-Linear Representation)

Instead of a single linear progression ladder, lexical knowledge consists of **parallel and interdependent competency dimensions**. 

```
                                  [ UNSEEN ]
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
          [ HEARD_RECOGNIZED ]                  [ TEXT_RECOGNIZED ]
          (Auditory Reception)                  (Visual Reception)
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
                             [ MEANING_RECALLED ]
                             (Semantic Retrieval)
                                       │
                                       ▼
                              [ FORM_RECALLED ]
                              (Productive Retrieval)
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
             [ CHUNK_USED ]                       [ GENERATIVE_USE ]
         (Formulaic Embedding)                   (Novel Combinations)
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
                                  [ RETAINED ]
                            (Delayed Spaced Stability)
```

### The 8 Lexical Evidence Dimensions:

| Dimension Code | Definition | Diagnostic Probe Method | Pedagogical Meaning |
|---|---|---|---|
| **`UNSEEN`** | No diagnostic probe or instructional encounter recorded. | N/A | Default state before sampling. |
| **`HEARD_RECOGNIZED`** | Learner hears spoken audio (e.g. `/bæɡ/`) and accurately identifies the meaning (taps visual card) without seeing text. | Mode A (Audio $\to$ Image) | Pure phonological-to-semantic mapping is established. Auditory receptive vocabulary intact. |
| **`TEXT_RECOGNIZED`** | Learner sees printed lemma (e.g. `bag`) and identifies meaning without hearing audio. | Mode B (Text $\to$ Image) | Orthographic decoding and sight-word recognition intact. |
| **`MEANING_RECALLED`** | When prompted with spoken or written word, learner explains or identifies core Vietnamese/conceptual meaning without options. | Open Prompt / Teacher Check | Semantic mapping is deep enough to bypass multiple-choice elimination guessing. |
| **`FORM_RECALLED`** | Learner sees unambiguous concept/visual and retrieves the English phonological or written form (`"bag"`). | Mode C (Image $\to$ Elicited Production/Tiles) | Active productive recall from memory (not passive recognition). |
| **`CHUNK_USED`** | Learner embeds the lemma fluently within a taught invariant frame (e.g., `This is my [bag]`, `I like [football]`). | Cloze / Tactile Word-Chip Assembly | Syntactic slot-filling competence established. |
| **`GENERATIVE_USE`** | Learner deploys the lemma in a novel, untaught communicative combination (e.g., `A big red bag`). | Communicative Task / Roleplay | Lemma is generalized into flexible language agency. |
| **`RETAINED`** | Evidence across previous dimensions persists across a spaced delay ($\ge 7\text{ days}$). | Delayed Check Probe | Memory consolidation has occurred; resistant to transient recency decay. |

---

## 3. Parallelism vs. Linear Assumptions

It is a common pedagogical error to assume a strict hierarchy:
$$\text{Sound} \to \text{Text} \to \text{Meaning} \to \text{Form} \to \text{Production}$$

### Empirical Reality in Vietnamese Classrooms:
- **Text-Without-Sound Profile**: Many Vietnamese students study English exclusively through grammar-translation textbooks. They achieve `TEXT_RECOGNIZED` for 200+ words but remain `UNSEEN` or `FAILED` on `HEARD_RECOGNIZED`.
- **Sound-Without-Text Profile**: Children who play video games or watch YouTube cartoons often have strong `HEARD_RECOGNIZED` for words like *game, run, jump, help, cool*, but fail `TEXT_RECOGNIZED` because they cannot spell or read the word.
- **Recognition Without Production**: A child may score 100% on passive recognition (Modes A and B), yet score 0% on `FORM_RECALLED` because passive recognition requires only cue familiarity, whereas productive recall requires neural motor/articulatory activation.

Therefore, the system **tracks each dimension as an independent evidence vector**:
$$\vec{V}_{\text{lemma}} = \langle E_{\text{sound}}, E_{\text{text}}, E_{\text{recall}}, E_{\text{chunk}}, E_{\text{gen}}, E_{\text{ret}}\rangle$$

---

## 4. Comprehensive Vocabulary Gap Taxonomy (10 Gap Types)

When an instructional probe fails, the system **must NOT** immediately output *"Vocabulary Unknown"*. It classifies the failure into one of ten specific gap profiles:

```
                                  INCORRECT PROBE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ INSTRUMENT ARTIFACT ]                           [ TRUE LEXICAL GAP ]
     1. POSSIBLE_VISUAL_ITEM_ERROR                     3. UNKNOWN_CONCEPT_OR_FORM
     2. POSSIBLE_TASK_CONFUSION                        4. SOUND_FORM_GAP
                                                       5. ORTHOGRAPHIC_FORM_GAP
                                                       6. MEANING_RECALL_GAP
                                                       7. ENGLISH_FORM_RECALL_GAP
                                                       8. CHUNK_USAGE_GAP
                                                       9. CONTEXT_TRANSFER_GAP
                                                      10. RETENTION_GAP
```

### Detailed Gap Definitions:

#### 1. `UNKNOWN_CONCEPT_OR_FORM`
- **Definition**: The learner has zero familiarity with either the English word or the conceptual meaning.
- **Evidence**: Fails both Sound $\to$ Image and Text $\to$ Image probes across multiple distractors.
- **Remediation**: Needs first-time inductive presentation via high-utility chunk.

#### 2. `SOUND_FORM_GAP` (Auditory Lexical Gap)
- **Definition**: The learner understands the written word (`book`), but fails to recognize the spoken word `/bʊk/`.
- **Evidence**: Pass `TEXT_RECOGNIZED` (Mode B), Fail `HEARD_RECOGNIZED` (Mode A).
- **Underlying Cause**: Vietnamese phonological interference (unreleased final consonants, vowel quality differences, absence of English coda stops).
- **Remediation**: Contrastive acoustic training, physical articulatory mnemonics ("Puff sound" /k/), listening discrimination pairs.

#### 3. `ORTHOGRAPHIC_FORM_GAP` (Decoding Gap)
- **Definition**: The learner understands the spoken word instantly, but cannot recognize or read the printed letters.
- **Evidence**: Pass `HEARD_RECOGNIZED` (Mode A), Fail `TEXT_RECOGNIZED` (Mode B).
- **Underlying Cause**: Weak sound-letter correspondence; English orthographic irregularity.
- **Remediation**: Phoneme-grapheme mapping, tactile letter-tile assembly, whole-word shape recognition.

#### 4. `MEANING_RECALL_GAP` (Fuzzy Semantic Boundary)
- **Definition**: The learner knows the word is an English word and belongs to a general category, but cannot pinpoint its precise meaning.
- **Evidence**: In Mode A/B, student repeatedly selects the *Category Foil* (e.g., selects *pen* when hearing *pencil*, or selects *desk* when hearing *chair*).
- **Remediation**: Minimal semantic contrast drills (side-by-side object comparison emphasizing distinctive features).

#### 5. `ENGLISH_FORM_RECALL_GAP` (Passive-Active Asymmetry)
- **Definition**: The learner immediately points to a bag when hearing *"bag"*, but when shown a picture of a bag and asked *"What is this?"*, they cannot retrieve the English sound `/bæɡ/`.
- **Evidence**: Pass Modes A and B; Fail Mode C1/C2.
- **Remediation**: Low-stakes retrieval practice, whisper rehearsal, teacher modeling with 3-second pause, scaffolded choral elicitation.

#### 6. `CHUNK_USAGE_GAP` (Isolated-to-Syntax Breakdown)
- **Definition**: The learner can recall the isolated word (`water`), but cannot combine it into a functional chunk (`"Water, please"` or `"I drink water"`).
- **Evidence**: Pass Mode C (Form Recall); Fail Cloze / Sentence-Chip Assembly.
- **Underlying Cause**: Working memory overload when combining lexicon with syntax.
- **Remediation**: Receptive chunk priming, tactile word-chip dragging, formulaic slot-filling without explicit grammar rules.

#### 7. `CONTEXT_TRANSFER_GAP` (Rigid Over-Fitting)
- **Definition**: The learner knows the word in the exact textbook picture or exact drill sentence, but fails when the visual representation or sentence context changes slightly.
- **Evidence**: Pass with Image $V_1$; Fail with Variant Image $V_2$ or novel speaker.
- **Remediation**: Multi-representation exposure (showing 3 different backpacks, different voice accents).

#### 8. `RETENTION_GAP` (Rapid Memory Decay)
- **Definition**: The learner masters the word at minute 15 of the lesson, but by Day 3 or Day 7 has forgotten it entirely.
- **Evidence**: Pass at $T_0$; Fail at $T_{+7\text{d}}$.
- **Remediation**: FSRS-based spaced micro-review, cross-lesson recycling in subsequent warm-up routines.

#### 9. `POSSIBLE_VISUAL_ITEM_ERROR` (Instrument Artifact)
- **Definition**: The probe failure was caused by visual ambiguity in the testing card, NOT by a vocabulary deficiency in the child.
- **Evidence**: Student selected a distractor that shared visual plausibility with the target (e.g. selected *dinner* picture for *eat*, or complained *"Con tưởng đây là buổi sáng"*).
- **System Action**: **NEVER penalize the learner's vocabulary score**. Log `VISUAL_AMBIGUITY_SUSPECTED`, quarantine the image prompt, and re-probe with an alternative representation.

#### 10. `POSSIBLE_TASK_CONFUSION` (Extraneous Cognitive Load)
- **Definition**: Failure caused by UI friction, audio volume issues, misunderstanding teacher instructions, or momentary anxiety freeze.
- **Evidence**: Response latency $> 15\text{ seconds}$ followed by random tap; student expresses confusion about how to drag tiles.
- **System Action**: Invalidate probe trial. Reset with teacher demonstration.

---

## 5. Summary Matrix: Diagnostic Diagnostic Actions

```
┌─────────────────────────┬─────────────────────────┬──────────────────────────────┐
│ Observed Probe Pattern  │ Inferred Gap Type       │ System / Teacher Action      │
├─────────────────────────┼─────────────────────────┼──────────────────────────────┤
│ Sound ✗ | Text ✓        │ SOUND_FORM_GAP          │ Focus on coda phonetics      │
│ Sound ✓ | Text ✗        │ ORTHOGRAPHIC_FORM_GAP   │ Sight-word tile assembly     │
│ Sound ✓ | Form Recall ✗ │ ENGLISH_FORM_RECALL_GAP │ Low-stakes retrieval drill   │
│ Category Foil Selected  │ MEANING_RECALL_GAP      │ Semantic contrast pairs      │
│ Isolated ✓ | Chunk ✗    │ CHUNK_USAGE_GAP         │ Slot-substitution practice   │
│ Ambiguous Card Tap      │ VISUAL_ITEM_ERROR       │ Invalidate probe; audit card │
└─────────────────────────┴─────────────────────────┴──────────────────────────────┘
```
