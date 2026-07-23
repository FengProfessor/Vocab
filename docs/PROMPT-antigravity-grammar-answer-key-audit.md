# PROMPT → Antigravity · Audit TOÀN BỘ đáp án bài tập ngữ pháp (P0)

> Copy **PROMPT START → PROMPT END** dán AG.  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** external LLM API.  
> User **không** có thời gian sửa tay từng câu — AG phải **quét hết 62 topic**, sửa hàng loạt, verify cứng.  
> Grok chỉ chấm handback + spot 10 câu.

---

## PROMPT START

```
# ROLE
Senior English teacher (VN secondary) + QA engineer.
Task: **AUDIT + FIX EVERY exercise answer key** in grammar_lessons.exercises (62 topics).
Priority: HS Việt kém tiếng Anh không bị chấm sai oan / học sai rule.

# INCIDENT (đã xảy ra — phải prevent)
1. TF: "I love Tom." is correct → marked Sai + fb they/them (WRONG).
2. ERROR: "Find the error: Tom is happy." → answer "Tom are happy." (WRONG — Tom is happy is correct; is→are is poison).

User saw this in **verb-to-be, câu ~19 error type** (not only TF).

# HARD RULES — answer key
## Never mark these as "wrong" / never "correct" them to bad English
Whitelist GOOD (answer must treat as correct English):
- Tom is happy. / She is a player. / He is a doctor. / I am a student.
- He works here. / She teaches English. / I work every day. / I love Tom.
- Tom was playing football. / They were not watching TV.
- There is a computer… / There are many cars… (when agreement matches noun)
- Any sentence that is standard grammatical English for the lesson level

## Poison patterns (MUST detect + fix)
| Pattern | Action |
|---------|--------|
| Find the error: **[correct sentence]** + answer is **worse grammar** | INVERT: Find the error: [wrong form]; answer = [correct form] OR delete |
| answer = "Tom are happy" / "She am…" / "They is…" | INVALID as correct answer |
| TF "X is correct" + X is good English + answer=false | set true + VI fb |
| TF "X is correct" + X is bad + answer=true | set false + VI fb |
| fb says is→are while subject is Tom/he/she/it | fix |
| fb "Đúng: She am…" | fix |
| MCQ answer not in opts | fix |
| MCQ answer clearly ungrammatical when better opt exists | fix |

## Fix procedure for poison ERROR items
IF stem is correct AND answer is incorrect form:
  new_q = "Find the error: " + answer  (the bad form)
  new_answer = stem                 (the good form)
  opts = [stem, answer, one more distractor]
  fb VI: "Sai. Chủ ngữ số ít (Tom/he/she/it) đi với is, không are. Câu đúng: …"
IF cannot invert safely → DELETE item, refill from FRESH bank or write 1 good error item.

# SCOPE
- ALL 62 lessons, ALL types: mcq, fill, error, tf
- Beginner FIRST (verb-to-be, present-simple, articles, pronouns, past-*, continuous, there-is, have-got, …) then rest

# DELIVERABLES (code)
1. `scripts/grammar-a0a2/audit-answer-keys.mjs`
   - Scan all exercises
   - Emit tmp/answer-key-audit.json:
     { poison: [...], ansNotInOpts: [...], tfSuspicious: [...], bySlug counts }
   - Detect at least:
     a) error-on-correct-sentence (stem good + answer worse)
     b) answer ∉ opts
     c) FORCE_TRUE sentences with answer false
     d) fb contains "Tom are" / "is → are" with singular subject

2. `scripts/grammar-a0a2/fix-answer-keys.mjs`
   - Apply fixes to Supabase
   - Clear grammar_quiz_cache per updated lesson
   - Log every change: slug, index, before, after
   - Keep n >= 36 (refill from practice-banks-fresh* if drop)

3. `scripts/grammar-a0a2/verify-answer-keys.mjs`
   PASS only if:
   - poison count == 0
   - ansNotInOpts == 0
   - FORCE_TRUE all answer=true when used as TF "is correct"
   - no "Find the error: Tom is happy" with answer containing "are happy"
   - verify-final.mjs still PASS
   - verify-learner-fb-r5.mjs still PASS (if exists)
   - verify-fb-generic-r5.1.mjs still PASS (if exists)

# QUALITY FB (when fixing)
Vietnamese, specific, mother-style:
- Sai. Tom là số ít → dùng is, không are. Câu đúng: Tom is happy.
NOT: "Sai ở chỗ lỗi từ…"

# NEVER
- NEVER leave poison pairs in DB
- NEVER external API
- NEVER nới verify-answer-keys to pass with poison>0
- NEVER claim "checked all" without verify-answer-keys PASS + audit JSON counts

# WORK ORDER
1. audit-answer-keys.mjs → baseline JSON (must find verb-to-be Tom is happy poison if still present)
2. fix-answer-keys.mjs --apply
3. re-audit → poison=0
4. verify-answer-keys + verify-final + learner gates
5. Spot human: verb-to-be full list of error+tf; present-simple; articles; pronouns; past-continuous
6. docs/grammar/AG-ANSWER-KEY-AUDIT-REPORT.md
7. commit:
```
git add scripts/grammar-a0a2/audit-answer-keys.mjs \
  scripts/grammar-a0a2/fix-answer-keys.mjs \
  scripts/grammar-a0a2/verify-answer-keys.mjs \
  docs/grammar/AG-ANSWER-KEY-AUDIT-REPORT.md
git commit -m "fix(grammar): full answer-key audit purge poison error/TF items"
```

# HANDBACK

### HANDBACK_GROK_ANSWER_KEY_AUDIT
- poison_before → poison_after (must 0)
- ansNotInOpts_before → after
- force_true_ok: yes/no
- verb-to-be Tom is happy status: (must: no error item with ans Tom are happy)
- verify_answer_keys / verify_final / verify_learner / verify_generic: PASS/FAIL
- sample 8 fixes (slug | before q/ans | after q/ans)
- commit:
- residual:
### END_HANDBACK

# START
Audit now → you MUST surface the Tom is happy poison if any remains → fix ALL poison across 62 → verify PASS → handback.
```

## PROMPT END

---

## Ghi chú tapho

User incident: **error** `Find the error: Tom is happy` → ans `Tom are happy` (không chỉ TF).

Prompt ép AG:
1. Audit machine toàn 62  
2. Fix hàng loạt  
3. Gate `poison == 0`  
4. Handback có số  

Grok sau handback: chạy lại `verify-answer-keys` + spot verb-to-be.
