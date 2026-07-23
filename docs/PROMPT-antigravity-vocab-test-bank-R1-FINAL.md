# PROMPT → Antigravity · **R1 FINAL — 267 verbs · một lần xong**

> **Copy toàn bộ `PROMPT START` … `PROMPT END`** dán Antigravity (Agent mode + terminal + ghi file).  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** gọi OpenRouter / Groq / Gemini / OpenAI / Zhipu / bất kỳ API LLM ngoài.  
> **Mục tiêu:** bank động từ **dùng được cho HS** — không template, không giao lại.  
> Verify **cực gắt** đã cập nhật: `node scripts/verify-vocab-test-bank.mjs <file>` — **fail = sửa hết mới sang file sau**.

---

## Vì sao prompt này “final”

Đã fail 2 vòng:

| Vòng | Fail |
|------|------|
| P2 | `ý nghĩa của X` · `apply X correctly` · `try to X without proper preparation` |
| R1 | Hết blacklist trên nhưng **template mới**: cloze *It is necessary to ___ the plan…* (~261×), error *…work very quick yesterday* (~262×), meaning *thực hiện {lemma}*, colo *V the task successfully*, irregular **finded trong answer** |

**Final = cấm cả 2 thế hệ template + bắt frame đa dạng + past bất quy tắc đúng + collocation có thật.**

---

## PROMPT START

```
# ============================================================
# ROLE
# ============================================================
Bạn là Senior ESL Curriculum Writer (15 năm) + Content QA Lead cho LingoPro.
Học sinh: teens Việt A1–B1. Sản phẩm: quiz 5 dạng / động từ.

Bạn KHÔNG phải code generator.
Bạn KHÔNG được lặp khung câu đổi lemma.
Mỗi item phải dạy 1 skill thật. Nếu không nghĩ ra collocation/thật nghĩa → tra kiến thức ESL của bạn, không bịa.

# ============================================================
# SCOPE (CHỈ VIỆC NÀY)
# ============================================================
1) Đọc lemma: data/vocab-test-bank/p2-lemma-lists/p2-verbs-top300.txt
   (nếu thiếu: node scripts/export-p2-lemma-queues.mjs)
2) XÓA hoặc ĐỔI TÊN bank R1 cũ (template v2):
   data/vocab-test-bank/p2-r1-verbs  →  data/vocab-test-bank/_rejected-p2-r1-frames/
   (giữ lại để đối chiếu; KHÔNG import)
3) GEN MỚI 100% vào:
   data/vocab-test-bank/p2-r1-final-verbs/
   Files: p2-r1-final-01.json … (10 lemma/file — NHỎ để chất lượng)
   File cuối có thể <10 lemma.
4) Sau MỖI file: 
   node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-r1-final-verbs/p2-r1-final-XX.json
   Exit code ≠ 0 → SỬA HẾT lỗi trong file đó. CẤM next file.
5) Không đụng p0-*, p1-*, p2-thpt-*, p2-oxford*, _rejected*.
6) Không git commit trừ user yêu cầu.
7) Không gen THPT/Oxford trong task này.

# ============================================================
# 5 TYPES — ĐỊNH NGHĨA + GOLD + CẤM
# ============================================================

## TYPE 1 · meaning_mcq
Skill: EN → chọn nghĩa VI đúng.

BẮT BUỘC:
- q: "{lemma} (v.)"
- opts: 4 nghĩa/cụm VI **thật** (1–8 từ), không chứa lemma EN
- 1 đúng = sense_vi chính (phổ thông)
- 3 distractor: đối nghĩa / gần nghĩa / nhầm hay gặp (cùng lớp từ)

CẤM (verify FAIL):
- ý nghĩa của …
- sự từ chối đối với …
- trạng thái thiếu …
- hành động ngược lại với …
- thực hiện {lemma}
- bày tỏ hành động …
- answer chứa "thực hiện " + English

GOLD do:
opts: ["làm / thực hiện", "ngủ", "ăn", "chạy"]
answer: "làm / thực hiện"

GOLD think:
opts: ["suy nghĩ / cho rằng", "lắng nghe", "nhìn", "nói"]

## TYPE 2 · l2_to_en
Skill: VI → chọn form EN.

BẮT BUỘC:
- q: câu/định nghĩa VI đa dạng (mỗi lemma 1 stem khác; không copy 1 khuôn cả file)
- opts: 4 form EN; ≥1 near-miss: base/3sg/V-ing/past/p.p. hoặc họ từ (help/helper/helpful)
- answer = base form lemma (trừ khi lemma là cụm)

CẤM:
- q bắt đầu "Bày tỏ hành động"
- q "Từ / cụm từ tiếng Anh nghĩa là"
- past giả trong opts được coi là “gần đúng” mà không explain (finded chỉ được là DISTRACTOR, không answer)

GOLD help:
q: "Hỗ trợ người khác làm việc:"
opts: ["help","helped","helper","helpful"]
answer: "help"

## TYPE 3 · cloze
Skill: chọn động từ đúng trong câu thật.

BẮT BUỘC:
- đúng 1 `___`
- câu EN tự nhiên A1–B1, **riêng cho lemma** (collocation/ngữ cảnh buộc chọn)
- opts: lemma + 3 động từ KHÁC NGHĨA (không thay thế được)

CẤM (verify FAIL nếu lặp frame):
- "It is necessary to ___ the plan before starting the project."
- Mọi khung lặp >15% lemmas trong 1 file (verify đếm frame)

GOLD:
look: "Please ___ at the board while I explain."
opts: look / see / watch / view

do: "You should ___ your best in the exam."
opts: do / make / create / take

get: "I hope to ___ good marks this term."
opts: get / take / make / give

## TYPE 4 · error
Skill: sửa 1 lỗi liên quan lemma (form / collocation / prep / pattern).

BẮT BUỘC:
- Trong q có câu SAI trong dấu nháy '...'
- Câu quote **PHẢI SAI**
- answer = câu ĐÚNG tiếng Anh (grammar + form đúng)
- quote ≠ answer
- Đúng đúng 1 opt
- Lỗi gắn lemma (không chỉ sửa quick→quickly trên cùng khung cho 200 verb)

CẤM (verify FAIL):
- try to … without proper preparation
- fail to … on time  
- "… the work very quick(ly) yesterday" hàng loạt
- answer chứa past sai: finded, getted, goed, taked, maked, catched, teached, thinked, buyed, leaved, achieveed, …

IRREGULAR — nếu câu quá khứ, answer PHẢI dùng past đúng:
find→found, get→got, go→went, take→took, make→made, think→thought,
come→came, see→saw, give→gave, leave→left, feel→felt, keep→kept,
know→knew, tell→told, say→said, become→became, begin→began, bring→brought,
buy→bought, catch→caught, choose→chose, do→did, drink→drank, drive→drove,
eat→ate, fall→fell, forget→forgot, grow→grew, hear→heard, hold→held,
lose→lost, meet→met, pay→paid, run→ran, sit→sat, sleep→slept, speak→spoke,
spend→spent, stand→stood, teach→taught, write→wrote, win→won, wake→woke

GOLD make:
q: "Chọn câu đúng: 'She did a mistake on the test.'"
opts:
- She made a mistake on the test.
- She did a mistake on the test.
- She make a mistake on the test.
- She is make a mistake on the test.
answer: She made a mistake on the test.

GOLD look:
q: "Chọn câu đúng: 'She is looking her keys under the sofa.'"
→ looking for her keys …

GOLD help:
helped me doing → helped me do

GOLD get:
getted → got

## TYPE 5 · collocation_mcq
Skill: chọn cụm V+N / V+prep / phrasal **có thật**.

BẮT BUỘC:
- 4 opts, **mỗi opt ≥ 2 từ** (có space)
- 1 cụm đúng tồn tại trong tiếng Anh học đường
- 3 cụm sai rõ (make/do nhầm, sai giới từ, cụm không ai nói)

CẤM (verify FAIL):
- apply X correctly / make X wrong / do X badly / take X off
- X the task successfully|wrongly|badly|completely
- X the plan successfully …
- Cụm bịa chỉ ghép adverb rác

BANK COLLOCATION GỢI Ý (ưu tiên dùng đúng lemma; không copy mù nếu sense khác):

do: do homework, do the dishes, do a good job, do exercise, do business
make: make a mistake, make a decision, make progress, make the bed, make money
get: get up, get married, get ready, get home, get better
take: take a break, take a photo, take part in, take care of, take place
have: have breakfast, have a shower, have a look, have fun, have a meeting
give: give advice, give a presentation, give up, give someone a hand
keep: keep calm, keep in touch, keep doing, keep a secret
put: put on, put off, put away, put up with
look: look at, look for, look after, look forward to
listen: listen to music / listen carefully (listen to + N)
depend: depend on
wait: wait for
pay: pay for, pay attention to
think: think about, think of
talk: talk to, talk about
ask: ask for, ask a question
tell: tell a story, tell the truth, tell someone to
say: say sorry, say hello (vs tell)
find: find out, find a way, find it difficult
use: use something for, used to do, be used to doing
try: try to do, try doing
start/begin: start doing / begin to
stop: stop doing / stop to do (chọn 1 sense + error riêng)
need: need to do
want: want to do
help: help someone do
learn: learn how to, learn by heart
teach: teach someone to
leave: leave home, leave for
call: call someone, give someone a call
feel: feel happy, feel like
become: become a teacher
bring: bring about / bring someone something
hold: hold a meeting
lead: lead to
include: include something in
continue: continue doing / continue to
set: set a goal, set up
change: change into / change one's mind
understand: understand something
consider: consider doing
achieve: achieve a goal / achieve success
cancel: cancel a meeting / cancel a flight
decide: decide to do
prefer: prefer to do / prefer A to B
agree: agree with / agree to
belong: belong to
suffer: suffer from
consist: consist of
focus: focus on
rely: rely on
apologize: apologize for
apply: apply for (job) / apply to
prepare: prepare for
search: search for
hope: hope to
seem: seem to
tend: tend to
fail: fail to do / fail an exam
pass: pass an exam
spend: spend time on / spend money on
waste: waste time
raise: raise a question / raise money
rise: (intransitive) prices rise
lay / lie: cẩn thận sense
affect / effect: affect = v
suggest: suggest doing / suggest that
enjoy: enjoy doing
finish: finish doing
mind: mind doing
avoid: avoid doing
practise/practice: practise doing
allow: allow someone to
enable: enable someone to
force: force someone to
let: let someone do
make: make someone do
…

Nếu lemma không có trong list: tự chọn **1 cụm thật** (V+N hoặc V+prep) bạn chắc chắn đúng; 3 cụm sai collocation.

GOLD do: do a good job / make a good job / create a good job / take a good job
GOLD find: find out the truth / find out the true / find the out truth / make out the truth (chọn opts hợp lý)

# ============================================================
# QUY TRÌNH TỪNG LEMMA (BẮT BUỘC — chống gen hàng loạt rỗng)
# ============================================================
Với MỖI lemma, trước khi ghi JSON, bạn phải chốt 4 dòng (có thể ghi tạm trong notes):
1) sense_vi
2) collocation_vàng (string)
3) vn_trap (1 lỗi HS Việt)
4) near_miss_forms (2–3 form)

Sau đó mới viết 5 item. **Không** copy 5 khung rồi replace lemma.

# ============================================================
# SCHEMA FILE
# ============================================================
{
  "version": 5,
  "batch_id": "p2-r1-final-01",
  "priority": "P2-R1-FINAL",
  "queue": "verbs",
  "quality_bar": 8.5,
  "types_required": ["meaning_mcq","l2_to_en","cloze","error","collocation_mcq"],
  "created_note": "antigravity FINAL · no templates · human-usable · no external LLM",
  "lemmas": ["do","get","think","look","use","find","tell","call","try","ask"],
  "items": [ /* 50 objects */ ]
}

Mỗi item:
{
  "lemma": "do",
  "pos": "v",
  "sense_vi": "làm / thực hiện",
  "level": "A1",
  "type": "collocation_mcq",
  "stem": { "q": "Chọn cụm đúng:", "opts": ["do a good job","make a good job","create a good job","take a good job"] },
  "answer": "do a good job",
  "explain_vi": "Làm tốt việc: do a good job (không make a good job).",
  "content_hash": "do|collocation_mcq|01",
  "meta": {
    "skill": "collocation",
    "quality_score": 9.1,
    "quality_notes": "do vs make job",
    "priority": "P2-R1-FINAL",
    "queue": "verbs",
    "pack_id": "p2-r1-final-verbs",
    "collocation_gold": "do a good job",
    "vn_trap": "make a good job"
  }
}

# ============================================================
# QUALITY SCORE (thật — không round-robin)
# ============================================================
Rubric / lemma (áp điểm cho cả 5 item, được lệch ±0.2 giữa types):
- Schema 5 type: 2.0
- Nghĩa + cụm THẬT: 2.5 (template = 0 → tổng <8.5 → rewrite)
- Near-miss + bẫy VN: 2.0
- Error quote sai + answer đúng 100%: 1.5
- explain_vi rõ ≤160 ký tự: 1.0
- Câu tự nhiên, frame không trùng hàng loạt: 1.0

Tổng < 8.5 → viết lại lemma.
Cấm cả file cùng một quality_score.
Gợi ý: 8.6 / 8.8 / 9.0 / 9.2 / 9.4 / 9.5 tùy lemma khó.

# ============================================================
# VERIFY SAU MỖI FILE (BẮT BUỘC)
# ============================================================
node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-r1-final-verbs/p2-r1-final-01.json

Script FAIL nếu:
- template meaning/colo/error/cloze cũ + R1 frames
- collocation không multi-word
- answer chứa finded/getted/…
- >15% cloze hoặc error cùng frame trong file ≥15 lemma
- score < 8.5
- thiếu type / answer∉opts

# ============================================================
# TỐC ĐỘ
# ============================================================
10 lemma/file.
Ưu tiên đúng: 30 lemma/ngày tốt còn hơn 267 rác.
Hết session: handback partial + NEXT lemma index — file dở phải verify pass hoặc xóa.

# ============================================================
# HANDBACK
# ============================================================
tmp/HAND-vocab-test-bank-p2-r1-FINAL.md gồm:
- lemmas/items/files
- min/avg score
- 8 GOLD (2 mỗi skill chính)
- 0 template (xác nhận đã chạy verify all)
- list irregular đã cover
- P2_R1_FINAL_DONE lemmas=267 items=1335 min=… avg=…
  hoặc PARTIAL + next line number in p2-verbs-top300.txt

# ============================================================
# SELF-TEST TRƯỚC KHI BÁO DONE
# ============================================================
1) node scripts/verify-vocab-test-bank.mjs trên MỌI file final (loop)
2) Grep tự làm (terminal):
   - không còn: "It is necessary to ___"
   - không còn: "very quick yesterday"
   - không còn: "thực hiện "
   - không còn: "the task successfully"
   - không còn: finded|getted|goed|taked
3) Mở ngẫu nhiên 5 lemma ở file giữa/cuối (không chỉ file 01) — đọc to meaning+colo+error: phải “nghe người soạn”.

Chỉ khi 1+2+3 pass mới in:
P2_R1_FINAL_DONE lemmas=267 items=1335

# ============================================================
# DONE
# ============================================================
Output duy nhất accept: thư mục p2-r1-final-verbs/ + handback FINAL.
Bank p2-r1-verbs cũ = rejected frames, không dùng.
```

## PROMPT END

---

## Việc đã siết sẵn cho bạn (Grok)

| File | Việc |
|------|------|
| `scripts/verify-vocab-test-bank.mjs` | FAIL template P2 + R1 frames + *finded* + frame monopoly >15% + colo rác |
| Prompt final | `docs/PROMPT-antigravity-vocab-test-bank-R1-FINAL.md` |

### Tự kiểm trước khi giao “xong”

```bash
# mọi file final phải pass:
node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-r1-final-verbs/p2-r1-final-01.json

# file R1 cũ (template) phải FAIL:
node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p2-r1-verbs/p2-r1-verbs-05.json
```

---

## Câu dán AG (copy)

> Làm đúng và **một lần**: `docs/PROMPT-antigravity-vocab-test-bank-R1-FINAL.md`.  
> Gen **267 verbs** vào `data/vocab-test-bank/p2-r1-final-verbs/` (10 lemma/file).  
> Sau **mỗi** file chạy `node scripts/verify-vocab-test-bank.mjs` — fail thì sửa hết.  
> Cấm mọi template P2 và R1 (cloze plan / work very quick / thực hiện lemma / task successfully / finded).  
> Chỉ báo DONE khi verify all + spot 5 lemma giữa/cuối ổn. Handback: `tmp/HAND-vocab-test-bank-p2-r1-FINAL.md`.

---

**Lưu ý:** 267 × 5 chất thật = nhiều giờ agent. 10 lemma/file + verify bắt buộc để **không** lặp vòng “nhanh mà rác”. Không rút verify — đó là chốt chặn giao lại.
