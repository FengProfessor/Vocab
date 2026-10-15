# 43. Lesson 001 Mission Task Pack: "Survive Your First Day at School"

> **Document Class**: Learner-Facing Activity & Task Specification Pack  
> **Course**: English From Zero — LingoPro Foundation Curriculum  
> **Target Audience**: 11–12 year old Vietnamese Grade-6 students  
> **Spine Alignment**: Tiếng Anh 6 — Global Success (Unit 1: My New School)  
> **Copyright Integrity**: 100% original pedagogical design; zero copyrighted text copied.

---

## MISSION A: THE SCHOOL BAG CHALLENGE

### Activity Card A1: The Core 4 Rapid Probe (Level F)
* **Objective**: Establish baseline sound-to-visual recognition for the four canonical pilot items.
* **Stimulus & Interaction Specification**:

```
[ SCREEN DISPLAY: 4-Grid Interactive Pad ]
Top Banner: "Nghe và chạm vào đúng đồ vật trong ba lô của bạn"
Sound Button: [ ▶ PLAY AUDIO ]

PROMPT 1:
- Audio Asset: "school_bag_audio_01.mp3" ("A school bag.")
- Options:
  [A] bag_v1.jpg (Correct Target)
  [B] distractor_shoes.jpg
  [C] distractor_hat.jpg
- Scoring: Independent selection within generous window (≤8s) = Level F Pass.

PROMPT 2:
- Audio Asset: "pen_audio_01.mp3" ("A blue pen.")
- Options:
  [A] distractor_eraser.jpg
  [B] pen_v1.jpg (Correct Target)
  [C] distractor_ruler.jpg

PROMPT 3:
- Audio Asset: "book_audio_01.mp3" ("An English book.")
- Options:
  [A] distractor_clock.jpg
  [B] distractor_bottle.jpg
  [C] book_v1.jpg (Correct Target)

PROMPT 4:
- Audio Asset: "drink_audio_01.mp3" ("A bottle of water for school.")
- Options:
  [A] drink_v1.jpg (Correct Target)
  [B] distractor_sandwich.jpg
  [C] distractor_apple.jpg
```

---

### Activity Card A2: The Lexical Boundary Trap (Level B)
* **Objective**: Disentangle high-frequency false beginner confusions.

#### Battle 1: Pen vs Pencil Duel
* **Visual Stimulus**: Side-by-side display of `pen_v1.jpg` (ink ballpoint) and `pencil_v1.jpg` (yellow graphite pencil).
* **Audio Prompt**: *"You need to write in your notebook with dark blue ink. Tap the **pen**."*
* **Response Logic & Telemetry**:
  - *If User Taps [Pen]*: Sound chime + Badge Fragment + Tag: `EXACT_MATCH`.
  - *If User Taps [Pencil]*: Friendly pop-up:
    > *"Gần đúng rồi! Đây là chiếc bút chì gỗ (pencil) để vẽ hình. Cây bút mực xanh (pen) nằm ở đây này!"*
    - Tag: `RELATED_MISCLASSIFICATION`, `Gap: "PEN_PENCIL_CONTRAST"`.

#### Battle 2: Book vs Notebook Duel
* **Visual Stimulus**: Side-by-side display of `book_v1.jpg` (printed textbook with chapters) and `notebook_v1.jpg` (blank ruled lines).
* **Audio Prompt**: *"Vy wants to write new English words. Which one is her **notebook**?"*
* **Response Logic & Telemetry**:
  - *If User Taps [Notebook]*: Pass.
  - *If User Taps [Book]*: Friendly distinction:
    > *"Đây là cuốn sách giáo khoa (book) để đọc bài. Cuốn vở trắng để ghi bài là **notebook**!"*
    - Tag: `RELATED_MISCLASSIFICATION`, `Gap: "BOOK_NOTEBOOK_CONTRAST"`.

---

### Activity Card A3: The 30-Second Weight Puzzle (Level X)
* **Objective**: High cognitive problem-solving under constraints using English lexical reading.
* **Mission Brief**:
  > *"Trường THCS quy định ba lô không được nặng quá 3.0 kg để bảo vệ cột sống học sinh. Ngày mai là Thứ Ba, bạn có 3 môn: **Maths, English, Art**. Hãy chọn đúng và đủ đồ dùng học tập mà không làm cặp bị quá cân!"*
* **Item Inventory & Weights**:

| Item Label (English) | Weight (kg) | Category | Required for Tuesday? | Trap Status |
|---|---|---|---|---|
| `Maths Textbook` | 0.5 kg | Book | YES (Maths) | Essential |
| `English Textbook` | 0.5 kg | Book | YES (English) | Essential |
| `English Notebook` | 0.3 kg | Notebook | YES (English) | Essential |
| `Pencil Case with Pens` | 0.3 kg | Stationery | YES (All subjects) | Essential |
| `Art Drawing Pad & Colors` | 0.8 kg | Art Supplies | YES (Art) | Essential |
| `Water Bottle` | 0.5 kg | Drink | Optional/Health | Good choice (Total: 2.9 kg) |
| `Heavy Comic Book Collection` | 1.4 kg | Entertainment | NO | **TRAP!** (Pushes total to 4.3 kg) |
| `Football` | 0.6 kg | Sports | NO (No PE tomorrow) | **TRAP!** |

* **Interactive Gameplay**:
  - Dragging items into the backpack updates a real-time weight gauge (`0.0 kg / 3.0 kg`).
  - If learner adds `Heavy Comic Book`: Gauge turns Yellow/Orange with warning: *"Cặp đã gần đầy! Kiểm tra lại thời khóa biểu xem có cần truyện tranh không nhé!"*
  - Success condition: All 3 subjects covered + Weight $\le 3.0$ kg.

---

## MISSION B: DECODE THE TEACHER (Classroom Commands)

### Activity Card B1: Audio-to-Action Rapid Response
* **Objective**: Comprehend spoken classroom imperatives without Vietnamese translation.

```
[ SCENE: Grade 6 Classroom Whiteboard ]
Speaker icon plays classroom audio. Learner interacts with desk workspace.

TASK 1:
- Audio: "Good morning class! Please OPEN your book to page 10."
- Action: Learner swipes right on the closed book on desk to reveal page 10.
- Receptive Cue: Keyword "OPEN" + "BOOK".
- Distractor Action: Tapping bag or closing notebook.

TASK 2:
- Audio: "Take out your blue PEN and WRITE down the date."
- Action: Learner drags the blue pen from the pencil case onto the notebook line.
- Receptive Cue: Keyword "PEN" + "WRITE".

TASK 3:
- Audio: "Listen carefully. Put your pens DOWN and LOOK at the board."
- Action: Learner releases pen and taps the classroom whiteboard.
- Receptive Cue: Keyword "DOWN" + "LOOK".

TASK 4:
- Audio: "The bell is ringing! CLOSE your bags, please."
- Action: Learner clicks the zipper icon on the school bag.
- Receptive Cue: Keyword "CLOSE" + "BAG".
```

* **Adaptive Telemetry**:
  - Immediate correct interaction within 6s: `INDEPENDENT_COMMAND_RECEPTIVE_PASS`.
  - Pause after 8s: System plays an animated visual hint (glowing yellow circle around the book).
  - Click after hint: `HINT_ASSISTED_PASS` (recorded for review, not scored as independent).

---

## MISSION C: THE LANGUAGE PUZZLE (S-V-O Sentence Builder)

### Activity Card C1: Tactile Syntax Construction
* **Objective**: Overcome Vietnamese word-by-word literal translation; assemble authentic Global Success sentences.

#### Puzzle 1: First Day Equipment
* **Vietnamese Meaning Prompt (Discreet footnote)**: *"Tôi có sách mới."*
* **Available Magnetic Word Blocks**:
  - `[ I ]` (Blue / Subject)
  - `[ have ]` (Orange / Verb)
  - `[ am ]` (Orange / Distractor Verb)
  - `[ new books ]` (Green / Object)
  - `[ new book ]` (Green / Distractor Singular)
* **Valid Assembly**: `[ I ]` + `[ have ]` + `[ new books ]`
* **Error Trap Handling**:
  - If learner snaps: `[ I ] [ am ] [ new books ]`:
    - Immediate scaffold: *"Trong tiếng Anh, 'am' là 'thì/là' (Tôi là sách mới à? Không phải đâu!). Để nói 'có', ta dùng **have** nhé!"*

#### Puzzle 2: School Uniform
* **Vietnamese Meaning Prompt**: *"Chúng tôi mặc đồng phục."*
* **Available Blocks**:
  - `[ We ]` (Blue)
  - `[ wear ]` (Orange)
  - `[ study ]` (Orange / Distractor)
  - `[ uniforms ]` (Green)
* **Valid Assembly**: `[ We ]` + `[ wear ]` + `[ uniforms ]`

#### Puzzle 3: Academic Routine
* **Vietnamese Meaning Prompt**: *"Tôi học Tiếng Anh và Toán."*
* **Available Blocks**:
  - `[ I ]` (Blue)
  - `[ study ]` (Orange)
  - `[ play ]` (Orange / Distractor)
  - `[ English and Maths ]` (Green)
* **Valid Assembly**: `[ I ]` + `[ study ]` + `[ English and Maths ]`

---

## MISSION D: CRAFT YOUR SCHOOL IDENTITY BADGE

### Activity Card D1: The Explorer Profile Builder
* **Objective**: Creative productive personalization and SafeHarbor speech rehearsal.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GRADE 6 EXPLORER IDENTITY BADGE                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [ PHOTO / AVATAR ]                                                   │
│   Select Avatar: [ 👦 Nam ] [ 👧 Linh ] [ 🤖 Cyber-Pup ] [ 🧙 Ninja ] │
│                                                                        │
│   NAME:                                                                │
│   "Hello! My name is ________________________."                       │
│                                                                        │
│   MY SCHOOL BAG:                                                       │
│   "In my bag, I have [a blue pen] and [three notebooks]."              │
│   (Humorous option available: "and a magic dragon sticker!")           │
│                                                                        │
│   MY FAVORITE SUBJECTS:                                                │
│   "At school, I study [English] and [Maths / Science / Art]."          │
│                                                                        │
│   [ 🎙️ TAP TO READ YOUR BADGE ALOUD ]                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

* **Speech Evaluation Parameters (SafeHarbor)**:
  - **Focus 1**: Releasing final consonant /k/ in *"book"*.
  - **Focus 2**: Releasing final sibilant /z/ in *"pens"* / *"uniforms"*.
  - **Encouragement Logic**:
    - Even with partial phonological errors, celebrate task completion:
      > *"Huy hiệu Thám hiểm Lớp 6 đã kích hoạt! Bạn đã hoàn thành xuất sắc 4 nhiệm vụ sinh tồn ngày đầu tiên!"*
    - The audio sample is stored for teacher review and automated gap mapping.

---

*Authored by LingoPro Curriculum Architecture & Forensics Core Team.*
