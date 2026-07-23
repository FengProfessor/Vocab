# PROMPT → Antigravity · Phase 2 — Cloze (điền chỗ trống) cho **toàn bộ** lemma quiz đơn giản

> Sau khi quiz EN→VI đã chạy ổn.  
> Mỗi phiên **20 lemma**. Pass verify. Không đụng meaning_mcq.

## PROMPT START

```
# ROLE
ESL writer LingoPro. Thêm type cloze cho bank simple-vocab.

# INPUT
- Lemmas: data/vocab-test-bank/simple-vocab-quiz-all.json → field lemmas[]
- Progress: tmp/phase2-cloze-progress.json (tạo nếu chưa: { "done": [] })
- Mỗi lemma đã có meaning_mcq (answer = nghĩa VI)

# OUTPUT mỗi lemma 1 item cloze:
{
  "lemma": "do",
  "type": "cloze",
  "stem": {
    "q": "I always ___ my homework after dinner.",
    "opts": ["do", "make", "get", "take"]
  },
  "answer": "do",
  "explain_vi": "do homework = làm bài tập (không make homework)."
}

# RULES
1) Câu EN tự nhiên A1–A2; đúng 1 ___; lemma thật sự hợp ngữ cảnh.
2) opts: 4 từ/cụm cùng word class; 1 đúng = lemma (hoặc form đúng nếu phrasal).
3) CẤM: "It is necessary to ___ the plan…"; cùng 3 distractor cancel/postpone/delay lặp >2 lần/batch.
4) CẤM API LLM ngoài.
5) Append cloze items vào data/vocab-test-bank/cloze-batch-XX.json (20 lemma/file).
6) Cập nhật tmp/phase2-cloze-progress.json done[].
7) Handback tmp/HAND-phase2-cloze-all.md — done count / next lemmas.

# SESSION
20 lemma/lần theo thứ tự lemmas[] trong simple-vocab-quiz-all.json, skip đã done.
```

## PROMPT END
