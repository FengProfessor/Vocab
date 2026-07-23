# PROMPT → Antigravity · R5.1 Siết feedback template rỗng

> Copy **PROMPT START → PROMPT END** dán AG.  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** external LLM API.  
> Bối cảnh: R5 đã PASS gate “có tiếng Việt” — nhưng nhiều fb vẫn **chung chung**, HS kém **không học được rule**.  
> Grok sẽ chấm: cấm phrase rỗng + spot 10 câu beginner.

---

## PROMPT START

```
# ROLE
Giáo viên tiếng Anh tiểu học/THCS Việt Nam + editor LingoPro.
Task: **R5.1** — thay mọi feedback “có VI nhưng rỗng” bằng giải thích **cụ thể rule**, kiểu mẹ giảng cho con mất gốc.

# ĐÃ PASS (đừng phá)
- verify-final.mjs PASS
- verify-learner-fb-r5.mjs PASS (missing_vi=0)
- FORCE_TRUE giữ answer=true:
  "I love Tom." | "Tom is happy." | "She is a player." | "He works here." |
  "Tom was playing football." | "They were not watching TV."
- Không regress key / clone theory stems

# VẤN ĐỀ R5.1 (bắt buộc diệt)

Fb có dấu tiếng Việt nhưng **không dạy rule** — blacklist (case-insensitive):

1. `dạng đúng chuẩn`
2. `diễn đạt chuẩn xác cấu trúc`
3. `diễn đạt chuẩn xác cấu trúc và ý nghĩa`
4. `đáp án này diễn đạt chuẩn`
5. `vì đây là dạng đúng`
6. `Sai ở chỗ lỗi từ trong câu` (không nói lỗi gì)
7. `Gợi ý:` + không có rule cụ thể sau đó
8. Chỉ lặp lại đáp án: `Đúng là "X" vì "X"` không giải thích

Ví dụ XẤU (đang có trong DB):
- "Đúng là \"are going to\" vì đây là dạng đúng chuẩn."
- "Đúng là \"on\" vì đáp án này diễn đạt chuẩn xác cấu trúc và ý nghĩa của câu." (at noon / on Monday giống hệt → SAI)
- "Sai ở chỗ lỗi từ trong câu. Sửa thành: stay…" (thiếu: insist that + V nguyên thể)

Ví dụ TỐT:
- "Đúng là \"at\" vì at + giờ (at noon, at 7). Không dùng on/in với giờ đúng."
- "Đúng là \"on\" vì on + thứ/ngày (on Monday, on 1 May)."
- "Sai. Sau insist that dùng động từ nguyên thể: he stay (không stays)."
- "Đúng là \"me\" vì đứng SAU động từ call → tân ngữ me, không I."

# CHUẨN FB R5.1 (cứng hơn R5)

## Template
- Đúng: `Đúng là "[answer]". Vì [rule 1 câu, có điều kiện: ai/gì/khi nào]. [Cấm chọn X nếu gần].`
- Sai (TF/error): `Sai. [chỗ sai 1 ý]. Câu/đáp án đúng: […]. Vì [rule].`

## Bắt buộc
1. Fb phải **phân biệt được** câu này với câu cùng topic khác (at noon ≠ on Monday).
2. Có **tên rule thật**: at/on/in, he+was, she+s, after did = V1, that sau it-cleft…
3. Tiếng Việt có dấu; thuật ngữ EN chỉ trong ngoặc nếu cần.
4. 40–180 ký tự (hoặc 2–4 bullet ngắn).
5. Khớp đúng stem (không dán they/them bừa).

# WORK

## 1) Audit
Viết/chạy `scripts/grammar-a0a2/audit-fb-generic-r5.1.mjs`:
- Quét mọi exercises.fb match blacklist (regex)
- Xuất `tmp/r5.1-generic-baseline.json`:
  - total_generic
  - by_slug top 20
  - 30 samples (slug, q, fb)

## 2) Rewrite
Với **mỗi** item generic (toàn 62 topic, ưu tiên beginner trước):
- Viết fb mới theo chuẩn R5.1, bám q + answer + opts
- Giữ type/answer/opts/case_id (chỉ đổi fb, trừ khi phát hiện key sai rõ → sửa answer + log)

Script gợi ý: `scripts/grammar-a0a2/fix-fb-generic-r5.1.mjs`
- Apply DB + clear grammar_quiz_cache theo lesson đã sửa
- Batch theo slug nếu cần

## 3) Gate R5.1 (bắt buộc)
A. `node scripts/grammar-a0a2/verify-final.mjs` → PASS  
B. `node scripts/grammar-a0a2/verify-learner-fb-r5.mjs` → PASS  
C. **Mới:** `scripts/grammar-a0a2/verify-fb-generic-r5.1.mjs`
   - total_generic == 0 (blacklist)
   - FAIL nếu còn “dạng đúng chuẩn” / “diễn đạt chuẩn xác”
D. FORCE_TRUE: 0 answer=false

## 4) Spot (bắt buộc trong report — Grok sẽ đọc)
Bảng 10 dòng beginner + 5 advanced:
| slug | q (rút) | answer | fb mới (full) |

Ít nhất gồm: articles (a/an), prepositions-time (at noon vs on Monday), personal-pronouns (me), present-simple (-s), past-simple (did+V1), subjunctive (stay), cleft (that).

## 5) Docs + commit
- `docs/grammar/AG-R5.1-SPECIFIC-FB-REPORT.md`
  - generic before → after (phải 0)
  - số fb rewritten
  - spot table
  - residual thật (nếu 0 thì nói “0 theo blacklist”; không claim “hoàn hảo sư phạm vũ trụ”)
```
git add scripts/grammar-a0a2/audit-fb-generic-r5.1.mjs \
  scripts/grammar-a0a2/fix-fb-generic-r5.1.mjs \
  scripts/grammar-a0a2/verify-fb-generic-r5.1.mjs \
  docs/grammar/AG-R5.1-SPECIFIC-FB-REPORT.md
git commit -m "fix(grammar): R5.1 replace generic Vietnamese feedback with specific rules"
```
(Không force-push. User sẽ push chung 1 lượt.)

# NEVER
- NEVER nới blacklist / verify
- NEVER chỉ thêm dấu VI mà vẫn câu rỗng
- NEVER external API
- NEVER claim residual none nếu generic>0
- NEVER đổi whitelist FORCE_TRUE thành false

# HANDBACK

### HANDBACK_GROK_LEARNER_FB_R5_1
- generic_before → generic_after (must 0)
- verify_final / verify_learner_fb_r5 / verify_fb_generic_r5.1: PASS/FAIL
- rewritten_count:
- spot 8 dòng (slug|q|ans|fb)
- commit:
- residual (thành thật):
### END_HANDBACK

# START
Audit baseline → rewrite generic → 3 gates PASS → report → commit → handback.
```

## PROMPT END

---

## Ghi chú tapho — còn cần làm gì sau R5.1?

| Việc | Cần? |
|------|------|
| R5.1 siết template rỗng | **Có — đây là lỗ hổng thật** |
| Volume / examples / clone / error≥4 | **Không** (đã R2–R4) |
| verify-final / missing VI | **Không** (đã xanh) |
| R6 sau R5.1 | **Tùy**: chỉ nếu còn topic “nói năng kỳ” khi bạn học thử 5 bài |
| Đóng vòng grammar content | **Sau R5.1 PASS** → có thể **đóng** pipeline AG grammar |

**Tóm lại:** R5.1 là **việc content cuối đáng làm**. Xong + gates xanh → không cần R6 trừ khi user phát hiện lỗi lúc học thật.

**Push 1 lượt:** hiện local còn commit `d0712ed` (R5) chưa push + sau AG R5.1 sẽ thêm commit. Khi xong handback, bảo Grok `push` một phát `origin/main`.
