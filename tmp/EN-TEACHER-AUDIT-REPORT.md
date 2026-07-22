# EN Teacher Audit Report

Date: 2026-07-22  
Auditor: STRICT VN high-school EN + Cambridge-aware  
Scope: 20 sample slugs (8 beginner GOLD / 6 intermediate / 6 advanced) + structural pass over 62 topics  
Method: `verify-wordbanks-db.mjs` · `audit-exercises-keys.mjs` · `audit-normalize-all.mjs` · `audit-quality-strict.mjs` · dump DB exercises/wordbanks · manual key spot-check **429** items on sample + **72** irregular conjugations  
**DB write:** none (report-only)

## Verdict: **FAIL**

Không ship full curriculum cho học sinh khi bank quiz intermediate/advanced còn **key sai thật** + **topic pollution** nặng. Wordbanks dense + GOLD beginner theory **tạm ổn**, nhưng practice/quiz là chỗ học sinh tin nhất — đang có chỗ **dạy sai**.

---

## Executive summary (thẳng)

- **Wordbanks code↔DB: 62/62 PASS** (1.563 rows, header VI). Irregular past **72/72** đúng. Sai===Đúng: 0. Normalize exercises: emptyQ/ansMiss = 0.
- **GOLD beginner (C/U, plural, articles, past-simple, pronouns, present-simple, obligation, cond 0–1):** theory + wordbanks **chặt**, bẫy thi VN đúng (informations, a university, between you and me, mustn’t vs don’t have to).
- **P0 chết người — `present-perfect`:** 4 câu *Find the error* lấy câu PP **ĐÚNG** (`I have eaten…`, `I have gone…`) rồi “sửa” thành HTĐ (`I eat…`, `I go…`). Đây là **dạy sai thì**, không phải edge style.
- **P0 topic pollution quiz:** `passive-voice` ~**26%** on-topic (còn lại May/Could/Would mind); `second-conditional` ~**21%** (còn lại Present Simple); `mixed-conditionals` trộn **There is/are** + key sai (`answer=had`, đúng mixed bị đánh lỗi); `subjunctive` trộn **plural nouns**; `relative-clauses` error bank copy **modal request**.
- **P0 key lẻ beginner:** `modals-obligation` double *to* (`You ___ to wear` + ans `have to`); error key `must` thay vì `to`; `present-simple` stem *always late* ans *works*; `inversion` error q rỗng.
- Structural scripts **không bắt** lỗi này (chỉ check answer∈opts / pattern “bad English in text”). Cần audit **nội dung sư phạm**, không chỉ schema.
- **Ship policy:** có thể giữ **wordbanks + GOLD A0–A1 theory** trên UI; **chặn / ẩn quiz** các slug FAIL đến khi refill on-topic. Full band intermediate+advanced quiz = **FAIL ship**.

---

## Scores by lesson

Thang: theory / wordbanks / quiz keys / density / overall = A–F (A = ship; F = cấm học sinh)

| slug | band | theory | wordbanks | quiz keys | density | overall | blockers |
|------|------|--------|-----------|-----------|---------|---------|----------|
| countable-uncountable | beg | A | A | A | A (206) | **A** | — |
| plural-nouns | beg | A | A | A | A (135) | **A** | — |
| articles | beg | A | A | A | B (40) | **A** | — |
| past-simple | beg | A | A (133 irreg OK) | A | A | **A** | — |
| personal-pronouns | beg | A | A | A | B (23) | **A** | — |
| present-simple | beg | A | A | C | B (30) | **B** | 1 stem lệch (#18 always late→works) |
| modals-obligation | beg | A | A | D | C (12) | **C** | double *to*; error key *must* vs *to*; quiz lặp |
| conditionals-0-1 | beg | A | A | A | B (13) | **A** | — |
| present-perfect | int | A | A (49, for/since/been) | **F** | A | **F** | 4× PP đúng → “sửa” HTĐ |
| passive-voice | int | B | A (24) | **F** | B | **F** | ~74% quiz = permission modal |
| reported-speech | int | B | A (26) | A | B | **B** | suggest to V-ing OK |
| gerunds-infinitives | int | B | A (44) | A | A | **A** | try/stop meaning OK |
| second-conditional | int | B | A (15) | **F** | B | **F** | ~79% quiz = Present Simple |
| relative-clauses | int | B | A (17) | D | B | **D** | 5 error items = modal request |
| inversion | adv | B | A (18) | C | B | **C** | #23 empty error q |
| causative | adv | B | A (18) | A | B | **A** | — |
| wish-if-only | adv | B | A (14) | C | B | **C** | ~30% bleed subjunctive/cond1 |
| modals-perfect | adv | B | A (19) | D | B | **D** | ~50% subjunctive bleed |
| mixed-conditionals | adv | B | A (10) | **F** | C | **F** | There is/are + wrong keys |
| subjunctive | adv | B | A (15) | D | B | **D** | plural-nouns pollution |

**Aggregate sample:** 8/20 ship-ready (A–B), 5/20 salvageable (C), **7/20 FAIL quiz (D–F)**.

---

## Critical FAILs (must fix)

### 1. present-perfect — dạy sai Present Perfect (P0)

| | |
|--|--|
| **slug** | `present-perfect` |
| **location** | exercises error #3, #7, #11, #15 |
| **wrong** | `Find the error: 'I have eaten a sandwich.'` → answer `"I eat a sandwich."` · tương tự `I have gone to the store.` → `I go to the store.` (+ bản *recently*) |
| **fix** | Xóa 4 item hoặc đổi stem sang lỗi thật: `I have saw…` / `I have finished yesterday` / `She have gone…`. Answer = bản PP/PS **đúng**. |
| **severity** | **P0** — học sinh tin key → học “PP = sai” |

### 2. passive-voice — quiz gần như bài modal permission (P0)

| | |
|--|--|
| **slug** | `passive-voice` |
| **location** | ~#1–3,5–7,9–11,13–15,17–19,21 (May/Could/Would mind/Can I…) |
| **wrong** | Ví dụ: `___ you please pass me the salt?` → Could; `Would you mind ___ me a favor?` → doing; `May I leave…` — **không có bị động** |
| **fix** | Refill 18–24 item: be+V3 các thì, by-agent, get-passive, modal+be+V3 (`must be done`). Giữ vài TF passive đúng (#4,#8,#12,#16,#20,#22–23 làm seed). |
| **severity** | **P0** — topic pollution + lừa progress “đã học passive” |

### 3. second-conditional — quiz = Present Simple (P0)

| | |
|--|--|
| **slug** | `second-conditional` |
| **location** | #1 sun rises, #2 father fixes, #5 cat doesn't like, #13 brushes, #17 play football… |
| **wrong** | Gần như full bank Present Simple; chỉ vài TF thật về if+past/would |
| **fix** | Refill: If + V2/were, would + V1; were vs was (formal); unless; I’d rather; wish contrast optional |
| **severity** | **P0** pollution |

### 4. mixed-conditionals — pollution + key sai (P0)

| | |
|--|--|
| **slug** | `mixed-conditionals` |
| **location** | There is/are items (#1,3,5–7,10,14,18,22); #15; #19 |
| **wrong** | (a) `If I had won the lottery, I __ a mansion.` → answer **`had`** (vô nghĩa; cần `would buy` / `would have bought`). (b) `Find the error: If he were taller, he would have joined the basketball team last year.` → answer **`were`** — câu **đúng** mixed 2→3. (c) #11 `would get` cho pure past result (thiếu *would have got* nếu không có *now*). |
| **fix** | Xóa There is/are; sửa keys; 10–12 item chuẩn type 3→2 và 2→3 |
| **severity** | **P0** |

### 5. modals-obligation — double *to* + error key (P0)

| | |
|--|--|
| **slug** | `modals-obligation` |
| **location** | fill #2; error #15 |
| **wrong** | `You ___ to wear a uniform` + answer `have to` → **You have to to wear**. · `…we must to arrive early` answer `must` (token lỗi là **`to`**) |
| **fix** | Stem: `You ___ wear…` ans `have to` **hoặc** `You ___ to wear` ans `have`. Error #15 answer = `to`. |
| **severity** | **P0** |

### 6. present-simple — stem/answer lệch (P0)

| | |
|--|--|
| **slug** | `present-simple` |
| **location** | mcq #18 |
| **wrong** | `She ___ always late. (be → … action: work)` → `"works"` — nghĩa câu thành “She works always late” (sai collocation + lệch note be) |
| **fix** | `She ___ always late.` → `is` · hoặc `She ___ hard every day.` → `works` |
| **severity** | **P0** |

### 7. subjunctive — trộn plural nouns (P0)

| | |
|--|--|
| **slug** | `subjunctive` |
| **location** | #14 watches, #15 tooths, #18 potatoes, #19 footes, #21 men, #22 wifes, #24 mice |
| **wrong** | Bài subjunctive hỏi số nhiều danh từ |
| **fix** | Thay bằng mandative (`suggest that he go`), *It is essential that… be*, *I wish I were*, *as if* |
| **severity** | **P0** pollution |

### 8. relative-clauses — error bank copy modal (P0)

| | |
|--|--|
| **slug** | `relative-clauses` |
| **location** | error #3,6,9,12,15 |
| **wrong** | `Could you to open…`, `Would you like holding…`, `Can I asking…` — **không** relative |
| **fix** | Error: *which* for people, comma non-defining, *whose* vs *who's*, preposition+which |
| **severity** | **P0** pollution (mcq who/which/whose vẫn ổn) |

### 9. inversion — empty error question (P0)

| | |
|--|--|
| **slug** | `inversion` |
| **location** | error #23 |
| **wrong** | `Find the error:` (rỗng) → answer `"can"` opts `solve/can/way/we` |
| **fix** | Khôi phục stem kiểu `In no way we can solve…` / xóa item |
| **severity** | **P0** UI + key mù |

### 10. modals-perfect / wish-if-only — bleed chéo (P0/P1)

| | |
|--|--|
| **slug** | `modals-perfect`, `wish-if-only` |
| **location** | modals-perfect: subjunctive stems (#2 lest, #5/#9/#10 demand/suggest, #13 suppose were…); wish: #1 first cond, #2–3/#7/#22 subjunctive, #11 unless |
| **wrong** | Học sai topic (vẫn có subset modal perfect / wish đúng) |
| **fix** | Tách bank: modal perfect = must/might/should/could/can’t/needn’t have + V3 only |
| **severity** | **P0** pollution (keys con đúng grammar nhưng **sai bài**) |

---

## Warnings (P2)

- **second-conditional #12 TF:** `"If I was you…"` = true — spoken OK, nhưng SGK/thi formal VN hay ép **were**. Nên false + fb *formal: were* hoặc đổi stem.
- **conditionals-0-1:** reject `"If you heat water, it will boil"` như zero-only — chặt quá (type 1 cũng chấp nhận được). P2.
- **modals-obligation:** lặp pattern *must to* / *have to* nhiều lần; thiếu tình huống *needn’t have* ( elev advanced). P2 density/style.
- **articles wordbanks:** `a` + `university` tách cột — audit string `/a university/` false-negative; content **đúng**. P2 tooling.
- **audit-quality-strict:** false positive trên stem *Find the error: … must to…* (bad English trong **q**, không phải đáp án). Harden: chỉ scan `answer` + cột Đúng.
- **examples** intermediate/advanced: nhiều bài chỉ **6** examples — mỏng so handout thi (P2).
- **GOLD C/U quiz:** 12 items (đủ seed, mỏng hơn target 20–24) — P2.
- **passive theory** ổn nhưng học sinh chỉ làm quiz → tưởng đã học May I. P2 product.
- **subjunctive TF:** “be always written as be for all subjects” = true — overclaim (were ≠ bare be). P2.

---

## What's actually good

1. **Dense wordbanks** — list U thi, irregular full, articles âm /j/ & silent *h*, PP for/since/just/already/yet, been vs gone, reported would, gerunds stop/try, inversion Hardly/No sooner, causative have/get. Verify 62/62.
2. **GOLD A0 nouns + past/articles** — definition/formula/mistakes **sạch** (không còn do/does bleed). VI giải thích bám lỗi VN.
3. **Beginner quiz keys** (C/U, plural, articles, past, pronouns, cond 0–1) — spot-check **đúng thật**, không chỉ answer∈opts.
4. **reported-speech + gerunds-infinitives + causative** — on-topic cao, key backshift / V-ing / have sth done ổn.
5. **Infrastructure:** free-fill=0, ans∉opts=0 sau normalize — nền tảng kỹ thuật OK; **lỗ hổng là content pedagogy + pollution**, không phải schema.

---

## Recommended fix order (top 10)

1. **P0 hotfix `present-perfect` error #3/#7/#11/#15** — 30 phút, unteach sai thì.  
2. **P0 `mixed-conditionals` keys #15/#19 (+#11)** + xóa There is/are.  
3. **P0 `modals-obligation` #2/#15** + `present-simple` #18 + `inversion` #23.  
4. **Refill full quiz `passive-voice`** (on-topic be+V3).  
5. **Refill full quiz `second-conditional`**.  
6. **Purge pollution `subjunctive` / `relative-clauses` error / `modals-perfect` / `wish-if-only`**.  
7. Harden generator: **topic tag allowlist** per slug (block May I in passive, block plural in subjunctive).  
8. Re-run teacher audit: ≥20 items/slug, manual key, on-topic ≥90%.  
9. Nâng examples intermediate ≥10; GOLD C/U quiz → 18–24 nếu muốn parity.  
10. CI: fail build nếu (a) error-q marks known-good PP/passive/mixed as wrong, (b) on-topic heuristic <70%.

---

## Evidence appendix

### Structural runs

| Script | Result |
|--------|--------|
| `verify-wordbanks-db.mjs` | **62/62 PASS**, 1563 rows |
| `audit-exercises-keys.mjs` | fails=0, freeFill=0; accuracy string check *a university* = false positive (cột tách) |
| `audit-normalize-all.mjs` | emptyQ=0, ansMiss=0, failCount=0 |
| `audit-quality-strict.mjs` | 9 “FAIL” = false positive trên stem Find-the-error |
| Conjugation spot-check | **72/72** irreg OK |
| Manual sample exercises | **429** items reviewed via dump |

### On-topic heuristic (sample)

| slug | on-topic |
|------|----------|
| gerunds-infinitives | 24/24 (100%) |
| causative | 23/24 (96%) |
| reported-speech | 23/24 (96%) |
| relative-clauses | 18/23 (78%) — error half polluted |
| inversion | 19/24 (79%) |
| wish-if-only | 17/24 (71%) |
| mixed-conditionals | 14/24 (58%) |
| modals-perfect | 12/24 (50%) |
| subjunctive | 12/24 (50%) |
| passive-voice | **6/23 (26%)** |
| second-conditional | **5/24 (21%)** |

### Artifacts

- `tmp/en-teacher-audit-dump.json` — full DB dump 20 slugs  
- `tmp/en-teacher-ans-sheet.txt` — answer sheet  
- `tmp/en-teacher-deep-flags.json` — 63 flagged items  
- `tmp/en-teacher-review.txt` — banks + exercises text  

---

## Ship gate

| Component | Gate |
|-----------|------|
| Wordbanks A0–C1 (dense tables) | **CONDITIONAL PASS** — ship |
| GOLD beginner theory/sections | **PASS** — ship |
| Beginner quiz (except noted P0 lẻ) | **CONDITIONAL PASS** — ship sau hotfix obligation/present-simple |
| Intermediate quiz (PP, passive, 2nd cond) | **FAIL** — không ship |
| Advanced quiz (mixed, subjunctive pollution, modals-perfect) | **FAIL** — không ship |
| **Overall product for students** | **FAIL** |

**Một lỗi key thật = FAIL bài đó. Nhiều P0 trải multi-band = FAIL ship.**

---

*Report-only. Không ghi Supabase. Không commit/deploy.*
