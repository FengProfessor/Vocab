"""Kiểm tra cấu trúc và in mẫu A0–A1 để giám định nội dung trước khi seed."""

import json
import re
from collections import Counter
from pathlib import Path


HERE = Path(__file__).resolve().parent


def main() -> None:
    roadmap = json.loads((HERE / "roadmap.json").read_text(encoding="utf-8"))
    slugs = [item["slug"] for item in roadmap]
    assert len(slugs) == len(set(slugs)) == 62
    errors: list[str] = []
    total_exercises = 0
    kinds: Counter[str] = Counter()
    for item in roadmap:
        lesson = json.loads((HERE / "out" / f"{item['slug']}.json").read_text(encoding="utf-8"))
        if lesson["slug"] != item["slug"] or lesson["order"] != item["order"]:
            errors.append(f"{item['slug']}: metadata mismatch")
        examples = lesson.get("sections", {}).get("examples", [])
        usage = lesson.get("sections", {}).get("usage", [])
        mistakes = lesson.get("sections", {}).get("mistakes", [])
        exercises = lesson.get("exercises", [])
        if len(examples) < 3 or not exercises:
            errors.append(f"{item['slug']}: insufficient examples or exercises")
        if min(len(usage), len(mistakes)) < 3:
            errors.append(f"{item['slug']}: insufficient micro cards")
        for card_index, card in enumerate(usage[: len(mistakes)], 1):
            if not card.get("en") or not card.get("vi"):
                errors.append(f"{item['slug']} micro card {card_index}: missing bilingual example")
        for card_index, mistake in enumerate(mistakes[: len(usage)], 1):
            if not mistake.get("wrong") or not mistake.get("right") or mistake["wrong"] == mistake["right"]:
                errors.append(f"{item['slug']} micro card {card_index}: invalid grammar contrast")
        total_exercises += len(exercises)
        for index, exercise in enumerate(exercises, 1):
            kind = exercise.get("type", "")
            kinds[kind] += 1
            answer = exercise.get("correct_answer", exercise.get("answer"))
            options = exercise.get("options", exercise.get("opts", []))
            if not exercise.get("question", exercise.get("q")) or answer is None:
                errors.append(f"{item['slug']} exercise {index}: missing stem or answer")
            if kind in ("mcq", "multiple_choice", "error", "error_correction") and (not options or str(answer) not in options):
                errors.append(f"{item['slug']} exercise {index}: invalid options")
            if kind == "fill_blank" and options and str(answer) not in options:
                errors.append(f"{item['slug']} exercise {index}: answer absent from suggestions")
            if options and len({str(option).strip().casefold() for option in options}) != len(options):
                errors.append(f"{item['slug']} exercise {index}: duplicate options")
            if kind in ("fill", "fill_blank") and isinstance(answer, str) and "hoặc" in answer:
                errors.append(f"{item['slug']} exercise {index}: alternatives embedded in answer")
            if kind in ("mcq", "multiple_choice", "fill", "fill_blank", "error"):
                answer_text = " ".join(answer) if isinstance(answer, list) else str(answer)
                stem = str(exercise.get("question", exercise.get("q", "")))
                if re.search(r"[À-ỹ]", answer_text) and not re.search(r"[À-ỹ]", stem):
                    errors.append(f"{item['slug']} exercise {index}: Vietnamese answer in English grammar quiz")
        if item["order"] <= 16:
            definition = lesson["sections"].get("definition", "").replace("**", "")
            print(f"[GrammarAudit] {item['order']:02d} {item['slug']}: {definition[:180]}")
    print(f"[GrammarAudit] topics={len(slugs)} exercises={total_exercises} types={dict(kinds)} errors={len(errors)}")
    for error in errors[:30]:
        print(f"[GrammarAudit] ERROR {error}")
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
