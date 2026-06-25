# US Standardized-Exam High-Frequency Vocabulary — Sources

> Áp dụng khi: scraper nạp 3 list từ vựng thi chuẩn hóa Mỹ (TOEFL iBT / SAT / GRE).
> Mục đích: ghi nguồn gốc + caveat để truy vết chất lượng. KHÔNG có "official numbers" — không kỳ thi nào công bố danh sách từ vựng chính thức.

## Nguyên tắc chung (caveat lớn nhất)

- **ETS (TOEFL, GRE) và College Board (SAT) KHÔNG phát hành danh sách từ vựng chính thức.** Mọi list "high-frequency" đều do nhà luyện thi uy tín **biên soạn lại** từ đề thật + corpus học thuật. Các con số (327, 333, 1000...) là của từng nhà xuất bản, KHÔNG phải số liệu chính thức của ETS/College Board.
- Tất cả từ đã chuẩn hóa: lowercase, single word, dedupe trong từng file.

## TOEFL iBT — `toefl-ibt.raw.txt` (327 từ)

- https://blog.prepscholar.com/toefl-vocabulary-list — "327 Most Important Words to Study". PrepScholar cross-reference nhiều list (gồm Magoosh) + corpus học thuật; chọn từ xuất hiện thường xuyên. Đây là list nền.
- https://magoosh.com/toefl/the-toefl-academic-word-list-research/ — Magoosh đóng gói lại **Academic Word List (AWL)** của Averil Coxhead cho TOEFL. AWL là cơ sở học thuật được trích dẫn nhiều nhất cho từ vựng academic reading/listening.
- https://magoosh.com/toefl/toefl-vocabulary-words-from-official-toefl-ibt-tests/ — Magoosh đối chiếu từ xuất hiện trong đề TOEFL iBT thật.
- **Caveat**: TOEFL test khả năng đoán nghĩa academic theo ngữ cảnh, không test định nghĩa đơn lẻ. List nghiêng về academic high-utility (vd `hypothesis`, `framework`, `fluctuate`), có lẫn vài từ C1-C2 (vd `cacophony`, `indefatigable`).

## SAT (Digital SAT era) — `sat-highfreq.raw.txt` (329 từ)

- https://blog.prepscholar.com/sat-vocabulary-words — "384 SAT Vocab Words You Must Know". List nền; đã **lược bỏ ~55 từ quá cơ bản** (vd `common`, `cause`, `avoid`, `borrow`) để giữ đúng tầng "high-frequency tested vocab" → còn 329.
- https://www.collegetransitions.com/blog/sat-vocabulary-words-list/ — College Transitions "455 best Digital SAT vocab words 2026" (đối chiếu chéo).
- https://collegeprep.uworld.com/blog/top-100-vocabulary-words-you-need-for-digital-sat-reading-passages/ — UWorld top words cho Digital SAT Reading.
- **Caveat**: Digital SAT (từ 2024) **không test định nghĩa cô lập** — test "Words in Context" / đoán nghĩa academic high-utility (vd `underscore`, `empirical`, `anomalous`). Không có official list; College Board lặp lại một pool từ tần suất cao tương tự mỗi năm. List này thiên academic-functional hơn là từ "đao to búa lớn".

## GRE — `gre-highfreq.raw.txt` (348 từ)

- https://s3.amazonaws.com/magoosh.resources/magoosh-gre-1000-words_oct01.pdf — Magoosh GRE 1000 Words. Đã trích **300 từ tầng "Common (High-frequency) Words"** (section đầu PDF, ranh giới rõ trước "Basic Words"/"Advanced Words"). Đây là core C1-C2.
- https://www.scribd.com/document/361576692/quizlet-333-HFW-GRE và https://www.vocabulary.com/lists/182204 — **Barron's 333 High-Frequency GRE Words** (kinh điển). Lấy raw qua mirror cộng đồng: https://github.com/Xatta-Trone/gre-words-collection (`word-list/006 Barrons-333.csv`). Đã chọn ~50 từ Barron's-only kinh điển (vd `abate`, `abscond`, `loquacious`, `truculence`, `obviate`) trộn vào core Magoosh → tổng 348.
- https://magoosh.com/gre/best-and-worst-gre-word-lists/ — Magoosh đánh giá list nào đáng học (khuyến nghị Magoosh/Manhattan/Barron's là "best", cảnh báo Barron's bản cũ nhồi nhét thiếu ngữ cảnh).
- **Caveat**: GRE test reasoning C1-C2 cao (Text Completion / Sentence Equivalence). Đây là phần advanced nhất trong 3 list (vd `perfunctory`, `salubrious`, `equanimity`). Barron's-333 từ Scribd/Vocabulary.com bị chặn fetch trực tiếp (content filter / 403) → dùng mirror GitHub cộng đồng; mirror CSV chỉ trả ~274 từ (cắt cuối bảng chữ cái) nên core chính lấy từ Magoosh PDF cho đầy đủ.

## Ghi chú kỹ thuật cho scraper

- 3 file đều là **1 dòng CSV duy nhất**, lowercase, không heading/markdown.
- Có overlap tự nhiên giữa 3 kỳ thi (vd `ambiguous`, `arduous`, `paucity`, `volatile`, `recalcitrant`) — nếu cần global dedupe thì làm ở tầng merge, KHÔNG sửa từng file.
- Nguồn chặn fetch: Vocabulary.com (content filter), yolasite PDF (403). Đã thay bằng PrepScholar/Magoosh (text mở) + GitHub mirror.
