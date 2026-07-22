# Practice: đa dạng + không trùng lý thuyết + phủ case

## Product rules

1. **Ngoài (lý thuyết)**: examples / mistakes / formula / usage — vài câu neo.
2. **Trong (luyện)**: stem **khác**, cùng rule; **không clone** câu ngoài.
3. **Phủ lý thuyết**: mỗi case (rules / mistakes / formula / usage / signals) có practice gắn `case_id` / coverage engine.
4. **Đa dạng trong bank**: unique stems (dedup), mix mcq · fill · error · tf.

## Pipeline

| File | Role |
|------|------|
| `practice-coverage-engine.mjs` | banlist stems, paraphrase mistakes, coverage report, wordbank cloze |
| `practice-banks-fresh.mjs` + `practice-banks-fresh-a0.mjs` | hand banks (articles, present-simple, pronouns, be, past-simple, C/U…) |
| `quality-fix-refill-all.mjs` | purge junk → assemble → balance → apply DB |

```bash
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --dry
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply
```

## Metrics (after apply 2026-07-22)

| Metric | Value |
|--------|------:|
| Lessons | 62 |
| Avg exercises | ~38 |
| under36 | 0 |
| Avg theory coverage | ~98% |
| Theory-stem overlap items | ~14 total (was ~40%/lesson) |
| Intra-bank duplicate stems | 0 |

## Next

- Thêm FRESH banks cho intermediate/advanced (conditionals, reported, passive…).
- Nới paraphrase pools để bớt phụ thuộc pad TF.
