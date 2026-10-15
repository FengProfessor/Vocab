# 22. Lessons 001–003 Granular Pedagogical Deep Audit

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Status**: P0 Pedagogical Verification & Pilot Hardening  
> **Target**: Lessons 001, 002, 003 (`docs/curriculum/beginner-grade6/lessons/lesson-001.md` to `003.md`)  
> **Purpose**: Word-by-word, minute-by-minute critical evaluation of the first 3 lessons prior to running the real N=1 pilot. Identifies cognitive bottlenecks, timing illusions, language balance flaws, and unrealistic assessment barriers.

---

## 1. Executive Findings: Lessons 001–003 Summary

| Lesson | Stated Objective | Target Active Words | Invariant Frames | Key Strengths | Identified Vulnerabilities & Flaws in Draft | Hardening Action Taken |
|---|---|---|---|---|---|---|
| **L-001** (`Who Am I?`) | Say name, age (11/12), and role as student. | `name`, `student`, `twelve`, `hello`, `bye` (5 items) | `My name is [Name]`, `I'm [Age] years old`, `I'm a student` (3 frames) | Highly relatable topic; immediate identity establishment; zero grammar rules. | 1. 7 phases in 45 minutes is too hurried for an anxious beginner.<br>2. Expecting a child to say *"years old"* in Lesson 1 increases cognitive overload.<br>3. Automated SafeHarbor speech scoring fails on Vietnamese names (*Minh, Lan*). | 1. Simplify to 5 realistic instructional phases.<br>2. Accept *"I'm 12"* as full credit; treat *"years old"* as optional receptive exposure.<br>3. Remove automated ASR gate for names; use human teacher confirmation. |
| **L-002** (`Things I Like`) | Express 2 likes and 1 dislike using full sentences. | `like`, `don't like`, `football`, `games`, `music`, `fish` (6 items) | `I like [Noun]`, `I don't like [Noun]` (2 frames) | Clear S-V-O slot building; high-contrast positive vs. negative feelings; relatable topics (games, sports). | 1. Introducing both affirmative `like` and negative `don't like` in the same lesson can cause element interactivity overload if done simultaneously.<br>2. Risk of hypercorrection with final /k/ or random /s/. | 1. Sequence strictly: Master `I like [X]` first (Phases 1–3) before introducing `I don't like [Y]` (Phase 4).<br>2. Use thumbs-up / thumbs-down visual paddles to ground meaning. |
| **L-003** (`Superpowers`) | Express 2 abilities and 1 inability using modal *can / can't*. | `can`, `can't`, `swim`, `run`, `draw`, `cook` (6 items) | `I can [Verb]`, `I can't [Verb]` (2 frames) | Empowering theme for 11–12yo; physical actions are easily mimed; contrasts with babyish content. | 1. Acoustic distinction between /kən/ (can) and /kænt/ (can't) is difficult for Vietnamese ears due to unreleased final /t/.<br>2. Risk of syntax confusion with previous `like` structure (*I can like swim*). | 1. Explicit acoustic ear-training on sharp /t/ release.<br>2. Color-code Action cards (Orange) distinct from Object cards (Yellow). |

---

## 2. Granular Word-by-Word & Task Audit: Lesson 001

### A. Cognitive Load & Element Interactivity
- **Active Words**: `hello`, `bye`, `name`, `student`, `twelve` (or `eleven`).
  - *Audit*: `hello` and `bye` are almost universally recognized by Vietnamese 6th graders (low intrinsic load). The true new learning load is focused on `name`, `student`, and numbers `11 / 12`.
  - *Vulnerability*: Requiring `years old` in oral production forces the child to manage 3 distinct words (*year*, plural *-s*, and *old*) while simultaneously retrieving their age number.
  - *Correction*: **Accept "I'm 12" as complete, valid communication**. Expose `years old` receptively through the avatar, but do NOT penalize or prompt for it if the child omits it.

### B. Teacher Talk: Vietnamese vs. English Balance
- **Current Balance**: Approximately 65% Vietnamese, 35% English.
- *Audit*: For an anxious Pre-A1 beginner in their first 45 minutes, this ratio is psychologically appropriate. Vietnamese provides emotional de-escalation and clarity, while English is used exclusively for modeled utterances, praise, and choral repetition.
- *Tone Check*: The Vietnamese phrasing (*"Các con thấy không, từ đầu tiên là Hello..."*) is warm, respectful, and avoids babyish patronizing language. It treats the 12-year-old with dignity.

### C. Realistic Timing & Pacing Breakdown
- *Draft Pacing (Rejected as Unrealistic)*: 7 phases (0–5, 5–13, 13–20, 20–28, 28–36, 36–41, 41–45). A child hesitating for 15 seconds before speaking would derail this timetable by minute 20.
- *Hardened Pacing (Mandated for Pilot)*: **5 Flexible Phases**:
  1. **Phase 1: Welcome & De-escalation (0–8m)**: Establish emotional safety, smile, confirm zero pressure.
  2. **Phase 2: Avatar Story & Listening Discovery (8–18m)**: Listen to "Super Nam" at 0.8x; answer binary questions in Vietnamese.
  3. **Phase 3: Mouth Gym & Acoustic Check (18–26m)**: Focus on closing lips for /m/ in *name*.
  4. **Phase 4: S-V-O Sentence Assembly & Low-Stakes Practice (26–38m)**: Tactile magnetic word cards; rolling ball game with binary choices.
  5. **Phase 5: Celebration & Can-Do Badge (38–45m)**: Individual declaration, victory high-five, no testing.

---

## 3. Granular Word-by-Word & Task Audit: Lesson 002

### A. Cognitive Load & Task Sequencing
- **Core Linguistic Structure**: S-V-O Frame with preference verbs: `I like [Noun]` / `I don't like [Noun]`.
- *Audit*: Introducing both positive and negative forms in one lesson is pedagogically feasible ONLY IF they are cleanly compartmentalized.
- *Sequential Safeguard*:
  - **Block 1 (Minutes 0–22)**: Exclusively focus on `I like [games / football / music]`. Achieve $100\%$ positive momentum.
  - **Block 2 (Minutes 22–35)**: Introduce `I don't like [fish / math]` as a dramatic, funny contrast (using funny facial expressions: *yuck!*).
  - *Never* mix both into a random shuffle until the learner has demonstrated mastery of the positive frame.

### B. Pronunciation & Articulatory Traps
- **Trap 1: The Swallowed /k/**: Saying *I lai* instead of *I like*.
  - *Pedagogical Solution*: Physical mnemonic "The Clean Throat Tap". The child places their hand on their throat to feel the gentle tap of air.
- **Trap 2: The Hypercorrection /s/**: Saying *I like-s football*.
  - *Pedagogical Solution*: Visual anchor. Show that the word card `like` has no 's' at the end. Reserve /s/ strictly for the noun `games`.

---

## 4. Granular Word-by-Word & Task Audit: Lesson 003

### A. Cognitive Load & Thematic Appropriateness
- **Theme**: "Superpowers" (Actions I can / can't do).
- *Audit*: Excellent developmental fit for 11–12-year-olds. Superheroes, gaming avatars, and special abilities are age-appropriate and avoid the childishness of basic primary school worksheets.
- *Verb Selection Check*: `swim`, `run`, `draw`, `cook`.
  - All 4 verbs are concrete, visually demonstrable, and physically actionable in a classroom or 1-on-1 setting.
  - The contrast between `cook` (most 12yo children cannot cook complex meals) and `draw`/`run` creates authentic personal communication with humor.

### B. Articulatory Contrast: /kən/ vs /kænt/
- **Phonetic Reality**: In connected speech, native speakers reduce *can* to /kən/ and emphasize the main verb (*I can SWIM*), while *can't* receives full vowel stress and a glottalized or released coda /t/ (*I CAN'T cook*).
- *Pre-A1 Remedial Approach*: Do not confuse the child with schwa reductions. Focus exclusively on:
  - *Positive*: Smooth, relaxed flow: *"I can swim"*.
  - *Negative*: Sharp, audible tongue-tip click /t/ on *can't*: *"I can't cook!"*.

---

## 5. Technology & Platform Audit for Lessons 001–003

### A. Flashcard & S-V-O Builder Alignment
- Digital exercises must strictly match the vocabulary and frames taught:
  - L-001 Builder Chips: `[My name is]` + `[Name]`; `[I'm]` + `[11 / 12]`; `[I'm a]` + `[student]`.
  - L-002 Builder Chips: `[I]` + `[like / don't like]` + `[games / football / music / fish / math]`.
  - L-003 Builder Chips: `[I]` + `[can / can't]` + `[swim / run / draw / cook]`.
- All chips must be color-coded consistently: Blue for Subjects/Frames, Green for Positive Predicates, Red for Negative Predicates, Orange for Actions, Yellow for Nouns.

### B. Microphone Integration Decoupling
- In Lessons 001–003, the app microphone is labeled **"Phòng Luyện Giọng Riêng Tư" (Private Voice Rehearsal)**.
- If the browser ASR fails to transcribe the child's recording, the app shows:
  *"Thầy cô đã nghe thấy con luyện nói! Rất tuyệt vời! Con có muốn nghe lại giọng của mình không?"*
- Under no circumstances will a low score or red banner appear. The student receives their completion badge upon completing the recording attempt.
