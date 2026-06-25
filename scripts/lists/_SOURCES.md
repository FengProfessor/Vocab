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

## Batch 2 — nguồn mở rộng (added 2026-06-18)

| File | Phạm vi | Tool | Net-new |
|------|---------|------|---------|
| `oxford-5000-b2c1.txt` | Oxford 5000 tầng B2-C1 (parse từ PDF chính thức OUP) | Agent + WebSearch | 174 |
| `nawl-academic.txt` | NAWL — New Academic Word List (Browne et al.) | Agent + WebSearch | 160 |
| `gre-highfreq.txt` | GRE high-freq (Magoosh 1000 + Barron's 333), C1-C2 | Agent + WebSearch | 212 |
| `sat-highfreq.txt` | SAT high-freq (digital SAT era, PrepScholar) | Agent + WebSearch | 209 |
| `toefl-ibt.txt` | TOEFL iBT academic high-freq | Agent + WebSearch | 129 |
| `academic-collocations.txt` | Academic collocations (ACL-style) | Gemini 2.5-pro | 242 |
| `idioms-common.txt` | Idiom/fixed expressions B2-C1 (phrase 3-7 từ) | Gemini 2.5-pro | 278 |

Sources: `_staging/published-lists.sources.md`, `_staging/us-exams.sources.md`.

> ⚠️ NGSL bỏ — 360/360 từ đã trùng oxford-3000 (general-service list = core, không net-new).
> ⚠️ Không kỳ thi nào (ETS/College Board/OUP) phát hành wordlist "chính thức" official số lượng; list = tổng hợp prep uy tín. Oxford 5000 headwords parse từ PDF chính thức (definitions vẫn © OUP, chỉ lấy headword làm seed).
> Idiom 3-7 từ: scraper Oxford miss → fallback AI enrich.

**Tổng 2 batch: 2216 net-new** (812 + 1404).

## Batch 3 — ESP + NLM grounded (added 2026-06-18)

NLM CLI query grounded trên notebook **"English Vocabulary in Use Advanced"** (26 nguồn Cambridge/Barron's/Oxford uy tín).

| File | Phạm vi | Tool | Net-new |
|------|---------|------|---------|
| `pte-academic.txt` | PTE Academic high-freq + collocations | Gemini 2.5-pro | 384 |
| `esp-legal.txt` | Legal English ESP (contracts/litigation/IP) | Gemini 2.5-pro | 240 |
| `esp-medical.txt` | Medical/healthcare ESP | Gemini 2.5-pro | 165 |
| `collocations-advanced.txt` | English Collocations in Use Advanced | **NLM CLI** (grounded) | 149 |
| `ielts-topic-vocab.txt` | IELTS topic (crime/tourism/art/food/sport/money) | **NLM CLI** (grounded) | 147 |
| `phrasal-verbs-advanced.txt` | Phrasal verbs B2-C1 | Gemini 2.5-pro | 116 |
| `ielts-speaking-idioms.txt` | Idioms For IELTS Speaking band 7+ | **NLM CLI** (grounded) | 99 |

Notebook ID: `4b09c19e-ff19-4f1b-adf5-5407ad31ab12`. Query UTF-8: `PYTHONIOENCODING=utf-8 nlm notebook query <id> "<q>"`.

**TỔNG 3 batch: 3516 net-new** (812 + 1404 + 1300), 18 list mới.

## Batch 4 — ESP finance + IELTS task1 + linking (added 2026-06-18)

| File | Phạm vi | Tool | Net-new |
|------|---------|------|---------|
| `esp-finance.txt` | Banking/investment/accounting/economics ESP | Gemini 2.5-pro | 141 |
| `ielts-task1-data.txt` | IELTS Writing Task 1: mô tả trend/chart/data | Gemini 2.5-pro | 122 |
| `linking-words.txt` | Linking words/discourse markers formal | **NLM CLI** (grounded) | 53 |

> Bỏ: `coca-academic` (2 net-new — trùng AWL/oxford), `academic-verbs` (14 — trùng), `nlm-toeic-barron` (NLM grounding hỏng, source = scan → trả meta-word junk). Độ trùng cao = coverage đã rộng (bão hòa lành mạnh).

**TỔNG 4 batch: 3832 net-new** (812+1404+1300+316), 21 list mới.

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
