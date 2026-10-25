# PROMPT → Antigravity · Vocab test bank **PRIORITY FULL** (chuẩn ≥ 8.5)

> **Copy block `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + file + `.env.local`).  
> Workspace: `D:\Vocab\web-app` (nếu path `D:\Vibe\Vocab\web-app` thì dùng path đó — **1 workspace duy nhất**).  
> **Quota:** soạn bằng Antigravity — **CẤM tuyệt đối** gọi OpenRouter / Groq / Gemini / OpenAI / Zhipu / fetch model ngoài.  
> **Mục tiêu:** gen **hết hàng ưu tiên** (không phải cả catalog 1000+ pack). Chất lượng **≥ 8.5/10** từng lemma — không pass số lượng suông.

---

## Ưu tiên kho từ (đã chọn sẵn — AG không tự đổi thứ tự)

| Priority | Nguồn | ~Số lemma unique | Lý do |
|----------|--------|------------------|--------|
| **P0** | `src/data/roadmap/starter-packs-v1.json` (11 pack A0) | **131** | Onboarding / sinh tồn — traffic đầu |
| **P1** | School-daily extension (list nhúng dưới) | **+24** (không trùng P0) | Cày lớp / đặt câu / unit gần app |
| **P2** | (Sau khi P0+P1 VERIFY≥8.5) — **dừng**, báo Grok | — | Không đụng catalog-v3 / pro3m trong task này |

**Tổng task này: ~155 lemma × 5 item ≈ 775 items.**  
Chia **sub-batch 20–25 lemma/file** — **cấm** 1 file 775 item (dễ ẩu).

---

## PROMPT START

```
# ROLE
Bạn là senior ESL curriculum engineer (VN teens A0–A2) + content QA lead LingoPro.
Bạn KHÔNG phải “generator cho đủ số”. Mỗi item phải **dạy được 1 skill thật**.
Nếu không đạt rubric ≥ 8.5/10 cho 1 lemma → **viết lại lemma đó** trước khi sang lemma khác.

# CẤM
1) Gọi API LLM ngoài (OpenRouter, Groq, Gemini, OpenAI, Zhipu, …).
2) Copy 1 câu EN thành 5 wrapper hỏi khác label.
3) Type `match_pair` kiểu “lemma — nghĩa” (đã bị chấm FAIL vì trùng meaning_mcq).
4) Hai options **cùng đúng** (vd late for / late to).
5) Distractor vô lý (POS lệch, semantic field xa).
6) explain_vi tiếng Anh / markdown ** / “Wow”.
7) Bỏ qua self-score; bịa VERIFY_OK.
8) Gen catalog-v3 / pro3m / exam full — **CHỈ P0 + P1**.

# 5 TYPE BẮT BUỘC — 5 SKILL THẬT (v2 — thay match_pair)

| type | Skill | Bắt buộc |
|------|--------|----------|
| meaning_mcq | Nhận nghĩa EN→VI | q = lemma (+pos); opts **4 nghĩa VI**; 3 distractor **cùng POS + field gần** |
| l2_to_en | Recall VI→EN | q = định nghĩa VI **không** chứa form EN đúng; opts **4 form EN** gồm **≥1 near-miss** (cùng root / wake vs wake up / tired vs tiring) |
| cloze | Collocation + ngữ cảnh | 1 câu A0–A2, **1** `___`; opts 4; answer là form điền; **context buộc chọn lemma** (không đoán cảm xúc suông nếu có thể) |
| error | Sửa lỗi form/POS/collocation **của lemma** | Câu sai **1 lỗi có chủ đích** (bẫy VN: make homework, go to the school, wake on, need go, felt happily…); opts 4 câu/fix; **đúng đúng 1** |
| collocation_mcq | Chọn **cụm đúng** | q hỏi collocation (Which is correct? / Chọn cụm đúng); opts 4 **cụm ngắn** (do homework / make homework / …); **không** lặp nguyên văn full sentence của cloze/error |

## Khác biệt skill (hard)
- meaning_mcq ≠ collocation_mcq (nghĩa vs cụm)
- cloze ≠ error (điền vs sửa)
- l2_to_en phải có near-miss form, không 4 từ field hoàn toàn khác (trừ lemma rất cơ bản one/two — near-miss số/orthography)

# RUBRIC CHẤM / LEMMA (tự chấm — PHẢI ≥ 8.5)

Thang 10. **Fail lemma nếu < 8.5** → rewrite trước khi continue.

| Tiêu chí | Điểm max | 8.5+ cần |
|----------|----------|----------|
| Đủ 5 type đúng schema | 2.0 | 2.0 bắt buộc |
| 5 skill thật, stem/context độc lập | 2.5 | ≥ 2.0 |
| Distractor / near-miss chất | 2.0 | ≥ 1.7 |
| answer ∈ opts, **duy nhất 1 đúng** | 1.5 | 1.5 bắt buộc |
| explain_vi đúng sense, ≤160 ký tự, plain VI | 1.0 | ≥ 0.8 |
| Bẫy VN / collocation hữu ích | 1.0 | ≥ 0.7 |

Ghi `meta.quality_score` (số 8.5–10) + `meta.quality_notes` (≤12 từ) **mỗi item** hoặc **mỗi lemma** (nếu theo lemma: ghi trên cả 5 item cùng score).

# SCHEMA ITEM

```json
{
  "lemma": "homework",
  "pos": "n",
  "sense_vi": "bài tập về nhà",
  "level": "A1",
  "type": "collocation_mcq",
  "stem": {
    "q": "Chọn cụm đúng:",
    "opts": [
      "do homework",
      "make homework",
      "create homework",
      "work homework"
    ]
  },
  "answer": "do homework",
  "explain_vi": "Tiếng Anh dùng do homework, không make homework.",
  "content_hash": "homework|collocation_mcq|01",
  "meta": {
    "skill": "collocation",
    "quality_score": 9.0,
    "quality_notes": "classic VN trap make/do",
    "pack_id": "starter-a0-classroom",
    "priority": "P0"
  }
}
```

Rules:
- content_hash = `{slug(lemma)}|{type}|01` unique toàn project batch.
- answer string **exact match** 1 phần tử opts.
- Multiword (wake up): answer nhất quán; near-miss được wake / waking.

# HÀNG ƯU TIÊN — DANH SÁCH CHỐT

## P0 — Starter A0 (131 lemma) — LÀM TRƯỚC, HẾT MỚI P1
Nguồn canonical: `src/data/roadmap/starter-packs-v1.json`.
Đọc file đó; gen **đúng words[]** từng pack (dedupe global: lemma đã có file trước thì **SKIP**, log skipped).

Thứ tự pack (bắt buộc):
1. starter-a0-greetings
2. starter-a0-people
3. starter-a0-numbers
4. starter-a0-colors
5. starter-a0-classroom
6. starter-a0-food
7. starter-a0-body
8. starter-a0-verbs
9. starter-a0-weather
10. starter-a0-animals
11. starter-a0-daily

Sub-batch file (mỗi file 1 pack hoặc gộp ≤ 25 lemma):
- `data/vocab-test-bank/p0-01-greetings.json`
- `data/vocab-test-bank/p0-02-people.json`
- …
- `data/vocab-test-bank/p0-11-daily.json`

Hoặc gộp:
- p0-01 = greetings+people (≤25)
- nhưng **không** gộp >25 lemma/file.

Mỗi file shape:
```json
{
  "version": 2,
  "batch_id": "p0-01-greetings",
  "priority": "P0",
  "pack_ids": ["starter-a0-greetings"],
  "quality_bar": 8.5,
  "types_required": ["meaning_mcq","l2_to_en","cloze","error","collocation_mcq"],
  "created_note": "antigravity · no external LLM · rubric ≥8.5",
  "items": []
}
```

## P1 — School / daily extension (24 lemma) — SAU P0
Chỉ các lemma **không** thuộc P0:

homework, tired, breakfast, happy, finish, start, need, late, early, classroom, teacher, break, exam, remember, lesson, student, textbook, notebook, listen, speak, answer (v.), question, afternoon, evening

File: `data/vocab-test-bank/p1-school-daily.json`  
priority: P1 · pack_ids: ["school-daily-ext"]

## P0∪P1 đã cover batch-a-20
Nếu tồn tại `data/vocab-test-bank/batch-a-20.json` (v1, type match_pair):
- **Không xóa** file cũ.
- Khi gen P0/P1, lemma trùng → item **v2** trong file P* (type collocation_mcq).
- Handback ghi: “v1 deprecated for runtime; use p0/p1”.

# WORKFLOW BẮT BUỘC (không nhảy cóc)

1) Đọc starter-packs-v1.json + prompt này.
2) Với **từng** pack P0 theo thứ tự:
   a. Liệt kê lemma (sau dedupe).
   b. Soạn **từng lemma** đủ 5 type.
   c. Self-score rubric; **nếu <8.5 → rewrite lemma**.
   d. Ghi file sub-batch JSON.
   e. Chạy verify script (dưới) trên file đó — fail thì sửa, **cấm** next pack.
3) Sau hết P0: handback partial `tmp/HAND-vocab-test-bank-p0.md` (bảng pack × lemma × avg score).
4) Làm P1 tương tự → `tmp/HAND-vocab-test-bank-p1.md`.
5) Handback tổng `tmp/HAND-vocab-test-bank-priority-full.md`:
   - Tổng lemma, items
   - Min/avg quality_score
   - 5 GOLD examples (error/collocation)
   - 5 item từng bị rewrite (trước/sau nếu có)
   - Rủi ro còn lại
   - VERIFY_OK=yes|no
6) **Không** migration SQL, **không** UI, **không** git commit trừ user yêu cầu.

# VERIFY SCRIPT (chạy mỗi file + cuối)

Tạo `scripts/verify-vocab-test-bank.mjs` nếu chưa có, chạy được:

```js
// Usage: node scripts/verify-vocab-test-bank.mjs data/vocab-test-bank/p0-01-greetings.json
import fs from 'fs';
const path = process.argv[2];
const j = JSON.parse(fs.readFileSync(path, 'utf8'));
const items = j.items;
const REQ = ['meaning_mcq','l2_to_en','cloze','error','collocation_mcq'];
const FORBIDDEN = ['match_pair'];
let ok = true;
const hashes = new Set();
const byL = {};
const scores = [];
for (const it of items) {
  if (FORBIDDEN.includes(it.type)) { console.error('forbidden type', it.lemma, it.type); ok=false; }
  if (!it.stem?.opts?.includes(it.answer)) { console.error('answer not in opts', it.content_hash); ok=false; }
  if (new Set(it.stem.opts).size !== it.stem.opts.length) { console.error('dup opts', it.content_hash); ok=false; }
  if (it.stem.opts.length !== 4) { console.error('opts!=4', it.content_hash); ok=false; }
  if (it.type === 'cloze' && !/___/.test(it.stem.q)) { console.error('cloze no blank', it.content_hash); ok=false; }
  if (hashes.has(it.content_hash)) { console.error('dup hash', it.content_hash); ok=false; }
  hashes.add(it.content_hash);
  byL[it.lemma] = byL[it.lemma] || new Set();
  byL[it.lemma].add(it.type);
  const qs = it.meta?.quality_score;
  if (typeof qs === 'number') scores.push(qs);
  if (typeof qs === 'number' && qs < 8.5) { console.error('score<8.5', it.lemma, qs); ok=false; }
}
for (const [L, set] of Object.entries(byL)) {
  if (set.size !== 5 || !REQ.every(t => set.has(t))) { console.error('lemma types', L, [...set]); ok=false; }
}
// stem independence: same q text across types of same lemma
const qmap = {};
for (const it of items) {
  const k = it.lemma + '||' + (it.stem.q||'').toLowerCase().trim();
  if (qmap[k]) { console.error('duplicate stem q', it.lemma, it.type); ok=false; }
  qmap[k] = it.type;
}
const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
const min = scores.length ? Math.min(...scores) : 0;
console.log(JSON.stringify({ file: path, items: items.length, lemmas: Object.keys(byL).length, avg, min, VERIFY_OK: ok }, null, 2));
if (!ok) process.exit(1);
```

(CommonJS `require` OK nếu project không ESM — chọn 1 kiểu chạy được.)

ACCEPT file chỉ khi exit 0 và min quality_score ≥ 8.5.

# QUALITY PLAYBOOK (bắt buộc áp)

## Collocation / error — bẫy VN ưu tiên (khi lemma cho phép)
- do/make homework, housework
- go to school / go to the school (institution vs building)
- wake up (not wake on)
- need to V / want to V
- help sb do
- finish + V-ing
- remember to V vs V-ing (chỉ khi lemma remember)
- tired / tiring
- late vs lately; early (no earlily)
- have/eat breakfast (not a breakfast) khi lemma breakfast
- take a break / have a break
- interested in / good at — nếu lemma cho phép

## Numbers / colors / body (A0)
- Vẫn đủ 5 type; error có thể = spelling/số gần (three/tree), collocation “a red pen”, cloze đơn giản nhưng **không** 4 distractor vô nghĩa.
- quality_score vẫn ≥ 8.5 bằng near-miss + clear explain.

## Sense khóa
- 1 sense_vi chính / lemma trong batch.
- break = giờ giải lao (n) như batch-a — ghi rõ pos.
- fish trong food pack = đồ ăn/cá (n) nhất quán.

# GOLD STANDARD (bám theo — không copy nguyên nếu lemma khác)

error homework: make → do  
error school: the school (learn) → school  
collocation: do homework | make homework | …  
cloze wake up: I usually ___ at 6 AM …  
l2_to_en wake up: opts gồm wake / wake up / get up / sleep  

# DONE CRITERIA
- Mọi file P0 + P1 tồn tại, verify exit 0
- Tổng lemma ≈ 131 + 24 (trừ dedupe thật)
- items = lemmas × 5
- min meta.quality_score ≥ 8.5
- 0 type match_pair
- Handback tổng VERIFY_OK=yes
- In stdout: PRIORITY_FULL_DONE lemmas=N items=M min_score=X avg_score=Y

# NẾU HẾT QUOTA / SESSION
- Dừng ở ranh pack; handback ghi DONE_PACKS + NEXT_PACK.
- Không để file dở < verify pass.
```

## PROMPT END

---

## Checklist sau khi AG xong (bạn / Grok)

| Check | Pass |
|-------|------|
| `node scripts/verify-vocab-test-bank.mjs` từng file | exit 0 |
| Spot 10 lemma random (error + collocation) | bẫy VN đúng |
| Không còn match_pair | yes |
| min score ≥ 8.5 | yes |
| Import DB + usage | task riêng |

---

## Ghi chú chọn kho (cho product)

1. **P0 Starter A0** — onboard, import pack sẵn, 131 từ cốt.  
2. **P1 School-daily** — khớp cày lớp / Đặt câu / batch-a cũ.  
3. **Chưa** catalog-v3 (1243 pack) / pro3m / exam — volume lớn, QA sụt; mở **P2** chỉ sau khi P0+P1 ≥ 8.5 ổn định.

---

## Cách giao AG

1. Mở Antigravity Agent · workspace web-app.  
2. Dán **PROMPT START … END** (file này).  
3. Cho ghi `data/vocab-test-bank/**`, `scripts/verify-vocab-test-bank.mjs`, `tmp/HAND-*.md`.  
4. Nhắc: **làm tuần tự P0 pack 1→11, verify từng file, rồi P1.**
