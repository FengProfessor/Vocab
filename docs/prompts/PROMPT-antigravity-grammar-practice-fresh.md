# PROMPT → Antigravity · Thêm ví dụ lý thuyết + bank luyện (không trùng)

> **Copy `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + file + `.env.local`).  
> Workspace: `D:\Vocab\web-app`.  
> **Quota AG:** tự soạn content — **CẤM** gọi OpenRouter / Groq / Gemini API / OpenAI để gen.  
> Grok chỉ chấm handback sau.

---

## PROMPT START

```
# ROLE
Curriculum engineer + TypeScript cho LingoPro grammar.
Task: (A) bổ sung **ví dụ lý thuyết** đa dạng; (B) viết **practice banks FRESH** phủ case; (C) apply DB + verify.

# PRODUCT RULES (bắt buộc)
1. **Ngoài (lý thuyết)** = `examples` + `sections.mistakes` + formula/usage trong `grammar_lessons`
   - Chỉ 8–15 example EN+VI/topic (đủ neo, không nhồi quiz).
2. **Trong (luyện)** = `exercises` — stem **KHÁC** hoàn toàn với examples/mistakes/usage EN.
3. **Không trùng**:
   - practice stem ≠ theory stem (exact / substring dài)
   - trong 1 bank: không 2 câu cùng stem (normalize lower+strip punct)
4. **Phủ lý thuyết**: mỗi case trong rules / mistakes.why / formula rows / usage labels có ≥1 exercise (case_id gắn rõ).
5. **Đa dạng dạng bài**: mcq ≥8, fill ≥6, error ≥4, tf ≥4; tổng target 36–42/topic.
6. **Chất lượng**:
   - answer ∈ opts (mcq/fill/error)
   - tf answer boolean
   - cấm multi-correct (vd "fits a" với cả a book + a cat)
   - cấm fake ss (teachess), "another", polarity will↔won't trên câu đúng
   - cấm stem VI tip: "Dùng cấu trúc…", "(khi nói nhạc nói chung)" dán trong error stem
   - fb tiếng Việt ngắn, đúng rule

# CODE ĐÃ CÓ (đọc trước, mở rộng — đừng viết lại từ zero)
- `scripts/grammar-a0a2/practice-coverage-engine.mjs` — banlist, paraphrase, coverageReport
- `scripts/grammar-a0a2/practice-banks-fresh.mjs` — articles + re-export A0
- `scripts/grammar-a0a2/practice-banks-fresh-a0.mjs` — present-simple, pronouns, be, past-simple, C/U
- `scripts/grammar-a0a2/quality-fix-refill-all.mjs` — apply pipeline
- GOLD/theory: `gold-lessons-a0.mjs`, `apply-a0a2-quality.mjs` GOLD (chỉ đọc để biết case — practice phải stem khác)

# SHAPE
## Example (theory)
{ en: string, vi: string, note?: string }

## Exercise (practice)
{
  type: 'mcq'|'fill'|'error'|'tf',
  q: string,
  opts?: string[],      // mcq/fill/error bắt buộc; tf không
  answer: string|boolean,
  fb: string,           // VI ngắn
  case_id: string       // map case lý thuyết: s_form, an_sound, subj, ...
}

# WORK PLAN

## Phase 0 — Baseline
Đếm hiện tại (script hoặc query Supabase):
- n exercises/topic, theory overlap count, coverage %
Lưu `tmp/ag-practice-baseline.json`

## Phase 1 — Theory examples (ngoài)
Với **từng** topic còn mỏng examples (<10) hoặc user-facing core:
- Thêm examples EN+VI **mới** (không copy nguyên practice stems)
- Giữ mistakes ngắn, wrong/right **không** dán chú thích VI dài trong `wrong`
- Update DB: `grammar_lessons.examples` (+ sections.mistakes nếu cần)
- **Không** đụng exercises ở phase này

Ưu tiên batch:
A0: articles, present-simple, personal-pronouns, verb-to-be, past-simple, countable-uncountable,
    plural-nouns, quantifiers, demonstratives, possessives, there-is, have-got,
    present-continuous, future-will, modals-obligation, conditionals-0-1
Rồi intermediate: present-perfect, passive, reported-speech, relative-clauses, gerunds-infinitives
Rồi advanced còn lại nếu còn quota.

## Phase 2 — Fresh practice banks (trong)
Mở rộng `practice-banks-fresh-*.mjs`:
- Mỗi slug: mảng 36–42 items
- case_id map rules/mistakes của topic đó
- STEM khác examples/mistakes đã có trong DB (đọc DB trước khi viết)

Export gộp vào `FRESH_BY_SLUG` trong `practice-banks-fresh.mjs`.

Template case (ví dụ present-simple):
- s_form, base, neg, Q, spell, short, contrast, signal
(không copy "She teaches English" nếu đã là example)

## Phase 3 — Apply + verify
```bash
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --dry
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply
```
(Nếu sửa examples: update examples trước apply exercises.)

Verify script (tự viết `tmp/ag-verify-practice.mjs` nếu cần):
PASS khi:
- 62 lessons, n ≥ 36
- theoryOverlapItems total < 30 (toàn bộ DB)
- intraDup stems = 0
- avg coveragePct ≥ 90
- spot 5 topic: 0 multi-correct, 0 VI-tip error stem, 0 "which example fits"

Report: `docs/grammar/AG-PRACTICE-FRESH-REPORT.md`

## Phase 4 — Commit (scoped)
```
git add scripts/grammar-a0a2/practice-banks-fresh*.mjs \
  scripts/grammar-a0a2/practice-coverage-engine.mjs \
  scripts/grammar-a0a2/quality-fix-refill-all.mjs \
  docs/grammar/AG-PRACTICE-FRESH-REPORT.md
# + files examples update scripts if any
git commit -m "feat(grammar): AG fresh examples + practice banks for theory coverage"
```
Push nếu env cho phép.

# NEVER
- NEVER gọi external LLM API keys
- NEVER hardcode secrets
- NEVER overwrite sections.wordbanks / theory_vi wholesale
- NEVER claim 100% không số liệu verify
- NEVER multi-correct MCQ
- NEVER clone theory stem vào exercises

# HANDBACK (paste về chat Grok)

### HANDBACK_GROK_PRACTICE_FRESH
- examples_updated: (số topic / +bao nhiêu example)
- fresh_banks_added: [slugs]
- after: avg_n, under36, theoryOverlapTotal, intraDup, avgCoveragePct
- samples (3 slug × 2 stems practice + 1 example theory — chứng minh khác nhau)
- files_changed:
- commit:
- risks:
### END_HANDBACK

# START
Phase 0 baseline → Phase 1 examples batch A0 → Phase 2 banks → Phase 3 apply verify → handback.
```

## PROMPT END

---

## Ghi chú cho tapho

| Việc | Ai |
|------|-----|
| Soạn examples + 36–42 câu/topic | **AG** (dễ, lặp theo template) |
| Chấm handback + spot DB | **Grok** |
| Pipeline/file đã có | Không cần AG thiết kế lại |

**Khó vừa phải:** chỉ cần AG **đọc case lý thuyết** rồi viết stem mới — đừng để nó “copy examples thành quiz”.

**Gợi ý batch nhỏ:** mỗi lần AG 8–12 topic → paste handback → Grok chấm → lượt sau.
