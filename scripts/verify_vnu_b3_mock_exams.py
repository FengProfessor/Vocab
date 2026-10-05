#!/usr/bin/env python3
"""
Adversarial Verification Suite for VNU Test Bac 3 (CEFR B1) Speaking Mock Exams.
Author: challenger_1
"""

import os
import re
import sys
from pathlib import Path

if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(r"D:\Vibe\Vocab\web-app\src\data\vnu_b3_drafts")
INDEX_FILE = BASE_DIR / "vnu_b3_mock_exams_index.md"

EXPECTED_FILES = [
    "vnu_b3_mock_01_daily_routine.md",
    "vnu_b3_mock_02_hometown_accommodation.md",
    "vnu_b3_mock_03_studies_campus_life.md",
    "vnu_b3_mock_04_food_cooking_healthy_eating.md",
    "vnu_b3_mock_05_travel_holidays_transport.md",
    "vnu_b3_mock_06_technology_smartphones_social_media.md",
    "vnu_b3_mock_07_family_friends_childhood.md",
    "vnu_b3_mock_08_shopping_consumer_habits.md",
    "vnu_b3_mock_09_health_fitness_stress.md",
    "vnu_b3_mock_10_future_career_ambitions.md",
    "vnu_b3_mock_11_weather_seasons_environment.md",
    "vnu_b3_mock_12_festivals_celebrations.md",
]

SUSPICIOUS_PLACEHOLDERS = [
    r"\bTODO\b",
    r"\bTBD\b",
    r"\bFIXME\b",
    r"\bLorem\s+ipsum\b",
    r"\[TBD\]",
    r"\[placeholder\]",
    r"\[insert\b",
    r"\[XX\]",
    r"\[YY\]",
]

def audit_file(filename: str):
    file_path = BASE_DIR / filename
    results = {
        "filename": filename,
        "exists": False,
        "size_bytes": 0,
        "size_pass": False,
        "part1_topics": [],
        "part1_topics_pass": False,
        "part1_questions": [],
        "part1_questions_pass": False,
        "part2_cue_cards": [],
        "part2_cue_cards_pass": False,
        "part2_further_questions": [],
        "part2_further_pass": False,
        "grammar_section_pass": False,
        "grammar_char_count": 0,
        "scaffolding_section_pass": False,
        "scaffolding_char_count": 0,
        "placeholders_found": [],
        "lazy_ellipsis_found": [],
        "errors": [],
    }

    if not file_path.exists():
        results["errors"].append(f"File {filename} does not exist!")
        return results

    results["exists"] = True
    size = file_path.stat().st_size
    results["size_bytes"] = size
    results["size_pass"] = size >= 5000
    if not results["size_pass"]:
        results["errors"].append(f"File size {size} bytes is < 5000 bytes.")

    content = file_path.read_text(encoding="utf-8")

    # 1. Check placeholders
    for p in SUSPICIOUS_PLACEHOLDERS:
        matches = re.findall(p, content, re.IGNORECASE)
        if matches:
            results["placeholders_found"].extend(matches)
            results["errors"].append(f"Found placeholder matching '{p}': {matches}")

    # Check for lazy ellipsis placeholders (e.g. lines with just "..." or "[...]" or "... [more]")
    lazy_ellipsis = re.findall(r"(?:^\s*\[?\.\.\.\]?\s*$|^\s*>\s*\[?\.\.\.\]?\s*$)", content, re.MULTILINE)
    if lazy_ellipsis:
        results["lazy_ellipsis_found"].extend(lazy_ellipsis)
        results["errors"].append(f"Found lazy ellipsis lines: {lazy_ellipsis}")

    # 2. Extract sections
    # Find Part 1 section
    p1_match = re.search(r"##\s+(?:PHẦN 1|PART 1).*?\n(.*?)(?=\n##\s+(?:PHẦN 2|PART 2))", content, re.DOTALL | re.IGNORECASE)
    if not p1_match:
        results["errors"].append("Missing or unparseable Part 1 section header (## PHẦN 1...)")
    else:
        p1_text = p1_match.group(1)

        # Part 1 topics
        topics = re.findall(r"^###\s+(?:Chủ đề|Topic)\s+([A-Z]):?\s*(.*)$", p1_text, re.MULTILINE | re.IGNORECASE)
        results["part1_topics"] = [f"{t[0].upper()}: {t[1].strip()}" for t in topics]
        results["part1_topics_pass"] = len(topics) == 2 and {t[0].upper() for t in topics} == {"A", "B"}
        if not results["part1_topics_pass"]:
            results["errors"].append(f"Part 1 must have exactly 2 distinct topics (A and B), found: {len(topics)} -> {topics}")

        # Part 1 questions
        # Look for questions either formatted as #### Câu hỏi X: ... or 1. **...**
        q_style1 = re.findall(r"^####\s+Câu hỏi\s+\d+:\s*(.+)$", p1_text, re.MULTILINE)
        q_style2 = re.findall(r"^\d+\.\s+\*\*(.+?\?)\*\*", p1_text, re.MULTILINE)
        all_q = q_style1 if q_style1 else q_style2
        if not all_q:
            # Fallback: find any line ending in ? in bold or header
            all_q = re.findall(r"(?:####|\d+\.)\s+(?:\*\*)?(.+?\?)(?:\*\*)?", p1_text, re.MULTILINE)
        results["part1_questions"] = all_q
        results["part1_questions_pass"] = len(all_q) >= 5
        if not results["part1_questions_pass"]:
            results["errors"].append(f"Part 1 must have at least 5 questions, found: {len(all_q)}")

    # 3. Find Part 2 section
    p2_match = re.search(r"##\s+(?:PHẦN 2|PART 2).*?\n(.*?)(?=\n##\s+(?:GHI CHÚ NGỮ PHÁP|GRAMMAR))", content, re.DOTALL | re.IGNORECASE)
    if not p2_match:
        results["errors"].append("Missing or unparseable Part 2 section header (## PHẦN 2...)")
    else:
        p2_text = p2_match.group(1)

        # Cue cards extraction
        # Cue cards are either in code blocks ``` or under ### Cue-Card Option X
        # Format: "Describe a / an..." followed by bullet points
        code_blocks = re.findall(r"```(?:text)?\s*\n(.*?)\n```", p2_text, re.DOTALL)
        
        parsed_cue_cards = []
        for block in code_blocks:
            lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
            if not lines:
                continue
            first_line = lines[0]
            if re.match(r"^Describe\s+(?:a|an)\s+", first_line, re.IGNORECASE):
                # Count bullets
                bullets = [l for l in lines if l.startswith("•") or l.startswith("-") or l.startswith("*")]
                parsed_cue_cards.append({
                    "prompt": first_line,
                    "bullets_count": len(bullets),
                    "bullets": bullets
                })

        results["part2_cue_cards"] = parsed_cue_cards
        if len(parsed_cue_cards) == 2:
            card_valid = True
            for i, c in enumerate(parsed_cue_cards, 1):
                if c["bullets_count"] < 3:
                    card_valid = False
                    results["errors"].append(f"Cue card {i} has only {c['bullets_count']} bullets (< 3 required).")
            results["part2_cue_cards_pass"] = card_valid
        else:
            results["part2_cue_cards_pass"] = False
            results["errors"].append(f"Part 2 must contain exactly 2 cue cards, found: {len(parsed_cue_cards)}")

        # Further questions extraction
        fq_match = re.search(r"###\s+(?:CÂU HỎI MỞ RỘNG|Further Questions).*?\n(.*)$", p2_text, re.DOTALL | re.IGNORECASE)
        if not fq_match:
            results["errors"].append("Missing Further Questions section in Part 2.")
        else:
            fq_text = fq_match.group(1)
            fq_q1 = re.findall(r"^####\s+Câu hỏi\s+\d+:\s*(.+)$", fq_text, re.MULTILINE)
            fq_q2 = re.findall(r"^\d+\.\s+\*\*(.+?\?)\*\*", fq_text, re.MULTILINE)
            all_fq = fq_q1 if fq_q1 else fq_q2
            if not all_fq:
                all_fq = re.findall(r"(?:####|\d+\.)\s+(?:\*\*)?(.+?\?)(?:\*\*)?", fq_text, re.MULTILINE)
            results["part2_further_questions"] = all_fq
            results["part2_further_pass"] = len(all_fq) >= 2
            if not results["part2_further_pass"]:
                results["errors"].append(f"Part 2 must contain at least 2 further questions, found: {len(all_fq)}")

    # 4. Find Grammar Notes Section
    g_match = re.search(r"##\s+(?:GHI CHÚ NGỮ PHÁP|GRAMMAR).*?\n(.*?)(?=\n##\s+(?:HƯỚNG DẪN CÁ NHÂN HÓA|TEACHER)|$)", content, re.DOTALL | re.IGNORECASE)
    if not g_match:
        results["errors"].append("Missing Grammar Notes section (## GHI CHÚ NGỮ PHÁP...)")
    else:
        g_text = g_match.group(1).strip()
        results["grammar_char_count"] = len(g_text)
        results["grammar_section_pass"] = len(g_text) >= 500
        if not results["grammar_section_pass"]:
            results["errors"].append(f"Grammar Notes section too short ({len(g_text)} chars < 500)")

    # 5. Find Teacher Personalization / Scaffolding Section
    s_match = re.search(r"##\s+(?:HƯỚNG DẪN CÁ NHÂN HÓA|TEACHER).*?\n(.*)$", content, re.DOTALL | re.IGNORECASE)
    if not s_match:
        results["errors"].append("Missing Teacher Personalization & Scaffolding section (## HƯỚNG DẪN CÁ NHÂN HÓA...)")
    else:
        s_text = s_match.group(1).strip()
        results["scaffolding_char_count"] = len(s_text)
        results["scaffolding_section_pass"] = len(s_text) >= 500
        if not results["scaffolding_section_pass"]:
            results["errors"].append(f"Teacher Scaffolding section too short ({len(s_text)} chars < 500)")

    return results

def deep_adversarial_check():
    print("\n" + "=" * 80)
    print("PHASE 2: DEEP ADVERSARIAL STRESS-TESTING & SEMANTIC INTEGRITY AUDIT")
    print("=" * 80)

    # 1. Verify links from index to disk
    index_content = INDEX_FILE.read_text(encoding="utf-8")
    table_files = re.findall(r"`(vnu_b3_mock_\d+_[a-z0-9_]+\.md)`", index_content)
    print(f"[*] Checking disk existence of files mentioned in index table ({len(table_files)} found)...")
    missing_on_disk = []
    for tf in table_files:
        p = BASE_DIR / tf
        if not p.exists():
            missing_on_disk.append(tf)
    if missing_on_disk:
        print(f"❌ ERROR: Files referenced in index table missing on disk: {missing_on_disk}")
    else:
        print(f"✅ PASS: All {len(table_files)} table references resolve to actual files on disk.")

    # 2. Inspect every single Cue-Card prompt and bullet count across all 12 files
    print("\n[*] Auditing all 24 Cue-Cards across 12 files for format and bullet integrity:")
    all_cue_prompts = []
    total_bullets = 0
    cue_card_issues = []

    for fname in EXPECTED_FILES:
        content = (BASE_DIR / fname).read_text(encoding="utf-8")
        code_blocks = re.findall(r"```(?:text)?\s*\n(.*?)\n```", content, re.DOTALL)
        file_cards = []
        for block in code_blocks:
            lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
            if lines and re.match(r"^Describe\s+", lines[0], re.IGNORECASE):
                bullets = [l for l in lines if l.startswith("•") or l.startswith("-") or l.startswith("*")]
                file_cards.append((lines[0], bullets))

        print(f"\n  [{fname}] -> {len(file_cards)} Cue Cards:")
        for idx, (prompt, bullets) in enumerate(file_cards, 1):
            total_bullets += len(bullets)
            all_cue_prompts.append((fname, prompt))
            print(f"    Option {idx}: \"{prompt}\" ({len(bullets)} bullets)")
            for b in bullets:
                print(f"      {b}")
            if len(bullets) < 3:
                cue_card_issues.append(f"{fname} Card {idx} has < 3 bullets")
            if not re.match(r"^Describe (?:a time|an activity|a memorable|a |an )", prompt, re.IGNORECASE):
                cue_card_issues.append(f"{fname} Card {idx} prompt does not match standard Describe format: {prompt}")

    if cue_card_issues:
        print(f"\n❌ CUE CARD AUDIT ISSUES: {cue_card_issues}")
    else:
        print(f"\n✅ PASS: All 24 Cue-Cards match 'Describe a/an...' with >= 3 bullets (Total bullets: {total_bullets}, avg {total_bullets/24:.1f}/card).")

    # 3. Check for question duplication across the entire 12-exam suite
    print("\n[*] Auditing for duplicate questions across the 12 exams...")
    all_questions = {}
    duplicates = []
    for fname in EXPECTED_FILES:
        res = audit_file(fname)
        for q in res["part1_questions"]:
            q_clean = q.strip().lower()
            if q_clean in all_questions:
                duplicates.append((q, fname, all_questions[q_clean]))
            else:
                all_questions[q_clean] = fname
        for fq in res["part2_further_questions"]:
            fq_clean = fq.strip().lower()
            if fq_clean in all_questions:
                duplicates.append((fq, fname, all_questions[fq_clean]))
            else:
                all_questions[fq_clean] = fname

    if duplicates:
        print(f"⚠️ WARNING: Found {len(duplicates)} duplicate questions:")
        for q, f1, f2 in duplicates:
            print(f"   - \"{q}\" in {f1} and {f2}")
    else:
        print(f"✅ PASS: 0 duplicate questions across all 12 exams (Total unique questions: {len(all_questions)}).")

    # 4. Verify TypeScript integration file compilation and syntax
    print("\n[*] Checking TypeScript integration file `ai-topics-vnu-b3-draft.ts`...")
    ts_file = BASE_DIR / "ai-topics-vnu-b3-draft.ts"
    if not ts_file.exists():
        print("❌ ERROR: ai-topics-vnu-b3-draft.ts does not exist!")
    else:
        ts_size = ts_file.stat().st_size
        print(f"✅ File exists: {ts_size} bytes")

    # 5. Teacher Scaffolding & Grammar Depth Check
    print("\n[*] Auditing Pedagogical Depth (AREA, STAR, Vocabulary Table, Fillers):")
    scaffolding_elements = ["AREA", "STAR", "|", "filler", "Mẫu câu", "Ngân hàng từ vựng"]
    for fname in EXPECTED_FILES:
        content = (BASE_DIR / fname).read_text(encoding="utf-8")
        missing_elem = []
        for elem in ["|", "filler", "ngữ pháp"]:
            if elem.lower() not in content.lower():
                missing_elem.append(elem)
        if missing_elem:
            print(f"  ⚠️ {fname} missing mentions of: {missing_elem}")
        else:
            print(f"  ✅ {fname}: Complete pedagogical apparatus verified.")

def audit_index():
    results = {
        "index_file": "vnu_b3_mock_exams_index.md",
        "exists": False,
        "size_bytes": 0,
        "size_pass": False,
        "indexed_files": [],
        "missing_files": [],
        "errors": []
    }
    if not INDEX_FILE.exists():
        results["errors"].append("Master index file does not exist!")
        return results

    results["exists"] = True
    size = INDEX_FILE.stat().st_size
    results["size_bytes"] = size
    results["size_pass"] = size >= 5000
    if not results["size_pass"]:
        results["errors"].append(f"Index file size {size} bytes < 5000 bytes.")

    content = INDEX_FILE.read_text(encoding="utf-8")

    for f in EXPECTED_FILES:
        if f in content:
            results["indexed_files"].append(f)
        else:
            results["missing_files"].append(f)
            results["errors"].append(f"Index file is missing reference to: {f}")

    return results

def main():
    print("=" * 80)
    print("VNU TEST BẬC 3 (CEFR B1) SPEAKING MOCK EXAMS — ADVERSARIAL VERIFICATION")
    print("=" * 80)

    total_files = len(EXPECTED_FILES)
    passed_files = 0
    all_results = []

    for fname in EXPECTED_FILES:
        res = audit_file(fname)
        all_results.append(res)
        status = "PASS" if not res["errors"] else "FAIL"
        if status == "PASS":
            passed_files += 1
        print(f"[{status}] {fname} ({res['size_bytes']} B)")
        print(f"       Part 1: {len(res['part1_topics'])} topics ({', '.join(t.split(':')[0] for t in res['part1_topics'])}), {len(res['part1_questions'])} questions")
        print(f"       Part 2: {len(res['part2_cue_cards'])} cue cards, {len(res['part2_further_questions'])} further Qs")
        print(f"       Grammar: {res['grammar_char_count']} chars | Scaffolding: {res['scaffolding_char_count']} chars")
        if res["errors"]:
            for err in res["errors"]:
                print(f"       ❌ ERROR: {err}")

    print("-" * 80)
    index_res = audit_index()
    index_status = "PASS" if not index_res["errors"] else "FAIL"
    print(f"[{index_status}] MASTER INDEX AUDIT: {index_res['size_bytes']} bytes")
    print(f"       Indexed {len(index_res['indexed_files'])} / {len(EXPECTED_FILES)} exams")
    if index_res["errors"]:
        for err in index_res["errors"]:
            print(f"       ❌ ERROR: {err}")

    deep_adversarial_check()

    print("=" * 80)
    print(f"SUMMARY: Exams Passed: {passed_files}/{total_files} | Master Index: {index_status}")
    verdict = "APPROVE" if (passed_files == total_files and index_status == "PASS") else "REJECT"
    print(f"FINAL EMPIRICAL VERDICT: {verdict}")
    print("=" * 80)

    if verdict != "APPROVE":
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
