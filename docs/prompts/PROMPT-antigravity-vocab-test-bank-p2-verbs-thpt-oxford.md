# PROMPT → Antigravity · P2 Vocab test bank  
## Top ~300 verbs + THPT + 1 phần Oxford · **chuẩn ≥ 8.5 (siết QA v3)**

> **Copy `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + file + `.env.local`).  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** gọi OpenRouter / Groq / Gemini / OpenAI / Zhipu / fetch model ngoài.  
> **Đọc lemma từ file queue** (đã export, đã loại P0/P1).  
> Grok chấm handback sau.

---

## Hàng đợi (đã chốt — không tự đổi thứ tự)

| # | Queue file | Nội dung | ~Lemma (sau dedupe P0/P1) |
|---|------------|----------|---------------------------|
| **1** | `data/vocab-test-bank/p2-lemma-lists/p2-verbs-top300.txt` | 300 động từ đầu `common-verbs-freq.txt` trừ đã có bank | **~267** |
| **2** | `…/p2-thpt-multiword.txt` | THPT collocation / cụm (2026 reform + core) | **~78** |
| **3** | `…/p2-thpt-single.txt` | THPT headword academic | **~326** |
| **4** | `…/p2-oxford-part300.txt` | 1 phần Oxford 3000 (theme seeds + fill) | **~300** |

Meta: `data/vocab-test-bank/p2-lemma-lists/p2-queues-meta.json`  
**≈ 900–1000 lemma × 5 ≈ 4500–5000 items** — chia sub-batch **20 lemma/file**, verify từng file.

Nếu queue lỗi: chạy `node scripts/export-p2-lemma-queues.mjs` rồi gen.

---

## PROMPT START

```
# ROLE
Senior ESL curriculum engineer (VN teens A1–B2) + Content QA lead LingoPro.
Task: gen **vocab test bank v3** cho hàng P2 (verbs → THPT multi → THPT single → Oxford part).
Mỗi lemma = **5 item · 5 skill thật**. Quality human-equivalent **≥ 8.5/10**.
Bạn KHÔNG được “điền cho đủ”. Item lỗi = rewrite lemma trước khi sang lemma khác.

# CẤM TUYỆT ĐỐI
1) API LLM ngoài (OpenRouter, Groq, Gemini, OpenAI, Zhipu, …).
2) Type `match_pair` hoặc bất kỳ type không nằm trong 5 type v3.
3) **1 câu EN × 5 wrapper** hỏi khác label.
4) **Fake error**: câu trong ngoặc/quote của type `error` **trùng** answer (câu đã đúng mà bảo “chọn câu đúng” từ câu đúng) → FAIL.
5) **Hai đáp án cùng đúng** (vd late for / late to; both grammatical).
6) answer ∉ opts; opts trùng; opts ≠ 4.
7) explain_vi English dump / markdown ** / “Wow”.
8) Gán quality_score đồng loạt 9.0/9.5 cho cả file (phải **phân hóa** 8.5–9.7 theo rubric).
9) Gen lemma **không** nằm trong queue file hiện tại.
10) Ghi đè / sửa file P0/P1 (`p0-*.json`, `p1-*.json`).
11) Git commit trừ user yêu cầu.

# 5 TYPE = 5 SKILL (v3)

| type | Skill | Hard rules |
|------|--------|------------|
| meaning_mcq | EN→VI nghĩa | q = lemma (+pos); 4 nghĩa VI; distractor **cùng POS + field gần** |
| l2_to_en | VI→EN form | q VI **không** chứa form EN đúng; 4 form EN; **≥1 near-miss** (cùng root / tense / wake–wake up / affect–effect) — **bắt buộc** với verb & academic; A0 closed-class hiếm khi có ở P2 |
| cloze | Ngữ cảnh + collocation | 1 câu, đúng 1 `___`; context **ép** chọn lemma (không 4 synonym đều điền được) |
| error | Sửa 1 lỗi có chủ đích | Quote/câu nguồn **PHẢI SAI**; answer = bản đúng; **duy nhất 1** đúng trong 4 opts; bẫy VN/collocation/POS |
| collocation_mcq | Cụm đúng | 4 **cụm** (ưu tiên có space: do research / make research); multiword lemma: cụm chứa lemma |

# SIẾT QA v3 (học từ nghiệm thu P0/P1)

## A. Error integrity (hard fail)
- Extract quoted span trong `stem.q` (nếu có `'...'` hoặc `"..."`).
- Nếu quoted === answer (normalize trim lower) → **INVALID**, viết lại.
- Nếu ≥2 opts đều grammar-OK cho cùng nghĩa → **INVALID** (đổi distractor thành lỗi rõ: sai giới từ, sai form, sai collocation).

## B. Collocation
- ≥ **90%** collocation_mcq trong batch verb/THPT có **≥1 space** trong mỗi opt (cụm).
- THPT multiword lemma: collocation/error/cloze **bám đúng cụm** (register for, take part in, as a result…).

## C. Verbs
- error/cloze ưu tiên: V-ing/to-V, irregular, collocation (make/do/have/take/get + N), preposition (depend on, listen to).
- l2_to_en near-miss: base / 3sg / V-ing / past / opposite khi hợp.

## D. THPT academic
- sense_vi **1 nghĩa thi cử** (không đa nghĩa lẫn).
- academic ≠ “học viện” khi là adj “học thuật”.
- Discourse markers (moreover, as a result): cloze/error trong câu văn academic ngắn.

## E. Oxford part
- level A2–B1; tránh function word (if lọt queue: skip + log).
- Ưu tiên collocation đời sống/trường/việc theo lemma.

## F. Self-score
Rubric / lemma (max 10) — **bắt buộc ghi** `meta.quality_score` trên **mỗi item**:
| Tiêu chí | Max |
|----------|-----|
| 5 type + schema | 2.0 |
| Skill độc lập + stem khác | 2.5 |
| Distractor / near-miss | 2.0 |
| 1 đáp án đúng duy nhất + error thật | 1.5 |
| explain_vi | 1.0 |
| Bẫy VN / collocation hữu ích | 1.0 |

- Score **< 8.5** → rewrite lemma.
- Phân hóa: không cả file cùng 9.0; dùng 8.6 / 8.8 / 9.0 / 9.2 / 9.4 / 9.5…
- `meta.quality_notes` ≤ 15 từ (vd "near-miss V-ing; do/make trap").

# SCHEMA ITEM (v3)

```json
{
  "lemma": "depend",
  "pos": "v",
  "sense_vi": "phụ thuộc / tùy thuộc",
  "level": "A2",
  "type": "error",
  "stem": {
    "q": "Chọn câu đúng: 'Success depends of hard work and luck.'",
    "opts": [
      "Success depends on hard work and luck.",
      "Success depends of hard work and luck.",
      "Success depend on hard work and luck.",
      "Success is depend on hard work and luck."
    ]
  },
  "answer": "Success depends on hard work and luck.",
  "explain_vi": "Cấu trúc đúng: depend on + N, không depend of.",
  "content_hash": "depend|error|01",
  "meta": {
    "skill": "error_identification",
    "quality_score": 9.2,
    "quality_notes": "prep trap depend on",
    "priority": "P2",
    "queue": "verbs",
    "pack_id": "p2-verbs-top300"
  }
}
```

content_hash = `{slug(lemma)}|{type}|01` — slug: space→`-`, unique global P2.

# WORKFLOW

## 0) Chuẩn bị
- Đọc `data/vocab-test-bank/p2-lemma-lists/p2-queues-meta.json`.
- Nếu thiếu list: `node scripts/export-p2-lemma-queues.mjs`
- Dùng / nâng `scripts/verify-vocab-test-bank.mjs` (giữ 5 type v3; cấm match_pair).
- **Thêm** (cùng file hoặc `scripts/verify-vocab-test-bank-p2.mjs`) check:
  - error: nếu có quote trong q và quote === answer → fail
  - quality_score number ≥ 8.5
  - collocation: với queue verbs|thpt* → opts có space (cảnh báo/fail nếu <80% file)

## 1) Thứ tự queue (bắt buộc)
1. `p2-verbs-top300.txt`
2. `p2-thpt-multiword.txt`
3. `p2-thpt-single.txt`
4. `p2-oxford-part300.txt`

## 2) Sub-batch
- Mỗi file **đúng 20 lemma** (file cuối queue có thể <20).
- Path:
  - `data/vocab-test-bank/p2-verbs/p2-verbs-01.json` … 
  - `data/vocab-test-bank/p2-thpt-mw/p2-thpt-mw-01.json` …
  - `data/vocab-test-bank/p2-thpt-sg/p2-thpt-sg-01.json` …
  - `data/vocab-test-bank/p2-oxford/p2-oxford-01.json` …
- File shape:
```json
{
  "version": 3,
  "batch_id": "p2-verbs-01",
  "priority": "P2",
  "queue": "verbs",
  "quality_bar": 8.5,
  "types_required": ["meaning_mcq","l2_to_en","cloze","error","collocation_mcq"],
  "created_note": "antigravity · no external LLM · QA v3",
  "lemmas": ["do","get", "..."],
  "items": []
}
```
- items.length === lemmas.length × 5

## 3) Per file
a. Soạn 20 lemma × 5  
b. Self-audit error quote ≠ answer  
c. Verify script exit 0  
d. Mới sang file tiếp  
e. Hết quota: handback `DONE_QUEUES` + `NEXT_FILE` + counts — **không** để file dở verify fail

## 4) Handback
- `tmp/HAND-vocab-test-bank-p2-verbs.md`
- `tmp/HAND-vocab-test-bank-p2-thpt.md`
- `tmp/HAND-vocab-test-bank-p2-oxford.md`
- `tmp/HAND-vocab-test-bank-p2-full.md` gồm:
  - lemmas/items per queue
  - min/avg quality_score (từ meta)
  - 5 GOLD (error/collocation verb + THPT multi)
  - 5 item từng rewrite
  - list skip (function word…)
  - VERIFY_OK
  - stdout: `P2_DONE lemmas=N items=M min=X avg=Y`

# VERIFY (mỗi file — bắt buộc pass)

```bash
node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-verbs/p2-verbs-01.json
```

Bổ sung audit error-fake (chạy thêm nếu chưa gộp vào verify):

```js
// pseudo: for each error item, if q matches /'([^']+)'/ and capture trim === answer trim → fail
```

# OUT OF SCOPE
- Migration Supabase / UI random-used
- Full Oxford 2978 / full 459 verbs tail
- Sửa P0/P1

# DONE
Chỉ khi 4 queue verify all green (hoặc handback partial rõ ràng).
In: P2_DONE ...
```

## PROMPT END

---

## Checklist sau AG (bạn / Grok)

| Check | |
|-------|--|
| `export-p2-lemma-queues.mjs` counts khớp meta | |
| Mọi `p2-*/**.json` verify exit 0 | |
| Spot 20 error: quote ≠ answer | |
| Spot 10 late/for–to style dual-key | |
| min meta ≥ 8.5 + phân hóa score | |
| Không đụng p0/p1 | |

---

## Ước lượng

| Queue | ~Lemma | ~Items |
|-------|--------|--------|
| Verbs | 267 | 1335 |
| THPT multi | 78 | 390 |
| THPT single | 326 | 1630 |
| Oxford part | 300 | 1500 |
| **Tổng** | **~971** | **~4855** |

Nên chạy **verbs trước** (giá trị cao cho cày/đặt câu), rồi THPT multi, rồi single, Oxford.

---

## Lệnh chuẩn bị (trước khi dán AG)

```bash
node scripts/export-p2-lemma-queues.mjs
```
