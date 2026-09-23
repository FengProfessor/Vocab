"""Sửa bài tập đầu A2 bị sinh bằng tiếng Việt và công thức lạc chủ đề."""

import json
from pathlib import Path


path = Path(__file__).resolve().parent / "out" / "countable-uncountable.json"
lesson = json.loads(path.read_text(encoding="utf-8"))
lesson["sections"]["formula"] = {
    "rows": [
        {"form": "Danh từ đếm được số ít", "base": "a/an + danh từ", "note": "a book, an apple"},
        {"form": "Danh từ đếm được số nhiều", "base": "số đếm + danh từ số nhiều", "note": "two books, three apples"},
        {"form": "Danh từ không đếm được", "base": "some + danh từ; đơn vị + of + danh từ", "note": "some water, two bottles of water"},
    ],
    "note": "Không đặt số đếm hoặc a/an trực tiếp trước water, advice, furniture. Muốn đếm, dùng đơn vị như bottle hoặc piece.",
}
lesson["exercises"][:12] = [
    {"type": "mcq", "q": "I have ___ book on my desk.", "opts": ["a", "an", "two"], "answer": "a", "fb": "Book đếm được, số ít và bắt đầu bằng âm /b/: a book."},
    {"type": "mcq", "q": "She has ___ apples.", "opts": ["two", "a", "an"], "answer": "two", "fb": "Apples là số nhiều, có thể đi với số đếm two."},
    {"type": "fill", "q": "I need ___ water. (some / a)", "answer": ["some"], "fb": "Water không đếm được; dùng some water."},
    {"type": "fill", "q": "We bought two ___ of water. (bottle)", "answer": ["bottles"], "fb": "Đếm đơn vị chứa nước: two bottles of water."},
    {"type": "tf", "q": "Is this standard English? 'I have two books.'", "answer": True, "fb": "Books đếm được và ở dạng số nhiều sau two."},
    {"type": "tf", "q": "Is this standard English? 'She gave me two advices.'", "answer": False, "fb": "Advice không đếm được; nói two pieces of advice."},
    {"type": "error", "q": "Which sentence is incorrect?", "opts": ["I have two books.", "I need some water.", "I need a water to drink."], "answer": "I need a water to drink.", "fb": "Khi nói chung về nước, dùng some water; a water chỉ có thể dùng trong ngữ cảnh gọi một phần nước."},
    {"type": "mcq", "q": "Which noun is usually uncountable?", "opts": ["furniture", "chair", "table"], "answer": "furniture", "fb": "Furniture không có dạng số nhiều furnitures trong tiếng Anh chuẩn."},
    {"type": "fill", "q": "She gave me a piece of ___. (advice / advices)", "answer": ["advice"], "fb": "Advice không thêm -s; dùng a piece of advice."},
    {"type": "mcq", "q": "Choose the natural phrase for two individual items of furniture.", "opts": ["two pieces of furniture", "two furnitures", "two furniture"], "answer": "two pieces of furniture", "fb": "Đếm furniture qua đơn vị: two pieces of furniture."},
    {"type": "fill", "q": "There are three ___ on the table. (apple)", "answer": ["apples"], "fb": "Sau three, danh từ đếm được apple chuyển thành apples."},
    {"type": "mcq", "q": "Which phrase names one apple?", "opts": ["an apple", "a apple", "one apples"], "answer": "an apple", "fb": "Apple bắt đầu bằng âm nguyên âm: an apple."},
]
path.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
