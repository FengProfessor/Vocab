# Grammar Content Generator — "Golden Lesson"

Bào lại toàn bộ nội dung grammar (bỏ OCR rác) theo template vàng. Mỗi bài ra 1 file JSON dày, đồng đều, sư phạm.

## File
- `roadmap.json` — 60 topic lộ trình CEFR (A1→C2). Sửa để thêm/bớt bài.
- `golden-seed.json` — bài mẫu chuẩn (Present Simple). **Anchor chất lượng** — few-shot ép mọi bài ra cùng độ dày. Muốn nâng chuẩn → sửa file này.
- `generate.ts` — script bào hàng loạt.
- `out/<slug>.json` — kết quả bào (tạo khi chạy).

## Chạy (trong `web-app/`)
```bash
# Gemini (mặc định) — cần GEMINI_API_KEY trong .env.local (nhiều key: phẩy)
npx tsx scripts/grammar-gen/generate.ts                  # bào hết 60 bài
npx tsx scripts/grammar-gen/generate.ts --level beginner # 1 cấp
npx tsx scripts/grammar-gen/generate.ts --only past-simple,articles
npx tsx scripts/grammar-gen/generate.ts --force          # bào lại bài đã có
npx tsx scripts/grammar-gen/generate.ts --limit 3        # test nhanh 3 bài

# Groq — cần GROQ_API_KEY (GROQ_MODEL mặc định llama-3.3-70b-versatile)
npx tsx scripts/grammar-gen/generate.ts --provider groq
```

Cờ: `--delay <ms>` (mặc định 3000, tránh rate limit) · `--level` · `--only` · `--force` · `--limit`.

## Đặc tính
- **Resume**: bỏ qua bài đã có `out/<slug>.json` (trừ `--force`) → tiết kiệm quota, chạy nhiều lần được.
- **Multi-key rotation**: `GEMINI_API_KEY`/`GROQ_API_KEY` nhiều key phân tách dấu phẩy → tự xoay.
- **Validate + retry**: mỗi bài kiểm độ dày (examples≥6, exercises≥10, mistakes≥3); thiếu → thử lại 1 lần; vẫn yếu thì vẫn lưu + liệt kê cuối log để review.
- Cuối log in danh sách bài cần review.

## Sau khi bào (BƯỚC SAU — chưa làm, review trước)
1. Soát chất lượng `out/*.json` (đọc vài bài, đặc biệt các bài bị ⚠).
2. Migration thêm cột `sections jsonb` + `exercises jsonb` vào `grammar_lessons` (giữ `theory_vi` cũ tương thích).
3. Script import `out/*.json` → `grammar_topics` + `grammar_lessons` + `grammar_exercises`.
4. Cập nhật UI render `sections` có cấu trúc (thay `formatOcrTheory` blob).
5. Cá nhân hóa (Pro): nút AI inject từ vựng user lúc render.

## Lưu ý chất lượng
Golden-seed là chuẩn tối thiểu. Gemini 2.5-flash đủ tốt cho lý thuyết+ví dụ; bài quan trọng (12 thì, điều kiện, bị động) nên review tay hoặc re-gen bằng model mạnh hơn. Đặt chất lượng lên hàng đầu — bài nào đọc chán/mỏng thì `--force --only <slug>` bào lại.
