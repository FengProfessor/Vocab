# PROMPT → Antigravity · **P2-R1 VERBS ONLY** (regen nghiêm · ≥ 8.5 **thật**)

> **Copy `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + file).  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** API LLM ngoài (OpenRouter/Groq/Gemini/OpenAI/Zhipu).  
> **Chỉ làm verbs** — không THPT/Oxford trong task này.  
> Batch P2 cũ (`p2-verbs/`, `p2-thpt-*`, `p2-oxford/`) đã **REJECT nội dung** — **không** sửa vá template; **gen lại** vào thư mục mới.

---

## Bài học nghiên cứu (đọc kỹ — lý do reject P2)

### P2 fail (audit 4855 item)
| Type | Template rác (cấm tuyệt đối) |
|------|------------------------------|
| meaning_mcq | `sự từ chối đối với X` · `trạng thái thiếu X` · `hành động ngược lại với X` · answer `ý nghĩa của X` |
| collocation_mcq | `apply X correctly` · `make X wrong` · `do X badly` · `take X off` |
| error | `He try to {lemma} without proper preparation yesterday` · `She fail to {lemma} on time` (kể cả noun/adv) |
| l2_to_en | q máy `Từ / cụm từ tiếng Anh nghĩa là '…':` lặp + near-miss giả (`doed`) |

→ Verify schema **PASS** nhưng **0 giá trị học**. Self-score 8.6–9.7 là **điểm ảo**.

### P0 pass (mẫu bám)
Xem `data/vocab-test-bank/p0-08-verbs.json` — lemma `help` / `make`:
- meaning: **4 nghĩa VI thật** (giúp đỡ / cản trở / hại / bỏ mặc)
- l2: near-miss **help / helped / helper / helpful**
- cloze: câu tự nhiên *Can you ___ me carry…*
- error: *helped me doing* → *helped me do* (bẫy VN)
- collocation: *make a mistake* / *do a mistake* (cụm thật)

**Luật vàng:** mỗi item phải trả lời được câu *“HS Việt hay sai gì / nhớ cụm gì?”* — nếu không trả lời được → **không viết**.

---

## PROMPT START

```
# ROLE
Bạn là senior ESL curriculum writer (VN teens A1–B1) chuyên **high-frequency verbs**.
Nhiệm vụ: **TẠO LẠI** bank 5-type cho danh sách động từ P2-R1.
Chất lượng human review **≥ 8.5/10**. Template = tội. Số lượng không quan trọng bằng đúng.

# PHẠM VI
- Queue lemma (đã trừ P0/P1): đọc `data/vocab-test-bank/p2-lemma-lists/p2-verbs-top300.txt`
- Nếu thiếu file: `node scripts/export-p2-lemma-queues.mjs`
- Output **CHỈ** vào: `data/vocab-test-bank/p2-r1-verbs/`
- batch_id: `p2-r1-verbs-01` … (20 lemma/file, file cuối có thể <20)
- **Không** đụng: p0-*, p1-*, p2-verbs/ (cũ), p2-thpt-*, p2-oxford/
- Có thể **đổi tên** thư mục cũ → `data/vocab-test-bank/_rejected-p2-template/` (optional, 1 lần, không xóa)

# 5 TYPE — ĐỊNH NGHĨA SƯ PHẠM (bắt buộc hiểu)

## 1) meaning_mcq — nhận nghĩa
- q: `"{lemma} (v.)"` hoặc lemma + pos
- opts: **4 cụm/nghĩa tiếng Việt thật** (1–6 từ VI mỗi opt)
- answer: nghĩa chính **phổ biến nhất** cho HS phổ thông (1 sense — ghi sense_vi)
- distractor: **cùng lớp nghĩa gần** (đối nghĩa, gần nghĩa, nhầm thường) — **không** meta-template
- CẤM opts chứa: "ý nghĩa của", "sự từ chối", "trạng thái thiếu", "hành động ngược", "đối với {lemma}"

GOLD:
lemma do → ["làm / thực hiện", "ngủ", "ăn", "chạy"]
(không dùng "sự từ chối đối với do")

## 2) l2_to_en — nhớ form EN
- q: định nghĩa / tình huống **tiếng Việt** (không chèn đúng form EN)
- opts: 4 form EN; **bắt buộc ≥1 near-miss hình thái hoặc họ từ**:
  - base / 3sg (does) / V-ing / past / past participle
  - hoặc noun/adj họ từ: help–helper–helpful; decide–decision
  - hoặc opposite: remember–forget; win–lose
- CẤM past giả `doed`, `leaved` trừ khi đó là **bẫy có chủ đích** và explain nói "không có dạng này"
- CẤM q lặp khuôn: "Từ / cụm từ tiếng Anh nghĩa là '…':" cho cả file (đa dạng hóa stem)

GOLD help: opts help / helped / helper / helpful · answer help

## 3) cloze — ngữ cảnh buộc chọn đúng động từ
- 1 câu EN A1–B1, đúng **một** `___`
- opts: lemma + 3 động từ **không** thay thế được trong câu (khác nghĩa rõ)
- Câu phải **tự nhiên**; ưu tiên collocation (help me + V, look at, listen to, depend on…)
- CẤM câu copy-paste cùng khung cho mọi lemma ("All students are required to ___ this key task…")

GOLD: "Can you ___ me carry this heavy box?" help/make/let/push

## 4) error — sửa **1 lỗi có chủ đích** liên quan lemma
- Trong q có câu SAI trong dấu nháy; **câu đó phải sai thật**
- answer = câu đúng; quote ≠ answer
- **Đúng đúng 1** trong 4 opts (không 2 câu đều chấp nhận được)
- Lỗi phải gắn lemma: collocation, form, prep, V-ing/to-V, irregular past…
- CẤM template:
  - "He try to {LEMMA} without proper preparation yesterday."
  - "She fail to {LEMMA} on time."
  - Mọi khuôn chỉ đổi LEMMA mà câu thành vô nghĩa với noun (P2 không gen noun; vẫn cấm khuôn)

Bẫy VN ưu tiên (khi lemma cho phép):
- do/make + N (homework, mistake, bed, decision…)
- help sb do / help sb to do
- look at / listen to / depend on / wait for / pay for
- try to V vs try V-ing (nếu dạy được)
- stop to V vs stop V-ing (nếu lemma stop)
- irregular: go-went, take-took, get-got…
- 3sg: He go → He goes

GOLD make: quote 'She did a mistake yesterday.' → 'She made a mistake yesterday.'
(hoặc tương đương — quote PHẢI sai)

## 5) collocation_mcq — chọn **cụm thật**
- q: "Chọn cụm đúng:" / "Cụm nào đúng?" + gợi ý nghĩa ngắn VI (optional)
- opts: **4 cụm ≥ 2 từ** (space bắt buộc mọi opt)
- 1 cụm đúng **tồn tại trong tiếng Anh thật** (corpus/ESL standard)
- 3 cụm sai: collocation lạ, make/do nhầm, thiếu mạo từ, sai giới từ
- CẤM tuyệt đối:
  - apply {lemma} correctly
  - make {lemma} wrong
  - do {lemma} badly
  - take {lemma} off
  - mọi biến thể "apply/make/do/take + lemma + adverb rác"

GOLD:
do → do homework / make homework / do a mistake / make exercise
make → make a mistake / do a mistake / make homework / create a mistake
get → get up / get down (nếu sense) / get married / get success (sai)
take → take a break / make a break / do a break / take decision (vs make a decision — chọn 1 sense)

# TRA CỨU COLLOCATION (bắt buộc suy nghĩ từng lemma)

Trước khi viết 5 item, **ghi nháp nội bộ** (không cần dump hết vào JSON):
1) sense_vi (1 nghĩa)
2) 1 collocation vàng (verb + N/prep/particle)
3) 1 lỗi VN hay gặp
4) 1 near-miss form

Nếu không nghĩ ra collocation thật → **tra trong đầu ESL** (do/make/have/take/get/give/keep/put/look/come/go…)  
Không được bịa "apply X correctly".

# BLACKLIST (verify sẽ FAIL — bạn phải pass)

meaning opt/answer:
- /ý nghĩa của|sự từ chối đối với|trạng thái thiếu|hành động ngược lại với/i

collocation opt:
- /apply .+ correctly|make .+ wrong|do .+ badly|take .+ off/i

error q:
- /try to .+ without proper preparation/i
- /fail to .+ on time/i

# SCHEMA (mỗi item)

```json
{
  "lemma": "help",
  "pos": "v",
  "sense_vi": "giúp đỡ",
  "level": "A1",
  "type": "error",
  "stem": {
    "q": "Chọn câu đúng: 'She helped me doing my homework.'",
    "opts": [
      "She helped me do my homework.",
      "She helped me doing my homework.",
      "She help me do my homework.",
      "She is helped me do my homework."
    ]
  },
  "answer": "She helped me do my homework.",
  "explain_vi": "Help + tân ngữ + động từ nguyên mẫu: help me do (không help me doing).",
  "content_hash": "help|error|01",
  "meta": {
    "skill": "error_identification",
    "quality_score": 9.2,
    "quality_notes": "VN trap help sb doing",
    "priority": "P2-R1",
    "queue": "verbs",
    "pack_id": "p2-r1-verbs"
  }
}
```

# RUBRIC / LEMMA (human lens — tự chấm thật)

| Tiêu chí | Max | Ghi chú |
|----------|-----|---------|
| 5 type đủ schema | 2.0 | bắt buộc full |
| Nghĩa VI + cụm **thật** | 2.5 | template = 0 điểm mục này |
| Near-miss / bẫy VN | 2.0 | |
| 1 đáp án đúng + error quote sai thật | 1.5 | |
| explain_vi ngắn đúng | 1.0 | ≤ 160 ký tự plain VI |
| Câu tự nhiên không copy khung | 1.0 | |

- **Tổng < 8.5 → viết lại cả 5 item lemma**
- quality_score ghi trên **mỗi item**; được 8.6–9.6; **cấm** mọi item trong file cùng một số
- quality_notes phải nêu bẫy cụ thể (vd "make a mistake", "look at")

# WORKFLOW (không nhảy cóc)

1) Đọc queue `p2-verbs-top300.txt` (toàn bộ dòng).
2) (Khuyến nghị) move rejected:
   `data/vocab-test-bank/p2-verbs` → `data/vocab-test-bank/_rejected-p2-template/p2-verbs`
   (và các p2-thpt/oxford nếu muốn gọn — optional)
3) Làm **tuần tự 20 lemma/file**:
   - `data/vocab-test-bank/p2-r1-verbs/p2-r1-verbs-01.json`
   - …
4) Mỗi file shape:
```json
{
  "version": 4,
  "batch_id": "p2-r1-verbs-01",
  "priority": "P2-R1",
  "queue": "verbs",
  "quality_bar": 8.5,
  "types_required": ["meaning_mcq","l2_to_en","cloze","error","collocation_mcq"],
  "created_note": "antigravity R1 strict · no template · no external LLM",
  "lemmas": ["do","get", "..."],
  "items": []
}
```
5) Sau **mỗi file**:
```bash
node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-r1-verbs/p2-r1-verbs-01.json
```
   Exit ≠ 0 → **sửa file đó** trước file sau.
6) **Self human-spot** mỗi file: đọc to 2 lemma (meaning + colo + error). Nếu nghe máy → rewrite.
7) Hết queue hoặc hết session: handback `tmp/HAND-vocab-test-bank-p2-r1-verbs.md`
   - lemmas/items done
   - min/avg score
   - 5 GOLD
   - 5 lemma từng fail verify
   - NEXT index trong queue
   - `P2_R1_VERBS_DONE` hoặc `P2_R1_PARTIAL`

# TỐC ĐỘ vs CHẤT
- Ưu tiên **đúng**: 10–20 lemma/phiên tốt hơn 267 rác.
- Không gen song song 14 file copy template.
- Được tham khảo (đọc) P0 `p0-08-verbs.json` làm phong cách — **không copy nguyên** item.

# OUT OF SCOPE
- THPT, Oxford
- UI, Supabase import
- Git commit

# DONE
Chỉ khi:
- Mọi file trong `p2-r1-verbs/` verify exit 0
- 0 hit blacklist template
- Spot-check 10 lemma random (bạn tự) không có "apply X correctly" / "ý nghĩa của"
- Handback ghi `P2_R1_VERBS_DONE lemmas=N items=M min=X avg=Y`

In stdout dòng đó khi xong.
```

## PROMPT END

---

## Việc Grok đã / sẽ hỗ trợ

| File | Việc |
|------|------|
| `scripts/verify-vocab-test-bank.mjs` | **Hard-fail** template meaning/colo/error + collocation multiword + near-miss l2 |
| Queue | `data/vocab-test-bank/p2-lemma-lists/p2-verbs-top300.txt` (~267) |
| Output AG | `data/vocab-test-bank/p2-r1-verbs/*.json` |

### Test blacklist (sau khi AG xong 1 file)

```bash
node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-r1-verbs/p2-r1-verbs-01.json
# phải VERIFY_OK true; file template cũ p2-verbs-01 sẽ FAIL
```

---

## Gợi ý giao AG (1 câu)

> Đọc và thực hiện `docs/PROMPT-antigravity-vocab-test-bank-p2-R1-verbs-strict.md` — chỉ R1 verbs, thư mục `p2-r1-verbs/`, verify sau mỗi file 20 lemma, cấm template P2 cũ.

---

## Sau R1 verbs PASS

Mới làm prompt R2: THPT multi (78) — collocation đề thi, cùng blacklist.  
Oxford sau cùng.
