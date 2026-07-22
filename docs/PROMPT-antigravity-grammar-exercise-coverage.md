# PROMPT → Antigravity · Grammar exercises: phủ lý thuyết + đa dạng dạng bài

> **Copy block `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + file + `.env.local`).  
> Workspace: `D:\Vocab\web-app`.  
> **Quota:** dùng **năng lực soạn nội dung sẵn có của Antigravity** — **CẤM** gọi OpenRouter / Groq / Gemini API / OpenAI / fetch model ngoài để gen bài.  
> Grok chỉ chấm handback sau — tiết kiệm quota Grok.

---

## PROMPT START

```
# ROLE
Bạn là senior curriculum engineer + TypeScript engineer LingoPro.
Task: **mở rộng bank bài tập ngữ pháp 62 topic** sao cho:
1) **phủ hết lý thuyết** của từng lesson (rules / formula / mistakes / wordbanks / signals / usage),
2) **đa dạng kiểu bài** (mcq · fill · error · tf),
3) **số lượng đủ** để học + in PDF + drill app,
4) **không pollution** (không dán bài topic khác),
5) **KHÔNG gọi API LLM ngoài** — bạn TỰ SOẠN bằng quota Antigravity.

# PRODUCT CONTEXT
- App: LingoPro, Next.js, Supabase.
- Canonical store: `grammar_lessons.exercises` (JSONB) — KHÔNG dùng bảng `grammar_exercises` (legacy).
- Shape item (canonical):
  {
    type: 'mcq' | 'fill' | 'error' | 'tf',
    q: string,                 // câu hỏi / stem (có ___ nếu fill)
    opts?: string[],           // bắt buộc với mcq/fill/error; tf không cần
    answer: string | boolean,  // tf: true/false
    fb: string,                // feedback VI ngắn, đúng case
    case_id?: string           // slug case lý thuyết (bắt buộc khi gen mới)
  }
- Normalize UI: `src/lib/grammar-exercises.ts` (tf → Đúng/Sai MCQ; error có thể là full-sentence MCQ).
- Caps UI (có thể đã uncommitted — GIỮ / hoàn tất nếu thiếu):
  - `GoldenLesson.tsx` PREVIEW_CAP = 24 (+ nút Xem thêm)
  - PDF `exerciseCap: 0` = all (`grammar/learn/page.tsx` + `grammar-lesson-pdf.ts` default 40, 0=∞)
  - Drill API `/api/grammar/quiz` lấy max **32** từ bank DB
  - `apply-a0a2-quality.mjs` QUIZ_CAP = **48**
- Baseline prod (trước task): avg ~**17.4** câu/lesson; nhiều topic chỉ 12–16; wordbank dày nhưng quiz mỏng (vd articles 12 câu / 40 bank rows / 4 rules).

# GOAL (ACCEPTANCE)
Cho **mỗi** trong 62 lessons:

## A. Số lượng
- **TARGET_MIN = 36** câu/lesson (ưu tiên 40–48 nếu lý thuyết dày).
- HARD_CAP = 80 (đừng phình vô nghĩa).
- Không lesson nào < 36 sau apply.

## B. Đa dạng dạng bài (mỗi lesson)
Tối thiểu:
| type  | min | ý nghĩa |
|-------|-----|---------|
| mcq   | 10  | chọn đáp án / form / case |
| fill  | 8   | điền chỗ trống (opts ≥2, answer ∈ opts) |
| error | 8   | sửa lỗi / chọn câu đúng sau "Sửa:" hoặc "Find the error:" |
| tf    | 6   | đúng/sai về rule (answer boolean) |

Tổng type counts phải **cân**, không 90% mcq.

## C. Phủ lý thuyết (quan trọng nhất)
Với mỗi lesson, đọc `sections` (+ `theory_vi` nếu cần) và build **coverage matrix**:

Nguồn case (gộp unique):
1. `sections.rules[].case` (hoặc rule text)
2. `sections.mistakes[]` → mỗi wrong/right = 1 case lỗi
3. `sections.formula.rows[]` → mỗi dạng form (+ / − / ?)
4. `sections.usage[].label`
5. `sections.signals[]` (group nếu nhiều)
6. `sections.wordbanks[]` — **ít nhất 1–2 câu quiz gắn mỗi bảng chính** (không cần 1 row = 1 câu nếu bảng 200 rows; cover **nhóm case** trong bảng)
7. `sections.comparison` / `tips` nếu có contrast (Simple vs Continuous, used to vs be used to…)

Với **mỗi case_id** trong matrix:
- ≥ **1** item bất kỳ type, và
- các case “xương sống” (form +, form −, form ?, spelling chính, 2–3 mistakes hay gặp) phải có **≥2 type khác nhau** (vd: fill + error, hoặc mcq + tf).

Gắn `case_id` rõ: `form_pos`, `form_neg`, `form_q`, `spell_ies`, `mistake_he_go`, `wb_u_nouns`, `signal_always`, `contrast_pc`…

## D. Chất lượng khóa
- `answer` ∈ `opts` (mcq/fill/error). tf: answer true|false.
- `q` không rỗng, không meta boilerplate:
  ✗ "Chọn cấu trúc phù hợp nhất"
  ✗ "Điền tên cấu trúc/chủ điểm đang luyện"
  ✗ "Chọn lời khuyên sai"
- On-topic 100%: stem + đáp án **chỉ** thuộc slug đó (cấm gerund dán future-will, there-is dán mixed-conditionals, …).
- Feedback `fb` tiếng Việt ngắn, **đúng rule** (không giải thích sai thì).
- Dedup theo normalize(q): lower, trim, collapse space.
- Giữ item GOLD / đã audit tốt sẵn; **APPEND** hoặc merge thông minh — không xóa sạch bank tốt chỉ để gen mới.
- VI/EN mix OK như bank hiện tại (stem EN hoặc VI đều được; ưu tiên stem EN + fb VI cho HS VN).
- Free-fill: **luôn có opts** (không free-text trống).

# NEVER
- NEVER gọi OpenRouter / Groq / Gemini API key / OpenAI / Anthropic / `generateBatch` qua network API để gen bài.
- NEVER hardcode secrets; đọc `.env.local` như scripts hiện có.
- NEVER đổi schema Supabase.
- NEVER overwrite `sections` / `theory_vi` / `examples` / wordbanks (chỉ touch `exercises` + clear quiz cache) — trừ khi sửa typo P0 trong quiz.
- NEVER commit `.env*`.
- NEVER claim PASS 100% không có số liệu verify.
- NEVER chạy `fix-refill-exercises-db.ts --apply` với provider API (đó là path tốn quota ngoài).

# METHOD (bắt buộc theo thứ tự)

## 0) Baseline
```bash
# đếm hiện trạng
node --input-type=module <<'EOF'
// dùng createClient + .env.local
// in: total lessons, avg, min, max, under36, type_totals
// in table: slug | n | mcq | fill | error | tf | cases
EOF
```
Lưu `tmp/grammar-ex-baseline.json`.

## 1) Inventory theory cases
Script hoặc tay: với mỗi slug → list case_id từ sections.
Lưu `tmp/grammar-theory-cases.json`:
`{ slug, cases: [{id, source, hint}], existing_case_ids: [], gaps: [] }`

## 2) Soạn bank bù (HAND-AUTHORED)
Ưu tiên thứ tự file code (merge vào 1 module mới cho dễ apply):

Tạo:
`scripts/grammar-a0a2/expand-exercises-coverage.mjs`

API:
- `export const EXPAND = { [slug]: Exercise[] }`  // chỉ câu **mới** bổ sung
- helpers: `mcq fill err tf` giống `upgrade-quiz-all-remaining.mjs` / `gold-lessons-a0.mjs`
- `pack` **không** cắt dưới 36 — target merge final ≥36

Nguồn tham chiếu (ĐỌC, không copy rác):
- `scripts/grammar-a0a2/gold-lessons-a0.mjs` — seed GOLD (giữ)
- `scripts/grammar-a0a2/upgrade-quiz-all-remaining.mjs`
- `scripts/grammar-a0a2/upgrade-quiz-round2.mjs`
- `scripts/grammar-a0a2/apply-a0a2-quality.mjs` (`curateExercises`, pollution filters)
- Wordbanks: `wordbanks-dense.mjs` + batch2/3/4 (để bám case thật)
- DB live: `grammar_lessons.sections` + `exercises` hiện tại

Chiến thuật soạn nhanh nhưng đúng:
1. Lấy **mistakes** → 1 error + 1 tf/mcq cho mỗi mistake (paraphrase stem, không clone y nguyên 2 lần).
2. Lấy **formula rows** → fill/mcq form +/−/? .
3. Lấy **rules** → mcq spelling/form + fill.
4. Lấy **wordbank groups** → 2–4 fill/mcq per group (pick typical rows).
5. Lấy **signals** → 1–2 mcq “when to use”.
6. Lấy **contrast/comparison** → 2–3 mcq/error phân biệt thì/cấu trúc gần.
7. Nếu vẫn <36: thêm paraphrase cùng case_id (đổi noun/verb, giữ rule) — ghi `case_id` + suffix `_v2`.

Batch làm việc (để đỡ context nổ):
- Batch A: beginner order 1–14 (countable → present-continuous …)
- Batch B: beginner 15–28
- Batch C: intermediate
- Batch D: advanced
Mỗi batch: soạn EXPAND → dry merge → apply batch → verify batch → báo cáo partial.

## 3) Apply merge (local script, không API)
Trong `expand-exercises-coverage.mjs` (hoặc sibling apply):

```
for each lesson:
  existing = lesson.exercises
  add = EXPAND[slug] || []
  merged = dedup(existing + add)  // prefer keep existing if same q
  // optional light drop only if isPollutedQuestion (reuse filter from apply-a0a2)
  // ensure type balance: if still thin on a type, you must author more — don't invent junk
  if merged.length > 80: keep highest diversity by case_id + type
  update grammar_lessons.exercises
  delete grammar_quiz_cache where lesson_id
```

CLI:
```
node scripts/grammar-a0a2/expand-exercises-coverage.mjs --dry
node scripts/grammar-a0a2/expand-exercises-coverage.mjs --apply
node scripts/grammar-a0a2/expand-exercises-coverage.mjs --apply --only articles,present-simple
```

## 4) Caps UI (nếu working tree chưa có)
Confirm / apply uncommitted intent:
- PREVIEW_CAP 24
- PDF all (0)
- quiz route min(32)
- QUIZ_CAP 48

## 5) Verify (bắt buộc trước handback)
Tự viết/chạy checker in ra PASS/FAIL:

Per lesson FAIL nếu:
- n < 36
- mcq < 10 | fill < 8 | error < 8 | tf < 6
- có item answer ∉ opts
- có item type lạ / q rỗng
- coverage: >30% theory cases (từ rules+mistakes+formula) **không** có case_id match (fuzzy OK: normalize)
- spot pollution keywords off-topic (reuse heuristics audit-topic-pollution-v2 nếu có; whitelist FP)

Global:
- under36 == 0
- type_totals roughly balanced
- report JSON + markdown

Files:
- `tmp/grammar-ex-expand-report.json`
- `docs/grammar/EXERCISE-COVERAGE-EXPAND-REPORT.md`

## 6) PDF smoke (optional nhưng tốt)
```
node scripts/grammar-a0a2/export-lesson-pdf-preview.mjs
```
(hoặc 2–3 slug: articles, present-simple, mixed-conditionals) — xác nhận worksheet in nhiều câu hơn trước.

## 7) Commit (chỉ khi verify PASS)
```
git add scripts/grammar-a0a2/expand-exercises-coverage.mjs \
  docs/grammar/EXERCISE-COVERAGE-EXPAND-REPORT.md \
  src/components/grammar/GoldenLesson.tsx \
  src/lib/grammar-lesson-pdf.ts \
  src/app/grammar/learn/page.tsx \
  src/app/api/grammar/quiz/route.ts \
  scripts/grammar-a0a2/apply-a0a2-quality.mjs
# + files EXPAND modules if split
git commit -m "feat(grammar): expand exercises for theory coverage + type mix"
```
Push nếu user env cho phép; không force-push.

# DELIVERABLES
1. Code: `scripts/grammar-a0a2/expand-exercises-coverage.mjs` (+ optional `expand-banks-*.mjs` split)
2. DB: 62 lessons updated, cache cleared
3. Report: `docs/grammar/EXERCISE-COVERAGE-EXPAND-REPORT.md`
4. Caps UI giữ raised
5. Handback block dưới đây

# HANDBACK (paste nguyên về chat Grok)

### HANDBACK_GROK_EX_COVERAGE
- baseline_avg:
- final_avg:
- under36_after:
- type_totals_after: { mcq, fill, error, tf }
- lessons_updated:
- samples (3 slug): slug | n | types | case_ids_count | gaps_remaining
- pollution_spotcheck: (PASS/FAIL + 3 stems)
- files_changed:
- commit:
- known_risks:
### END_HANDBACK

# START NOW
1. Baseline count → tmp
2. Scaffold expand-exercises-coverage.mjs
3. Batch A author → dry → apply → verify
4. B → C → D
5. Full verify + report + commit
6. In handback

Không dừng ở “đã viết script”; **DB phải đạt TARGET_MIN** mới xong.
```

## PROMPT END

---

## Ghi chú cho tapho (ngoài prompt)

| Việc | Ai |
|------|-----|
| Soạn 36–48 câu/topic × 62, phủ case | **Antigravity** (quota bạn) |
| Chấm handback + spot-check DB | **Grok** (ít token) |
| Caps UI/PDF/quiz đã draft uncommitted | Giữ; AG confirm |

**Cách chạy:** mở Antigravity Agent → dán PROMPT START…END → workspace `D:\Vocab\web-app` → cho quyền terminal + `.env.local`.

**Sau khi AG xong:** paste `### HANDBACK_GROK_EX_COVERAGE` … `### END_HANDBACK` vào chat này — Grok chấm thật (count DB, 3 slug spot-check), không tin narrative 100% suông.
