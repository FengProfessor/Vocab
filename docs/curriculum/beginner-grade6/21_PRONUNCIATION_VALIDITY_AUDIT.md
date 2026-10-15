# 21. Pronunciation Assessment & Speech Technology Validity Audit

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Status**: P0 Pedagogical Verification & Pilot Hardening  
> **Purpose**: Technical and pedagogical audit of speech recognition technologies, Levenshtein scoring limitations, and contrastive phonetics for young Vietnamese false beginners. Establishes fail-safe protocols to prevent software-induced language anxiety.

---

## 1. Executive Technical Reality: ASR vs. Human Phonetics

The LingoPro platform utilizes browser-based Automatic Speech Recognition (Web Speech API / SpeechRecognition) combined with a Normalized Levenshtein Distance algorithm (labeled `SafeHarbor` in draft documentation).

### The Critical Validity Breakdown:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE FATAL MEASUREMENT CONFLATION                         │
│                                                                             │
│  [Child's Spoken Audio] ──► [Browser ASR Engine] ──► [Transcribed Text]     │
│                                (Black Box)                  │               │
│                                                             ▼               │
│                                              [Normalized Levenshtein Match] │
│                                                             │               │
│                                                             ▼               │
│                                                [Numerical Score: 0–100%]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **ASR String Distance $\neq$ Phonetic Intelligibility**:
   - Levenshtein distance compares two **ASCII text strings** (Target Text vs. Transcribed Text).
   - It cannot measure acoustic formant trajectories, voice onset time (VOT), vowel duration, pitch contour, or articulatory accuracy.
2. **High Word Error Rates (WER) on Young Learner Speech**:
   - Commercial ASR acoustic models are trained primarily on adult native or near-native speakers.
   - Children aged 11–12 possess shorter vocal tracts, higher fundamental frequencies ($F_0$), and variable speech timing, causing ASR error rates to increase by $200–300\%$ compared to adults.
3. **Vietnamese L1 Acoustic Transfer Penalties**:
   - Sub-phonemic differences (e.g. slightly shorter vowel duration or slight tonal drift) that do NOT impair human intelligibility often cause browser ASR to misclassify tokens completely or return an empty transcript (`""`).
4. **The "Proper Name" Trap (Catastrophic Failure in Lesson 001)**:
   - When a student says: *"My name is Minh"*, the English ASR language model attempts to map the Vietnamese phoneme sequence /mïŋ/ to an English dictionary word, transcribing *"My name is mean"*, *"My name is me"*, or *"My name is man"*.
   - A naive Levenshtein score drops from $100\%$ to $45\%$, triggering a false error.

---

## 2. The Danger of False Negatives for Anxious Learners

In young learner remedial pedagogy, **the psychological cost of a false negative is catastrophic**:

| Scenario | System Behavior | Learner Cognitive & Emotional Reaction | Pedagogical Impact |
|---|---|---|---|
| **False Negative**<br>*(Child speaks intelligibly, but ASR fails)* | Red banner appears: *"Không đạt (48%). Thử lại!"* with an error buzzer sound. | *"Mình đã cố gắng hết sức, nói rõ ràng mà máy vẫn bảo sai. Mình thực sự không có khiếu học tiếng Anh."* | **Catastrophic Failure**: Confirms learned helplessness. Learner experiences immediate task withdrawal, freezes, and refuses to speak into the microphone again. |
| **False Positive**<br>*(Child produces imperfect sound, but system accepts)* | Green banner appears: *"Rất tốt! Thầy cô khen con!"* | *"Mình nói được rồi! Tiếng Anh không khó như mình nghĩ."* | **Minor Sub-optimal Event**: Child gains confidence and communicative momentum. Phonetic refinement can occur naturally in subsequent guided practice. |

> [!CAUTION]
> **Pedagogical Asymmetry Axiom**:
> At Pre-A1 Foundation Stage, **a false negative is 100 times more damaging than a false positive**.
> Under NO circumstances should automated speech scoring be used as a hard, blocking gatekeeper for lesson progression.

---

## 3. De-escalation & Re-engineering of "SafeHarbor"

To eliminate false-negative harm while preserving the gamified engagement of speech practice, the following software and instructional modifications are mandatory:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SAFE-HARBOR 2.0: NON-PUNITIVE ARCHITECTURE                  │
│                                                                             │
│  1. Soft Affirmation Feedback (No Red Scores, No Error Buzzers)             │
│  2. Two-Try Maximum with Automatic Soft Bypass                              │
│  3. Dual Verification: Machine Practice + Self-Declaration ("Con đã đọc")   │
│  4. Private Audio Playback (Listen to own voice without public judgment)   │
│  5. Name-Agnostic Masking (In L-001, evaluate frame "My name is" only)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Specific UI/UX Feedback Redesign:

| Attempt | Transcribed Match | Old Feedback (Rejected) | New Non-Punitive Feedback (Mandated) | System Action |
|---|---|---|---|---|
| **Try 1** | $\ge 70\%$ match | "Tuyệt vời! 85 điểm!" | "Giọng con rất rõ ràng! Tuyệt vời! 🌟" | Advance immediately; award star. |
| **Try 1** | $< 70\%$ match or empty | "Sai rồi! Thử lại! (42%)" ❌ | "Mic chưa bắt rõ âm thanh, con hãy nghe thầy cô nói lại một lần rồi thử lại nhé! 🎧" | Play model audio; display warm mic button. |
| **Try 2** | $\ge 70\%$ match | "Đã đạt! 72 điểm!" | "Rất tiến bộ! Con phát âm rất tự tin! 🌟" | Advance immediately. |
| **Try 2** | $< 70\%$ match or empty | "Thất bại. Con chưa hoàn thành bài tập!" ❌ | "Thầy cô ghi nhận con đã rất dũng cảm luyện nói! 👍 Con có thể chuyển sang bài tiếp theo." | Display two options:<br>1. *Thử lại lần nữa* (Voluntary)<br>2. *Tiếp tục bài học* (Non-blocking pass) |

---

## 4. Multidimensional Pronunciation Observation Rubric (Human Observation)

The linear 4-tier progression (*Non-Vocal $\rightarrow$ Syllabic Approximation $\rightarrow$ Audible Coda Release $\rightarrow$ Spontaneous Fluency*) is **formally retired**. It conceptually conflated participation, segmental articulation, final stop releases, intelligibility, and fluency into a single invalid hierarchy.

Teacher evaluation is **Human Observation** (not an infallible absolute standard), providing rich qualitative context that ASR cannot capture. The pilot evaluates speech across **five independent dimensions**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                 MULTIDIMENSIONAL PRONUNCIATION OBSERVATION RUBRIC (PRE-A1)                  │
├───────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ Dimension         │ Observable Evaluation Criteria                                          │
├───────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ **A. Intelligibility**│ • **Comprehensible**: Teacher immediately understands intended phrase.  │
│                   │ • **Context-Dependent**: Understood given picture/prompt context.       │
│                   │ • **Unclear**: Intended message is obscured or inaudible.               │
├───────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ **B. Target Feature**│ • **Attempted**: Learner consciously attempts the focal sound (e.g. /m/  │
│                   │   lip closure in *name*, /k/ tap in *like*, or /t/ tap in *can't*).     │
│                   │ • **Not Attempted**: Target feature omitted (e.g. *nay* for *name*).    │
│                   │ • **Hypercorrected**: Feature inserted where it does not belong.       │
├───────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ **C. Word Completeness**│ • **Complete**: Recognizable full lexical item produced.           │
│                   │ • **Truncated**: Word cut off prematurely (e.g. *stu-* for *student*).   │
├───────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ **D. Fluency**    │ • **Continuous**: Chunk produced smoothly as a single melodic unit.     │
│                   │ • **Segmented**: Word-by-word chopping with pauses between words.        │
│                   │ • **Broken**: Significant breakdown requiring restart.                  │
├───────────────────┼─────────────────────────────────────────────────────────────────────────┤
│ **E. Independence**│ • **Independent (I)**: Produced without immediate auditory model.      │
│                   │ • **Modelled (M)**: Produced immediately following teacher/audio model. │
│                   │ • **Prompted (P)**: Produced with visual gesture or binary choice hint. │
└───────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### Important Articulatory Clarification: No Exaggerated Stop Release
- **Goal = Comprehensible Speech, NOT Maximally Exaggerated Articulation**:
  - In natural English, final voiceless stops (/p, t, k/) in unreleased or glottalized positions are common (e.g. in *like football*, the /k/ does not require an explosive burst).
  - Learners must **NOT** be taught that every English final consonant requires an exaggerated puff of air or loud click.
  - The objective at Pre-A1 is simply to prevent word truncation (e.g. saying *nay* instead of *name*, or losing the contrast between *can* and *can't*).

---

## 5. Contrastive Phonetics: Optional Physical Articulatory Cues

Physical cues are **OPTIONAL MNEMONIC EXPERIMENTS** (`OPTIONAL CUE — PILOT AND OBSERVE`). They are not mandatory phonetic doctrine. If a learner finds a physical cue silly, confusing, or distracting, the teacher drops it immediately and uses natural auditory modeling.

| Target Phonological Feature | Vietnamese L1 Interference Pattern | Classroom Remedial Trap | Optional Mnemonic Cue (Pilot & Observe) | Target Words in L1–L3 |
|---|---|---|---|---|
| **Final /k/** | Unreleased glottal closure: *lai* for *like*. | Demanding loud, exaggerated coughing sound. | *Optional*: Back of tongue taps roof of mouth gently (*like*). | `like`, `cook` |
| **Final /s/** | Total omission due to zero coda fricatives (*games* $\rightarrow$ *game*). | Teaching plural grammar tables instead of auditory noticing. | *Optional*: Gentle air stream through front teeth on plural nouns. | `games` |
| **Final /t/ in *can't*** | Dropping /t/, collapsing *can* and *can't*. | Treating distinction as a written grammar error. | *Optional*: Tongue tip taps roof behind upper teeth for sharp stop. | `can't`, `student` |
| **Final /m/ in *name*** | Leaving lips open (*nay*). | Over-critiquing without demonstrating mouth. | *Optional*: Gently closing lips at the end of the word (*name*). | `name`, `swim` |
| **Hypercorrection** | Attaching /s/ randomly to vowels (*I-s like-s*). | Praising any /s/ output indiscriminately. | *Visual check*: Point out whether the written card has an ending 's'. | `games` |

---

## 6. Pilot Verification Protocol for Speech Tech

During the N=1 Pilot, the observer records:
1. **Device Context**: Device type, browser, internal vs external microphone.
2. **ASR Concordance**: Does browser ASR capture the utterance? (Log ASR output vs Human Observation side by side).
3. **Learner Experience with Mic**: Record learner's voluntary comfort with recording. ASR output is purely optional supporting data and **never determines task success**.

