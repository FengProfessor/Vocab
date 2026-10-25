# PROMPT → Antigravity · Vocab test bank (≥5 **loại** khác nhau / từ)

> **Copy block `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + file + `.env.local`).  
> Workspace: `D:\Vocab\web-app`.  
> **Quota:** soạn nội dung bằng **năng lực Antigravity** — **CẤM** gọi OpenRouter / Groq / Gemini API / OpenAI / Zhipu / fetch model ngoài.  
> Grok chấm handback + gắn DB/runtime sau — tiết kiệm quota Grok.

---

## Mục tiêu product (đọc trước khi dán)

| Mục | Chi tiết |
|-----|----------|
| Pre-gen | Mỗi lemma có **≥5 item**, mỗi item **1 type khác** — **không** 1 câu biến thành 5 cách hỏi |
| Store | File JSON bank (MVP); sau Grok map → bảng `word_test_items` |
| Runtime (chưa làm trong prompt này) | Random item chưa `used` → tick used → hết 5: reset hoặc stop |
| Scope MVP | **20 lemma** (list bên dưới hoặc list user đưa) × 5 type = **100 item** |

---

## PROMPT START

```
# ROLE
Bạn là senior ESL curriculum engineer + content QA cho LingoPro (app học từ VN).
Task: **tạo bank câu hỏi / test pre-gen** cho vocabulary lemmas sao cho:
1) Mỗi lemma có **đúng 5 item**, **5 type khác nhau** (bắt buộc đủ 5 type dưới đây).
2) **5 type = 5 skill khác** — CẤM clone 1 stem thành 5 wrapper hỏi.
3) Stem / context / collocation **khác nhau** giữa các type trong cùng lemma.
4) Tiếng Việt feedback ngắn, đúng sense; distractor cùng POS / gần nghĩa (không random vô lý).
5) **KHÔNG gọi API LLM ngoài** — TỰ SOẠN bằng quota Antigravity.
6) Xuất **JSON hợp lệ** + báo cáo coverage; ghi file bank + handback.

# PRODUCT CONTEXT
- App: LingoPro · Next.js · Supabase · HS Việt A1–B1 (một số từ B2).
- Use case: session “Học gói” / cày ngày / quiz bulk (vd 13 từ) — mỗi lần chạm 1 lemma → random 1 item chưa used.
- **Không** gen lúc HS làm bài. Bank phải audit được.
- FSRS / review dài hạn = hệ khác. Bank này = **đa dạng test** khi luyện/cày.

# 5 TYPE BẮT BUỘC (canonical)

| type           | Skill                         | Shape bắt buộc |
|----------------|-------------------------------|----------------|
| meaning_mcq    | EN → chọn nghĩa VI            | q, opts[4], answer, explain_vi |
| l2_to_en       | VI → chọn form EN             | q (có nghĩa VI), opts[4] form EN, answer, explain_vi |
| cloze          | Điền collocation trong câu EN | q có `___`, opts[4], answer ∈ opts, explain_vi |
| error          | Câu EN **sai 1 lỗi** (form/POS/collocation của target) → chọn bản đúng hoặc chỗ sửa | q, opts[4] (các bản câu / fix), answer, explain_vi |
| match_pair     | Ghép EN–VI (1 target + 3 distractor pair) hoặc “chọn cặp đúng” | q, pairs[] hoặc opts dạng "EN — VI", answer, explain_vi |

### HARD RULES per type
1) **meaning_mcq**
   - q: chỉ hiện lemma (hoặc lemma + POS ngắn). Không spoil nghĩa.
   - opts: 4 nghĩa VI; **1 đúng**; 3 distractor **cùng word class / semantic field gần** (không “con mèo” cho abstract adj).
   - answer = đúng 1 opt (string khớp exact 1 phần tử opts).

2) **l2_to_en**
   - q: nghĩa VI (+ optional short hint ngữ cảnh), **không** chứa form EN đúng.
   - opts: 4 form EN (có thể gồm near-miss: wake / wake up / awake).
   - answer = form canonical lemma (hoặc form đã chốt trong meta).

3) **cloze**
   - 1 câu EN tự nhiên A1–B1, **1 blank** gắn collocation/POS đúng của lemma.
   - Cấm reuse nguyên văn sentence của type error/match.
   - opts: 4; answer = surface form điền vào blank (có thể là lemma hoặc form biến thể có chủ đích, ghi rõ trong explain_vi).

4) **error**
   - Câu **cố ý sai** liên quan lemma (vd perilously + noun; make homework; go to home).
   - opts: 4 cách sửa / 4 câu — **1 đúng grammar + đúng nghĩa**.
   - explain_vi: chỉ ra **sai → đúng** 1 dòng (POS/collocation).
   - Cấm stem giống hệt cloze (chỉ khác blank).

5) **match_pair**
   - 4 cặp EN—VI (1 đúng cho target + 3 distractor lemmas **khác**, cùng difficulty band nếu được).
   - q: "Chọn cặp đúng cho từ đang học: {lemma}" hoặc "Cặp nào đúng?"
   - answer = string cặp đúng exact trong opts.
   - Không dùng lại 3 distractor nghĩa y hệt meaning_mcq nếu tránh được (được overlap 1).

# ANTI-PATTERNS (REJECT nếu dính)
- Cùng 1 câu EN dùng cho cloze + error + meaning.
- 5 type nhưng chỉ đổi "Which is correct?" / "Choose the answer".
- opts không chứa answer.
- explain_vi English dump / markdown ** / "Wow".
- academic = “học viện” khi sense là học thuật/học tập (trừ lemma đúng nghĩa institution).
- opts VI/EN lệch POS (adj opt là noun phrase vô lý).
- lemma multiword (wake up): không tách sai thành wake / up trong answer trừ khi type l2_to_en cố ý near-miss.

# LEMMA LIST — MVP BATCH A (20 từ)
Nếu user không đưa list khác, soạn **đủ 20** sau (school / daily — A1–A2):

1. wake up
2. homework
3. school
4. tired
5. breakfast
6. study
7. friend
8. happy
9. finish
10. start
11. need
12. want
13. help
14. late
15. early
16. classroom
17. teacher
18. break (n. / v. — chọn 1 sense, ghi pos + sense_vi trong meta)
19. exam
20. remember

Mỗi lemma:
- pos: n | v | adj | adv | phrase | …
- sense_vi: 1 nghĩa chính dùng trong bank (không đa nghĩa lẫn)
- level: A1 | A2 | B1

# OUTPUT SCHEMA (mỗi item)

```json
{
  "lemma": "wake up",
  "pos": "phrase",
  "sense_vi": "thức dậy",
  "level": "A1",
  "type": "meaning_mcq",
  "stem": {
    "q": "wake up",
    "opts": ["thức dậy", "đi ngủ", "thức khuya", "ngáp"]
  },
  "answer": "thức dậy",
  "explain_vi": "Phrasal verb: thức dậy (khỏi giường), không phải go to sleep.",
  "content_hash": "optional-sha-or-slug-unique-per-item",
  "meta": {
    "skill": "receptive_meaning",
    "notes": ""
  }
}
```

- content_hash: slug ổn định `lemma|type|short-stem-slug` (unique trong file).
- 1 lemma → **đúng 5 object** (đủ 5 type).

# FILE OUTPUT

1) Tạo / ghi:
   `data/vocab-test-bank/batch-a-20.json`

Shape file:
```json
{
  "version": 1,
  "batch_id": "batch-a-20",
  "created_note": "antigravity pre-gen · no external LLM API",
  "types_required": ["meaning_mcq", "l2_to_en", "cloze", "error", "match_pair"],
  "items": [ /* 100 objects */ ]
}
```

2) Tạo handback:
   `tmp/HAND-vocab-test-bank-batch-a.md`

Handback gồm:
- Bảng: lemma | 5 type OK? | notes
- Tổng items (expect 100)
- 3 ví dụ “GOLD” (lemma khó hoặc multiword)
- 3 rủi ro / chỗ human nên soi
- Lệnh verify tự viết (node one-liner hoặc script nhỏ **không** gọi network):
  - count items
  - mỗi lemma đủ 5 type
  - answer ∈ opts khi có opts
  - không trùng content_hash

# WORKFLOW (bắt buộc)
1) Đọc prompt; nếu thiếu list → dùng BATCH A 20.
2) Soạn **từng lemma** đủ 5 type (có thể làm 5 lemma/lượt rồi merge — **không** gọi API ngoài).
3) Self-QA checklist (dưới) — sửa trước khi ghi file.
4) Ghi `data/vocab-test-bank/batch-a-20.json` + handback.
5) Chạy verify local (script inline trong handback hoặc `node -e` đọc JSON).
6) **Không** migration Supabase / **không** UI quiz trong task này (Grok làm sau).
7) **Không** commit git trừ khi user bảo commit.

# SELF-QA CHECKLIST (mỗi lemma)
[ ] Đủ đúng 5 type, không thiếu/thừa
[ ] 5 stem **khác context** (đọc to: không “cùng 1 câu”)
[ ] answer khớp exact 1 opt (khi MCQ-like)
[ ] cloze blank đúng collocation
[ ] error có **1** lỗi có chủ đích + explain sai→đúng
[ ] match_pair có 3 distractor pair hợp lý
[ ] explain_vi ≤ ~160 ký tự, plain VI
[ ] multiword lemma answer nhất quán

# ACCEPTANCE
- File JSON parse được, items.length === 100
- 20 lemma × mỗi type exactly 1
- 0 item fail answer∉opts
- Handback có bảng coverage + verify passed

# OUT OF SCOPE (không làm)
- Bảng SQL / RLS / user_word_test_usage
- Random runtime / reset policy trong app
- Gen 10k từ full catalog
- Gọi Gemini/Zhipu/OpenRouter

# DONE
In ra path file bank + path handback + 1 dòng: VERIFY_OK=yes|no + counts.
```

## PROMPT END

---

## Sau khi Antigravity xong (Grok / bạn)

| Bước | Việc |
|------|------|
| 1 | Đọc `tmp/HAND-vocab-test-bank-batch-a.md` + sample 5 lemma |
| 2 | Migration `word_test_items` + import script JSON → Supabase |
| 3 | API: `GET items?lemma=` − used; `POST used` |
| 4 | UI “Học gói” random 1 type/lần chạm từ |
| 5 | Policy: hết 5 → reset usage lemma |

---

## Mở rộng batch sau

| Batch | Gợi ý |
|-------|--------|
| B | 50 core fail-set / unit School |
| C | Academic adj/adv (perilous, academic…) — siết POS trong error/cloze |
| D | Multiword / phrasal (100) |

Đổi list: sửa mục **LEMMA LIST** trong prompt rồi dán lại AG; `batch_id` + tên file JSON đổi theo (`batch-b-50.json`).

---

## Ghi chú cho AG

- Ưu tiên **đúng type + QA** hơn văn chương.  
- Được dùng template câu A1–A2 lặp **pattern** (I ___ at 6 / She is ___ …) nhưng **slot + collocation khác** theo lemma.  
- Không cần ảnh/audio trong MVP (`match_pair` text-only).
