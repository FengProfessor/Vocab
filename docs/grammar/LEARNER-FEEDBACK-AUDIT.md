# Audit feedback — góc học sinh VN kém tiếng Anh

## Vấn đề phát hiện

1. **Key sai:** câu đúng bị đánh *Sai* (vd `I love Tom.`, `Tom is happy.`, `He works here.`, `Tom was playing football.`).
2. **Giải thích lệch đề:** fb nói *they/them* trong khi câu không có they/them.
3. **Sửa sai thành sai:** *Đúng: She am a player* / *Tom are happy*.
4. **Fb toàn tiếng Anh jargon** (V1, subject…) — HS yếu khó hiểu.
5. **Boilerplate** “minh họa cách dùng…”

## Đã sửa (DB live)

| Việc | Kết quả |
|------|---------|
| Force **Đúng** cho câu rõ ràng hợp lệ | Tom is happy, She is a player, He works here, past continuous đúng… |
| Rewrite **personal-pronouns** TF | Bullet tiếng Việt: sai chỗ nào + câu đúng |
| Wrap fb EN (beginner) | “Gợi ý: … đối chiếu chủ ngữ/động từ” |
| Gỡ boilerplate | Cắt câu rỗng |
| Script tái chạy | `scripts/grammar-a0a2/fix-learner-feedback.mjs` |

## Câu 16 đại từ (user report)

**Trước:** *I love Tom.* → Sai + they/them  
**Sau:** → **Đúng** + giải thích I (người làm) / Tom (sau động từ)

## Còn lại (R5 optional)

- ~500+ item advanced vẫn fb nghiêng EN (intermediate/advanced) — không chặn verify.
- ~20 TF “false on odd sentence” heuristic nhiễu (câu sai thật nhưng heuristic tưởng đúng).
- Nên rà tay **beginner 24 topic** theo checklist: mỗi fb có (1) Đúng/Sai (2) vì sao 1 câu VI (3) câu đúng nếu Sai.

## Lệnh

```bash
node scripts/grammar-a0a2/fix-learner-feedback.mjs
node scripts/grammar-a0a2/verify-final.mjs
```
