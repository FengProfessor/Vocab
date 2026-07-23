# PROMPT → Antigravity · Teacher pack 62 topic (handout HS + đáp án GV)

> **Copy `PROMPT START` → `PROMPT END`** dán Antigravity (Agent mode, terminal + `.env.local`).  
> Workspace: `D:\Vocab\web-app`.  
> **CẤM** external LLM API.  
> **CẤM** sửa content exercises/examples trong DB (chỉ **export**).  
> Grok chấm: đủ 62 file + index + spot 5 topic.

---

## PROMPT START

```
# ROLE
Tooling engineer LingoPro + trợ lý giáo viên.
Task: xuất **bộ tài liệu in** cho cả **62** chủ điểm ngữ pháp:
1) Handout học sinh (HTML → in PDF)
2) Đáp án giáo viên (Markdown/HTML)
3) Mục lục + script batch một lệnh

# PRODUCT CONTEXT
- App: LingoPro, data `grammar_topics` + `grammar_lessons` (Supabase).
- Content đã ship-ready (R2–R5.1): ~36–42 exercises/topic, examples 12–15, fb VI.
- Builder HTML sẵn: `src/lib/grammar-lesson-pdf.ts` → `buildGrammarLessonPdfHtml`
- Script 1 bài:
  - `node scripts/grammar-a0a2/export-lesson-pdf-preview.mjs [slug]`
    → `tmp/grammar-pdf-{slug}.html` (exerciseCap: 0 = all, withAnswers: true hiện tại)
  - `node scripts/grammar-a0a2/export-teacher-key.mjs [slug1,slug2,...]`
    → `tmp/TEACHER-KEY-sample.md`

# GOAL
Thư mục ổn định (không chỉ tmp rác):

```
tmp/teacher-pack-62/
  README.md                 # hướng dẫn in cho GV
  INDEX.md                  # mục lục 62: level | order | slug | title_vi | n_ex | n_examples | links
  student/                  # handout HS — KHÔNG có đáp án (hoặc đáp án ẩn CSS print)
    01-beginner-articles.html
    ...
  teacher/                  # đáp án GV
    01-beginner-articles-KEY.md
    ALL-KEYS.md             # gộp 62 key (optional nếu file quá lớn → split by level)
  manifest.json             # machine-readable counts
```

Tên file: `{order:02d}-{level}-{slug}.html` (order từ grammar_topics.order_index).

# REQUIREMENTS

## A) Student handout (mỗi topic)
Dùng `buildGrammarLessonPdfHtml` với:
- `withAnswers: false`  ← **quan trọng**: HS không thấy đáp án khi in lớp
- `exerciseCap: 0` (all exercises)
- definition / tips / mistakes / wordbanks / exercises từ DB
- siteUrl: https://lingopro.online
- Footer: LingoPro · slug · level

Nếu API hiện chỉ hỗ trợ withAnswers true: **mở rộng** `grammar-lesson-pdf.ts` + export script cho phép `withAnswers: false` (ẩn answer key section). Minimal diff.

## B) Teacher key (mỗi topic)
Bảng markdown:
| # | type | question (rút ≤80) | answer | fb (rút ≤100) |

Header: title_vi, slug, level, n exercises, ngày xuất.
File `teacher/ALL-KEYS.md` = concat có anchor `#slug`.

## C) Batch script (bắt buộc)
`scripts/grammar-a0a2/export-teacher-pack-62.mjs`

```
node scripts/grammar-a0a2/export-teacher-pack-62.mjs
node scripts/grammar-a0a2/export-teacher-pack-62.mjs --only articles,present-simple
node scripts/grammar-a0a2/export-teacher-pack-62.mjs --out tmp/teacher-pack-62
```

Logic:
1. Load .env.local, Supabase service role
2. SELECT all topics order by level (beginner→intermediate→advanced) rồi order_index
3. Join lessons (examples, exercises, sections)
4. Skip topic không có lesson (log WARN)
5. Write student HTML + teacher MD
6. Write INDEX.md + manifest.json
7. Exit 1 nếu student files < 62 hoặc lesson missing exercises

## D) README (cho GV in)
- Cách mở HTML → Ctrl+P → Save PDF (Chrome)
- student/ = giao HS; teacher/ = chỉ GV
- Không commit secrets; pack nằm tmp/ (gitignore ok) hoặc docs/teacher-pack/ nếu user muốn version — **mặc định tmp/teacher-pack-62/** + script trong repo

## E) Verify script
`scripts/grammar-a0a2/verify-teacher-pack-62.mjs`
PASS khi:
- đúng 62 file student `*.html` (hoặc = số topic có lesson trong DB; nếu DB có đúng 62 lesson thì 62)
- đúng 62 file teacher `*-KEY.md`
- INDEX.md tồn tại, có 62 dòng data
- manifest: mỗi slug n_exercises >= 36, n_examples >= 10
- Spot: 5 slug (articles, personal-pronouns, present-simple, cleft-sentences, conditionals-0-1)
  - HTML chứa string "Answer key" / "Đáp án" section nếu withAnswers false (hoặc section bị display:none + class answers — chấp nhận nếu print CSS ẩn)
  - KEY.md có cột Answer và số dòng ≈ n_exercises

# NEVER
- NEVER UPDATE grammar_lessons / grammar_topics (read-only export)
- NEVER commit .env*
- NEVER external LLM API
- NEVER rm -rf lung tung ngoài out dir
- NEVER claim 62 PDF binary nếu chỉ có HTML (ghi rõ: HTML print-to-PDF)

# OPTIONAL (nếu còn quota)
- CSS print `@media print` tối ưu lề A4
- Zip: `tmp/teacher-pack-62.zip` (PowerShell Compress-Archive)
- Trang index HTML click mở từng bài

# DELIVERABLES
1. `scripts/grammar-a0a2/export-teacher-pack-62.mjs`
2. `scripts/grammar-a0a2/verify-teacher-pack-62.mjs`
3. Patch `grammar-lesson-pdf.ts` + export preview nếu cần withAnswers:false
4. Output `tmp/teacher-pack-62/` đầy đủ sau 1 lệnh export
5. `docs/grammar/AG-TEACHER-PACK-62-REPORT.md` (số file, 5 spot, lệnh chạy)
6. Commit:
```
git add scripts/grammar-a0a2/export-teacher-pack-62.mjs \
  scripts/grammar-a0a2/verify-teacher-pack-62.mjs \
  scripts/grammar-a0a2/export-lesson-pdf-preview.mjs \
  src/lib/grammar-lesson-pdf.ts \
  docs/grammar/AG-TEACHER-PACK-62-REPORT.md \
  docs/PROMPT-antigravity-teacher-pack-62.md
git commit -m "feat(grammar): batch export teacher pack 62 handouts and answer keys"
```
(tmp/ output: không commit binary/html pack trừ khi user yêu cầu)

# HANDBACK

### HANDBACK_GROK_TEACHER_PACK_62
- topics_exported: (N)
- student_html_count / teacher_key_count:
- verify_teacher_pack_62: PASS/FAIL + output
- sample paths (3):
- withAnswers_student: false? (yes/no)
- commit:
- residual:
### END_HANDBACK

# START
1) List 62 slugs from DB  
2) Implement export-teacher-pack-62.mjs (+ withAnswers false)  
3) Run full export  
4) verify-teacher-pack-62.mjs PASS  
5) Report + commit + handback  
```

## PROMPT END

---

## Ghi chú tapho

| | |
|--|--|
| **File** | `docs/PROMPT-antigravity-teacher-pack-62.md` |
| **AG làm** | Batch export 62 handout HS + key GV + verify |
| **Không đụng** | DB content exercises (read-only) |
| **Bạn sau AG** | Paste handback → Grok đếm file + spot 3 HTML |

**Chạy AG:** dán PROMPT START…END · quyền terminal + `.env.local`.
