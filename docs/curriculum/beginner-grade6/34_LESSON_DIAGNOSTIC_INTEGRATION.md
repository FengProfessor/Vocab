# 34. Lesson-Embedded Diagnostic Integration & Lessons 001–012 Audit

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Approved Architectural Integration Specification  
> **Core Principle**: Continuous In-Lesson Micro-Probing without Turning Lessons into Exams  

---

## 1. The Dual-Process Lesson Architecture

Under the updated Foundation Curriculum v0.x architecture, every lesson simultaneously executes two synchronized processes:
1. **The Teaching Process**: Safe, low-anxiety, inductive acquisition of high-utility chunks and communicative agency.
2. **The Diagnostic Process**: Continuous, invisible micro-probing that samples lexical states and updates the Layer B Vocabulary Map.

### The Mandatory Lesson Diagnostic Header
Every lesson specification in `docs/curriculum/beginner-grade6/lessons/` must now formally declare its diagnostic telemetry:

```markdown
---
lesson_id: L-XXX
can_do_code: CD-XXX
primary_modality: listening | recognition | assembly | speaking | reading

lexical_telemetry:
  new_target_lexicon:
    - lemma: "bag"
      concept_id: CON-G6-027
      target_evidence: [HEARD_RECOGNIZED, FORM_RECALLED]
  recycled_lexicon:
    - lemma: "like"
      concept_id: CON-G6-009
      purpose: "Syntactic frame carrier ('I like my bag')"
  diagnostic_probe_items:
    - probe_id: PRB-L005-01
      target_concept: "bag"
      modality: "Mode A (Sound -> Image)"
      timing: "Minute 03 (Warm-up game)"
    - probe_id: PRB-L005-02
      target_concept: "pen"
      modality: "Mode C2 (Letter tiles)"
      timing: "Minute 21 (Cooldown assembly)"
  uncertain_items_recheck:
    - concept_id: CON-G6-016 (swim)
      reason: "Previous lesson showed Sound-Form gap (dropped coda /m/)"
      recheck_probe: "Acoustic discrimination check in warm-up"
  representations_used:
    - IMG-G6-001-v1 (Canonical V0 Bag)
    - TXT-G6-027-01 (Printed sight-word 'bag')
    - AUD-G6-027-01 (Citation audio /bæɡ/)
  evidence_updated:
    - "Layer B: CON-G6-027 -> HEARD_RECOGNIZED / FORM_RECALLED"
    - "Layer B: CON-G6-016 -> SOUND_FORM_GAP resolved or persistent"
---
```

---

## 2. Comprehensive Audit of Lessons 001–012

We evaluated all 12 existing executable lesson plans against four critical criteria:
1. **Modality Realism**: Does the lesson mistake oral speaking for overall language mastery?
2. **Cognitive Load & Lexical Density**: Is there hidden vocabulary overload exceeding the 3–5 new items limit?
3. **Diagnostic Telemetry**: Does the lesson collect actionable evidence across the 8 Layer B dimensions?
4. **Representation Validity**: Are all visual, auditory, and chunk representations clean, unambiguous, and age-appropriate?

### Audit Summary Classification:
- **`KEEP AS IS`**: 0 Lessons (All require diagnostic metadata headers).
- **`MINOR PATCH`**: 9 Lessons (Structure, pedagogy, and chunks are sound; require addition of micro-probe telemetry, uncertainty rechecks, and explicit modality labeling).
- **`MAJOR PATCH`**: 3 Lessons (Need structural adjustments to prevent vocabulary overload, decouple speaking from mastery, or fix abstract concept representation).

---

### Detailed Lesson-by-Lesson Audit Dossier

#### [Lesson 001: Who Am I? (Tôi là ai?)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-001.md)
- **Current Focus**: Self-introduction (`hello`, `bye`, `name`, `student`, `eleven`, `twelve`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - The lesson successfully prioritizes psychological safety, whisper rehearsal, and SafeHarbor scoring.
  - *Patch Needed*: Add explicit diagnostic micro-probes for `student` (Mode A: Sound $\to$ Image) and `eleven`/`twelve` (Numeral subitizing probe). Ensure `name` is clearly marked as an abstract communicative routine, NOT a flashcard image.

#### [Lesson 002: Things I Like (Những thứ con thích)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-002.md)
- **Current Focus**: Expressing preferences via `I like [X]` (`like`, `football`, `music`, `games`, `fish`, `math`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - High generative chunk (`I like...`). Excellent affective engagement.
  - *Patch Needed*: Introduce a Mode D minimal contrast probe (`like` vs `don't like`). Add explicit recheck of `student` from L-001. Ensure `games` visual is middle-school appropriate (controller/board game, not toddler toys).

#### [Lesson 003: Superpowers (Những việc con làm được)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-003.md)
- **Current Focus**: Expressing capabilities via `I can [verb]` (`can`, `swim`, `run`, `draw`, `cook`, `dance`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - Extremely strong kinetic action verbs. Inductive syntax works well.
  - *Patch Needed*: Embed kinetic micro-probes (Mode A: Sound $\to$ Dynamic Action Visual). Add contrast probe for `run` vs `walk`. Recheck auditory recognition of unreleased codas (`cook` /k/, `swim` /m/).

#### [Lesson 004: Survival English (Cứu tinh trong lớp học)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-004.md)
- **Current Focus**: Classroom help requests (`help`, `please`, `slowly`, `again`, `know`, `speak`).
- **Audit Verdict**: **`MAJOR PATCH`**.
- **Why Major Patch is Required**:
  1. *Abstract Vocabulary Overload*: Contains 6 highly abstract function words and adverbs (`slowly`, `again`, `know`, `please`, `help`, `speak`). None are concrete physical nouns.
  2. *Risk of Forced Clipart*: Attempting to teach `slowly` with snail pictures or `know` with lightbulb icons creates diagnostic confusion (`V2/V3`).
  3. *Restructuring*: Shift the entire lesson into **Situated Functional Classroom Roleplay**. Explicitly prohibit static flashcard testing for `know`, `please`, `slowly`. Test purely through live teacher tempo shifts (*"Teacher speaks too fast $\to$ student taps 'Slowly, please'"*).

#### [Lesson 005: What's In My Bag? (Có gì trong cặp của con?)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-005.md)
- **Current Focus**: School supplies (`bag`, `pen`, `book`, `ruler`, `pencil`, `rubber`, `this`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - Highly concrete, tangible school objects. Perfect fit for Mode A, Mode B, and Mode C probes.
  - *Patch Needed*: Deploy canonical `V0` visual cards (`IMG-G6-001` through `005`). Add specific distractor boundary checks between `pen` and `pencil`. Add demonstration routine for demonstrative `this` (near object).

#### [Lesson 006: Number Magic (Số đếm kỳ diệu 1–20)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-006.md)
- **Current Focus**: Counting and possession (`one`–`five`, `ten`, `have`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - Well-structured subitizing progression.
  - *Patch Needed*: Add rapid subitizing micro-probes (instant dot pattern recognition without counting fingers). Add Mode D contrast for `have` vs `like`. Recheck `eleven` and `twelve` from L-001.

#### [Lesson 007: How Are You Today? (Hôm nay con cảm thấy thế nào?)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-007.md)
- **Current Focus**: Emotions and physical states (`happy`, `tired`, `hungry`, `thirsty`, `cold`, `hot`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - Vital emotional agency vocabulary.
  - *Patch Needed*: Pair all states into mandatory contrast visual pairs (`hot` vs `cold`, `happy` vs `tired`, `hungry` vs `thirsty`). Enforce zero-text rule on `tired` (no 'ZZZ' symbols) and `hot/cold` (no thermometer numbers).

#### [Lesson 008: My Favorite Outfit (Trang phục yêu thích)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-008.md)
- **Current Focus**: Clothes and colors (`blue`, `black`, `white`, `red`, `shirt`, `shoes`, `wear`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - Concrete and relatable for secondary school dress codes.
  - *Patch Needed*: Separate color recognition from noun recognition. In diagnostic probes, avoid testing color and clothing on the same card simultaneously to prevent confounding variables.

#### [Lesson 009: Meet My Friend (Gặp gỡ bạn thân của con)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-009.md)
- **Current Focus**: Describing peers (`friend`, `he`, `she`, `funny`, `kind`, `smart`).
- **Audit Verdict**: **`MAJOR PATCH`**.
- **Why Major Patch is Required**:
  1. *Pronoun Conflation*: Lesson previously relied on static pictures of boys/girls to teach `he` and `she`. A picture of a boy can be labeled *boy, student, Nam, child*, causing false errors.
  2. *Abstract Trait Ambiguity*: Adjectives like `kind` and `smart` cannot be reliably diagnosed with a single static drawing without heavy cultural bias.
  3. *Restructuring*: Pronouns `he` and `she` must be taught via **triangular communicative pointing** (Teacher points to a male peer $\to$ *He*; points to female peer $\to$ *She*). Abstract traits must be contextualized in micro-stories (e.g. sharing an umbrella = *kind*).

#### [Lesson 010: My Secret Space (Căn phòng nhỏ của con)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-010.md)
- **Current Focus**: Bedroom objects and spatial existence (`bed`, `desk`, `chair`, `room`, `there`, `big`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - High personal ownership and comfort for 11–12yo.
  - *Patch Needed*: Embed Mode D contrast probe for `big` vs `small` (using identical color objects on same plane). Recheck furniture nouns (`desk` vs `chair`) using clean `V0` cards.

#### [Lesson 011: Animal Friends (Những người bạn có đuôi)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-011.md)
- **Current Focus**: Domestic pets (`dog`, `cat`, `bird`, `pet`, `cute`, `love`).
- **Audit Verdict**: **`MINOR PATCH`**.
- **Pedagogical Evaluation**:
  - High affective appeal. Keeps animal inventory tightly constrained to 3 universal domestic species.
  - *Patch Needed*: Deploy multi-representation variant visuals (`dog_v0` vs `dog_v1_corgi`) to test against visual over-fitting. Proactively recheck `like` and `have` from earlier units.

#### [Lesson 012: What Is That? (Cái đó là cái gì vậy?)](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/lessons/lesson-012.md)
- **Current Focus**: Deictic questions and classroom objects (`what`, `that`, `clock`, `board`, `phone`, `box`).
- **Audit Verdict**: **`MAJOR PATCH`**.
- **Why Major Patch is Required**:
  1. *Deictic Confusion*: Distinguishing `this` (near) vs `that` (far) cannot be tested with isolated object cards. Previous plan had learners tap pictures of objects to answer *"What is that?"*, confusing distance with object identity.
  2. *Over-Emphasis on Question Formation*: Asking a Pre-A1 false beginner to produce full question syntax orally too early triggers syntax freeze.
  3. *Restructuring*: Anchor `this` vs `that` in physical distance staging (near desk vs far wall). Measure comprehension via listening response (student touches near object for *this*, points to far object for *that*).

---

## 3. Implementation Plan for Lesson Patches

All 12 lessons remain fully valid in their core pedagogical progression. The architectural patches will be applied incrementally:
- Phase 1: Inject the standardized **Diagnostic Header & Telemetry Block** into Lessons 001–003 for the N=1 pilot.
- Phase 2: Restructure Lessons 004, 009, and 012 to remove abstract visual traps and deictic confusion.
- Phase 3: Incorporate multi-representation variants across Lessons 005–011.
