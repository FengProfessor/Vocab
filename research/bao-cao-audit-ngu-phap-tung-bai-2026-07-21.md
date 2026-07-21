# Báo cáo audit ngữ pháp LingoPro — soi từng bài (giáo viên khắt khe)

**Ngày:** 2026-07-21  
**Nguồn data:** Supabase `grammar_topics` + `grammar_lessons` (dump live)  
**Nguồn chuẩn:** NotebookLM `LingoPro Method Wow Grammar Self-Study` (query 2026-07-21) + Form–Meaning–Use / EPI  
**File dump:** `tmp/grammar-audit-dump.json`, `tmp/grammar-audit-summary.md`, `tmp/grammar-lesson-*.json`

---

## 0. Tóm tắt điều hành (đọc 30 giây)

| Chỉ số live | Giá trị | Đánh giá |
|---|---|---|
| Topics / Lessons | **62 / 62** (1 topic = 1 lesson) | Quá phẳng; không unit/module |
| `sections` (Golden Lesson) | **0/62** | UI Golden **không chạy** → rơi về blob `theory_vi` |
| Examples / bài | **~6** gần như mọi bài | Dưới chuẩn (cần ≥3 ví dụ **mỗi quy tắc**) |
| Quiz / bài | **80–111** | **Bloat** — tạp, không gắn case; bot cap 100 |
| Theory | 1.6–3k chars, **cùng template** | Không bảng case, không list bất quy tắc đầy đủ |
| Dup title | 0 | Nhưng **chồng chéo nội dung** nặng (articles/countable/quantifiers) |
| Thứ tự A0 | plural (5) → … → countable (17) | **Lộn**: số nhiều trước khi dạy C/U |

**Verdict:** Không phải “thiếu vài ví dụ”. Hệ thống đang **mass-generate cùng khuôn** (Khi nào dùng / Công thức / Lỗi / Mẹo / So sánh + 80 quiz). Dạy được recognition nông; **không dạy đủ case để làm bài tập có chủ đích**.

**Chốt hướng:**  
1) Cắt syllabus A0–A1 còn **~20–24 bài** (freeze/hide B2–C1 trong UI beginner).  
2) Viết lại **sections JSON** + bảng case + examples theo rule.  
3) Quiz **12–30 item/bài**, map theo case (không 80 item random).  
4) Pilot rewrite **cụm Danh từ** (4–5 bài) trước khi đụng 62.

---

## 1. Chẩn đoán hệ thống (áp dụng 62/62)

### 1.1 Mọi bài = cùng “khuôn AI”

Template lặp:

```
Mở đầu định nghĩa
## Khi nào dùng (3–4 bullet)
## Công thức (3–5 dòng form/structure)
## Lỗi thường gặp (3–5 ❌→✅)
## Mẹo nhớ
## So sánh
```

→ Học sinh thấy **từ bài 1 đến 62 y hệt bố cục**, khác mỗi “nhãn” ngữ pháp. Không có:

- Bảng case đầy đủ (regular / irregular / zero plural…)
- Mini-table irregular plurals (man→men, child→children…)
- Input flood đoạn ngắn
- Sentence builder
- Phân tầng A0 vs A1 trong cùng topic

### 1.2 `sections = null` trên toàn bộ

UI (`grammar/learn`) ưu tiên `GoldenLesson` khi có `sections`. **62/62 không có** → chỉ render markdown `theory_vi` + 6 example cards + quiz bloat.

### 1.3 Quiz bloat (bot)

- Mỗi bài **80–111** câu (mcq/fill/error/tf).
- `bot/grammar/save` **cap 100** và merge — khuyến khích **nhồi** chứ không thiết kế.
- Không metadata `case_id` / `skill` → không biết câu đang test rule nào.
- User cảm giác: **tạp nham, lặp, không bố cục**.

### 1.4 Examples mỏng + annotation nặng

- 6 examples/bài, mỗi cái có `annotations` dài (role/start/end) — tốt cho UI highlight, **không đủ case**.
- Chuẩn NLM: **≥3 ví dụ / mỗi quy tắc** (riêng -s/-es/-ies/-ves + 3 irregular families).

### 1.5 Thứ tự lộ trình — lỗi nghiêm trọng

| # hiện tại | Topic | Vấn đề |
|---|---|---|
| 5 | plural-nouns | Số nhiều **trước** countable/uncountable (#17) |
| 8 | articles | a/an/the **trước** C/U — HS chưa phân biệt được danh từ |
| 17 | countable-uncountable | Quá muộn; nên **trước** plural + articles |
| 18 | quantifiers | some/any/much/many — OK sau C/U, nhưng C/U đang #17 |
| 1–4 | pronouns → to be → demonstratives → possessives | Hợp lý hơn, nhưng **thiếu “What is a noun?”** mở đầu |
| 29–62 | intermediate/advanced | Đưa beginner vào full catalog → **lộn cấp / ngợp** |

### 1.6 Chồng chéo (không phải dup title)

- **articles** ↔ **countable** ↔ **quantifiers**: cùng nói a/an/some/any  
- **modals** 3 bài liên tiếp (permission/obligation/advice) có thể gộp module  
- **conditionals** 0-1 / 2 / 3 / mixed / wish — beginner không cần full stack  
- **passive basic + advanced**, **relative basic + advanced** — tách cấp OK nhưng UI không gate rõ theo roadmap A0–A1

---

## 2. Soi sâu 3 bài “Danh từ” (minh họa đúng nỗi đau user)

### 2.1 `plural-nouns` (#5) — **FAIL chuẩn giáo viên**

**Có:**
- 5 “form” dòng: +s / +es / y→ies / f→ves / irregular (1 dòng)
- 3 lỗi thường gặp
- 6 examples (buses, babies, knives…)
- 80 quiz

**Thiếu (bắt buộc nếu muốn làm bài tập):**

| Case cần list | Hiện trạng | Cần |
|---|---|---|
| /s/ /z/ /ɪz/ (phát âm số nhiều) | **0** | ≥3 ví dụ mỗi allomorph |
| -es sau s/x/z/ch/sh | 1 dòng + 1 example | Bảng 6–8 từ |
| consonant+y → ies | 1 dòng | ≥3 (baby/city/fly) |
| vowel+y → ys | **0** (boy→boys) | ≥2 — tránh overgeneralize |
| f/fe → ves + ngoại lệ (roofs, beliefs) | 1 dòng | Bảng + 2 ngoại lệ |
| Irregular vowel change | 1 example child | Bảng man/men, woman/women, foot/feet, tooth/teeth |
| Zero plural | sheep 1 dòng | fish/sheep/deer + note |
| people / children / teeth | mơ hồ | Tách pattern |
| Nouns always plural (scissors, trousers) | **0** | A1 optional |
| Spelling double consonant (quizzes) | **0** | optional |

**Theory “Công thức”** chỉ 5 dòng bullet — **không đủ để tự làm 80 quiz irregular**.

**Điểm giáo viên:** **3/10** (có khung, thiếu case, quiz không map rule).

### 2.2 `countable-uncountable` (#17) — **FAIL bố cục + lộn chỗ**

**Có:** định nghĩa C/U, some/any, 5 lỗi, 6 examples, 88 quiz.

**Hỏng nặng:**
- Mục **Công thức** copy nhầm khung **Present Simple** (+/−/? với do/does) — **không phải grammar của C/U**. Đây là lỗi content generation nghiêm trọng.
- Thiếu bảng: common uncountable (advice, information, furniture, homework, news, money, rice, water, hair…)
- Thiếu unitisers: a piece of / a bottle of / a glass of
- Thiếu “borderline” (coffee as C vs U)
- Đặt **sau** plural & articles → HS học a/an khi chưa có C/U

**Điểm:** **2.5/10**.

### 2.3 `articles` (#8) — **MỎNG case**

**Có:** a/an phụ âm–nguyên âm, the cụ thể, 5 lỗi.

**Thiếu:**
- a/an theo **âm** (hour → an, university → a) — chỉ nói “nguyên âm chữ cái”
- zero article (play football, go to school, languages)
- the với duy nhất (the sun) có 1 lỗi nhưng không systematize
- generic plurals (Dogs are…) vs the dogs
- Không gắn bắt buộc với C/U

**Điểm:** **4/10**.

---

## 3. Chuẩn 1 bài “vàng” theo NLM (checklist áp dụng)

### Phases (A0–A1, teen VN)

1. **Noticing** (nghe/nhìn s–es)  
2. **Mental model** (C/U + Regular/Irregular map)  
3. **Input flood** đoạn ngắn highlight  
4. **Receptive** (sort / true-false)  
5. **Controlled production** (sentence builder / fill)  
6. **Error correction** (5 lỗi có chủ đích)

### Minimum content density

| Thành phần | Tối thiểu |
|---|---|
| Case/rule cards | Mọi rule có **tên + form + ≥3 ví dụ EN+VI** |
| Irregular table | Nhóm pattern (không list alphabet mù) |
| Examples UI | ≥ **12–18** (3× số rule chính) |
| Quiz core | **12–20** item map `case_id` (A0) · **20–30** (A1) |
| Quiz optional bank | +10 review spaced — **không** 80 random |
| Common VN errors | ≥5, có giải thích L1 transfer |

### Quiz design (thay bloat)

```
10 receptive (sort / choose form)
10 grammaring (MC/fill đúng case)
5–10 edit paragraph (error)
```
Tổng **25–30**, gắn `case_id`: `plural_es | plural_ies | irregular_vowel | uncount_no_s | ...`

---

## 4. Syllabus A0–A1 đề xuất (24 bài) — merge/split

> Freeze #29–62 khỏi path beginner (vẫn DB, ẩn UI theo roadmap level).

### Module 1 — Noun phrase (sửa lõi user complaint)

| # mới | Bài | Ghi chú |
|---|---|---|
| 1 | Danh từ: common vs proper | **Mới** — hiện thiếu |
| 2 | Countable vs Uncountable (+ unitisers) | **Kéo lên đầu**; rewrite công thức (bỏ do/does) |
| 3 | Plural regular (+s/es/ies/ves) + phát âm /s z ɪz/ | Tách từ plural-nouns |
| 4 | Plural irregular (bảng pattern) | Tách; table đầy đủ |
| 5 | Articles a/an/the (+ zero cơ bản) | Sau C/U |
| 6 | Quantifiers some/any/much/many/a lot of | Sau C/U+articles |

### Module 2 — Subject / be / determiners

| # | Bài |
|---|---|
| 7 | Personal pronouns (S/O) |
| 8 | Verb to be (+/−/?) |
| 9 | Demonstratives this/that/these/those |
| 10 | Possessives my/mine + 's |

### Module 3 — Sentence & Present Simple

| # | Bài |
|---|---|
| 11 | SVO skeleton + object pronouns |
| 12 | Present Simple +/− (agreement) |
| 13 | Present Simple questions (Yes/No + Wh-) |
| 14 | Adjectives (word order VN conflict) |
| 15 | There is/are |
| 16 | Have got |

### Module 4 — Place / time / frequency / can

| # | Bài |
|---|---|
| 17 | Prepositions place |
| 18 | Prepositions time |
| 19 | Adverbs of frequency |
| 20 | Can/can't |

### Module 5 — Continuous + contrast

| # | Bài |
|---|---|
| 21 | Present Continuous +/−/? |
| 22 | Present Simple vs Continuous |

### Module 6 — Past / Future cơ bản

| # | Bài |
|---|---|
| 23 | Past Simple be + regular -ed |
| 24 | Past Simple irregular high-freq + be going to / will intro |

**Merge đề xuất:**  
- modals permission+obligation+advice → 1 module sau A1  
- conditionals 0+1 only ở cuối A1; 2/3/mixed → B1+  

**Split đề xuất:**  
- plural regular ≠ irregular  
- present simple +/− ≠ questions  
- past regular ≠ irregular  

---

## 5. Ma trận “giữ / rewrite / ẩn / gộp” (toàn catalog — tóm tắt)

| Nhóm order | Hành động |
|---|---|
| #1–4 pronouns, be, demonstratives, possessives | **Rewrite** density + sections |
| #5 plural | **Split + rewrite** (case tables) |
| #6 adjectives | Rewrite word-order focus |
| #7 there is/are | Rewrite (sau nouns) |
| #8 articles | Rewrite sau C/U |
| #9 have got | OK keep, rewrite examples |
| #10–13 present simple / wh / freq / continuous | Split PS; add contrast lesson |
| #14–16 place, imperatives, can | Keep order sau core |
| #17–18 C/U, quantifiers | **Move up** + rewrite (fix formula bug) |
| #19–28 time, past, future, comparative, modals, cond 0-1 | A1 later; rewrite gradually |
| #29–62 intermediate/advanced | **Hide** on beginner path; gate roadmap |

---

## 6. Spec rewrite pilot — bài “Danh từ số nhiều (regular)” (1 bài mẫu)

### `sections` JSON skeleton (Golden)

```json
{
  "version": 1,
  "level": "A0-A1",
  "goals_vi": ["Nhận diện số nhiều", "Viết đúng -s/-es/-ies/-ves", "Phát âm /s z ɪz/"],
  "cases": [
    {
      "id": "plural_s",
      "title_vi": "Thêm -s (thường)",
      "form": "N + s",
      "examples": [
        {"en": "one cat → two cats", "vi": "..."},
        {"en": "a book → books", "vi": "..."},
        {"en": "a day → days", "vi": "..."}
      ]
    },
    {
      "id": "plural_es",
      "title_vi": "-es sau s/x/z/ch/sh",
      "form": "N + es",
      "examples": [ "...≥3" ]
    },
    {
      "id": "plural_ies",
      "title_vi": "phụ âm + y → ies",
      "examples": [ "...≥3" ]
    },
    {
      "id": "plural_ys",
      "title_vi": "nguyên âm + y → ys",
      "examples": [ "boy→boys", "key→keys" ]
    },
    {
      "id": "plural_ves",
      "title_vi": "f/fe → ves (+ ngoại lệ)",
      "examples": [ "...≥3 + roofs/beliefs" ]
    }
  ],
  "tables": {
    "pronunciation": [
      {"sound": "/s/", "examples": ["cats", "books", "cups"]},
      {"sound": "/z/", "examples": ["dogs", "bags", "days"]},
      {"sound": "/ɪz/", "examples": ["buses", "boxes", "dishes"]}
    ]
  },
  "vn_traps": [
    {"wrong": "three book", "right": "three books", "why_vi": "VN không biến hình danh từ"}
  ],
  "input_flood_en": "short paragraph with bold plurals",
  "exercises_plan": {
    "total": 24,
    "by_case": { "plural_s": 4, "plural_es": 4, "plural_ies": 4, "plural_ys": 2, "plural_ves": 3, "mixed": 7 }
  }
}
```

### Bài “Irregular plurals” (tách)

Bảng pattern tối thiểu A1:

| Pattern | SG → PL |
|---|---|
| Vowel change | man→men, woman→women, foot→feet, tooth→teeth |
| -en | child→children |
| people | person→people |
| Zero | sheep, fish, deer |
| (optional) | mouse→mice, leaf→leaves đã ở regular ves |

---

## 7. Kế hoạch triển khai (không “sửa 62 trong 1 ngày”)

### Sprint 0 (1–2 ngày) — **ngay**
1. Báo cáo này + freeze UI: beginner chỉ thấy **order ≤ 28** hoặc whitelist 24 slug.  
2. Flag nội bộ `content_grade: fail|pass` trên dump.  
3. **Hotfix** `countable-uncountable` formula (bỏ do/does giả) — P0 content bug.

### Sprint 1 (3–5 ngày) — **Module Danh từ**
Rewrite + re-order:
1. noun-intro (new)  
2. countable-uncountable  
3. plural-regular  
4. plural-irregular  
5. articles  
6. quantifiers  

Mỗi bài: `sections` full + 15–25 examples + 20–30 quiz có `case_id`.

### Sprint 2 — Module Be / Pronouns / SVO / Present Simple  
### Sprint 3 — Continuous / Prep / Can / Past light  
### Sprint 4 — Quiz cleanup: script cắt bank cũ → chỉ giữ item có case_id; archive bloat  

### Tooling
- Script audit: `scripts/audit-grammar-dump.mjs` (đã có)  
- Authoring: **cấm** bot nhồi 100 câu không case  
- Checklist PR: không merge lesson nếu `sections` null hoặc examples < 3×cases  

---

## 8. Trả lời thẳng user

> “Danh từ, số nhiều, bất quy tắc… chả có ví dụ gì… bài tập tạp… lộn chủ đề…”

**Đúng.**  
- Không phải 0 ví dụ — có ~6, nhưng **không cover case**.  
- Bài tập **nhiều** (80+) nhưng **không bố cục theo rule** → cảm giác tạp.  
- **sections trống** → không có “bài vở” chuẩn Golden.  
- **Thứ tự C/U sau plural/articles** = lỗi sư phạm.  
- Công thức C/U **sai khung thì** (do/does) = lỗi content nghiêm trọng.

**Không** nên “gen lại 62 bài giống khuôn cũ”.  
**Nên** rewrite module Danh từ theo spec vàng + ẩn advanced + siết quiz.

---

## 9. Next action đề xuất (chờ chốt)

| Ưu tiên | Việc | Output |
|---|---|---|
| **A** | Rewrite 6 bài Module Danh từ + reorder | JSON sections + examples + quiz case_id → upsert DB |
| **B** | Gate UI beginner whitelist 24 slug | `/grammar` chỉ hiện A0–A1 path |
| **C** | Hotfix formula bug C/U | 1 PR nhỏ |

**Khuyến nghị:** làm **A+B** trong 1 sprint; **C** trong 24h.

---

## Phụ lục — nguồn

- Dump live 62 lessons (2026-07-21)  
- NLM notebook `85c2df4d-…` Method Wow Grammar (checklist nouns + 24-lesson A0–A1)  
- Form–Meaning–Use; EPI Conti; L1 VN transfer (no plural morphology)  
