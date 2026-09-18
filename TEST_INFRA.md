# English Grammar Learning Experience — Test Architecture & Infrastructure

## 1. Test Philosophy & Engineering Principles

The Grammar Learning test infrastructure (`tests/grammar/`) adheres to three foundational engineering principles:

1. **Opaque-Box Requirement Verification**:
   Tests evaluate strictly observable system behaviors, interface contracts, DOM/layout constraints, and curriculum data integrity. Tests do not bind to volatile private implementation details. If an internal function is refactored, tests will only break if observable behavior or contract compliance regresses.

2. **Authoritative Specification Anchoring**:
   Every assertion is derived directly from authoritative requirements:
   - `ORIGINAL_REQUEST.md` (§ `## 2026-09-18T06:04:24Z`): Editorial Minimalism, frameless layouts, zero broken markdown tables, clean Vietnamese pedagogical language, and zero LaTeX symbols.
   - `SCOPE.md` (`.agents/orchestrator_grammar_1/SCOPE.md`): Idempotent table preprocessing, Publication-style frameless tables, Formula tokenization, 54 Supabase exercise defects remediation, and responsive breakpoint rules.
   - `GEMINI.md`: Zero-downtime deployment guardrails and staging build safety.

3. **4-Tier Test Architecture**:
   The suite is organized into four distinct progressive tiers, balancing unit capability, edge-case resilience, multi-feature integration, and full-scale production dataset validation.

---

## 2. 4-Tier Test Suite Hierarchy

```
tests/grammar/
├── test-harness.ts                   # Self-contained test runner, assertions & Supabase client
├── tier1-feature-coverage.test.ts    # Tier 1: Core Feature Coverage (>=5 cases per feature)
├── tier2-boundary-corner.test.ts     # Tier 2: Boundary, Edge Cases & Idempotence
├── tier3-cross-feature.test.ts       # Tier 3: Multi-Feature Interactions & Proportions
├── tier4-curriculum-scenarios.test.ts# Tier 4: Real-World Scenarios across 25 Supabase Lessons
└── run-all-grammar-tests.ts          # Master Test Runner & Diagnostic Aggregator
```

### Tier 1 — Core Feature Coverage (>=5 test cases per feature)
- **Markdown Table Parser**: Validates header rendering, pipe delimiter splitting, column alignment recognition (`:---` left, `:---:` center, `---:` right), whitespace trimming, and table boundary isolation.
- **Formula Tokenizer**: Validates syntactic token parsing (`S:S`, `V:V`, `O:O`, `V:be`, `be`, `D:bổ ngữ`, `k:v`), visual chip styles (sky, indigo, emerald, muted), math operators (`+`, `·`), and alternative choice stacks (`{am|is|are}`).
- **Exercise Validation Engine**: Tests MCQ matching (letter index, option prefix, clean text), fill-in-the-blank normalization (accents, spaces, smart quotes, lowercase), and auxiliary contraction expansion (`don't` vs `do not`, `didn't` vs `did not`, etc.).
- **Layout & Responsive Constraints**: Static analysis and layout rule verification ensuring absence of hardcoded fixed widths (`w-[1...px]`, `min-w-[8..px]`), presence of fluid wrappers, touch-friendly `overflow-x-auto` table/formula wrappers, and breakpoint adaptivity.

### Tier 2 — Boundary, Corner Cases & Idempotence (>=5 test cases per feature)
- **Idempotent Table Preprocessing**: Proves that running `ensureMarkdownTableFormat` multiple consecutive times (1x, 2x, 5x) on valid tables produces zero line loss and preserves table structure.
- **Malformed & Boundary Tables**: Verifies behavior with empty cells `| |`, trailing spaces, escaped pipes `\|`, multi-line cells, and tables adjacent to markdown headings or code blocks.
- **Extreme Formula Inputs**: Exercises unclosed brackets (`{am|is`), empty strings, special characters (`~`, `*`, `&`, `%`, `$`, `→`), consecutive operators (`+ + +`), and deep nesting.
- **Extreme Question Stems & Diacritics**: Handles empty stems, long strings (>2,500 chars), full Vietnamese diacritics, noisy question number prefixes (`Câu 1: Câu 1:`), and explanation clutter tags.

### Tier 3 — Cross-Feature Combinations
- **Markdown Tables + Formulas + Bold**: Tests simultaneous rendering of formula blocks (`S + V + O`), bold grammatical emphasis (`**lưu ý**`), and speaker audio controls within tabular structures.
- **Heterogeneous Quiz Session**: Validates mixed exercise workflows combining Multiple Choice, Fill-in-the-Blank, and Error Correction, checking answer evaluation and scoring accuracy across a composite session.
- **Split-View Layout Calculations**: Tests responsive split-view proportion logic (50/50, 60/40, 65/35), automated single-column collapsing on tablet/mobile (<1024px), and viewport constraint preservation.

### Tier 4 — Real-World Curriculum Scenarios (25 Supabase Lessons)
Live query and validation across all 25 active Supabase grammar lessons (1,749 exercises):
- **Curriculum Completeness**: Confirms all 25 lessons exist with valid IDs, topic mappings, order index 1..25, and non-empty pedagogical content.
- **Table Parsability**: Verifies all 25 lessons have valid, parsable markdown tables without row corruption.
- **Leaked Stem Audit**: Verifies zero leaked answer stems `(B → ...)` or catalogs pre-remediation violations for Milestone 2 remediation.
- **MCQ Option Containment**: Confirms every MCQ has its correct answer present in its options list.
- **LaTeX Typography Cleanliness**: Verifies zero unrendered LaTeX math notation (`$S_{ít}$, $\rightarrow$`, `\nearrow`, `\searrow`) in theory text.
- **End-to-End Learner Journey**: Simulates a complete learner study session through Buổi 1 (S-V-O) with interactive quiz scoring.

---

## 3. Test Runner & Execution Semantics

### Execution Command
```bash
npx tsx tests/grammar/run-all-grammar-tests.ts
```

### Environment & Connection
- **Live Supabase Connection**: Automatically reads credentials from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Offline / Isolated Fallback**: If Supabase network is unreachable, automatically falls back to local production snapshot (`tmp/grammar-audit-dump.json`).

### Pass/Fail Semantics & Exit Codes
- **Zero External Dependencies**: Harness runs natively on Node.js / TypeScript via `tsx` without requiring heavy testing framework setup.
- **Exit Code 0**: 100% of test assertions passed across all tiers.
- **Exit Code 1**: One or more assertions failed. Detailed failure logs, diffs, and exact lesson/question coordinates are printed to stderr and summary tables.

---

## 4. Test Coverage Summary Matrix

| Tier | Focus Area | Minimum Cases | Verification Mechanism |
| :--- | :--- | :---: | :--- |
| **Tier 1** | Markdown Table Parser | 6 | Structural AST & GFM row/column extraction |
| **Tier 1** | Formula Tokenizer | 6 | Token decomposition, styling badges, operators |
| **Tier 1** | Exercise Validation Engine | 6 | Answer normalization, contractions, MCQs |
| **Tier 1** | Layout & Responsive Checks | 6 | Source static analysis, breakpoint rules, overflow |
| **Tier 2** | Table Idempotence (1x/2x/5x) | 5 | Multi-pass string invariance & row loss check |
| **Tier 2** | Boundary Tables & Pipes | 5 | Empty cells, escaped pipes, missing borders |
| **Tier 2** | Extreme Formula Strings | 6 | Malformed brackets, operators, special symbols |
| **Tier 2** | Extreme Stems & Diacritics | 6 | Empty/long strings, Vietnamese diacritics, prefixes |
| **Tier 3** | Tables + Formulas + Bold | 4 | Multi-modal markdown composition |
| **Tier 3** | Mixed Quiz Session | 5 | Heterogeneous exercise drill scoring |
| **Tier 3** | Split View Layout | 4 | Proportional view math & mobile collapse rules |
| **Tier 4** | Curriculum Real-World Scenarios | 7 | Full database validation across 25 Supabase lessons |
| **TOTAL** | **Full Grammar Suite** | **66+** | **Comprehensive Opaque-Box E2E Coverage** |
