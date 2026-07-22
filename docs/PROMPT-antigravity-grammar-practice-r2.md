# PROMPT R2 → Antigravity · Cải thiện practice (CHẶT — sau Grok audit)

> Copy **PROMPT START → END** dán AG.  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** external LLM API. Soạn tay / script local.  
> Grok sẽ chấm bằng `node scripts/grammar-a0a2/verify-final.mjs` (strict) — **không** tin narrative 100%.

---

## PROMPT START

```
# ROLE
Curriculum QA engineer LingoPro Grammar.
Task: cải thiện **examples (ngoài)** + **exercises (trong)** cho 62 topic, đạt STRICT verify PASS.

# CONTEXT (đã có — đọc trước)
- Pipeline: `quality-fix-refill-all.mjs`, `practice-coverage-engine.mjs`
- FRESH banks: `practice-banks-fresh.mjs` + a0 + batch2 + inter
- Theory examples updater: `update-theory-examples.mjs`
- **Verify BẮT BUỘC (strict):**
  node scripts/grammar-a0a2/verify-final.mjs
  → FAIL nếu: under36>0 | examples<10 | strictOverlap≥30 | intraDup>0 | junk/ansBad>0 | cov<90%
- Grok đã purge residual clones (pronouns/future-will/continuous). Đừng re-introduce stems lỗi đã xóa.

# PRODUCT RULES (cứng)
1. NGOÀI = examples + mistakes (neo lý thuyết). Mục tiêu **12–15 examples EN+VI/topic** (hiện nhiều topic chỉ 10).
2. TRONG = exercises. Stem **≠** example.en và **≠** mistake.wrong/right (chuỗi ≥3 từ).
3. Trong 1 bank: full-question unique (intraDup=0). Không pad 10 câu "Choose the correct sentence." giống hệt.
4. Phủ case: rules / mistakes / formula / usage — gắn case_id; cov ≥90% (engine).
5. Types: ưu tiên mcq≥10, fill≥8, error≥4, tf≥4; n=36–42.
6. CẤM: multi-correct "fits a"; another; fake ss; will↔won't trên câu đúng; VI tip trong error stem; clone mistake "This is for I" / "Between you and I" / "runing" / theory door-open.

# WORK (theo thứ tự)

## 1) Baseline strict
node scripts/grammar-a0a2/verify-final.mjs --json > tmp/ag-r2-baseline.json
Ghi số: under10Examples, strictOverlap, thin error topics.

## 2) Examples lên 12–15 (ngoài)
- Ưu tiên topic `examples.length < 12` (đa số đang =10).
- Mỗi example: {en, vi, note} — **EN mới**, không copy exercise stems hiện có trong DB.
- Mở rộng `update-theory-examples.mjs` hoặc script mới; apply DB.
- Sau phase: 0 topic <12 examples (target); tuyệt đối 0 topic <10.

## 3) Practice gaps (trong)
- Topic error=0 hoặc <4: thêm error stems **paraphrase**, không clone mistakes.
- Topic strictOverlap>0: thay stem (đọc tmp/verify-final-report.json worstOverlap).
- Topic n<40 muốn dày: thêm FRESH bank file mới `practice-banks-fresh-batch3.mjs` (advanced: conditionals 2/3, mixed, wish, modals-perfect, inversion…) → export vào FRESH_BY_SLUG.
- Apply:
  node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply
  (hoặc --only slug1,slug2)

## 4) Verify + self-reject
node scripts/grammar-a0a2/verify-final.mjs
Chỉ PASS khi exit code 0.
Nếu FAIL: sửa tiếp, **cấm** chỉnh verify-final cho dễ PASS.

## 5) Spot-check tay (bắt buộc trong report)
3 topic (articles, personal-pronouns, present-simple):
- 2 example theory
- 2 exercise
Chứng minh stem khác nhau.

## 6) Commit scoped
git add scripts/grammar-a0a2/practice-banks-fresh*.mjs \
  scripts/grammar-a0a2/update-theory-examples.mjs \
  scripts/grammar-a0a2/quality-fix-refill-all.mjs \
  docs/grammar/AG-R2-REPORT.md
git commit -m "feat(grammar): R2 more theory examples + denser non-cloning practice"
# push nếu được

# DELIVERABLES
1. docs/grammar/AG-R2-REPORT.md (số baseline → after + 3 topic spot)
2. verify-final PASS (đính kèm output)
3. Handback:

### HANDBACK_GROK_PRACTICE_R2
- baseline: under10Ex, strictOverlap, avgN, avgCov
- after: same + under36, intraDup, junk
- examples_min_max:
- verify_final: PASS/FAIL + paste 8 dòng report
- samples (3 slug × example vs exercise):
- files / commit:
- residual risks:
### END_HANDBACK

# NEVER
- NEVER nới threshold trong verify-final
- NEVER claim 100% khi strictOverlap>0 hoặc examples vẫn 10/topic mà báo "15 đều"
- NEVER re-add stems Grok đã purge (for I / between you and I / runing park / open the door for me)
- NEVER external API gen

# START
Baseline verify-final --json → examples 12–15 → practice gaps → apply → verify-final PASS → report + handback.
```

## PROMPT END

---

## Ghi chú tapho
- R2 **chặt hơn R1**: verify strict, cấm sửa verify, cấm overclaim 15 khi chỉ 10.
- Grok đã fix clone + verify; AG lo **bù examples 12–15** + **error density** + batch3 advanced.
