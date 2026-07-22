# AG-R3-ERROR-DENSITY.md: Grammar Practice Error Correction Density Enhancement

## 1. Executive Summary & Verification

Run strict verification command:
`node scripts/grammar-a0a2/verify-final.mjs`

### Strict Verification Output:
```text
================ STRICT FINAL VERIFICATION ================
Lessons: 62
Avg exercises: 40.53  under36: 0 (must 0)
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

## 2. Error Density Metrics Comparison

| Metric | Before R3 | After R3 | Target / Threshold | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Topics with `error` items < 4** | 29 | **0** | 0 | **PASS** |
| **Total Lessons / Topics** | 62 | 62 | 62 | PASS |
| **Average Exercises / Lesson** | 39.58 | **40.53** | 36 - 42 | PASS |
| **Lessons with < 36 Exercises**| 0 | **0** | 0 | PASS |
| **Average Theory Coverage** | 97.7% | **97.7%** | ≥ 90% | PASS |
| **Strict Theory-Practice Overlap**| 0 | **0** | < 30 | PASS |
| **Intra-bank Stem Duplicates**| 0 | **0** | 0 | PASS |
| **Hard Junk / Bad Answers** | 0 / 0 | **0 / 0** | 0 / 0 | PASS |

---

## 3. Sample New Error Items (5 Topics)

1. **`emphasis-structures`**:
   - **q**: `Find the error: She did completed the assignment before leaving.`
   - **ans**: `She did complete the assignment before leaving.`
   - **fb**: `Nhấn mạnh với did + động từ nguyên thể (did complete)`

2. **`causative`**:
   - **q**: `Find the error: I had the mechanic to repair my car yesterday.`
   - **ans**: `I had the mechanic repair my car yesterday.`
   - **fb**: `Have somebody DO something (V_base)`

3. **`cleft-sentences`**:
   - **q**: `Find the error: It was in Rome where they first met.`
   - **ans**: `It was in Rome that they first met.`
   - **fb**: `Cleft sentence: It was [trạng ngữ] THAT...`

4. **`subjunctive`**:
   - **q**: `Find the error: The doctor insisted that he stays in bed.`
   - **ans**: `The doctor insisted that he stay in bed.`
   - **fb**: `Giả định thức: insist that + S + V_base (stay)`

5. **`advanced-relative-clauses`**:
   - **q**: `Find the error: She interviewed ten applicants, all of who had degrees.`
   - **ans**: `She interviewed ten applicants, all of whom had degrees.`
   - **fb**: `Sau giới từ (of) dùng whom cho người`

---

## 4. Key Artifacts

- `scripts/grammar-a0a2/practice-banks-fresh-batch4.mjs`: Added fresh error correction items for 29 error-thin topics.
- `scripts/grammar-a0a2/practice-banks-fresh.mjs`: Registered `FRESH_BATCH4` into `FRESH_BY_SLUG`.
- `scripts/grammar-a0a2/check-error-density.mjs`: Utility script verifying 0 topics with error < 4.
