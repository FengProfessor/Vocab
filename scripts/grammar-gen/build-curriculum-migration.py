"""Tạo migration chỉ thêm 62 chủ đề mới từ out/*.json, giữ nguyên 25 buổi cũ.

Chạy: python scripts/grammar-gen/build-curriculum-migration.py
"""

import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROADMAP = json.loads((HERE / "roadmap.json").read_text(encoding="utf-8"))
DEST = HERE.parents[1] / "supabase" / "migrations" / "20260923_seed_grammar_curriculum.sql"


def sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_json(value: object) -> str:
    raw = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if "$grammar$" in raw:
        raise ValueError("Unexpected SQL delimiter in curriculum")
    return f"$grammar${raw}$grammar$::jsonb"


def main() -> None:
    if len(ROADMAP) != 62 or len({topic["slug"] for topic in ROADMAP}) != 62:
        raise ValueError("Expected exactly 62 unique curriculum topics")
    lines = [
        "-- Bổ sung lộ trình A0–B2, giữ nguyên 25 buổi cũ và mọi tiến độ hiện có.",
        "-- Dữ liệu nguồn: scripts/grammar-gen/out/*.json; tạo lại bằng build-curriculum-migration.py.",
        "-- Nội dung AI hỗ trợ biên soạn, cần tiếp tục giám định sư phạm theo từng bài.",
        "begin;",
    ]
    for topic in ROADMAP:
        slug = topic["slug"]
        lesson = json.loads((HERE / "out" / f"{slug}.json").read_text(encoding="utf-8"))
        if lesson["slug"] != slug or lesson["order"] != topic["order"]:
            raise ValueError(f"Metadata mismatch: {slug}")
        sections = lesson["sections"]
        examples = [item for item in sections.get("examples", []) if item.get("en")]
        exercises = lesson.get("exercises", [])
        if not sections.get("definition") or len(examples) < 3:
            raise ValueError(f"Insufficient source content: {slug}")
        for exercise in exercises:
            if not (exercise.get("question") or exercise.get("q")):
                raise ValueError(f"Exercise missing question: {slug}")
            if "correct_answer" not in exercise and "answer" not in exercise:
                raise ValueError(f"Exercise missing answer: {slug}")
        lines.extend([
            f"-- {topic['order']:02d}. {slug}",
            "insert into public.grammar_topics (slug, title, title_vi, level, order_index)",
            f"values ({sql_text(slug)}, {sql_text(lesson['title'])}, {sql_text(lesson['title_vi'])}, {sql_text(lesson['level'])}, {lesson['order']})",
            "on conflict (slug) do nothing;",
            "insert into public.grammar_lessons (topic_id, title, theory_vi, examples, sections, exercises, source, order_index)",
            f"select t.id, {sql_text(lesson['title_vi'])}, {sql_text(sections['definition'])}, {sql_json(examples)}, {sql_json(sections)}, {sql_json(exercises)}, 'ai-golden', {lesson['order']}",
            f"from public.grammar_topics t where t.slug = {sql_text(slug)}",
            "and not exists (select 1 from public.grammar_lessons l where l.topic_id = t.id);",
        ])
    lines.append("commit;")
    DEST.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[GrammarCurriculum] {len(ROADMAP)} topics -> {DEST} ({DEST.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
