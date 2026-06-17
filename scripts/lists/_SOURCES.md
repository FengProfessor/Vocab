# Wordlist sources — provenance

> Nguồn từ vựng nạp cho scraper (`scripts/scrapers/run-scrape.ts --list=<tên>`).
> Định dạng: comma/newline đều được; scraper tự `split(/\r?\n|,/)`, lowercase, dedup.

## Reputable source lists

| File | Phạm vi | Nguồn | Net-new |
|------|---------|-------|---------|
| `oxford-3000.txt` | Core A1-B2 | Oxford 3000 | 2978 |
| `cambridge-c1-advanced.txt` | C1 | Cambridge | 786 |
| `academic-word-list.txt` | AWL | Coxhead AWL | 554 |
| `phrasal-verbs-essential.txt` | Phrasal verbs | — | 177 |
| `business-english-core.txt` | Business core | — | 147 |
| `collocations-common.txt` | Collocations | — | 102 |
| `ielts-academic.txt` | IELTS AWL | Coxhead | ~180 |
| `vstep-b1-b2.txt` | VSTEP B1-B2 | — | ~520 |
| `toeic-600.txt` | TOEIC core | — | ~600 |
| `thpt-quoc-gia-core.txt` | THPT cũ | — | ~280 |

## 2026 enrichment batch (added 2026-06-18)

Sinh bằng Gemini 2.5-pro CLI + Agent research. Đã sanitize + dedup vs MỌI list cũ
(chỉ giữ từ NET-NEW) qua `_staging/sanitize-merge.mjs`. Raw lưu `_staging/*.raw.txt`.

| File | Phạm vi | Tool | Net-new |
|------|---------|------|---------|
| `toeic-2026.txt` | TOEIC 2023-26: office/finance/logistics/HR/contracts + collocations | Gemini 2.5-pro | 218 |
| `ielts-band7-8.txt` | IELTS Academic band 7.0-8.5: env/tech/edu/health/society collocations | Gemini 2.5-pro | 310 |
| `business-collocations-2026.txt` | Business collocations 2-3 từ (meetings/negotiation/finance/PM) | Gemini 2.5-pro | 119 |
| `thpt-2026-reform.txt` | Bộ mới 2026 — THPT GDPT-2018 reform (B1-B2): 40Q/50', cloze notice/flyer, paragraph-arrange, collocations + discourse markers | Agent + WebSearch | 165 |

> ⚠️ Bộ 2026: KHÔNG có wordlist chính thức của Bộ GD; tổng hợp từ đề minh họa 2025 + prep uy tín (prepedu/zim/ila/izone). Con số "30% B1-B2" là ƯỚC TÍNH của bên luyện thi, không phải số liệu Bộ.

Chi tiết nguồn bộ 2026: `_staging/thpt-2026-reform.sources.md`.

## Nạp vào DB (global_dictionary)

```bash
cd web-app
# scrape + enrich 1 list (Oxford scraper, concurrency 3)
npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=toeic-2026 --enrich --concurrency=3
npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=ielts-band7-8 --enrich --concurrency=3
# dry-run trước để xem số từ
npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=ielts-band7-8 --dry-run
```

> Collocation 2-3 từ: scraper Oxford/Longman có thể miss → fallback AI enrich (`/api/dictionary/ai-lookup`).
