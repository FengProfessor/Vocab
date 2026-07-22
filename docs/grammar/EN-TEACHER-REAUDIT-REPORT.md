# EN Teacher Re-audit

Date: 2026-07-22  
Auditor: STRICT VN high-school EN + Cambridge-aware  
Method: live pull Supabase (`scripts/grammar-a0a2/dump-reaudit-exercises.mjs` → `tmp/reaudit-dump.json`) · manual key + on-topic review all items on 11 deep slugs · 5-item+ spot on 5 control slugs  
Previous: `tmp/EN-TEACHER-AUDIT-REPORT.md` = **FAIL**  
Prior hotfixes: `hotfix-p0-quiz.mjs`, `hotfix-p0-pollution-2.mjs`  
This run scripts: `hotfix-reaudit-p0.mjs` (relative residual), `hotfix-reaudit-keys.mjs` (2 keys + 1 stem)  
**DB write this run:** yes (see Hotfix this run) · **no commit/push**

## Verdict: **CONDITIONAL PASS**

Các slug từng **FAIL / D–F** (present-perfect, passive, second-conditional, mixed, obligation, present-simple, inversion, subjunctive, relative, modals-perfect, wish) **không còn dạy sai thì / topic pollution nặng** trên live quiz.  
Ship được **quiz + wordbanks** cho band beginner→advanced sample này.  
Chưa **full unconditional PASS** curriculum vì: (1) density wordbanks/examples vài slug còn mỏng; (2) style lặp / stem meta còn P1–P2; (3) chưa có CI on-topic allowlist — pollution từng lọt qua 2 vòng hotfix.

**Remaining hard P0 (wrong key / teach-wrong): 0** sau hotfix this run.

---

## Delta vs previous FAIL

| Issue (audit FAIL) | Trạng thái live |
|---|---|
| present-perfect: PP đúng → “sửa” HTĐ (4 error) | **FIXED** — error bank: *have saw / finished yesterday / she have / Did you ever* |
| passive-voice ~26% on-topic (May/Could/Would mind) | **FIXED** — full refill 20/20 be+V3 / modal passive |
| second-conditional ~21% (Present Simple pollution) | **FIXED** — full refill 20/20 type 2 |
| mixed-conditionals There is/are + key `had` / mark correct mixed wrong | **FIXED** — bank 21 item mixed 3→2 / 2→3; lottery → *would buy/own* |
| modals-obligation double *to* + error key `must` | **FIXED** — stem *You ___ wear*; error ans=`to` |
| present-simple *always late → works* | **FIXED** — ans=`is` |
| inversion empty error q | **FIXED** — *Never I have seen…* |
| subjunctive plural-nouns pollution | **FIXED** — bank 20 mandative/wish/as if (không còn tooths/potatoes) |
| relative error = modal request | **FIXED** (this run dọn 2 residual #11/#14) |
| modals-perfect / wish bleed chéo | **FIXED** — banks tách topic, 20/20 on-topic |
| **New P0 found this re-audit** | modals-perfect *looks fresh → can't have* (**FIXED this run**); mixed meta-answer “is OK if have=own” (**FIXED this run**) |

---

## Scores table

Thang: on-topic% · key accuracy · residual P0 · grade (A ship · B ship+note · C salvage · D–F block)

| slug | n | banks | on-topic% | key accuracy | residual P0 | grade | notes |
|------|---|-------|-----------|--------------|-------------|-------|-------|
| present-perfect | 22 | 49 | **100%** | A | 0 | **A** | for/since/been/gone/V3 OK |
| passive-voice | 20 | 24 | **100%** | A | 0 | **A** | be+V3 các thì + modal passive |
| second-conditional | 20 | 15 | **100%** | A | 0 | **A** | were/would; #17 I'd rather = related OK |
| mixed-conditionals | 21 | 10 | **100%** | A | 0 | **A−** | bank sạch; banks mỏng (10) |
| modals-obligation | 24 | 12 | **100%** | A | 0 | **B+** | keys đúng; lặp *must to* pattern |
| present-simple | 18 | 30 | **100%** | A | 0 | **A** | always late→is |
| inversion | 24 | 18 | **100%** | A | 0 | **A** | Never/Hardly/No sooner |
| subjunctive | 20 | 15 | **100%** | A | 0 | **A** | mandative + were |
| relative-clauses | 23 | 17 | **100%** | A | 0 | **A** | who/which/whose/where/when |
| modals-perfect | 20 | 19 | **100%** | A | 0 | **A** | after fix *must have* fresh |
| wish-if-only | 20 | 14 | **100%** | A | 0 | **A** | wish/if only past & would |
| countable-uncountable *(spot)* | 12 | 206 | 100% | A | 0 | **A** | quiz mỏng vs banks siêu dày |
| past-simple *(spot)* | 19 | 133 | 100% | A | 0 | **A** | irreg OK |
| gerunds-infinitives *(spot 5+)* | 24 | 44 | 100% | A | 0 | **A** | stop/try/suggest OK |
| reported-speech *(spot)* | 24 | 26 | 100% | A | 0 | **A** | backshift OK |
| causative *(spot)* | 24 | 18 | 100% | A | 0 | **A** | have/get sth done |

**Aggregate deep (11):** 11/11 ship-ready quiz (A–B+). **0 slug D–F.**

---

## Remaining P0 (exact q + ans + fix)

**Không còn hard P0** trên sample re-audit sau hotfix this run.

*(Đã đóng trong run này — archive):*

| slug | q (rút) | was | fix applied |
|------|---------|-----|-------------|
| modals-perfect | `He looks fresh — he ___ slept well.` | `can't have` | → `must have` (+ opts) |
| mixed-conditionals | error *would have a mansion now* + ans meta *is OK if have=own* | meta / sentence đúng bị “error” | → error *would have owned…now* → *would own…now* |
| relative-clauses | `Do you mind if I taking…` / `Could you please to pass…` | modal pollution | → *book who* / *London, that is…* |

---

## Remaining P1/P2

### P1
1. **mixed-conditionals wordbanks = 10** — quiz ổn nhưng handout/list còn mỏng so A2 target.  
2. **modals-obligation** — nhiều item lặp bẫy *must to* / *have to*; thiếu contrast *needn't / don't have to* đa dạng tình huống.  
3. **subjunctive / relative opts** — vài option text mang ghi chú meta exam (`AmE informal…`) — học sinh thấy lạ trên UI.  
4. **examples** nhiều lesson intermediate/advanced vẫn **6** — mỏng handout.  
5. **C/U quiz n=12** vs banks 206 — lệch practice vs theory list.

### P2
1. **relative** fill bắt `which` khi stem ghi *(which/that)* — both đúng; ép one key.  
2. **reported** *told me to not eat* → mark *to not* — pedantic (*not to* formal preference).  
3. **second-conditional #17** *I'd rather you stayed* — related unreal, không pure if-clause.  
4. **passive #19** ans ghép `cleaning / to be cleaned` — đúng grammar, format opts dài.  
5. **Generator/CI** vẫn chưa chặn pollution theo allowlist slug (nguyên nhân FAIL vòng 1).  
6. **Hotfix purge regex** `there is|there are` đã **miss** dạng blank `___ there any` — cần heuristic rộng hơn nếu còn bank cũ ở slug khác.

---

## Hotfix this run

| Script | Scope | n fixed |
|--------|-------|---------|
| `scripts/grammar-a0a2/hotfix-reaudit-p0.mjs` | relative-clauses residual modal error #11,#14 | 2 |
| `scripts/grammar-a0a2/hotfix-reaudit-keys.mjs` | modals-perfect #1 key; mixed #16 stem; mixed #18 error | 3 |
| **Total** | | **5** |
| Cache | `grammar_quiz_cache` delete per touched lesson | yes |

Evidence dump: `tmp/reaudit-dump.json`, `tmp/reaudit-dump.txt`  
Fix logs: `tmp/hotfix-reaudit-p0.json`, `tmp/hotfix-reaudit-keys.json`

---

## Ship decision

| Surface | Decision |
|---------|----------|
| Wordbanks (dense A0–A2 sample) | **SHIP** |
| GOLD beginner theory + quiz (C/U, past, present-simple, obligation…) | **SHIP** |
| Quiz present-perfect / passive / second-cond / mixed / relative / subjunctive / modals-perfect / wish / inversion | **SHIP** (sau re-audit) |
| Full curriculum 62 topics ngoài sample | **Không xác nhận** — ngoài scope re-audit 16 slug; cần batch pass tương tự nếu generator từng pollute |
| CI / anti-pollution generator | **Chưa ship** — bắt buộc trước khi tin “không tái FAIL” |

**Policy:** mở quiz các slug đã re-audit. Không block learner trên 11 deep + 5 spot. Giữ mắt P1 density.

---

## Next upgrade list (priority)

1. **CI on-topic allowlist** per slug (block May I in passive, There is/are in mixed, plural in subjunctive, hope/first-cond in wish). Fail build nếu on-topic heuristic <90%.  
2. **Harden purge regex** blanked *there* / token error banks.  
3. **mixed-conditionals wordbanks** → ≥20 rows (type map 3→2 / 2→3 + examples).  
4. **modals-obligation** diversify: *needn't / don't have to / mustn't / had to* scenarios; bớt lặp *must to*.  
5. **examples** intermediate/advanced ≥10.  
6. **C/U quiz** 12 → 18–24 parity với banks.  
7. **Strip meta text** khỏi `opts`/`answer` (ghi chú AmE/exam → chỉ `fb`).  
8. Re-audit **phần còn lại** ~40+ topics ngoài sample (cùng teacher method).  
9. Optional: reported *not to* vs *to not* — align SGK VN.  
10. Progress log: ghi `progress.md` khi ship UI flag “quiz audited”.

---

## Evidence appendix

### Live counts (post this-run fix)

| slug | exercises | wordbank rows |
|------|-----------|---------------|
| present-perfect | 22 | 49 |
| passive-voice | 20 | 24 |
| second-conditional | 20 | 15 |
| mixed-conditionals | 21 | 10 |
| modals-obligation | 24 | 12 |
| present-simple | 18 | 30 |
| inversion | 24 | 18 |
| subjunctive | 20 | 15 |
| relative-clauses | 23 | 17 |
| modals-perfect | 20 | 19 |
| wish-if-only | 20 | 14 |

### Spot-check keys (5+ each control)

- **C/U:** much/many, homework, furniture, news is, information — OK  
- **past-simple:** did+V1, went, irregular bought/ate — OK  
- **gerunds:** avoid/admit/deny/suggest +ing; promise/manage/hope to; stop to buy — OK  
- **reported:** backshift was learning / had seen / would; no inversion in embedded Q — OK  
- **causative:** had it checked / get to fix / have + O + V1 / V3 — OK  

### On-topic (final)

Mọi deep slug **≥100%** on-topic trên live bank sau hotfix. Không còn residual pollution kiểu audit FAIL.
