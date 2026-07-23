# PROMPT → Antigravity · Phase 2 (làm dần) — cloze + error cho verbs

> **Không chặn dạy tối nay.** Phase 2 = nâng bank khi rảnh.  
> Copy `PROMPT START`…`END` khi làm tiếp.  
> **Bắt buộc** pass `verify-vocab-test-bank.mjs` + `verify-vocab-test-bank-global.mjs`.

---

## PROMPT START

```
# ROLE
ESL curriculum writer LingoPro. Task: **chỉ** viết lại type cloze + error cho động từ đã có trong p2-r1-final-verbs (meaning/l2/colo GIỮ NGUYÊN nếu sense đúng gold).

# RULES
1) CẤM API LLM ngoài.
2) sense_vi/meaning_mcq: khớp data/vocab-test-bank/gold/verb-sense-keywords-vi.json — KHÔNG đổi nghĩa.
3) Mỗi phiên chỉ **10 lemma** (file 1 batch).
4) Cloze: câu tự nhiên, lemma thật sự fit; distractor khác nghĩa; CẤM cùng triple cancel|postpone|delay cho >2 lemma/batch.
5) Error: quote SAI thật; answer grammar đúng; irregular past đúng; CẤM khung lặp "very good yesterday" / "without inform" >2 lần/batch.
6) Colo distractor: CẤM "in wrong way|without care|for nothing" — thay bằng collocation sai thật (make/do/prep).
7) Sau batch: merge vào p2-r1-final-verbs (cập nhật 2 type), chạy:
   node scripts/verify-vocab-test-bank.mjs <file>
   node scripts/verify-vocab-test-bank-global.mjs data/vocab-test-bank/p2-r1-final-verbs
8) Handback partial: tmp/HAND-phase2-cloze-error.md — DONE 10 lemma nào, NEXT 10.

# ORDER
Theo p2-verbs-top300.txt từ đầu; skip lemma đã phase2-ok (ghi list trong handback).

# DONE 1 PHIÊN
10 lemma × (cloze+error) chất + verify global vẫn OK (meaning wrong=0).
```

## PROMPT END

---

## Tối nay (đã ship product)

- URL: `/practice/verb-drill`
- Pack: `public/data/tonight-verb-drill.json` (build bằng `node scripts/build-tonight-verb-drill.mjs`)
- Types: meaning + l2 + colo sạch · **không** cloze/error
