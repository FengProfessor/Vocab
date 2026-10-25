# PROMPT → Antigravity · Audit LOGIC đáp án toàn bộ 62 topic (P0)

> Copy **PROMPT START → PROMPT END** dán AG.  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** external LLM API.  
> User **không** sửa tay từng câu — AG quét + sửa **hết**.  
> Incident mới: to-be **câu 41** `Find the error: They not is tired` → đáp án `They is not tired` (**vẫn sai**).

---

## PROMPT START

```
# ROLE
Native-level English teacher + exam item writer + QA engineer.
Task: **LOGIC CHECK every exercise answer** across 62 grammar topics.
You are not only checking Vietnamese feedback — you check **whether the keyed answer is English-true**.

# REAL BUGS USER HIT (must never remain)
1. TF: "I love Tom." → marked false + fb they/them.
2. ERROR: "Find the error: Tom is happy." → answer "Tom are happy." (poison: correct stem, wrong key).
3. ERROR: "Find the error: They not is tired." → answer "They is not tired. / She isn't tired."
   - STILL WRONG. Correct: **They are not tired / They aren't tired.**
   - "They is…" is never a valid key for they.

# CORE LOGIC LAWS (teach computer + yourself)

## Law 1 — Agreement (to be present)
| Subject | Form |
|---------|------|
| I | am / 'm / am not |
| he / she / it / Tom / name singular / everyone / something | is / isn't |
| you / we / they / plural noun | are / aren't |

## Law 2 — Find-the-error item integrity
For type `error` with q = "Find the error: STEM":
- STEM must contain a **real error** (unless question is "which is correct" elsewhere).
- `answer` must be a **fully grammatical** repair of STEM (same meaning).
- `answer` MUST fix the error; must NOT introduce a new error.
- `answer` ∈ opts.
- If STEM is already correct English → item is INVALID:
  - Either invert (STEM becomes the wrong form in q; answer = correct), or DELETE.

## Law 3 — TF "X is correct"
- If X is grammatical for standard English → answer **true**
- If X is ungrammatical → answer **false** + fb shows **correct sentence** that is grammatical
- fb must match the sentence (no they/them on a Tom sentence)

## Law 4 — MCQ / fill
- answer ∈ opts
- answer is the only best grammatical choice for the blank
- Distractors may be wrong; the key must not be wrong

## Law 5 — fb
- Vietnamese, specific rule (R5.1)
- Corrected example in fb must be grammatical

# AUTOMATED CHECKS TO IMPLEMENT

Write `scripts/grammar-a0a2/audit-logic-keys.mjs` that flags:

### A) Poison ERROR pairs
- STEM matches good be-agreement (e.g. /Tom is happy/i) but answer worsens it (/Tom are/)
- answer matches `/\b(they is|we is|he are|she are|i is|you is|tom are|she am)\b/i`
- answer matches `/\bthey is not\b/i` when stem was about they
- opts contain the real correct form but answer points to wrong form

### B) Agreement scanner (high precision)
Parse simple patterns:
- Subject token ∈ {I,he,she,it,you,we,they,Tom,...} + be form in answer
- Flag if answer uses wrong be for that subject

### C) TF scanner
- FORCE_TRUE list + expand:
  Tom is happy, She is a player, He works here, I love Tom, They are students,
  Are you free?, Is she free?, Is everyone OK?
- If TF quotes that sentence and answer=false → P0

### D) ans ∉ opts
### E) Double-wrong: both stem and answer ungrammatical and answer doesn't fully fix

Output: `tmp/logic-key-audit.json` with counts + every finding.

# FIX ENGINE

`scripts/grammar-a0a2/fix-logic-keys.mjs --apply`

For each finding:
1. Prefer **invert** poison: wrong form in Find-the-error, correct form as answer
2. Else **rewrite** answer+opts+fb with correct English + VI fb
3. Else **delete** + refill 1 good item from FRESH bank / hand rule
4. Clear grammar_quiz_cache
5. Keep n ≥ 36

### Special fixes (must include)
- verb-to-be: They not is tired → key **They aren't / are not tired** (never They is)
- verb-to-be: Tom is happy never keyed as Tom are happy
- Is everyone OK? → true (everyone singular)
- Drop meta "Contrast focus: which is a valid pair" items

# VERIFY GATES (all must PASS)
1. node scripts/grammar-a0a2/audit-logic-keys.mjs → findings==0 after fix
2. node scripts/grammar-a0a2/verify-logic-keys.mjs → PASS (wrap audit, exit 1 if findings>0)
3. node scripts/grammar-a0a2/verify-final.mjs → PASS
4. node scripts/grammar-a0a2/verify-learner-fb-r5.mjs → PASS (if present)
5. node scripts/grammar-a0a2/verify-fb-generic-r5.1.mjs → PASS (if present)

# MANUAL SPOT (in report — full dump)
After fix, print **all** verb-to-be error+tf items (number, q, answer, fb) in report.
Also spot: present-simple, articles, personal-pronouns, past-continuous, there-is-there-are.

# HUMAN LOGIC CHECK (AG must do for beginner 10 topics)
For each exercise, ask:
"If a weak student picks the keyed answer, do they learn correct English?"
If no → fix.

# NEVER
- NEVER leave answer containing "They is" as correct for they-subject
- NEVER Find-the-error on a correct sentence with worse answer
- NEVER external API
- NEVER claim PASS if audit-logic findings > 0
- NEVER only fix verb-to-be — fix **all 62**

# WORK ORDER
1. audit-logic-keys (baseline) — must list poison including any They is / Tom are
2. fix-logic-keys --apply (all 62)
3. re-audit → 0 findings
4. all verify gates
5. docs/grammar/AG-LOGIC-KEY-AUDIT-REPORT.md (+ full verb-to-be dump)
6. commit:
```
git add scripts/grammar-a0a2/audit-logic-keys.mjs \
  scripts/grammar-a0a2/fix-logic-keys.mjs \
  scripts/grammar-a0a2/verify-logic-keys.mjs \
  docs/grammar/AG-LOGIC-KEY-AUDIT-REPORT.md
git commit -m "fix(grammar): logic answer-key audit — no poison is/are keys"
```

# HANDBACK

### HANDBACK_GROK_LOGIC_KEY_AUDIT
- findings_before → findings_after (must 0)
- they_is_as_answer_count: (must 0)
- tom_are_as_answer_count: (must 0)
- verb-to-be #41 after fix: q | answer | fb
- verb-to-be #37 after fix: q | answer | fb
- gates: logic/final/learner/generic PASS/FAIL
- sample 10 fixes
- commit:
- residual:
### END_HANDBACK

# START
Audit logic now. Fix all 62. Zero poison. Handback with verb-to-be dump.
```

## PROMPT END

---

## Ghi chú incident #41

| | |
|--|--|
| Q | Find the error: **They not is tired.** |
| Key sai | **They is not tired** (vẫn sai) |
| Key đúng | **They are not tired / They aren't tired** |

Đã được Grok sửa DB to-be; AG prompt trên để **quét logic toàn hệ**, không chỉ 1 câu.
