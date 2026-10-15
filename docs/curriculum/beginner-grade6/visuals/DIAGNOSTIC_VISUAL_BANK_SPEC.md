# Diagnostic Visual Bank Specification

> **Target Audience**: Vietnamese Grade 6 Learners (Ages 11–12, False Beginners, Pre-A1)  
> **Curriculum**: English From Zero – Foundation Curriculum  
> **Status**: Approved Assessment Engine Specification  
> **Module**: Multimodal Diagnostic & Meaning-Mapping Engine  

---

## 1. Assessment Architecture & Pedagogical Rationale

Traditional ESL diagnostics fail Grade 6 false beginners because they conflate three distinct cognitive skills:
1. **Orthographic Decoding** (Reading written letters);
2. **Grammar Parsing** (Analyzing sentence structure and syntax rules);
3. **Semantic Mapping** (Connecting spoken English sounds to real-world meaning).

A student who panics when seeing written multiple-choice grammar questions (*"Choose the correct sentence: A. He like... B. He likes..."*) often possesses latent receptive vocabulary that is completely masked by test anxiety and reading difficulties.

The **Diagnostic Visual Bank** isolates semantic comprehension from written reading literacy. By using clean, validated visual assets, the system accurately diagnoses what the learner actually understands in under 5 minutes without inducing stress.

```
                           DIAGNOSTIC TASK FLOW
                           
       [Audio Stimulus]                [Written Stimulus]
         /bʊk/ ("book")                   "swim"
              │                                │
              ▼                                ▼
       [MODE A: SOUND→IMAGE]          [MODE B: TEXT→IMAGE]
              │                                │
              └───────────────┬────────────────┘
                              │
                              ▼
                 4-Option Visual Display (No Text)
             [A: Target]   [B: Category Foil]
             [C: Cross Foil]  [D: Phonological Foil]
                              │
                              ▼
                   Instant Comprehension Tap
                   (Latency & Accuracy Logged)
```

---

## 2. Four Diagnostic Interaction Modalities

### Mode A: Sound-to-Image (Phonological Reception)
- **Purpose**: Measure direct phonological-to-semantic mapping without orthographic interference.
- **Stimulus**: Clean, high-fidelity audio recording of the target word (`audio_key`). No text displayed on screen.
- **Interface**: Four visual cards arranged in a $2 \times 2$ grid.
- **Task**: Learner taps the image that matches what they hear.
- **Diagnostic Signal**:
  - Success $\to$ The learner's auditory receptive vocabulary is intact.
  - Failure on Category Foil $\to$ Fuzzy semantic boundaries (knows it's a school tool, but confuses *pen* with *pencil*).
  - Failure on Phonological Foil $\to$ Phonological decoding confusion (confuses `/bʊk/` with `/bæɡ/`).

### Mode B: Written Word-to-Image (Orthographic Reception)
- **Purpose**: Test receptive reading recognition of basic sight words.
- **Stimulus**: Single printed word displayed in large, clean, sans-serif font (e.g., `swim`). Zero audio provided.
- **Interface**: Four visual cards ($2 \times 2$ grid).
- **Task**: Learner taps the image corresponding to the printed word.
- **Diagnostic Signal**:
  - Success in Mode A + Failure in Mode B $\to$ Phonology is established, but orthographic sound-letter decoding needs reinforcement.

### Mode C: Image-to-Production (Elicited Active Recall)
- **Purpose**: Assess productive vocabulary retrieval.
- **Stimulus**: Single unambiguous visual card displayed prominently in the center of the screen.
- **Variant C1 (Spoken Recall)**:
  - Prompt: *"What is this?"* or *"What can they do?"*
  - Student speaks the word into the microphone (or directly to the teacher during 1-on-1 pilot).
  - Evaluated via the **Teacher Multidimensional Observation Rubric** (Intelligibility, Word Completeness, Fluency) rather than rigid binary pass/fail.
- **Variant C2 (Orthographic Assembly)**:
  - Scrambled letter tiles provided below the image (e.g. `[k] [o] [b] [o]` for *book*).
  - Learner drags tiles into the correct sequence. Eliminates keyboard typing friction.

### Mode D: Minimal Contrast Discrimination (Semantic Boundary Check)
- **Purpose**: Verify fine-grained semantic distinctions between closely related concepts.
- **Stimulus**: Spoken target phrase or audio question (e.g. *"Look, he is running!"*).
- **Interface**: Two contrastive cards side-by-side:
  - Card 1: Boy sprinting dynamically (*run*).
  - Card 2: Boy walking casually (*walk*).
- **Target Pairs**:
  - `run` vs `walk`
  - `eat` vs `drink`
  - `big` vs `small`
  - `hot` vs `cold`
  - `in` vs `on` vs `under`

---

## 3. Distractor Construction Architecture (Anti-Bias Rules)

A diagnostic item is only as valid as its distractors. Flawed distractors produce false negatives (student knows the word but is confused by two similar pictures) or false positives (three pictures are ridiculous, leaving only one possible answer).

### The Standard 4-Option Matrix ($T, F_{\text{cat}}, F_{\text{cross}}, F_{\text{phono}}$):

```
+--------------------------------------------------------------------------+
| TARGET (T): The exact semantic representation                            |
| Example: [IMG-G6-003: book] (Clean blank textbook)                       |
+--------------------------------------------------------------------------+
| CATEGORY FOIL (F_cat): Same semantic domain; tests category boundary    |
| Example: [IMG-G6-002: pen] (Both are classroom learning supplies)        |
+--------------------------------------------------------------------------+
| CROSS-DOMAIN FOIL (F_cross): Highly familiar item from a different domain|
| Example: [IMG-G6-067: cat] (Known animal; ensures non-random choice)     |
+--------------------------------------------------------------------------+
| PHONOLOGICAL FOIL (F_phono): Similar initial consonant or acoustic shape|
| Example: [IMG-G6-001: bag] (Starts with /b/; tests auditory discrimination|
+--------------------------------------------------------------------------+
```

### Strict Quality Rules for Distractor Sets:
1. **Equal Visual Salience**: All four cards must share identical art style, background tone, subject size, and visual weight.
2. **Mutual Exclusivity**: No two images in the same test item may depict the same object or action from different angles.
3. **No Unknown Distractors**: Distractor images must only depict objects or concepts already familiar to the student (either from previous lessons or universal daily life).
4. **No Trick Visuals**: Never use visual optical illusions or ambiguous secondary objects.

---

## 4. Imageability Classification of the 100 Core Lemmas

The 100 core lemmas from `docs/curriculum/beginner-grade6/vocabulary/core-lexicon.csv` are strictly categorized into three visual tiers:

```
┌──────────────────────────────────────────────────────────────┐
│                    100 CORE LEMMAS                           │
├──────────────────────────────┬───────────────────────────────┤
│ TIER 1: HIGH IMAGEABILITY    │ 48 Lemmas (Concrete & Action) │
│ TIER 2: RELATIONAL/STATE     │ 28 Lemmas (Context & Contrast)│
│ TIER 3: NON-IMAGEABLE        │ 24 Lemmas (Abstract/Function) │
└──────────────────────────────┴───────────────────────────────┘
```

### 4.1 Tier 1: High Imageability (48 Lemmas)
*Concrete physical objects, animals, distinct bodily actions, primary colors, and numerals.*  
**Assessment Rule**: Fully eligible for standalone visual flashcards and Modes A, B, C.

| Category | Lemmas (IDs) | Visual Staging Rule |
|---|---|---|
| **Classroom Supplies** | `pen` (lex-028), `book` (lex-029), `ruler` (lex-030), `pencil` (lex-031), `rubber` (lex-032), `bag` (lex-027), `desk` (lex-061), `chair` (lex-062), `board` (lex-075) | Isolated on neutral desk plane; zero text on covers or labels. |
| **Physical Actions** | `swim` (lex-016), `run` (lex-017), `draw` (lex-018), `cook` (lex-019), `dance` (lex-020), `wash` (lex-098), `wear` (lex-053) | Culminating action moment; clear posture; dynamic motion lines. |
| **Food & Drink** | `bread` (lex-084), `milk` (lex-085), `water` (lex-086), `fish` (lex-013), `breakfast` (lex-100) | Familiar Vietnamese breakfast items; plain transparent drinking glass. |
| **Animals & Objects** | `dog` (lex-066), `cat` (lex-067), `bird` (lex-068), `bed` (lex-060), `clock` (lex-074), `phone` (lex-076), `box` (lex-077), `shirt` (lex-051), `shoes` (lex-052), `teeth` (lex-099) | Crisp silhouette, warm lighting, natural proportions. |
| **Sports & Activities**| `football` (lex-010), `music` (lex-011), `games` (lex-012) | Soccer ball at foot; headphones with musical notes; handheld game controller. |
| **Colors** | `blue` (lex-047), `black` (lex-048), `white` (lex-049), `red` (lex-050) | Solid colored shapes (paint splashes or uniform color blocks on shirts). |
| **Numerals** | `one` (lex-034), `two` (lex-035), `three` (lex-036), `four` (lex-037), `five` (lex-038), `ten` (lex-039), `eleven` (lex-004), `twelve` (lex-003) | Groups of discrete identical dots/apples arranged neatly for instant subitizing. |

### 4.2 Tier 2: Relational & Contextual Imageability (28 Lemmas)
*Emotional/physical states, spatial prepositions, family relationships, times of day, and comparative sizes.*  
**Assessment Rule**: Requires paired contrast, visual comparison, or minimal situational staging. Never present in total isolation.

| Category | Lemmas (IDs) | Contextual Staging Requirement |
|---|---|---|
| **Physical/Emotional States** | `happy` (lex-041), `tired` (lex-042), `hungry` (lex-043), `thirsty` (lex-044), `hot` (lex-046), `cold` (lex-045) | Expressive adolescent character; clear physiological indicators (sweat drop + fan for *hot*; shivering + jacket for *cold*; empty stomach thought bubble + clock for *hungry*). |
| **Spatial Prepositions** | `on` (lex-089), `in` (lex-090), `under` (lex-091), `next to` (lex-092) | Single reference object (e.g. wooden desk or box) with red target ball positioned in relation to it, accompanied by a subtle highlight ring. |
| **Sizes & Qualities** | `big` (lex-065), `cute` (lex-070), `funny` (lex-057), `smart` (lex-059), `kind` (lex-058) | Contrast staging (oversized bag vs tiny pouch for *big*; playful puppy for *cute*; student sharing umbrella for *kind*). |
| **Social & Family** | `student` (lex-002), `friend` (lex-054), `dad` (lex-078), `mom` (lex-079), `brother` (lex-080), `sister` (lex-081), `family` (lex-082), `pet` (lex-069) | Vietnamese secondary student in uniform; two peer students walking together with arms over shoulders (*friend*); simple domestic family frame. |
| **Times & Routines** | `morning` (lex-094), `afternoon` (lex-095), `night` (lex-096), `time` (lex-093), `wake up` (lex-097) | Sun rising over window with 6:30 clock (*morning*); golden afternoon classroom bell (*afternoon*); moonlit window with sleeping student (*night*). |
| **Actions on Objects** | `eat` (lex-087), `drink` (lex-088) | Student bringing fork/spoon to mouth (*eat*) vs student drinking water from clear glass (*drink*). Unambiguous action contrast. |

### 4.3 Tier 3: Non-Imageable Abstract Items (24 Lemmas)
*Grammatical function words, politeness markers, adverbs of manner/frequency, pronouns, modal auxiliaries.*  
**STRICT EXCLUSION RULE**: **Never test these items with standalone image flashcards**. Forcing a static drawing for "because" or "slowly" confuses learners and produces invalid test data.

| Category | Lemmas (IDs) | Why Imageable Testing Is Prohibited | Required Assessment Modality |
|---|---|---|---|
| **Discourse & Politeness** | `hello` (lex-005), `bye` (lex-006), `please` (lex-022) | Hand-wave icon can mean hello, goodbye, or greeting; easily confused. | Audio-situated communicative drill (Teacher says: *"Class is starting"*, student responds). |
| **Adverbs of Manner/Time** | `slowly` (lex-023), `again` (lex-024) | Snail/arrow icons are abstract and ambiguous. | Teacher speech rate variation drill (*"Speak slowly, please"*). |
| **Mental Verbs & Modals** | `can` (lex-015), `know` (lex-025), `like` (lex-009), `love` (lex-071), `help` (lex-021), `have` (lex-040), `live` (lex-083), `speak` (lex-026) | Static drawings of "thinking" or "knowing" are indistinguishable from "confused" or "headache". | Micro-dialogue listening comprehension or sentence-building routines. |
| **Pronouns & Demonstratives** | `he` (lex-055), `she` (lex-056), `this` (lex-033), `that` (lex-073), `what` (lex-072), `there` (lex-064) | Isolated pictures cannot reliably distinguish "he" from "boy" or "student", or "this" from the object itself. | Gestural classroom demonstration (pointing close vs pointing far). |
| **Abstract Units** | `name` (lex-001), `year` (lex-007), `old` (lex-008), `math` (lex-014) | Abstract concepts lack discrete visual shape. | Spoken self-introduction interview (`CD-001`). |

---

## 5. Pilot Implementation: 18 High-Priority Diagnostic Visual Items

For the initial N=1 pilot phase, the Visual Bank will deploy **18 dedicated foundation visual items** covering Lessons 1–3 and Stage 0 core essentials:

1. `IMG-G6-001`: **bag** (`lex-027`, School backpack)
2. `IMG-G6-002`: **pen** (`lex-028`, Blue ballpoint pen)
3. `IMG-G6-003`: **book** (`lex-029`, Blank-cover textbook)
4. `IMG-G6-004`: **ruler** (`lex-030`, Metric 20cm clear ruler)
5. `IMG-G6-005`: **pencil** (`lex-031`, Yellow graphite pencil)
6. `IMG-G6-006`: **swim** (`lex-016`, Action: student swimming)
7. `IMG-G6-007`: **run** (`lex-017`, Action: student sprinting on track)
8. `IMG-G6-008`: **draw** (`lex-018`, Action: hand drawing cat on paper)
9. `IMG-G6-009`: **cook** (`lex-019`, Action: stirring soup in kitchen pot)
10. `IMG-G6-010`: **water** (`lex-086`, Clear glass of water)
11. `IMG-G6-011`: **eat** (`lex-087`, Action: student eating food)
12. `IMG-G6-012`: **drink** (`lex-088`, Action: student drinking water)
13. `IMG-G6-013`: **happy** (`lex-041`, Emotion: smiling 11yo student)
14. `IMG-G6-014`: **tired** (`lex-042`, State: resting head on desk)
15. `IMG-G6-015`: **hot** (`lex-046`, State: sweating under sun with fan)
16. `IMG-G6-016`: **cold** (`lex-045`, State: shivering in winter coat)
17. `IMG-G6-017`: **big vs small** (`lex-065`, Contrast pair: big bag vs small pouch)
18. `IMG-G6-018`: **in / on / under** (`lex-089-091`, Tri-contrast spatial preposition set)

All 18 items are fully specified with prompt engineering parameters in `IMAGE_GENERATION_PROMPTS.md`.
