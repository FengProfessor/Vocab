# Nghiên cứu: Free tier · Gói nhóm · Demo tra AI (câu → từ)

**Ngày:** 2026-07-13  
**NotebookLM:** `0db50b1d-d751-4e6a-a2fb-82c5da8533da` (LingoPro Freemium + AI Sentence Lookup Research)  
**Hiện trạng code:** `FREE_AI_DAILY_LIMIT = 5`; chưa có cap lưu từ; gói nhóm đã có trên `/upgrade` (2–20 ghế, 39k–59k/ghế).

---

## 1. Free: có nên “lưu 300 từ/tháng”?

### Benchmark freemium (SaaS)

| Chỉ số | Mốc thường |
|--------|------------|
| Free → paid conversion | **2–5%** (cohort 1 năm) |
| Free tier “quá hào phóng” | Conversion thấp vì free đã đủ |
| Free tier “quá chặt” | Acquisition + activation chết |
| Hybrid tốt | **Usage limit + feature gate** (a16z, case SaaS 2024–26) |

Nguồn tư duy: a16z freemium optimization; capacity-based freemium (Dropbox/Mailchimp style); hybrid usage+feature cho conversion cao hơn feature-only.

### Tính cho LingoPro

| Nhịp học | Từ mới/ngày | ≈ /tháng | Ý nghĩa |
|----------|-------------|----------|---------|
| Nhẹ (giữ streak) | 3–5 | 90–150 | Đủ “vòng lặp” FSRS |
| Vừa | 7–10 | 210–300 | Học sinh nghiêm túc |
| Nặng | 15+ | 450+ | Power user / ôn thi |

**300 từ/tháng ≈ 10 từ mới/ngày** — **đủ dùng cho user nghiêm túc**, nên:

- ✅ Tốt nếu mục tiêu = **top-of-funnel lớn**, ít chặn sớm, convert bằng **AI + lộ trình + nhóm**.
- ⚠️ Yếu làm paywall “lưu từ” vì nhiều user **không bao giờ chạm 300**.
- ❌ Không nên dùng 300 làm **giới hạn duy nhất** để ép Pro.

### Khuyến nghị (không ship code limit trong phiên này)

**Option A — Ưu tiên (khuyến nghị ship sau):**  
Hybrid 3 lớp:

| Lớp | Free | Pro |
|-----|------|-----|
| Lưu từ **mới**/tháng | **150** (hoặc 200) | Unlimited |
| Tra AI (đã có) | **5 lượt/ngày** | Unlimited |
| Feature | Lộ trình A0–A1 | Full + nói/viết AI |

**150/tháng ≈ 5 từ/ngày** — khớp chặng 5–8 phút; user “nghiêm” chạm cap tuần 3–4 → upsell tự nhiên.

**Option B — 300/tháng:** chỉ khi phase growth (PR, school pilot) cần free hào phóng 3–6 tháng, rồi siết về 150.

**Option C — Lifetime 300 (tổng kho free):** **không khuyến nghị** — giết long-tail free, giảm referral/teacher trial.

### Soft gate (bắt buộc nếu bật cap)

- Cảnh báo 80% / 100% quota.
- Từ đã lưu vẫn **ôn FSRS được** (chỉ chặn **lưu mới**).
- Copy upsell: “Bạn đã lưu 150/150 từ tháng này — Pro để lưu không giới hạn.”

---

## 2. Gói nhóm trên thanh toán

### Đã có sẵn (backend + `/upgrade`)

- `orderKind: 'group'`, seats 2–20  
- Giá ghế: 2→59k · 3→49k · 4→45k · 5+→**39k**/ghế/tháng  
- Mỗi ghế = tier **Pro** (`GROUP_PLAN`)  
- Invite code, propagate entitlement  

### Landing trước đây

Chỉ Free + Pro → user **không biết** có gói nhóm.

### Đã chỉnh landing (phiên này)

Thêm cột **Nhóm** → link `/upgrade` (chọn mode group trên trang upgrade).

### Gợi ý UX tiếp

- Deep link: `/upgrade?mode=group` (nếu chưa có query, thêm 1 dòng state init).
- Landing teacher (`/for-teachers`) nhấn group/seat mạnh hơn cá nhân.

---

## 3. Demo “tra AI” nên là gì? (câu → bóc từ)

### Đối thủ / pattern thị trường

| Sản phẩm | Hành vi cốt lõi |
|----------|-----------------|
| **Readlang** | Bôi từ trong câu → nghĩa + lưu deck |
| **Language Reactor** | Phụ đề: click từ, nghĩa theo ngữ cảnh |
| **LingQ** | Import text, click unknown words, status known/learning |
| **KOReader AI dict** | Định nghĩa **trong context** đoạn đang đọc |
| Clozemaster / WordUp | Từ trong câu / media, không chỉ definition |

Insight user (Reddit/language learning): *“không muốn chỉ nhồi câu — muốn biết từng từ trong câu nghĩa gì.”*

### Tra từ đơn vs tra câu (LingoPro)

| Mode | Chi phí | Wow factor | Rủi ro free |
|------|---------|------------|-------------|
| Dict/Wiktionary 1 từ | Thấp | Trung bình | Thấp — **demo landing hiện tại OK** |
| AI 1 từ (nghĩa VI + ví dụ) | Trung | Cao | Cần quota |
| **AI cả câu → token + bóc vocab** | Cao hơn | **Rất cao** (khác Anki) | Abuse nếu free unlimited |

### Spec demo đề xuất (landing + in-app)

**Tên UX:** “Dán 1 câu → bóc từ cần học”

**Input demo (landing, không login):**
1. Ô text: dán/gõ **1 câu tiếng Anh** (max ~120 ký tự public demo).  
2. Sample chips sẵn (3 câu THPT/IELTS).  
3. Nút **Phân tích**.

**Output (1 màn):**
```
Câu: "Despite the setback, she remained resilient."
├─ Nghĩa cả câu (1 dòng VI)
└─ Từ nổi bật (3–6 thẻ):
    resilient  /rɪˈzɪliənt/  adj  · kiên cường
    [Lưu] → /auth
    setback · despite (optional, phụ)
```

**Pipeline kỹ thuật gợi ý:**
1. **Tokenizer** (rule: split word, bỏ stopword cơ bản) — free/cheap.  
2. **Rank** từ “đáng học” (CEFR ≥ B1 hoặc không có trong known list) — rule + dict.  
3. **AI chỉ khi cần:** gloss câu + chọn top 3 lemma khó — 1 call/câu.  
4. Public demo: **cache 5–10 câu mẫu** (không tốn AI mỗi view); free-form input → rate limit IP + optional AI.

**Phân tầng quyền:**

| | Guest landing | Free | Pro |
|--|---------------|------|-----|
| Demo câu mẫu (cache) | ✅ unlimited | ✅ | ✅ |
| Dán câu free-form | 1–2/ngày (hoặc tắt) | 5/ngày (= AI quota) | Unlimited |
| Lưu thẻ từ câu | → signup | Theo cap lưu | Unlimited |

### Không làm trên demo public

- Full essay / đoạn dài (spam cost).  
- Dịch máy cả trang.  
- “AI chat” mở — lệch positioning tra–lưu–ôn.

### Khác biệt positioning vs Anki

> Anki: bạn tự tạo thẻ.  
> LingoPro: **gặp câu thật → bóc từ → lịch FSRS**.

Demo câu là **aha moment** mạnh hơn “tra 1 từ dictionary”.

---

## 4. Quyết định đề xuất (product)

| Hạng mục | Quyết định | Ưu tiên |
|----------|------------|---------|
| Bỏ “không cần thẻ” | ✅ Đã làm landing | P0 |
| Hiện gói nhóm trên landing | ✅ Card + link `/upgrade` | P0 |
| Free lưu 300/tháng | **Không ưu tiên 300**; ship **150/tháng** + soft gate khi enforce | P1 |
| Free AI | Giữ **5/ngày** | — |
| Demo AI landing | **Câu → bóc 3–5 từ** (cache mẫu trước, free-form sau) | P1 |
| Deep link group upgrade | `?mode=group` | P2 |

---

## 5. Việc code đã làm phiên này

1. Xóa trust “Không cần thẻ / Không thẻ” trên homepage.  
2. Pricing 3 cột: Free · Pro · **Nhóm**.  
3. Báo cáo này + NotebookLM research task (import khi `status` = done).

## 6. Chưa làm (cần confirm)

- [ ] Enforce cap lưu từ (migration + API `/api/words`)  
- [ ] UI demo “dán câu” trên landing  
- [ ] `upgrade?mode=group` auto-select  
- [ ] Import nguồn NLM khi research xong  

---

*Cập nhật khi import NLM xong: bổ sung citation nguồn deep research vào mục 1–3.*
