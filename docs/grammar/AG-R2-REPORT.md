# AG-R2-REPORT.md: Grammar Theory & Practice R2 Enhancement

## 1. Executive Summary & Verification

Run strict verification command:
`node scripts/grammar-a0a2/verify-final.mjs`

### Verification Output:
```text
================ STRICT FINAL VERIFICATION ================
Lessons: 62
Avg exercises: 39.58  under36: 0 (must 0)
Examples <10: 0 (must 0)
Avg coverage: 97.7% (must >=90)
Strict theory↔practice overlap: 0 (must <30)
Intra-bank stem dups: 0 (must 0)
Hard junk / ansBad: 0 / 0 (must 0/0)
===========================================================
STATUS: PASS
report: tmp/verify-final-report.json
```

---

## 2. Baseline vs After Metrics Comparison

| Metric | Baseline (R2 Start) | After (R2 Complete) | Target / Threshold | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Total Lessons / Topics** | 62 | 62 | 62 | PASS |
| **Topics < 10 Examples** | 0 | **0** | 0 | PASS |
| **Topics < 12 Examples** | 49 | **0** | 0 | **PASS** |
| **Examples Range (Min - Max)** | 10 - 15 | **12 - 15** | 12 - 15 | **PASS** |
| **Average Exercises / Lesson** | 39.35 | **39.58** | 36 - 42 | PASS |
| **Lessons with < 36 Exercises**| 0 | **0** | 0 | PASS |
| **Average Theory Coverage** | 97.7% | **97.7%** | ≥ 90% | PASS |
| **Strict Theory-Practice Overlap**| 0 | **0** | < 30 | PASS |
| **Intra-bank Stem Duplicates**| 0 | **0** | 0 | PASS |
| **Junk / Bad Answers** | 0 / 0 | **0 / 0** | 0 / 0 | PASS |

---

## 3. Spot-Check Verification (3 Topics)

Proof that theory examples and practice exercise stems are strictly non-overlapping:

### 1. `articles`
- **Theory Examples (NGOÀI)**:
  1. `I have a car.`
  2. `I am reading an article.`
- **Exercise Stems (TRONG)**:
  1. `Choose: ___ one-way ticket, please.`
  2. `Choose: She is ___ honest friend.`
- **Verification**: Distinct stems (no substring overlap).

### 2. `personal-pronouns`
- **Theory Examples (NGOÀI)**:
  1. `I am a student.`
  2. `She likes music.`
- **Exercise Stems (TRONG)**:
  1. `___ rains a lot in autumn. (weather)`
  2. `Choose: He ___ tall.`
- **Verification**: Distinct stems (no substring overlap).

### 3. `present-simple`
- **Theory Examples (NGOÀI)**:
  1. `I work every day.`
  2. `She teaches English.`
- **Exercise Stems (TRONG)**:
  1. `Choose: watch → he/she form`
  2. `Choose: play → he/she form`
- **Verification**: Distinct stems (no substring overlap).

---

## 4. Key Artifacts & Files

- `scripts/grammar-a0a2/update-theory-examples-r2.mjs`: Added fresh theory examples to 49 topics to achieve 12–15 examples across all 62 topics.
- `scripts/grammar-a0a2/practice-banks-fresh-batch3.mjs`: Added fresh practice banks for Advanced topics (conditionals, wish, modals-perfect, inversion).
- `scripts/grammar-a0a2/practice-banks-fresh.mjs`: Updated registration of all fresh practice banks into `FRESH_BY_SLUG`.
- `scripts/grammar-a0a2/quality-fix-refill-all.mjs`: Pipeline purging junk and applying fresh exercises to Supabase.
- `scripts/grammar-a0a2/verify-final.mjs`: Strict verification script ensuring all product rules are strictly met.
