"""Thay bài tập lạc chủ đề trong ba bài A0/A1 bằng câu đúng cấp độ."""

import json
from pathlib import Path


OUT = Path(__file__).resolve().parent / "out"
EXERCISES = {
    "adjectives-basic": [
        {"type": "mcq", "q": "She has a ___ dress.", "opts": ["beautiful", "beautifully", "beauty"], "answer": "beautiful", "fb": "Trước danh từ dress dùng tính từ beautiful."},
        {"type": "mcq", "q": "The soup smells ___.", "opts": ["delicious", "deliciously", "delight"], "answer": "delicious", "fb": "Sau động từ nối smells dùng tính từ delicious."},
        {"type": "fill", "q": "I am ___ today. (happy / happily)", "answer": ["happy"], "fb": "Sau am dùng tính từ happy."},
        {"type": "mcq", "q": "Choose the correct sentence.", "opts": ["She is tired.", "She is tiredly.", "She tired is."], "answer": "She is tired.", "fb": "Be + tính từ: She is tired."},
        {"type": "fill", "q": "This is a ___ book. (new / newly)", "answer": ["new"], "fb": "Trước danh từ book dùng tính từ new."},
        {"type": "mcq", "q": "The flowers look ___.", "opts": ["nice", "nicely", "niceness"], "answer": "nice", "fb": "Look là động từ nối ở đây, sau đó dùng tính từ nice."},
        {"type": "fill", "q": "The room is ___. (small / smallly)", "answer": ["small"], "fb": "Sau is dùng tính từ small."},
        {"type": "mcq", "q": "Which phrase describes a big house?", "opts": ["a big house", "a house big", "a bigly house"], "answer": "a big house", "fb": "Tính từ big đứng trước danh từ house."},
    ],
    "articles": [
        {"type": "mcq", "q": "I have ___ book.", "opts": ["a", "an", "the"], "answer": "a", "fb": "Book bắt đầu bằng âm phụ âm; nhắc lần đầu dùng a."},
        {"type": "mcq", "q": "She has ___ apple.", "opts": ["an", "a", "some"], "answer": "an", "fb": "Apple bắt đầu bằng âm nguyên âm; dùng an."},
        {"type": "fill", "q": "He is ___ teacher. (a / an)", "answer": ["a"], "fb": "Teacher bắt đầu bằng âm /t/; dùng a."},
        {"type": "mcq", "q": "I saw a dog. ___ dog was black.", "opts": ["The", "A", "An"], "answer": "The", "fb": "Đã nhắc a dog rồi, lần sau dùng the dog."},
        {"type": "fill", "q": "This is ___ orange. (a / an)", "answer": ["an"], "fb": "Orange bắt đầu bằng âm nguyên âm; dùng an."},
        {"type": "mcq", "q": "Choose the correct phrase.", "opts": ["an umbrella", "a umbrella", "the umbrella for the first mention"], "answer": "an umbrella", "fb": "Umbrella bắt đầu bằng âm nguyên âm; lần đầu nhắc dùng an umbrella."},
        {"type": "fill", "q": "Please close ___ door. (the / a; both people know which door)", "answer": ["the"], "fb": "Hai người đều biết cánh cửa nào nên dùng the."},
        {"type": "mcq", "q": "She bought a pen. Where is ___ pen now?", "opts": ["the", "a", "an"], "answer": "the", "fb": "Chiếc bút đã được xác định ở câu trước."},
    ],
    "modals-ability": [
        {"type": "mcq", "q": "I ___ swim.", "opts": ["can", "cans", "can to"], "answer": "can", "fb": "Can + động từ nguyên thể swim."},
        {"type": "mcq", "q": "She can ___ English.", "opts": ["speak", "speaks", "to speak"], "answer": "speak", "fb": "Sau can dùng speak, không thêm -s hoặc to."},
        {"type": "fill", "q": "He ___ ride a bike. (can / cans)", "answer": ["can"], "fb": "Can không đổi theo chủ ngữ he."},
        {"type": "mcq", "q": "Choose the negative sentence.", "opts": ["I cannot swim.", "I not can swim.", "I can not to swim."], "answer": "I cannot swim.", "fb": "Phủ định của can là cannot hoặc can't."},
        {"type": "fill", "q": "___ you help me? (Can / Cans)", "answer": ["Can"], "fb": "Câu hỏi: Can + you + động từ nguyên thể?"},
        {"type": "mcq", "q": "Can Mai sing? Choose the short positive answer.", "opts": ["Yes, she can.", "Yes, she cans.", "Yes, she is."], "answer": "Yes, she can.", "fb": "Trả lời ngắn với can: Yes, she can."},
        {"type": "fill", "q": "They ___ play football. (can / cans)", "answer": ["can"], "fb": "Với they vẫn dùng can."},
        {"type": "mcq", "q": "Which sentence asks about ability?", "opts": ["Can you cook?", "You can cook?", "Do can you cook?"], "answer": "Can you cook?", "fb": "Đưa can lên trước chủ ngữ để hỏi."},
    ],
}


def main() -> None:
    for slug, exercises in EXERCISES.items():
        path = OUT / f"{slug}.json"
        lesson = json.loads(path.read_text(encoding="utf-8"))
        lesson["exercises"] = exercises
        path.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[GrammarRepair] {slug}: {len(exercises)} exercises")


if __name__ == "__main__":
    main()
