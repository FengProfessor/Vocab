# 20. Canonical Lexical & Chunk Counting Specification

> **Curriculum Project**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Status**: P0.5 Reality Check Before N=1 Pilot  
> **Purpose**: Formal specification of counting units, dataset scopes, morphological rules, and lexical inventories. Eliminates ambiguity between pilot datasets and full-curriculum projections.

---

## 1. Programmatic File Verification & Canonical Count Table

All counts below are verified programmatically against the physical files on disk in `docs/curriculum/beginner-grade6/`:

| Dataset File | File Path | Header Line | Data Rows | Unique Primary IDs | Range of IDs | Canonical Status |
|---|---|---|---|---|---|---|
| **Core Lexicon** | `vocabulary/core-lexicon.csv` | 1 | **100** | **100** | `lex-001` to `lex-100` | **Foundational Pilot Core Seed** (15 active lemmas in L1–L3) |
| **Core Chunks** | `chunks/core-chunks.csv` | 1 | **35** | **35** | `chk-001` to `chk-035` | **Core Formulaic Sequences Layer** |
| **Can-Do Map** | `mapping/can-do-map.csv` | 1 | **42** | **42** | `CD-001` to `CD-042` | **Competency Matrix** (1 Can-Do per unit) |

*Clarification of previous reporting discrepancies*: Previous mentions of "101 rows" and "36 chunks" confused the file's total physical lines (which included the header line) with data rows. The actual physical datasets contain exactly **100 data rows** in `core-lexicon.csv` and **35 data rows** in `core-chunks.csv`.

---

## 2. Definitive Lexical Terminology Standards

To prevent confusing vocabulary size with textual frequency, the curriculum adheres to the following precise linguistic definitions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LEXICAL TAXONOMY HIERARCHY                            │
│                                                                             │
│  1. LEMMA (Headword)        : Canonical dictionary entry (e.g. "like")       │
│  2. TYPE (Wordform)         : Specific inflected form ("like", "likes")     │
│  3. TOKEN (Occurrence)      : Every instance appearing in a passage         │
│  4. CHUNK (Formulaic Unit)  : Holistic multi-word frame ("My name is...")   │
│  5. EXPOSURE (Event)        : An encounter with a word in listening/reading  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Concrete Illustrative Example:
> Sentence text: *"I like football. I like games."*
- **Tokens**: 7 tokens (*I, like, football, I, like, games*).
- **Types**: 4 types (*I, like, football, games*).
- **Lemmas**: 4 lemmas (*I, like, football, game*).
- **Chunks**: 1 frame (`I like [Noun]`) with 2 slot instantiations.
- **Exposures**: 2 exposures to the lemma *like*.

> [!IMPORTANT]
> **Vocabulary Size $\neq$ Number of Exposures**:
> Repeated exposures across dialogues, flashcards, and stories reinforce memory, but **NEVER** inflate the curriculum's vocabulary size count. 
> Claims of "350–400 receptive items" in older drafts conflated textual exposures with unique lexical types. 
> At Pre-A1 Foundation stage, vocabulary size is measured strictly in **Unique Productive Lemmas**, with formulaic chunks tracked as a separate communicative layer.

---

## 3. Productive Inventory Counting Rules

1. **Unit of Counting = Base Lemma**:
   - Items in `core-lexicon.csv` represent base headwords.
   - Compound nouns that denote a single concept count as 1 lemma: `pencil case` (1 lemma), `living room` (1 lemma), `football` (1 lemma).
2. **Inflections Do NOT Inflate Counts**:
   - Regular plurals (`book` / `books`) count as 1 lemma (`book`).
   - Third-person singular (`like` / `likes`) counts as 1 lemma (`like`).
   - Verb forms of *to be* (`am, is, are`) are mapped to the copula lemma `be` and learned as melodic blocks (`I'm`, `This is`).
3. **Formulaic Chunks Counted Separately**:
   - The 35 items in `core-chunks.csv` are counted as **Formulaic Sequences / Communicative Frames**, not as isolated words.
   - For example, `Can I have [item], please?` is tracked as **1 Formulaic Frame**, avoiding artificial inflation of individual word counts.
4. **Scope Reconciliation**:
   - **Pilot Baseline (Lessons 1–3)**: Exactly **15 Productive Lemmas** and **7 Formulaic Frames**.
   - **Pilot Core Seed (`core-lexicon.csv`)**: **100 Lemmas** across Stages 0–6.
   - **Full 42-Lesson Curriculum Target**: Projected at **180–220 Productive Lemmas** once domain expansions (meals, routines, school topics) are populated.

---

## 4. Lesson 1–3 Exact Linguistic Inventory

| Lesson | Focus Chunks (Prefabricated Frames) | Active Productive Lemmas | Optional Receptive Exposure |
|---|---|---|---|
| **L-001** | `Hello!`, `My name is [Name]`, `I'm [Age]`, `What's your name?` *(4 frames)* | `hello`, `name`, `twelve`, `eleven` *(4 lemmas)* | `year`, `old` |
| **L-002** | `I like [Noun]`, `I don't like [Noun]`, `Do you like [Noun]?` *(3 frames)* | `like`, `football`, `music`, `games`, `fish` *(5 lemmas)* | `math`, `pizza` |
| **L-003** | `I can [Verb]`, `I can't [Verb]` *(2 frames)* | `can`, `swim`, `run`, `draw`, `cook` *(5 lemmas)* | `fast`, `dance` |
| **Cumulative L1–L3** | **7 Core Communicative Frames** | **14 Core Lemmas** | **6 Context Tokens** |
