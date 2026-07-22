# EN Teacher FINAL Spot-check

**Date:** 2026-07-22  
**Auditor:** STRICT EN teacher (Cambridge-aware)  
**Workspace:** `D:\Vocab\web-app`  
**DB:** Supabase live via `.env.local` service role  
**Scope:** P0 only = wrong answer key · teaches incorrect English as correct · topic completely wrong  
**DB write this run:** none (0 P0 to fix) · **no commit/push**

---

## Verdict: **PASS**

Hard P0 trên sample ship gate = **0**.  
Past P0 (present-perfect / passive / 2nd-cond / mixed / present-simple / modals-perfect) **vẫn sạch** trên live full bank.  
12 focus slug (3 random each) + full scan high-risk banks: **không phát hiện key sai / dạy sai / pollution topic chết người**.

---

## Automated gate (step 1)

| Script | Result |
|--------|--------|
| `node scripts/grammar-a0a2/audit-all-62-ontopic.mjs` | **62 shipReady** · A=60 B=2 · C/D/F=0 · weak=0 |
| `npx tsx scripts/grammar-a0a2/audit-normalize-all.mjs` | **1081** items · emptyQ=0 · noOpts=0 · ansMiss=0 · fail=0 |
| `node scripts/grammar-a0a2/verify-wordbanks-db.mjs` | **62/62 PASS** · 1573 code rows match DB |

**B grades (heuristic on-topic%, không phải key fail):**
- `present-simple` onTopicPct **67%** → false-negative keyword (stem ngắn: *studies / watches / is always late* vẫn đúng HTĐ; full bank 18/18 OK)
- `plural-nouns` onTopicPct **70%** → heuristic; ngoài scope sample P0 deep

Artifacts: `tmp/audit-all-62.json` · `tmp/final-spot-dump.json` · `tmp/final-spot-sheet.txt` · `tmp/final-spot-raw.json`

---

## Sample plan (step 2–3)

**FOCUS — 3 random each (seed 20260722):**

| slug | n | sample idx | key/topic |
|------|---|------------|-----------|
| phrasal-verbs | 16 | 9,1,3 | OK — looking for / particle shift / wake≠get up |
| used-to | 16 | 12,8,7 | OK — Did use to / get used to / be used to ≠ used to |
| future-will | 16 | 13,3,4 | OK — will can→able to / will to→will / won't |
| modals-advice | 16 | 2,13,6 | OK — should to / shouldn't drink / shoulds |
| third-conditional | 16 | 6,4,10 | OK — would pass→would have passed / could have / would have caught |
| modals-deduction | 16 | 5,9,13 | OK — might (unsure) / must (German) / might (knock) |
| causative | 16 | 12,13,3 | OK — tense note / having room painted / have sth done |
| advanced-passive | 16 | 7,12,11 | OK — supposed to / reporting passives / I am said→It is said |
| participle-clauses | 16 | 10,6,14 | OK — Viewed / Having finished / Frightened |
| cleft-sentences | 16 | 11,4,8 | OK — which→who/that / What…is / reason why |
| hedging-language | 16 | 8,15,4 | OK — roughly / Broadly / Many (soft quantifier) |
| grammatical-collocations | 16 | 12,5,8 | OK — different from / responsible for / prefer to |

**PAST P0 — 2 random + FULL bank scan:**

| slug | n | sample | full-bank status |
|------|---|--------|------------------|
| present-perfect | 22 | #9 Has · #4 have seen | **HOLD** — error bank đúng (have saw / finished yesterday / she have / Did you ever→Have you ever been); for/since; been/gone |
| passive-voice | 20 | #7 being painted · #3 by optional | **HOLD** — 20/20 be+V3 / modal passive; không còn May/Could pollution |
| second-conditional | 20 | #9 could · #3 unreal TF | **HOLD** — were/would; #18 *I'd rather you stayed* = related (P1 style, không sai EN) |
| mixed-conditionals | 21 | #17 wouldn't be · #10 would be doctor now | **HOLD** — 3→2 / 2→3 đúng; lottery → *would own* (không còn meta-answer) |
| present-simple | 18 | #4 go · #11 doesn't like | **HOLD** — *always late* → **is** (P0 cũ đã fix) |
| modals-perfect | 20 | #13 should · #18 can't have | **HOLD** — *looks fresh → must have* (P0 cũ đã fix); needn't have; can't have stolen |

---

## P0 list

**None.**

Không có item nào:
1. answer key sai so với grammar chuẩn  
2. dạy câu sai như đúng  
3. topic hoàn toàn lệch (passive = modal permission, 2nd-cond = Present Simple, mixed = There is/are, v.v.)

### Archive (đã fix trước final — xác nhận live)

| slug | was | live now |
|------|-----|----------|
| present-perfect error bank | PP đúng → “sửa” HTĐ | error = have saw / yesterday / she have / Did you ever |
| passive-voice | ~26% on-topic modal | 20/20 passive |
| second-conditional | Present Simple pollution | 20/20 type 2 |
| mixed-conditionals | There is/are + wrong keys | 21 mixed clean |
| present-simple #always late | ans=`works` | ans=`is` |
| modals-perfect looks fresh | `can't have` | `must have` |

---

## Non-P0 notes (không block ship)

| sev | slug | note |
|-----|------|------|
| P1 | third-conditional #14 | Stem dính meta: *Wait — correct: If we ___ missed…* — key `hadn't` đúng, polish stem |
| P1 | second-conditional #18 | *I'd rather you stayed* — related unreal, không phải pure type-2 pattern |
| P1 | cleft #2 | Textbook marks *where*→*that* in it-cleft place; informal *where* tồn tại — acceptable teaching choice |
| P2 | nhiều MCQ | Distractor kiểu `must to` / `should to` / `proves definitely` — rõ ràng nhưng thô |
| P2 | passive #19 / adv-passive #10 | Option gộp `cleaning / to be cleaned` (một string) — chọn đúng được, UX kém |
| P2 | present-simple onTopicPct 67% | Heuristic false-negative; full bank OK |
| P2 | CI anti-pollution | Chưa có generator allowlist cứng — pollution từng lọt; audit-all-62 mitigates pre-ship |

**Không sửa DB run này** — không có P0 ≤10 cần hotfix.

---

## Ship recommendation

| Layer | Rec |
|-------|-----|
| Wordbanks (62/62 · 1573 rows · VI) | **SHIP** |
| In-lesson / quiz exercises (sample 18 slugs deep + 62 auto) | **SHIP** |
| Past P0 residual | **CLEAR** on live |
| Full curriculum polish (stem meta, distractor style, density) | post-ship P1 backlog |
| CI on-topic allowlist per slug | **nên** add trước round gen tiếp theo |

**Product call:** **PASS → ship grammar quiz + wordbanks** beginner→advanced cho band đã audit.  
Không block. Không cần hotfix DB trước deploy.

---

## Method appendix

1. Ran 3 automated scripts (exit 0 all).  
2. Live dump: `tmp/final-spot-dump.mjs` → sample 3×12 + 2×6 past P0.  
3. Raw schema dump: exercises field = `{q, opts, answer, type, fb, case_id}` — reviewed with options.  
4. Full bank manual read for: present-perfect, passive-voice, second-conditional, mixed-conditionals, present-simple, modals-perfect, third-conditional, participle-clauses, cleft-sentences, causative, modals-deduction, used-to.  
5. Cross-check prior reports: `tmp/EN-TEACHER-AUDIT-REPORT.md` (FAIL) · `tmp/EN-TEACHER-REAUDIT-REPORT.md` (CONDITIONAL PASS) — final confirms re-audit hold + extends to 12 new focus slugs.
