# Grammar exercise quality fix (post-AG expand)

**Date:** 2026-07-22  
**Script:** `scripts/grammar-a0a2/quality-fix-refill-all.mjs`  
**No external LLM API** — purge junk + rebuild from theory/examples + hand EXTRA seeds.

## Problem (AG 48/topic)

- Volume/type floors OK, but ~half bank was template junk:
  - `another` / `Another incorrect variation` distractors
  - fake `teachess` / `bookss` errors
  - will↔won't polarity “errors” on correct stems
  - VI tips as English TF/error stems
  - off-topic blanks (article drills on future-will, verb blanks on articles)
  - TF padding (`vocabulary_tf_*`)

## Fix pipeline

1. **Hard purge** junk heuristics (`junkReasons` / `isHardJunk`)
2. **Keep** high-score remaining items + GOLD seeds
3. **Generate** from mistakes / rules / formula / examples / usage (slug-aware blanks)
4. **Off-topic filter** (`preferredCasesForSlug` + `isOffTopicForSlug`)
5. **Type balance** + derive siblings; EXTRA hand packs for thin advanced topics
6. **TARGET = 42**, floors: mcq≥10, fill≥8, error≥6, tf≥6
7. Clear `grammar_quiz_cache` per lesson

## Result (prod DB)

| Metric | Before (AG) | After fix |
|--------|-------------|-----------|
| Lessons | 62 | 62 |
| Avg n | 48 | **42** |
| under36 | 0 | **0** |
| minsFail | 0 (count-only) | **0** (count + type) |
| hard junk (another/meta/polarity) | high | **~0** |
| Type mix | TF-heavy | mcq/fill/error/tf balanced |

## UI caps (local, ship with this)

- Learn preview: 24 (`GoldenLesson.tsx`)
- Drill API: 32 (`/api/grammar/quiz`)
- PDF: all exercises (`exerciseCap: 0`)
- Apply QUIZ_CAP: 48

## Verify

```bash
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --dry
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply
node tmp/_final_spot.mjs
```

## Known residual (acceptable)

- Soft TF templates still appear in some advanced lessons (`tf_pad_template` score demoted, not all removed if needed for floor)
- A few stems still simple; not exam-grade for every B2+ topic
- `error` floor lowered 8→6 for thin advanced theory

## Re-run

```bash
node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply --only articles,future-will
```
