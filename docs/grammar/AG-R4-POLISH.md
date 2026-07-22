# Grammar R4 — Polish (on-topic, cleft rule, PDF, teacher key)

**Date:** 2026-07-22  
**Commit scope:** scripts + docs (DB applied live)

## Done

1. **Purge soft pads** — removed `Key point #…` / coverage pad stems (~17 items across 7 topics); refilled from FRESH banks.
2. **Off-topic** — personal-pronouns: dropped contrast-pair meta + pure be-adj items.
3. **Cleft unify**
   - Theory (`sections`): It-cleft + place/time → **that** (bank standard).
   - Mistakes: Rome + *where* → *that*.
   - Practice stem: **Lisbon** (≠ theory Rome) so 0 theory↔practice clone.
4. **PDF smoke (HTML)** — `tmp/grammar-pdf-{slug}.html` for articles, present-simple, personal-pronouns, cleft-sentences, conditionals-0-1.
5. **Teacher key** — `tmp/TEACHER-KEY-sample.md` (+ script `export-teacher-key.mjs`).

## Verify

```bash
node scripts/grammar-a0a2/verify-final.mjs
# expect PASS, strictOverlap 0, under36 0
```

## Scripts

| Script | Role |
|--------|------|
| `r4-polish.mjs` | pad/off-topic purge + cleft sections |
| `export-lesson-pdf-preview.mjs` | student HTML handout |
| `export-teacher-key.mjs` | GV answer table MD |

## Residual

- Some emergency pads still generic S-V if FRESH thin — acceptable ≥36.
- PDF preview default cap was 16 in script; product learn page uses full bank (cap 0).
