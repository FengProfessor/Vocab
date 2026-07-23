# PROMPT → Antigravity · R5 Feedback “mẹ giải thích con hiểu”

> **Copy block `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + `.env.local`).  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** gọi OpenRouter / Groq / Gemini API / OpenAI — soạn fb bằng quota AG.  
> Grok chấm bằng handback + spot DB, **không** tin “100%” suông.

---

## PROMPT START

```
# ROLE
Bạn là giáo viên tiếng Anh tiểu học/THCS Việt Nam + editor nội dung LingoPro.
Nhiệm vụ: viết lại **toàn bộ feedback (fb)** bài tập ngữ pháp sao cho
**học sinh Việt kém tiếng Anh** (mất gốc / mới bắt đầu) đọc xong **hiểu ngay**.

# BỐI CẢNH ĐÃ CÓ (đừng phá)
- Exercises nằm ở `grammar_lessons.exercises` (Supabase JSONB).
- Shape: { type: mcq|fill|error|tf, q, opts?, answer, fb, case_id? }
- Script nền: `scripts/grammar-a0a2/fix-learner-feedback.mjs` (đã force vài TF đúng + wrap VI sơ).
- Verify cấu trúc (vẫn phải xanh):
  node scripts/grammar-a0a2/verify-final.mjs
- Lịch sử lỗi thật user gặp:
  - "I love Tom." bị chấm Sai + fb "they/them" → đã fix, **không được regress**.
  - "Tom is happy." / "She is a player." / "He works here." từng bị Sai → **giữ Đúng**.
  - "Đúng: She am a player" = cấm tuyệt đối.

# MỤC TIÊU R5 (2 workstream)

## Workstream A — BEGINNER 24 topic (ƯU TIÊN 1, “100% mẹ giải thích”)
Danh sách slug beginner (theo DB level=beginner, ~24 topic). Lấy list chính xác:
  query grammar_topics where level='beginner' order by order_index

Với **TỪNG** exercise trong từng topic beginner:
1. Đọc q + opts + answer + fb hiện tại.
2. Kiểm tra **đáp án có đúng không** (HS kém cũng cần key đúng).
3. Viết lại **fb** theo chuẩn bên dưới.
4. Nếu câu TF “X is correct” mà X là câu đúng → answer=true + fb “Đúng…”.
5. Nếu X là câu sai → answer=false + fb “Sai… Câu đúng: … Vì …”

## Workstream B — INTERMEDIATE + ADVANCED (ƯU TIÊN 2)
Mọi exercise còn `fb` **không có dấu tiếng Việt** (không khớp regex dấu VN):
- Viết lại fb có **ít nhất 1 câu tiếng Việt rõ nghĩa**.
- Có thể giữ thuật ngữ EN trong ngoặc, nhưng **phải giải thích bằng VI trước**.
  Ví dụ tốt: “Sai. Sau look forward to phải dùng V-ing (meeting), không meet.”
  Ví dụ xấu: “look forward to + V-ing”

# CHUẨN FEEDBACK “MẸ GIẢI THÍCH CON HIỂU”

## Nguyên tắc viết (bắt buộc)
1. **Tiếng Việt là chính** — mỗi fb ≥ 1 câu VI có dấu.
2. **Cấu trúc cố định:**
   - Nếu đúng: `Đúng. [vì sao 1–2 ý]. [ví dụ ngắn nếu cần].`
   - Nếu sai: `Sai. [chỗ sai]. Câu/đáp án đúng: […]. [vì sao].`
3. **Một ý chính / fb** — không nhồi 3 rule.
4. **Không** chỉ viết: subject, object, V1, V2, V3, base form, clause… nếu không có VI.
5. **Không** boilerplate: “minh họa cách dùng…”, “Giải thích bài tập”, “Gợi ý: … đối chiếu…” (trừ khi đã viết cụ thể phía sau).
6. **Khớp câu hỏi:** fb chỉ nói về từ/ngữ trong câu đó (cấm they/them khi câu không có they/them).
7. **Câu đúng trong fb phải đúng thật** (cấm “Đúng: She am …”).
8. Từ vựng giải thích: lớp 6–7 (chủ ngữ = “ai làm”, tân ngữ = “ai/cái bị tác động / đứng sau động từ hoặc giới từ”).
9. Độ dài: **40–160 ký tự** (hoặc 2–4 dòng bullet ngắn). Quá dài HS bỏ đọc.

## Template theo type

### tf
- Đúng: `Đúng. [I/She/They…] đứng [đầu câu / sau động từ] vì […].`
- Sai: `Sai. [từ sai] không dùng ở đây. Câu đúng: […]. Vì […].`

### mcq / fill
- `Đúng là [answer] vì [rule VI]. Không chọn [1 distractor gần] vì […].` (phần distractor optional nếu chật)

### error
- `Sai ở chỗ: […]. Sửa thành: [answer]. Vì […].`

## Ví dụ chuẩn (bám theo)

### Tốt
- `Đúng. I = tôi (đứng trước động từ). Tom đứng sau love. Câu đúng.`
- `Sai. Me không đứng đầu câu. Câu đúng: I am a student.`
- `Sai. Sau between dùng me, không I. Đúng: between you and me.`

### Xấu (cẤM)
- `they = subject; them = object` (lạc đề / không VI)
- `V1 after did`
- `Sai. Đúng: She am a player.`
- `Gợi ý: subject. Hãy đối chiếu…` (chung chung)

# KHÔNG ĐƯỢC LÀM
- NEVER đổi schema Supabase.
- NEVER xóa hàng loạt exercises chỉ vì lười viết fb (được **sửa fb/answer**, được xóa item rác pad “Key point #” nếu còn).
- NEVER nới `verify-final.mjs`.
- NEVER external LLM API.
- NEVER hardcode secrets; dùng `.env.local` như script cũ.
- NEVER claim PASS nếu beginner còn fb không dấu VI.

# CÁCH LÀM (kỹ thuật)

## 1) Inventory
Viết script `scripts/grammar-a0a2/audit-learner-fb-r5.mjs`:
- List beginner slugs
- Đếm per lesson:
  - fb thiếu dấu VI
  - fb rỗng / quá ngắn (<12)
  - TF “is correct” + answer có vẻ lệch (heuristic + whitelist câu đúng đã biết)
- Xuất `tmp/r5-fb-baseline.json`

## 2) Rewrite
Ưu tiên thứ tự:
1. personal-pronouns, verb-to-be, present-simple, past-simple, articles, present-continuous, past-continuous, there-is-there-are, have-got, demonstratives, possessives, quantifiers, countable-uncountable, plural-nouns, be-going-to, future-will, modals-*, prepositions-*, imperatives, wh-questions, adverbs-frequency, adjectives-basic, conditionals-0-1, comparatives-superlatives
2. Toàn bộ intermediate
3. Toàn bộ advanced

Cách apply:
- Script update theo slug (batch 5–8 topic/lần để an toàn), HOẶC
- Map `slug → [{match_q_regex hoặc index, new_fb, new_answer?}]` rồi write DB
- Sau mỗi batch: xóa `grammar_quiz_cache` theo lesson_id đã sửa

Có thể mở rộng `fix-learner-feedback.mjs` thành R5 full, nhưng **fb phải cụ thể theo từng câu**, không chỉ wrap “Gợi ý: {en}”.

## 3) Gate R5 (bắt buộc trước handback)

### Gate A — Beginner “mẹ giải thích”
Với mọi exercise thuộc level=beginner:
- fb có ít nhất 1 ký tự tiếng Việt có dấu (regex Unicode VN)
- fb không match blacklist jargon-only / boilerplate
- 0 case FORCE_TRUE sentences còn answer=false

### Gate B — Global
- `node scripts/grammar-a0a2/verify-final.mjs` → PASS (exit 0)
- Thêm script `scripts/grammar-a0a2/verify-learner-fb-r5.mjs`:
  - beginner_missing_vi == 0
  - advanced_missing_vi == 0  (toàn bộ level, không chỉ beginner)
  - p0_wrong_tf_keys == 0 (danh sách whitelist câu đúng)

### Gate C — Spot human (bắt buộc trong report)
Chọn 6 topic beginner + 3 advanced, mỗi topic paste 3 cặp:
  Q | answer | fb mới
Tự đọc to: “HS lớp 6 mất gốc có hiểu không?” — nếu không, viết lại.

## 4) Report + commit
- `docs/grammar/AG-R5-LEARNER-FB-REPORT.md`
  - baseline vs after (số fb thiếu VI beginner / all)
  - số answer key đã sửa
  - 9 topic spot (Q/A/fb)
  - residual (nếu còn)
- Commit scoped:
```
git add scripts/grammar-a0a2/*learner* scripts/grammar-a0a2/fix-learner-feedback.mjs \
  scripts/grammar-a0a2/verify-learner-fb-r5.mjs \
  docs/grammar/AG-R5-LEARNER-FB-REPORT.md
git commit -m "fix(grammar): R5 mother-explains-child Vietnamese feedback for all levels"
```
Push nếu được phép.

# HANDBACK (paste nguyên về Grok)

### HANDBACK_GROK_LEARNER_FB_R5
- beginner_missing_vi: before → after
- all_levels_missing_vi: before → after
- wrong_tf_keys_fixed: (số)
- verify_final: PASS/FAIL + 8 dòng output
- verify_learner_fb_r5: PASS/FAIL
- spot (3 beginner + 2 advanced) — mỗi cái 1 dòng: slug | q rút gọn | ans | fb
- commit:
- residual:
### END_HANDBACK

# ACCEPTANCE (Grok chỉ PASS khi)
1. beginner_missing_vi = 0
2. all_levels_missing_vi = 0  
3. verify-final PASS
4. verify-learner-fb-r5 PASS
5. Spot không còn jargon-only / key sai kiểu I love Tom
6. Không regress: I love Tom / Tom is happy / He works here vẫn Đúng

# START NOW
1) audit baseline JSON  
2) rewrite beginner 24 (full)  
3) rewrite remaining EN fb intermediate/advanced  
4) verify gates  
5) report + commit + handback  
```

## PROMPT END

---

## Ghi chú cho tapho

| | |
|--|--|
| **File prompt** | `docs/PROMPT-antigravity-grammar-learner-fb-r5.md` |
| **Việc AG** | Viết lại fb “mẹ giải thích” beginner 24 + VI cho advanced |
| **Việc Grok sau** | Chấm handback + spot 5–10 câu, không tin 100% suông |
| **Lưu ý** | Bắt AG tạo `verify-learner-fb-r5.mjs` — tránh overclaim như R1 |

**Cách chạy:** mở AG Agent → dán PROMPT START…END → quyền terminal + `.env.local`.
