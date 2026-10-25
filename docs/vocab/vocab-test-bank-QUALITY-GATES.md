# Vocab test bank — Quality gates (chống vòng “prompt gắt mà vẫn rác”)

## Bài học 3 vòng AG

| Gate | Per-file verify | Global verify | Dict/gold sense |
|------|-----------------|---------------|-----------------|
| Schema / 5 type / answer∈opts | ✅ | ✅ | — |
| Blacklist string template | ✅ | ✅ | — |
| Frame monopoly **trong 1 file** | ✅ (>15%) | — | — |
| Frame monopoly **cả bank** | ❌ lách bằng 4–6 frame | ✅ **bắt buộc** | — |
| Cloze cùng 3 distractor cả bank | ❌ | ✅ | — |
| Colo pattern `V something carefully` | ❌ một phần | ✅ | — |
| **Nghĩa VI đúng lemma** | ❌ | ✅ vs **gold keywords** | nguồn chân lý |

**Kết luận:** `prompt gắt + verify file` **không đủ**.  
Ship chỉ khi: **per-file ∧ global ∧ (gold sense | dict)**.

---

## Lệnh chuẩn (R1 verbs / mọi bank sau này)

```bash
# 1) Từng file (schema + blacklist + frame local)
for f in data/vocab-test-bank/p2-r1-final-verbs/*.json; do
  node scripts/verify-vocab-test-bank.mjs "$f" || exit 1
done

# 2) Cả thư mục (nghĩa đúng + diversity global)
node scripts/verify-vocab-test-bank-global.mjs data/vocab-test-bank/p2-r1-final-verbs --per-file
```

Kỳ vọng bank FINAL hiện tại: **global FAIL** (wrong_meaning + frame monopoly) — đúng.

---

## Gold sense

- File: `data/vocab-test-bank/gold/verb-sense-keywords-vi.json`
- Rule: `meaning_mcq.answer` **hoặc** `sense_vi` phải chứa **≥1** keyword của lemma.
- Ví dụ: `cancel` → `hủy` · `offer` → `đề nghị|chào|…` · `skate` → `trượt`

Mở rộng POS khác: thêm `gold/noun-sense-…` sau.

---

## Pipeline gen an toàn (khuyến nghị product)

```
lemma list
   + gold sense_vi (bắt buộc, từ dict/gold file — KHÔNG để model bịa)
   + collocation_gold (bảng cố định hoặc dict)
        ↓
   agent CHỈ viết: stem câu / distractor / error quote
   (không được đổi sense_vi / answer meaning)
        ↓
   per-file verify
        ↓
   global verify  ← chặn diversity + wrong meaning
        ↓
   spot 10 random mid/end
        ↓
   ACCEPT import
```

Nếu vẫn free-gen nghĩa → lặp lại sai `cancel = chuẩn bị`.

---

## Definition of Done (bank verbs)

- [ ] `VERIFY_OK` mọi file  
- [ ] `VERIFY_GLOBAL_OK=true`  
- [ ] `meaning.wrong === 0` với full gold coverage  
- [ ] Spot human 10 lemma (đầu / giữa / cuối)  
- [ ] Handback ghi 2 lệnh verify + số wrong_meaning=0  

Không Done nếu chỉ có per-file pass.
