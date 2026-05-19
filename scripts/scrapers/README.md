# Scrapers — cào dữ liệu từ vựng cho global_dictionary

Hệ thống cào từ vựng chất lượng từ web từ điển + nền tảng học, chuẩn hóa và đổ vào bảng `global_dictionary`.

## Cấu trúc

```
scrapers/
├── core/
│   ├── http-client.ts   — axios + rate-limit + retry exponential backoff
│   ├── rate-limiter.ts  — giãn nhịp per-domain + backoff khi 429/403
│   ├── normalizer.ts    — chuẩn hóa dữ liệu thô → shape global_dictionary.data
│   └── checkpoint.ts    — lưu tiến độ để resume khi crash
├── sources/
│   ├── oxford.ts          — Oxford Learner's Dictionaries
│   ├── longman.ts         — Longman LDOCE
│   ├── vocabulary-com.ts  — Vocabulary.com
│   ├── quizlet.ts         — Quizlet set (parse JSON nhúng)
│   └── anki.ts            — file Anki .apkg (SQLite trong zip)
├── config/quizlet-sets.json — danh sách Quizlet set cần cào
└── run-scrape.ts          — orchestrator
```

## Cách chạy (từ thư mục `web-app`)

```bash
# Web từ điển — cần --list (tên file trong scripts/lists/)
npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=oxford-3000
npx tsx scripts/scrapers/run-scrape.ts --source=longman --list=ielts-academic
npx tsx scripts/scrapers/run-scrape.ts --source=vocabulary-com --list=toeic-600

# Tùy chọn: --limit=N giới hạn số từ, --enrich gọi Gemini bổ khuyết synonym/ảnh-query
npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=oxford-3000 --limit=20 --enrich

# Quizlet — đọc config/quizlet-sets.json
npx tsx scripts/scrapers/run-scrape.ts --source=quizlet

# Anki — đọc 1 file .apkg
npx tsx scripts/scrapers/run-scrape.ts --source=anki --file=scripts/scrapers/decks/mydeck.apkg
```

## Pipeline mỗi từ

1. **Scrape** — adapter lấy dữ liệu thô (`RawEntry`).
2. **Normalize** — `normalizeToGlobalDict` chuẩn hóa + dedup nghĩa.
3. **Enrich** (chỉ khi `--enrich`) — `enrichWord` (Gemini) bổ khuyết synonym/antonym/image_search_query.
4. **Ảnh** — `resolveWordImage` (image-pipeline): query thông minh + đa nguồn + validate + AI Vision.
5. **Upsert** — ghi `global_dictionary`. Từ đã tồn tại → merge tags, chỉ bổ sung ảnh nếu đang thiếu.

## Lưu ý

- **Selector HTML có thể đổi.** Oxford/Longman/Vocabulary.com — nếu adapter trả rỗng hàng loạt, kiểm tra lại selector trong `sources/*.ts`.
- **Quizlet** chống scraping mạnh; cấu trúc JSON nhúng thay đổi thường xuyên.
- **Checkpoint** lưu trong `.checkpoints/` — xóa file checkpoint để cào lại từ đầu.
- **Rate limit** — chạy chậm (1.5-4s/request mỗi domain), tự backoff khi bị chặn. Nên chạy ban đêm.
- File `.checkpoints/`, `decks/`, `*.apkg` đã được gitignore.
