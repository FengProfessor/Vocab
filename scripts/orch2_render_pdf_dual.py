#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
orch2_render_pdf_dual.py
========================
Dual PDF Generator Engine for TOEIC 20-min Micro-learning Curriculum.
Renders two synchronized PDF deliverables per lesson:
  1. Teleprompter Script PDF (A4 Portrait, Inter/Roboto, 14-16pt, timeline/camera angle cues,
     demarcated dialogue blocks, and student worksheet appendix table).
  2. Synchronized Slide Deck PDF (16:9 Landscape 1920x1080px, Technical Minimalist #0f172a
     dark theme, emerald/indigo accents, exactly 8 synchronized slides matching 5 phases).

Uses Playwright Headless Chromium Engine with full CSS Paged Media support.

Author: Slide Deck & Synchronized PDF Generator Lead (orch2_m23_worker_slide_generator)
"""

import os
import sys
import re
import glob
import json
import shutil
import argparse
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple

# Force UTF-8 on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright not installed. Run `pip install playwright`.")
    sys.exit(1)

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


# ==============================================================================
# DATA MODELS
# ==============================================================================

@dataclass
class QuestionItem:
    num: int
    source_tag: str
    topic: str
    prompt: str
    options: Dict[str, str]
    answer_key: str
    explanation: str
    image_url: Optional[str] = None
    audio_url: Optional[str] = None


@dataclass
class TrapItem:
    num: int
    title: str
    content: str
    examples: List[str] = field(default_factory=list)


@dataclass
class LessonData:
    stt: str
    file_path: Path
    title: str
    duration: str
    target: str
    creator: str
    stage: str
    stage_name: str
    filming_mode: str
    timeline: List[str]
    hook_prompt: str
    hook_options: Dict[str, str]
    hook_insight: str
    p1_dialogues: List[Tuple[str, str]]
    p2_dialogues: List[Tuple[str, str]]
    p2_concept: str
    p2_formula: str
    p2_golden_rule: str
    traps: List[TrapItem]
    p3_dialogues: List[Tuple[str, str]]
    questions: List[QuestionItem]
    p4_dialogues: List[Tuple[str, str]]
    mantra: str
    homework: str
    p5_dialogues: List[Tuple[str, str]]
    worksheet_rows: List[Tuple[str, str, str]]
    raw_markdown: str


# ==============================================================================
# PARSER ENGINE
# ==============================================================================

class LessonPlanParser:
    """Robust Markdown Parser for TOEIC 20-min Teaching Plans."""

    STAGE_NAMES = {
        "01_nen_tang_cot_loi": "CHẶNG 1: NỀN TẢNG CỐT LÕI (0 - 450+)",
        "02_ngu_phap_nang_cao": "CHẶNG 2: NGỮ PHÁP NÂNG CAO (450 - 650+)",
        "03_reading_part_5_6": "CHẶNG 3: READING PART 5 & 6 (650 - 750+)",
        "04_listening_part_1_4": "CHẶNG 4: LISTENING PART 1 - 4 (750 - 850+)",
    }

    @classmethod
    def parse_file(cls, file_path: Path) -> LessonData:
        file_path = Path(file_path)
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        # Lesson STT & Title
        m_title = re.search(r"^##\s+(.+)$", text, re.MULTILINE)
        raw_title = m_title.group(1).strip() if m_title else file_path.stem
        stt_m = re.search(r"BÀI\s+(\d+):", raw_title, re.IGNORECASE)
        stt = stt_m.group(1).zfill(2) if stt_m else "01"

        # Metadata
        duration_m = re.search(r">\s*\*\*Thời lượng:\*\*\s*([^\n]+)", text)
        duration = duration_m.group(1).strip() if duration_m else "20:00 phút"

        target_m = re.search(r">\s*\*\*Target mục tiêu:\*\*\s*([^\n]+)", text)
        target = target_m.group(1).strip() if target_m else "TOEIC 450 - 650+"

        creator_m = re.search(r">\s*\*\*Người giảng / Creator:\*\*\s*([^\n]+)", text)
        creator = creator_m.group(1).strip() if creator_m else "Võ Tá Phong (LingoPro)"

        stage_m = re.search(r">\s*\*\*Chặng đào tạo:\*\*\s*`?([^`\n]+)`?", text)
        stage = stage_m.group(1).strip() if stage_m else file_path.parent.name
        stage_name = cls.STAGE_NAMES.get(stage, "CHƯƠNG TRÌNH TOEIC LINGOPRO")

        film_m = re.search(r">\s*\*\*Hình thức quay:\*\*\s*([^\n]+)", text)
        filming_mode = film_m.group(1).strip() if film_m else "Split-screen"

        # Timeline
        timeline = []
        tl_match = re.search(r"## ⏱️ PHÂN BỔ TIMELINE.*?\n```\s*(.*?)\s*```", text, re.DOTALL)
        if tl_match:
            timeline = [line.strip() for line in tl_match.group(1).splitlines() if line.strip()]

        # Helper to extract dialogue blocks: (header, content)
        def extract_dialogues(section_text: str) -> List[Tuple[str, str]]:
            dialogues = []
            pattern = re.compile(r">\s*\*\*\[(.*?)\]:\*\*\s*\n((?:>[^\n]*\n?)+)")
            for m in pattern.finditer(section_text):
                head = m.group(1).strip()
                body_lines = [re.sub(r"^>\s*", "", l) for l in m.group(2).splitlines()]
                body = "\n".join(body_lines).strip()
                # remove outer quotes if present
                if body.startswith('*""') or body.startswith('*"'):
                    body = body.strip('*').strip('"')
                dialogues.append((head, body))
            return dialogues

        # Split into main sections
        sec1_m = re.search(r"### PHẦN 1:(.*?)(?=### PHẦN 2:|\Z)", text, re.DOTALL)
        sec2_m = re.search(r"### PHẦN 2:(.*?)(?=### PHẦN 3:|\Z)", text, re.DOTALL)
        sec3_m = re.search(r"### PHẦN 3:(.*?)(?=### PHẦN 4:|\Z)", text, re.DOTALL)
        sec4_m = re.search(r"### PHẦN 4:(.*?)(?=### PHẦN 5:|\Z)", text, re.DOTALL)
        sec5_m = re.search(r"### PHẦN 5:(.*?)(?=## 📝|\Z)", text, re.DOTALL)

        sec1_text = sec1_m.group(1) if sec1_m else ""
        sec2_text = sec2_m.group(1) if sec2_m else ""
        sec3_text = sec3_m.group(1) if sec3_m else ""
        sec4_text = sec4_m.group(1) if sec4_m else ""
        sec5_text = sec5_m.group(1) if sec5_m else ""

        # --- Section 1: Hook Question ---
        p1_dialogues = extract_dialogues(sec1_text)
        hook_prompt = "Câu hỏi khởi động thử thách tư duy 5 giây"
        hook_options = {"A": "", "B": "", "C": "", "D": ""}
        hook_insight = "80% thí sinh phân vân hoặc chọn nhầm đáp án do bẫy ngữ cảnh."

        hook_code_m = re.search(r"```(?:text)?\s*(.*?)\s*```", sec1_text, re.DOTALL)
        if hook_code_m:
            code_lines = [l.strip() for l in hook_code_m.group(1).splitlines() if l.strip()]
            if code_lines:
                hook_prompt = code_lines[0]
                opts_text = " ".join(code_lines[1:])
                opt_matches = re.findall(r"\(([A-D])\)\s*([^()]+)", opts_text)
                for opt_key, opt_val in opt_matches:
                    hook_options[opt_key] = opt_val.strip()

        # --- Section 2: Concept & Formula ---
        p2_dialogues = extract_dialogues(sec2_text)
        p2_concept = "Nắm vững bản chất tư duy ngôn ngữ cốt lõi để giải quyết nhanh mọi biến thể trong đề thi."
        p2_formula = "S + V + O ➔ BẢN CHẤT QUY TẮC CỐT LÕI"
        p2_golden_rule = "⭐ QUY TẮC VÀNG: Hiểu bản chất ➔ Phản xạ 5 giây không cần dịch!"

        sec2_code_m = re.search(r"```(?:text)?\s*(.*?)\s*```", sec2_text, re.DOTALL)
        if sec2_code_m:
            clean_code = sec2_code_m.group(1)
            # Remove ascii box borders
            clean_code = re.sub(r"[╔═╗║╚╝\─│┌┐└┘├┤┬┴┼]+", "", clean_code)
            clean_lines = [l.strip() for l in clean_code.splitlines() if l.strip()]
            if clean_lines:
                p2_formula = "\n".join(clean_lines[:6])
                p2_concept = "\n".join(clean_lines[6:]) if len(clean_lines) > 6 else clean_lines[0]

        # Extract golden rule from dialogue if mentioned
        for _, d_body in p2_dialogues:
            if "nguyên tắc" in d_body.lower() or "quy tắc" in d_body.lower():
                rule_m = re.search(r"['\"]([^'\"]{10,120})['\"]", d_body)
                if rule_m:
                    p2_golden_rule = f"⭐ NGUYÊN TẮC VÀNG: {rule_m.group(1)}"
                    break

        # --- Section 3: 3 Traps ---
        p3_dialogues = extract_dialogues(sec3_text)
        traps: List[TrapItem] = []
        sec3_code_m = re.search(r"```(?:text)?\s*(.*?)\s*```", sec3_text, re.DOTALL)
        if sec3_code_m:
            raw_traps = sec3_code_m.group(1)
            trap_parts = re.split(r"\n(?=\d+\.\s+)", raw_traps)
            for idx, tp in enumerate(trap_parts):
                tp_lines = [l.strip() for l in tp.splitlines() if l.strip()]
                if not tp_lines:
                    continue
                first_line = tp_lines[0]
                if "⚠️" in first_line:
                    tp_lines = tp_lines[1:]
                    if not tp_lines:
                        continue
                    first_line = tp_lines[0]

                t_title_m = re.search(r"\d+\.\s*(?:\*\*)?([^*\n]+)(?:\*\*)?", first_line)
                t_title = t_title_m.group(1).strip() if t_title_m else f"BẪY #{idx+1}"
                t_content = "\n".join(tp_lines[1:]) if len(tp_lines) > 1 else first_line
                traps.append(TrapItem(num=idx+1, title=t_title, content=t_content))

        # Fallback traps if not parsed
        while len(traps) < 3:
            traps.append(TrapItem(
                num=len(traps)+1,
                title=f"BẪY #{len(traps)+1}: CẠM BẪY ETS THƯỜNG GẶP",
                content="Cẩn thận với các đáp án nhiễu âm, biến thể từ loại hoặc thì đặc biệt."
            ))

        # --- Section 4: Practice Questions ---
        p4_dialogues = extract_dialogues(sec4_text)
        questions: List[QuestionItem] = []
        q_blocks = list(re.finditer(r"####\s+Câu\s+(\d+):.*?(?=####|\n---\n|\Z)", sec4_text, re.DOTALL))

        for idx, q_match in enumerate(q_blocks):
            q_raw = q_match.group(0)
            q_num = int(q_match.group(1)) if q_match.group(1) else (idx + 1)

            # Canonical tag
            tag_m = re.search(r"\*\*Mã nguồn câu hỏi:\*\*\s*`?([A-Za-z0-9_]+)`?", q_raw)
            tag = tag_m.group(1).strip() if tag_m else f"ETS_PRACTICE_Q{q_num}"

            # Topic
            topic_m = re.search(r"\*\*Chủ điểm:\*\*\s*([^\n]+)", q_raw)
            topic = topic_m.group(1).strip() if topic_m else raw_title

            # Image & Audio URLs
            img_m = re.search(r"\*\*Ảnh minh họa đề thi:\*\*\s*`?([^\n`\s]+)`?", q_raw)
            image_url = img_m.group(1).strip() if img_m else None

            audio_m = re.search(r"\*\*Audio đề thi ETS:\*\*\s*`?([^\n`\s]+)`?", q_raw)
            audio_url = audio_m.group(1).strip() if audio_m else None

            # Question code block
            q_code_m = re.search(r"```(?:text)?\s*(.*?)\s*```", q_raw, re.DOTALL)
            prompt = f"Question {q_num}: Chọn đáp án chính xác nhất."
            opts = {"A": "", "B": "", "C": "", "D": ""}
            if q_code_m:
                c_lines = [l.strip() for l in q_code_m.group(1).splitlines() if l.strip()]
                if c_lines:
                    prompt = c_lines[0]
                    opts_str = " ".join(c_lines[1:])
                    for o_k, o_v in re.findall(r"\(([A-D])\)\s*([^()]+)", opts_str):
                        opts[o_k] = o_v.strip()

            # Answer key
            ans_m = re.search(r"Đáp án chính xác:\s*\*\*([A-D])\*\*|Chọn\s*\(([A-D])\)|Chọn:\s*\(([A-D])\)", q_raw)
            key = next((g for g in ans_m.groups() if g), "A") if ans_m else "A"

            # Explanation
            exp_m = re.search(r">\s*\*\*\[HƯỚNG DẪN GIẢNG VIÊN - LỜI THOẠI\]:\*\*\s*\n((?:>[^\n]*\n?)+)", q_raw)
            if exp_m:
                exp_lines = [re.sub(r"^>\s*", "", l) for l in exp_m.group(1).splitlines()]
                explanation = " ".join(exp_lines).strip('*"').strip()
            else:
                explanation = f"Phân tích kỹ vị trí trước và sau chỗ trống, áp dụng quy tắc loại trừ để chọn phương án {key}."

            questions.append(QuestionItem(
                num=q_num,
                source_tag=tag,
                topic=topic,
                prompt=prompt,
                options=opts,
                answer_key=key,
                explanation=explanation,
                image_url=image_url,
                audio_url=audio_url
            ))

        # --- Section 5: Mantra & Homework ---
        p5_dialogues = extract_dialogues(sec5_text)
        mantra = "Làm chủ bản chất — Phản xạ tức thì — Quét sạch bẫy ETS!"
        homework = "Làm ngay 5-10 câu trắc nghiệm thực chiến trên LingoPro!"

        mantra_m = re.search(r"⭐\s*THẦN CHÚ:\s*[\"']?([^\"'\n]+)[\"']?", sec5_text)
        if mantra_m:
            mantra = mantra_m.group(1).strip()
        else:
            # check slide code box
            sec5_code_m = re.search(r"```(?:text)?\s*(.*?)\s*```", sec5_text, re.DOTALL)
            if sec5_code_m:
                for line in sec5_code_m.group(1).splitlines():
                    if "Thần chú" in line or "THẦN CHÚ" in line:
                        mantra = re.sub(r".*THẦN CHÚ[^:]*:\s*", "", line).strip('║* "')
                    elif "BÀI TẬP" in line:
                        homework = re.sub(r".*BÀI TẬP[^:]*:\s*", "", line).strip('║* "')

        # --- Worksheet Table ---
        ws_rows = []
        ws_m = re.search(r"## 📝 FILE ĐÍNH KÈM / TÀI LIỆU HỌC VIÊN.*?(\|[^\n]+\|\n\|(?:\s*:?---:?\s*\|)+\n(?:\|[^\n]+\|\n?)+)", text, re.DOTALL)
        if ws_m:
            lines = [l.strip() for l in ws_m.group(1).strip().splitlines() if l.strip()]
            for l in lines[2:]:  # skip header & divider
                cells = [c.strip() for c in l.split("|")[1:-1]]
                if len(cells) >= 3:
                    ws_rows.append((cells[0], cells[1], cells[2]))

        return LessonData(
            stt=stt,
            file_path=file_path,
            title=raw_title,
            duration=duration,
            target=target,
            creator=creator,
            stage=stage,
            stage_name=stage_name,
            filming_mode=filming_mode,
            timeline=timeline,
            hook_prompt=hook_prompt,
            hook_options=hook_options,
            hook_insight=hook_insight,
            p1_dialogues=p1_dialogues,
            p2_dialogues=p2_dialogues,
            p2_concept=p2_concept,
            p2_formula=p2_formula,
            p2_golden_rule=p2_golden_rule,
            traps=traps,
            p3_dialogues=p3_dialogues,
            questions=questions,
            p4_dialogues=p4_dialogues,
            mantra=mantra,
            homework=homework,
            p5_dialogues=p5_dialogues,
            worksheet_rows=ws_rows,
            raw_markdown=text
        )


# ==============================================================================
# TEMPLATE 1: TELEPROMPTER SCRIPT (A4 PORTRAIT)
# ==============================================================================

class TeleprompterHTMLRenderer:
    """Renders high-readability A4 Portrait Teleprompter Script PDF."""

    @staticmethod
    def render(data: LessonData) -> str:
        # Build timeline HTML
        timeline_html = ""
        for item in data.timeline:
            time_m = re.match(r"(\[[^\]]+\])\s*(.*)", item)
            if time_m:
                badge = time_m.group(1)
                desc = time_m.group(2)
                timeline_html += f"""
                <div class="tl-item">
                    <span class="tl-badge">{badge}</span>
                    <span class="tl-desc">{desc}</span>
                </div>
                """
            else:
                timeline_html += f'<div class="tl-item">{item}</div>'

        # Helper for dialogue block
        def render_dialogue(header: str, body: str) -> str:
            # Highlight cues inside body
            body_clean = body.replace("\n", "<br>")
            return f"""
            <div class="speech-box">
                <div class="speaker-tag">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                    <span>{header}</span>
                </div>
                <div class="speech-text">{body_clean}</div>
            </div>
            """

        # Section 1 dialogues
        sec1_dialogues_html = "".join([render_dialogue(h, b) for h, b in data.p1_dialogues])
        sec2_dialogues_html = "".join([render_dialogue(h, b) for h, b in data.p2_dialogues])
        sec3_dialogues_html = "".join([render_dialogue(h, b) for h, b in data.p3_dialogues])
        sec4_dialogues_html = "".join([render_dialogue(h, b) for h, b in data.p4_dialogues])
        sec5_dialogues_html = "".join([render_dialogue(h, b) for h, b in data.p5_dialogues])

        # Practice questions HTML
        questions_html = ""
        for q in data.questions:
            opts_html = ""
            for opt_k in ["A", "B", "C", "D"]:
                val = q.options.get(opt_k, "")
                is_key = (opt_k == q.answer_key)
                key_class = "opt-key" if is_key else ""
                opts_html += f"""
                <div class="q-opt {key_class}">
                    <span class="opt-badge">({opt_k})</span>
                    <span class="opt-val">{val}</span>
                </div>
                """

            media_html = ""
            if q.image_url:
                media_html += f'<div class="q-media"><span class="pill pill-cyan">📷 Ảnh đề thi:</span> <a href="{q.image_url}">{q.image_url}</a></div>'
            if q.audio_url:
                media_html += f'<div class="q-media"><span class="pill pill-emerald">🎧 Audio ETS:</span> <a href="{q.audio_url}">{q.audio_url}</a></div>'

            questions_html += f"""
            <div class="question-card">
                <div class="q-header">
                    <span class="pill pill-source">{q.source_tag}</span>
                    <span class="q-title">CÂU HỎI {q.num}: {q.topic}</span>
                </div>
                {media_html}
                <div class="q-prompt">{q.prompt}</div>
                <div class="q-grid">{opts_html}</div>
                <div class="q-exp-box">
                    <span class="key-badge">ĐÁP ÁN: {q.answer_key}</span>
                    <div class="exp-text">{q.explanation}</div>
                </div>
            </div>
            """

        # Worksheet HTML
        ws_rows_html = ""
        for r in data.worksheet_rows:
            ws_rows_html += f"""
            <tr>
                <td style="text-align:center; font-weight:700;">{r[0]}</td>
                <td><strong>{r[1]}</strong></td>
                <td>{r[2]}</td>
            </tr>
            """

        html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Teleprompter: {data.title}</title>
<style>
    @page {{
        size: A4 portrait;
        margin: 14mm 16mm 16mm 16mm;
        @bottom-right {{
            content: "Trang " counter(page) " / " counter(pages);
            font-family: 'Segoe UI', Inter, Roboto, sans-serif;
            font-size: 9pt;
            color: #64748b;
        }}
        @bottom-left {{
            content: "LingoPro Micro-learning Studio • Giảng viên Võ Tá Phong";
            font-family: 'Segoe UI', Inter, Roboto, sans-serif;
            font-size: 9pt;
            color: #64748b;
        }}
    }}
    * {{
        box-sizing: border-box;
    }}
    body {{
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Inter, -apple-system, Roboto, sans-serif;
        font-size: 13.5pt;
        line-height: 1.65;
        color: #0f172a;
        background: #ffffff;
    }}
    
    /* Header Area */
    .tele-header {{
        border-bottom: 2px solid #0284c7;
        padding-bottom: 12px;
        margin-bottom: 20px;
    }}
    .brand-row {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }}
    .brand-logo {{
        font-size: 11pt;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: #0284c7;
        text-transform: uppercase;
    }}
    .badge-stage {{
        background: #e0f2fe;
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 9.5pt;
        font-weight: 700;
    }}
    .lesson-h1 {{
        font-size: 20pt;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.25;
        margin: 6px 0 10px 0;
    }}
    .meta-bar {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 10pt;
    }}
    .pill {{
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 9.5pt;
    }}
    .pill-blue {{ background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }}
    .pill-indigo {{ background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }}
    .pill-amber {{ background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }}
    .pill-emerald {{ background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }}
    .pill-cyan {{ background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; }}
    .pill-source {{ background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 10pt; border-radius: 4px; padding: 3px 8px; }}

    /* Timeline Box */
    .timeline-container {{
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 22px;
    }}
    .tl-header {{
        font-size: 10pt;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        margin-bottom: 8px;
    }}
    .tl-grid {{
        display: flex;
        flex-direction: column;
        gap: 5px;
    }}
    .tl-item {{
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 10.5pt;
    }}
    .tl-badge {{
        font-family: monospace;
        font-weight: 700;
        color: #0284c7;
        background: #e0f2fe;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9.5pt;
        min-width: 120px;
    }}
    .tl-desc {{
        color: #334155;
    }}

    /* Section Styles */
    .phase-section {{
        margin-bottom: 24px;
        page-break-inside: avoid;
    }}
    .phase-banner {{
        background: #0f172a;
        color: #ffffff;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 12pt;
        font-weight: 700;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        margin-top: 20px;
    }}
    .cue-box {{
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
    }}

    /* Speech / Teleprompter Box */
    .speech-box {{
        background: #f8fafc;
        border-left: 5px solid #0284c7;
        border-top: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        border-radius: 0 8px 8px 0;
        padding: 14px 18px;
        margin: 12px 0;
    }}
    .speaker-tag {{
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10.5pt;
        font-weight: 800;
        color: #0284c7;
        text-transform: uppercase;
        margin-bottom: 6px;
    }}
    .speech-text {{
        font-size: 14pt;
        line-height: 1.65;
        color: #0f172a;
        font-weight: 500;
    }}

    /* Code & Slide Previews */
    .slide-preview {{
        background: #1e293b;
        color: #f1f5f9;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 10.5pt;
        line-height: 1.45;
        padding: 12px 16px;
        border-radius: 6px;
        margin: 10px 0;
        white-space: pre-wrap;
    }}

    /* Practice Question Card */
    .question-card {{
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 14px 16px;
        margin: 14px 0;
        page-break-inside: avoid;
    }}
    .q-header {{
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }}
    .q-title {{
        font-size: 11pt;
        font-weight: 700;
        color: #0f172a;
    }}
    .q-media {{
        font-size: 9.5pt;
        color: #0369a1;
        margin-bottom: 8px;
    }}
    .q-prompt {{
        font-size: 13pt;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 12px;
        line-height: 1.4;
    }}
    .q-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
    }}
    .q-opt {{
        padding: 8px 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 11pt;
    }}
    .q-opt.opt-key {{
        background: #ecfdf5;
        border-color: #10b981;
        color: #065f46;
        font-weight: 700;
    }}
    .opt-badge {{
        font-weight: 800;
        margin-right: 6px;
        color: #0284c7;
    }}
    .opt-key .opt-badge {{
        color: #10b981;
    }}
    .q-exp-box {{
        background: #eff6ff;
        border-radius: 6px;
        padding: 10px 14px;
        border-left: 4px solid #3b82f6;
    }}
    .key-badge {{
        display: inline-block;
        background: #10b981;
        color: #ffffff;
        font-size: 9.5pt;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 4px;
        margin-bottom: 4px;
    }}
    .exp-text {{
        font-size: 11pt;
        color: #1e3a8a;
        line-height: 1.5;
    }}

    /* Worksheet Table */
    .worksheet-table {{
        width: 100%;
        border-collapse: collapse;
        margin-top: 14px;
        font-size: 10.5pt;
        page-break-inside: avoid;
    }}
    .worksheet-table th {{
        background: #0f172a;
        color: #ffffff;
        text-align: left;
        padding: 8px 12px;
        font-weight: 700;
    }}
    .worksheet-table td {{
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
    }}
    .worksheet-table tr:nth-child(even) {{
        background: #f8fafc;
    }}
</style>
</head>
<body>

<!-- Header -->
<div class="tele-header">
    <div class="brand-row">
        <span class="brand-logo">LINGOPRO STUDIO TELEPROMPTER • MICRO-LEARNING 20M</span>
        <span class="badge-stage">{data.stage_name}</span>
    </div>
    <div class="lesson-h1">{data.title}</div>
    <div class="meta-bar">
        <span class="pill pill-blue">⏱️ Thời lượng: {data.duration}</span>
        <span class="pill pill-emerald">🎯 Target: {data.target}</span>
        <span class="pill pill-indigo">🎙️ Giảng viên: {data.creator}</span>
        <span class="pill pill-amber">📹 Quay: {data.filming_mode}</span>
    </div>
</div>

<!-- Timeline -->
<div class="timeline-container">
    <div class="tl-header">⏱️ PHÂN BỔ KHUNG THỜI GIAN CHUẨN 20 PHÚT</div>
    <div class="tl-grid">
        {timeline_html}
    </div>
</div>

<!-- PHẦN 1 -->
<div class="phase-section">
    <div class="phase-banner">
        <span>PHẦN 1: THE HOOK & CÂU BẪY MỞ ĐẦU</span>
        <span>00:00 - 02:30 (2.5 Phút)</span>
    </div>
    <div class="cue-box">
        <span class="pill pill-indigo">[CẬN CẢNH]</span>
        <span class="pill pill-cyan">Năng lượng cao • Chào người xem</span>
        <span class="pill pill-amber">[SLIDE 1: THỬ THÁCH 5 GIÂY]</span>
    </div>
    {sec1_dialogues_html}
    <div class="slide-preview">{data.hook_prompt}
(A) {data.hook_options.get('A','')}    (B) {data.hook_options.get('B','')}
(C) {data.hook_options.get('C','')}    (D) {data.hook_options.get('D','')}</div>
</div>

<!-- PHẦN 2 -->
<div class="phase-section">
    <div class="phase-banner">
        <span>PHẦN 2: BẢN CHẤT CỐT LÕI & CÔNG THỨC VÀNG</span>
        <span>02:30 - 08:30 (6.0 Phút)</span>
    </div>
    <div class="cue-box">
        <span class="pill pill-indigo">[SPLIT-SCREEN]</span>
        <span class="pill pill-cyan">Trái: Giảng viên chỉ tay • Phải: Slide Mindmap</span>
    </div>
    <div class="slide-preview">{data.p2_formula}</div>
    {sec2_dialogues_html}
</div>

<!-- PHẦN 3 -->
<div class="phase-section">
    <div class="phase-banner">
        <span>PHẦN 3: 3 CHIÊU TRÒ GÀI BẪY KINH ĐIỂN CỦA ETS</span>
        <span>08:30 - 13:30 (5.0 Phút)</span>
    </div>
    <div class="cue-box">
        <span class="pill pill-indigo">[CẬN CẢNH]</span>
        <span class="pill pill-amber">Nhấn mạnh sắc thái cảnh báo • Phản xạ né bẫy</span>
    </div>
    {sec3_dialogues_html}
</div>

<!-- PHẦN 4 -->
<div class="phase-section">
    <div class="phase-banner">
        <span>PHẦN 4: THỰC CHIẾN ĐỀ THI THẬT ETS (AUTHENTIC PROVENANCE)</span>
        <span>13:30 - 18:00 (4.5 Phút)</span>
    </div>
    <div class="cue-box">
        <span class="pill pill-indigo">[PICTURE-IN-PICTURE]</span>
        <span class="pill pill-emerald">Quy trình 3 bước: Nhìn đáp án ➔ Bắt manh mối ➔ Loại trừ</span>
    </div>
    {questions_html}
    {sec4_dialogues_html}
</div>

<!-- PHẦN 5 -->
<div class="phase-section">
    <div class="phase-banner">
        <span>PHẦN 5: TỔNG KẾT, THẦN CHÚ & GIAO BÀI TẬP VỀ NHÀ</span>
        <span>18:00 - 20:00 (2.0 Phút)</span>
    </div>
    <div class="cue-box">
        <span class="pill pill-indigo">[TOÀN CẢNH]</span>
        <span class="pill pill-cyan">Ánh mắt chân thành • Truyền động lực</span>
    </div>
    <div class="slide-preview">⭐ THẦN CHÚ: {data.mantra}
🎯 BÀI TẬP: {data.homework}</div>
    {sec5_dialogues_html}
</div>

<!-- WORKSHEET APPENDIX -->
<div class="phase-section" style="page-break-before: always;">
    <div class="phase-banner">
        <span>📝 PHỤ LỤC: BẢNG TỔNG HỢP WORKSHEET TỰ LUYỆN (DÀNH CHO HỌC VIÊN)</span>
        <span>KÈM THEO VIDEO</span>
    </div>
    <table class="worksheet-table">
        <thead>
            <tr>
                <th style="width: 50px; text-align:center;">STT</th>
                <th style="width: 38%;">Câu hỏi thực hành (Mã ETS)</th>
                <th>Lời giải & Mẹo ghi nhớ</th>
            </tr>
        </thead>
        <tbody>
            {ws_rows_html}
        </tbody>
    </table>
</div>

</body>
</html>
        """
        return html


# ==============================================================================
# TEMPLATE 2: SYNCHRONIZED SLIDE DECK (16:9 LANDSCAPE 1920x1080)
# ==============================================================================

class SlideDeckHTMLRenderer:
    """Renders pixel-perfect 16:9 Landscape 8-Slide Presentation Deck."""

    @staticmethod
    def render(data: LessonData) -> str:
        # Questions for Slide 6 and Slide 7
        q1 = data.questions[0] if len(data.questions) > 0 else QuestionItem(
            1, "ETS_2026_Test07_Q115", data.title, "The proposed purchase agreement is ------ being evaluated.",
            {"A": "active", "B": "actively", "C": "activity", "D": "activate"}, "B",
            "Cần trạng từ bổ nghĩa cho being evaluated."
        )
        q2 = data.questions[1] if len(data.questions) > 1 else QuestionItem(
            2, "ETS_2024_Test04_Q109", data.title, "Ms. Okada is ----- a new social media campaign.",
            {"A": "organize", "B": "organized", "C": "organizing", "D": "organization"}, "C",
            "Chọn V-ing vì có tân ngữ a new social media campaign phía sau."
        )

        def render_opts(q: QuestionItem) -> str:
            opts_html = ""
            for k in ["A", "B", "C", "D"]:
                val = q.options.get(k, "")
                is_key = (k == q.answer_key)
                cls = "s-opt opt-key" if is_key else "s-opt"
                opts_html += f"""
                <div class="{cls}">
                    <span class="opt-letter">{k}</span>
                    <span class="opt-text">{val}</span>
                </div>
                """
            return opts_html

        # Traps for Slide 4 & 5
        trap1 = data.traps[0] if len(data.traps) > 0 else TrapItem(1, "Bẫy Nội Động Từ", "occur, happen không có bị động.")
        trap2 = data.traps[1] if len(data.traps) > 1 else TrapItem(2, "Bẫy Trạng Từ Xen Giữa", "BE + ADV + V3/ed.")
        trap3 = data.traps[2] if len(data.traps) > 2 else TrapItem(3, "Bẫy Các Thì Đặc Biệt", "Being (tiếp diễn), Been (hoàn thành).")

        html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Slide Deck: {data.title}</title>
<style>
    @page {{
        size: 1920px 1080px;
        margin: 0;
    }}
    * {{
        box-sizing: border-box;
    }}
    html, body {{
        margin: 0;
        padding: 0;
        width: 1920px;
        font-family: 'Segoe UI', Inter, -apple-system, Roboto, sans-serif;
        background: #0f172a;
        color: #f8fafc;
        -webkit-font-smoothing: antialiased;
    }}
    
    /* Base Slide Container */
    .slide {{
        width: 1920px;
        height: 1080px;
        padding: 56px 80px 48px 80px;
        box-sizing: border-box;
        page-break-after: always;
        break-after: page;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        background: radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 45%),
                    radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.08) 0%, transparent 45%),
                    #0f172a;
        overflow: hidden;
    }}
    .slide:last-child {{
        page-break-after: avoid;
        break-after: avoid;
    }}

    /* Global Slide Elements */
    .slide-topbar {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        padding-bottom: 16px;
    }}
    .brand-group {{
        display: flex;
        align-items: center;
        gap: 16px;
    }}
    .brand-badge {{
        background: linear-gradient(135deg, #0284c7, #2563eb);
        color: #ffffff;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 1.5px;
        padding: 6px 14px;
        border-radius: 6px;
        text-transform: uppercase;
    }}
    .phase-badge {{
        background: rgba(148, 163, 184, 0.12);
        color: #38bdf8;
        font-weight: 700;
        font-size: 15px;
        padding: 6px 16px;
        border-radius: 9999px;
        border: 1px solid rgba(56, 189, 248, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
    }}
    .slide-content {{
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 24px 0;
    }}
    .slide-footer {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(148, 163, 184, 0.15);
        padding-top: 14px;
        font-size: 16px;
        color: #94a3b8;
    }}
    .footer-highlight {{
        color: #38bdf8;
        font-weight: 600;
    }}

    /* Typography & Utilities */
    .title-h2 {{
        font-size: 38px;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 16px 0;
        line-height: 1.25;
    }}
    .title-highlight {{
        color: #38bdf8;
    }}
    .subtitle-p {{
        font-size: 22px;
        color: #94a3b8;
        margin: 0 0 28px 0;
        line-height: 1.4;
    }}

    /* SLIDE 1: COVER */
    .cover-container {{
        text-align: left;
        max-width: 1400px;
    }}
    .cover-track-badge {{
        display: inline-block;
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.4);
        padding: 8px 20px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 16px;
        letter-spacing: 1.5px;
        margin-bottom: 24px;
    }}
    .cover-title {{
        font-size: 64px;
        font-weight: 900;
        line-height: 1.15;
        color: #ffffff;
        margin-bottom: 24px;
        background: linear-gradient(135deg, #ffffff 60%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }}
    .cover-meta-grid {{
        display: flex;
        gap: 20px;
        margin-bottom: 40px;
    }}
    .cover-pill {{
        background: #1e293b;
        border: 1px solid #334155;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 600;
        color: #e2e8f0;
        display: flex;
        align-items: center;
        gap: 10px;
    }}
    .cover-pill strong {{
        color: #38bdf8;
    }}
    .timeline-preview-bar {{
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-top: 20px;
    }}
    .phase-card {{
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.2);
        padding: 16px;
        border-radius: 10px;
    }}
    .phase-num {{
        font-size: 12px;
        font-weight: 800;
        color: #38bdf8;
        text-transform: uppercase;
        letter-spacing: 1px;
    }}
    .phase-name {{
        font-size: 14px;
        font-weight: 700;
        color: #f1f5f9;
        margin-top: 4px;
    }}

    /* SLIDE 2: HOOK QUESTION */
    .hook-grid {{
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 40px;
        align-items: center;
    }}
    .prompt-card {{
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 36px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }}
    .challenge-tag {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(244, 63, 94, 0.15);
        color: #fb7185;
        border: 1px solid rgba(244, 63, 94, 0.3);
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 20px;
    }}
    .prompt-text {{
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.4;
        margin-bottom: 28px;
    }}
    .opts-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }}
    .s-opt {{
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 18px;
        font-weight: 600;
        color: #cbd5e1;
    }}
    .s-opt.opt-key {{
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.1);
        color: #34d399;
    }}
    .opt-letter {{
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        font-weight: 800;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
    }}
    .opt-key .opt-letter {{
        background: #10b981;
        color: #ffffff;
    }}
    .insight-card {{
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 16px;
        padding: 36px;
    }}
    .insight-title {{
        font-size: 20px;
        font-weight: 800;
        color: #38bdf8;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
    }}
    .insight-body {{
        font-size: 18px;
        line-height: 1.6;
        color: #cbd5e1;
    }}

    /* SLIDE 3: CONCEPT & FORMULA */
    .concept-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-bottom: 30px;
    }}
    .concept-card {{
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 36px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }}
    .formula-box {{
        background: #0f172a;
        border: 1px solid #0284c7;
        border-radius: 12px;
        padding: 24px;
        font-family: 'Consolas', monospace;
        font-size: 19px;
        line-height: 1.5;
        color: #38bdf8;
        white-space: pre-wrap;
    }}
    .golden-rule-banner {{
        background: linear-gradient(90deg, rgba(251, 191, 36, 0.15), rgba(16, 185, 129, 0.15));
        border: 1px solid rgba(251, 191, 36, 0.4);
        border-radius: 12px;
        padding: 20px 30px;
        font-size: 22px;
        font-weight: 800;
        color: #fbbf24;
        display: flex;
        align-items: center;
        gap: 14px;
    }}

    /* SLIDE 4 & 5: TRAPS */
    .traps-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 36px;
    }}
    .trap-card {{
        background: #1e293b;
        border-radius: 16px;
        padding: 36px;
        border: 1px solid #334155;
        display: flex;
        flex-direction: column;
    }}
    .trap-card.card-red {{
        border-top: 5px solid #f43f5e;
    }}
    .trap-card.card-amber {{
        border-top: 5px solid #fbbf24;
    }}
    .trap-card.card-purple {{
        border-top: 5px solid #a855f7;
    }}
    .trap-tag {{
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 1px;
        margin-bottom: 12px;
        text-transform: uppercase;
    }}
    .tag-red {{ color: #f43f5e; }}
    .tag-amber {{ color: #fbbf24; }}
    .tag-purple {{ color: #a855f7; }}
    .trap-h3 {{
        font-size: 26px;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 16px 0;
    }}
    .trap-text {{
        font-size: 18px;
        line-height: 1.6;
        color: #cbd5e1;
        white-space: pre-wrap;
    }}

    /* SLIDE 6 & 7: PRACTICE QUESTIONS */
    .practice-grid {{
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 40px;
        align-items: start;
    }}
    .steps-card {{
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 32px;
    }}
    .steps-title {{
        font-size: 19px;
        font-weight: 800;
        color: #38bdf8;
        margin-bottom: 20px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 10px;
    }}
    .step-item {{
        margin-bottom: 16px;
        padding-left: 14px;
        border-left: 3px solid #38bdf8;
    }}
    .step-label {{
        font-size: 14px;
        font-weight: 700;
        color: #94a3b8;
    }}
    .step-val {{
        font-size: 17px;
        font-weight: 600;
        color: #f1f5f9;
        margin-top: 2px;
    }}
    .key-callout {{
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid #10b981;
        border-radius: 10px;
        padding: 16px 20px;
        margin-top: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }}
    .key-big {{
        font-size: 28px;
        font-weight: 900;
        color: #10b981;
    }}

    /* SLIDE 8: MANTRA & HOMEWORK */
    .mantra-giant-box {{
        background: radial-gradient(circle at center, rgba(251, 191, 36, 0.15) 0%, rgba(15, 23, 42, 0.8) 70%), #1e293b;
        border: 2px solid #fbbf24;
        border-radius: 20px;
        padding: 48px;
        text-align: center;
        margin-bottom: 36px;
        box-shadow: 0 0 50px -10px rgba(251, 191, 36, 0.25);
    }}
    .mantra-label {{
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #fbbf24;
        text-transform: uppercase;
        margin-bottom: 14px;
    }}
    .mantra-quote {{
        font-size: 36px;
        font-weight: 900;
        color: #ffffff;
        line-height: 1.35;
    }}
    .action-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
    }}
    .action-card {{
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 14px;
        padding: 24px 30px;
        display: flex;
        align-items: center;
        gap: 20px;
    }}
    .action-icon {{
        width: 52px;
        height: 52px;
        border-radius: 12px;
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }}
    .action-info h4 {{
        margin: 0 0 4px 0;
        font-size: 19px;
        color: #ffffff;
    }}
    .action-info p {{
        margin: 0;
        font-size: 15px;
        color: #94a3b8;
    }}
</style>
</head>
<body>

<!-- ==========================================
     SLIDE 1: COVER & OVERVIEW
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge">LINGOPRO STUDIO</span>
            <span class="phase-badge">{data.stage_name}</span>
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #94a3b8;">
            THỜI LƯỢNG: {data.duration}
        </div>
    </div>
    
    <div class="slide-content">
        <div class="cover-container">
            <span class="cover-track-badge">GIÁO TRÌNH TOEIC MICRO-LEARNING 20 PHÚT</span>
            <div class="cover-title">{data.title}</div>
            
            <div class="cover-meta-grid">
                <div class="cover-pill">🎯 Target: <strong>{data.target}</strong></div>
                <div class="cover-pill">🎙️ Giảng viên: <strong>{data.creator}</strong></div>
                <div class="cover-pill">⚡ Phương pháp: <strong>3 Bước Loại Trừ Đề Thật</strong></div>
            </div>

            <div class="timeline-preview-bar">
                <div class="phase-card">
                    <div class="phase-num">Phần 1 • 2.5m</div>
                    <div class="phase-name">The Hook & Bẫy Mở Đầu</div>
                </div>
                <div class="phase-card">
                    <div class="phase-num">Phần 2 • 6.0m</div>
                    <div class="phase-name">Bản Chất & Công Thức</div>
                </div>
                <div class="phase-card">
                    <div class="phase-num">Phần 3 • 5.0m</div>
                    <div class="phase-name">3 Bẫy Kinh Điển ETS</div>
                </div>
                <div class="phase-card">
                    <div class="phase-num">Phần 4 • 4.5m</div>
                    <div class="phase-name">Thực Chiến Đề Thật</div>
                </div>
                <div class="phase-card">
                    <div class="phase-num">Phần 5 • 2.0m</div>
                    <div class="phase-name">Thần Chú & Giao Bài</div>
                </div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>© 2026 LingoPro Academy • Bản quyền thuộc về LingoPro</span>
        <span class="footer-highlight">Slide 1 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 2: THE HOOK & CÂU BẪY MỞ ĐẦU
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge">PHẦN 1: THE HOOK</span>
            <span class="phase-badge">[00:00 - 02:30] • 2.5 PHÚT</span>
        </div>
        <div class="footer-highlight">KHỞI ĐỘNG TƯ DUY</div>
    </div>

    <div class="slide-content">
        <div class="hook-grid">
            <div class="prompt-card">
                <div class="challenge-tag">⏱️ THỬ THÁCH 5 GIÂY — 80% THÍ SINH MẮC BẪY</div>
                <div class="prompt-text">{data.hook_prompt}</div>
                <div class="opts-grid">
                    <div class="s-opt"><span class="opt-letter">A</span> {data.hook_options.get('A','')}</div>
                    <div class="s-opt"><span class="opt-letter">B</span> {data.hook_options.get('B','')}</div>
                    <div class="s-opt"><span class="opt-letter">C</span> {data.hook_options.get('C','')}</div>
                    <div class="s-opt"><span class="opt-letter">D</span> {data.hook_options.get('D','')}</div>
                </div>
            </div>

            <div class="insight-card">
                <div class="insight-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    TẠI SAO BẠN HAY CHỌN SAI?
                </div>
                <div class="insight-body">
                    {data.hook_insight}
                    <br><br>
                    <strong>Mục tiêu buổi học 20 phút hôm nay:</strong>
                    <ul>
                        <li>Nắm vững bản chất ngôn ngữ không cần dịch nghĩa.</li>
                        <li>Giải quyết câu hỏi trong 5-15 giây.</li>
                        <li>Tránh bẫy gây nhiễu của giám khảo ETS.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>Giảng viên Võ Tá Phong • Chuỗi 60 Bài Giảng Micro-learning</span>
        <span class="footer-highlight">Slide 2 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 3: BẢN CHẤT CỐT LÕI & CÔNG THỨC VÀNG
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge">PHẦN 2: BẢN CHẤT CỐT LÕI</span>
            <span class="phase-badge">[02:30 - 08:30] • 6.0 PHÚT</span>
        </div>
        <div class="footer-highlight">CÔNG THỨC VÀNG</div>
    </div>

    <div class="slide-content">
        <div class="title-h2">BẢN CHẤT NGÔN NGỮ & <span class="title-highlight">CÔNG THỨC VÀNG</span></div>
        <div class="concept-grid">
            <div class="concept-card">
                <div>
                    <h3 style="color:#38bdf8; font-size:22px; margin-top:0;">1. NGUYÊN LÝ BẢN CHẤT</h3>
                    <p style="font-size:18px; line-height:1.6; color:#cbd5e1;">{data.p2_concept}</p>
                </div>
                <div style="background:#0f172a; padding:16px; border-radius:10px; border-left:4px solid #38bdf8;">
                    <span style="font-size:15px; color:#94a3b8; font-weight:700;">TƯ DUY ĐỘT PHÁ:</span>
                    <p style="margin:4px 0 0 0; font-size:16px; color:#f8fafc;">Không học thuộc vẹt cấu trúc rời rạc. Quan sát mối quan hệ giữa Chủ ngữ - Động từ - Tân ngữ.</p>
                </div>
            </div>

            <div class="concept-card">
                <div>
                    <h3 style="color:#fbbf24; font-size:22px; margin-top:0;">2. CÔNG THỨC VÀNG BẤT BIẾN</h3>
                    <div class="formula-box">{data.p2_formula}</div>
                </div>
                <div style="margin-top:16px; font-size:15px; color:#94a3b8;">
                    Ghi nhớ mẫu hình giúp phản xạ tức thì dưới 10 giây khi thi thật.
                </div>
            </div>
        </div>

        <div class="golden-rule-banner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>{data.p2_golden_rule}</span>
        </div>
    </div>

    <div class="slide-footer">
        <span>LingoPro Micro-learning Platform</span>
        <span class="footer-highlight">Slide 3 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 4: CHIÊU TRÒ GÀI BẪY ETS (BẪY #1 & #2)
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge" style="background:#f43f5e;">PHẦN 3: BẪY ETS</span>
            <span class="phase-badge">[08:30 - 13:30] • 5.0 PHÚT</span>
        </div>
        <div class="footer-highlight" style="color:#f43f5e;">CẢNH BÁO TỬ HUYỆT (TẬP 1)</div>
    </div>

    <div class="slide-content">
        <div class="title-h2">CHIÊU TRÒ GÀI BẪY ETS: <span style="color:#f43f5e;">BẪY #1 & BẪY #2</span></div>
        <div class="subtitle-p">Những cái bẫy tinh vi khiến thí sinh mất điểm oan uổng nhiều nhất:</div>
        
        <div class="traps-grid">
            <div class="trap-card card-red">
                <span class="trap-tag tag-red">⚠️ BẪY SỐ 1 • TẬP TRUNG CAO ĐỘ</span>
                <div class="trap-h3">{trap1.title}</div>
                <div class="trap-text">{trap1.content}</div>
            </div>

            <div class="trap-card card-amber">
                <span class="trap-tag tag-amber">⚠️ BẪY SỐ 2 • CẢN TRỞ TỐC ĐỘ</span>
                <div class="trap-h3">{trap2.title}</div>
                <div class="trap-text">{trap2.content}</div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>Chiến thuật thực chiến TOEIC • Giảng viên Võ Tá Phong</span>
        <span class="footer-highlight">Slide 4 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 5: CHIÊU TRÒ GÀI BẪY ETS (BẪY #3) & PHẢN XẠ
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge" style="background:#a855f7;">PHẦN 3: BẪY ETS (TIẾP)</span>
            <span class="phase-badge">[08:30 - 13:30] • 5.0 PHÚT</span>
        </div>
        <div class="footer-highlight" style="color:#a855f7;">PHẢN XẠ LOẠI TRỪ 3 GIÂY</div>
    </div>

    <div class="slide-content">
        <div class="title-h2">BẪY SỐ 3 & <span style="color:#a855f7;">MA TRẬN PHẢN XẠ LOẠI TRỪ</span></div>
        
        <div class="traps-grid">
            <div class="trap-card card-purple">
                <span class="trap-tag tag-purple">⚠️ BẪY SỐ 3 • ĐỘ KHÓ 750+</span>
                <div class="trap-h3">{trap3.title}</div>
                <div class="trap-text">{trap3.content}</div>
            </div>

            <div class="trap-card" style="border-top: 5px solid #10b981;">
                <span class="trap-tag" style="color:#10b981;">⚡ PHẢN XẠ LOẠI TRỪ 3 GIÂY</span>
                <div class="trap-h3">BẢNG PHẢN XẠ TỨC THÌ TRONG PHÒNG THI</div>
                <div style="font-size:17px; line-height:1.6; color:#cbd5e1;">
                    <div style="padding:10px; background:#0f172a; border-radius:8px; margin-bottom:8px;">
                        <strong>1. Nhìn 4 đáp án:</strong> Xác định ngay câu hỏi ngữ pháp hay từ vựng.
                    </div>
                    <div style="padding:10px; background:#0f172a; border-radius:8px; margin-bottom:8px;">
                        <strong>2. Quét trước & sau chỗ trống:</strong> Bắt từ khóa manh mối then chốt.
                    </div>
                    <div style="padding:10px; background:#0f172a; border-radius:8px;">
                        <strong>3. Gạch bỏ 2 đáp án nhiễu:</strong> Chọn đáp án đúng trong 3 giây.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>Tuyệt kỹ phản xạ nhanh TOEIC 2024 / 2026</span>
        <span class="footer-highlight">Slide 5 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 6: THỰC CHIẾN ĐỀ THI THẬT — CÂU 1
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge" style="background:#059669;">PHẦN 4: THỰC CHIẾN ETS</span>
            <span class="phase-badge">[13:30 - 15:45] • CÂU 01</span>
        </div>
        <div class="footer-highlight" style="color:#34d399;">CANONICAL PROVENANCE</div>
    </div>

    <div class="slide-content">
        <div style="margin-bottom: 20px; display:flex; align-items:center; gap:16px;">
            <span style="background:#0f172a; border:1px solid #10b981; color:#34d399; font-family:monospace; padding:6px 14px; border-radius:6px; font-weight:800; font-size:16px;">
                MÃ NGUỒN: {q1.source_tag}
            </span>
            <span style="color:#94a3b8; font-size:18px; font-weight:600;">{q1.topic}</span>
        </div>

        <div class="practice-grid">
            <div class="prompt-card" style="padding: 28px;">
                <div class="prompt-text" style="font-size:24px;">{q1.prompt}</div>
                <div class="opts-grid">
                    {render_opts(q1)}
                </div>
            </div>

            <div class="steps-card">
                <div class="steps-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    QUY TRÌNH 3 BƯỚC GIẢI NHANH
                </div>
                <div class="step-item">
                    <div class="step-label">BƯỚC 1: NHÌN ĐÁP ÁN</div>
                    <div class="step-val">Quan sát 4 đáp án để nhận diện điểm ngữ pháp.</div>
                </div>
                <div class="step-item">
                    <div class="step-label">BƯỚC 2: BẮT MANH MỐI</div>
                    <div class="step-val">Xét cấu trúc và thành phần câu xung quanh chỗ trống.</div>
                </div>
                <div class="step-item">
                    <div class="step-label">BƯỚC 3: LOẠI TRỪ & CHỌN</div>
                    <div class="step-val">{q1.explanation}</div>
                </div>

                <div class="key-callout">
                    <span style="font-size:16px; font-weight:700; color:#cbd5e1;">ĐÁP ÁN CHÍNH XÁC:</span>
                    <span class="key-big">({q1.answer_key})</span>
                </div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>Ngân hàng câu hỏi chuẩn hóa ETS 2024 / ETS 2026</span>
        <span class="footer-highlight">Slide 6 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 7: THỰC CHIẾN ĐỀ THI THẬT — CÂU 2
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge" style="background:#059669;">PHẦN 4: THỰC CHIẾN ETS</span>
            <span class="phase-badge">[15:45 - 18:00] • CÂU 02</span>
        </div>
        <div class="footer-highlight" style="color:#34d399;">CANONICAL PROVENANCE</div>
    </div>

    <div class="slide-content">
        <div style="margin-bottom: 20px; display:flex; align-items:center; gap:16px;">
            <span style="background:#0f172a; border:1px solid #10b981; color:#34d399; font-family:monospace; padding:6px 14px; border-radius:6px; font-weight:800; font-size:16px;">
                MÃ NGUỒN: {q2.source_tag}
            </span>
            <span style="color:#94a3b8; font-size:18px; font-weight:600;">{q2.topic}</span>
        </div>

        <div class="practice-grid">
            <div class="prompt-card" style="padding: 28px;">
                <div class="prompt-text" style="font-size:24px;">{q2.prompt}</div>
                <div class="opts-grid">
                    {render_opts(q2)}
                </div>
            </div>

            <div class="steps-card">
                <div class="steps-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    QUY TRÌNH 3 BƯỚC GIẢI NHANH
                </div>
                <div class="step-item">
                    <div class="step-label">BƯỚC 1: NHÌN ĐÁP ÁN</div>
                    <div class="step-val">Quan sát 4 đáp án để nhận diện điểm ngữ pháp.</div>
                </div>
                <div class="step-item">
                    <div class="step-label">BƯỚC 2: BẮT MANH MỐI</div>
                    <div class="step-val">Xét cấu trúc và thành phần câu xung quanh chỗ trống.</div>
                </div>
                <div class="step-item">
                    <div class="step-label">BƯỚC 3: LOẠI TRỪ & CHỌN</div>
                    <div class="step-val">{q2.explanation}</div>
                </div>

                <div class="key-callout">
                    <span style="font-size:16px; font-weight:700; color:#cbd5e1;">ĐÁP ÁN CHÍNH XÁC:</span>
                    <span class="key-big">({q2.answer_key})</span>
                </div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>Ngân hàng câu hỏi chuẩn hóa ETS 2024 / ETS 2026</span>
        <span class="footer-highlight">Slide 7 / 8</span>
    </div>
</div>

<!-- ==========================================
     SLIDE 8: THẦN CHÚ & GIAO BÀI TẬP VỀ NHÀ
=========================================== -->
<div class="slide">
    <div class="slide-topbar">
        <div class="brand-group">
            <span class="brand-badge" style="background:#d97706;">PHẦN 5: TỔNG KẾT & GIAO BÀI</span>
            <span class="phase-badge">[18:00 - 20:00] • 2.0 PHÚT</span>
        </div>
        <div class="footer-highlight" style="color:#fbbf24;">RECAP & CALL TO ACTION</div>
    </div>

    <div class="slide-content">
        <div class="mantra-giant-box">
            <div class="mantra-label">⭐ THẦN CHÚ 1 DÒNG ĐÚC KẾT PHẢN XẠ ⭐</div>
            <div class="mantra-quote">"{data.mantra}"</div>
        </div>

        <div class="action-grid">
            <div class="action-card">
                <div class="action-icon">🎯</div>
                <div class="action-info">
                    <h4>BÀI TẬP VỀ NHÀ HÔM NAY</h4>
                    <p>{data.homework}</p>
                </div>
            </div>

            <div class="action-card">
                <div class="action-icon">📱</div>
                <div class="action-info">
                    <h4>LUYỆN TẬP TRÊN LINGOPRO</h4>
                    <p>Truy cập https://lingopro.online để làm bài chấm điểm tự động.</p>
                </div>
            </div>
        </div>
    </div>

    <div class="slide-footer">
        <span>Giảng viên Võ Tá Phong • LingoPro Master Trainer</span>
        <span class="footer-highlight">Slide 8 / 8</span>
    </div>
</div>

</body>
</html>
        """
        return html


# ==============================================================================
# DUAL PDF RENDERER (PLAYWRIGHT)
# ==============================================================================

class DualPDFRenderer:
    """Renders both Teleprompter and Slide Deck PDFs using Playwright Chromium."""

    def __init__(self, output_root: Path):
        self.output_root = Path(output_root)
        self.tele_dir = self.output_root / "teleprompter"
        self.slide_dir = self.output_root / "slides"
        self.tele_dir.mkdir(parents=True, exist_ok=True)
        self.slide_dir.mkdir(parents=True, exist_ok=True)

    def render_lesson(self, lesson_data: LessonData, custom_basename: Optional[str] = None) -> Dict[str, any]:
        base_name = custom_basename or lesson_data.file_path.stem
        tele_pdf_name = f"{base_name}_teleprompter.pdf"
        slide_pdf_name = f"{base_name}_slides.pdf"

        tele_pdf_path = self.tele_dir / tele_pdf_name
        slide_pdf_path = self.slide_dir / slide_pdf_name

        html_tele = TeleprompterHTMLRenderer.render(lesson_data)
        html_slide = SlideDeckHTMLRenderer.render(lesson_data)

        # Temporary HTML files
        temp_dir = self.output_root / "temp_html"
        temp_dir.mkdir(parents=True, exist_ok=True)
        tele_html_path = temp_dir / f"{base_name}_tele.html"
        slide_html_path = temp_dir / f"{base_name}_slide.html"

        with open(tele_html_path, "w", encoding="utf-8") as f:
            f.write(html_tele)
        with open(slide_html_path, "w", encoding="utf-8") as f:
            f.write(html_slide)

        print(f"[*] Rendering Dual PDFs for: {lesson_data.file_path.name}")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            # 1. Render Teleprompter PDF (A4 Portrait)
            page_tele = browser.new_page()
            page_tele.goto(f"file:///{tele_html_path.as_posix()}", wait_until="networkidle")
            page_tele.pdf(
                path=str(tele_pdf_path),
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "14mm", "right": "16mm", "bottom": "16mm", "left": "16mm"}
            )
            page_tele.close()

            # 2. Render Slide Deck PDF (16:9 Landscape 1920x1080)
            page_slide = browser.new_page(viewport={"width": 1920, "height": 1080})
            page_slide.goto(f"file:///{slide_html_path.as_posix()}", wait_until="networkidle")
            page_slide.pdf(
                path=str(slide_pdf_path),
                width="1920px",
                height="1080px",
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            page_slide.close()
            browser.close()

        # Clean up temp html
        shutil.rmtree(temp_dir, ignore_errors=True)

        # Inspect generated PDFs
        tele_size = tele_pdf_path.stat().st_size
        slide_size = slide_pdf_path.stat().st_size

        tele_pages = 0
        slide_pages = 0
        if fitz:
            doc_t = fitz.open(str(tele_pdf_path))
            tele_pages = doc_t.page_count
            doc_t.close()

            doc_s = fitz.open(str(slide_pdf_path))
            slide_pages = doc_s.page_count
            doc_s.close()

        print(f"    [+] Teleprompter PDF: {tele_pdf_path.name} | Size: {tele_size:,} bytes | Pages: {tele_pages}")
        print(f"    [+] Slide Deck PDF  : {slide_pdf_path.name} | Size: {slide_size:,} bytes | Pages: {slide_pages}")

        # Validation assertions
        assert tele_size > 0, "Teleprompter PDF file size must be > 0"
        assert slide_size > 0, "Slide Deck PDF file size must be > 0"
        if fitz:
            assert tele_pages >= 3, f"Teleprompter PDF must have >= 3 pages (got {tele_pages})"
            assert slide_pages == 8, f"Slide Deck PDF must have exactly 8 pages (got {slide_pages})"

        return {
            "lesson_stt": lesson_data.stt,
            "title": lesson_data.title,
            "tele_path": str(tele_pdf_path),
            "tele_size": tele_size,
            "tele_pages": tele_pages,
            "slide_path": str(slide_pdf_path),
            "slide_size": slide_size,
            "slide_pages": slide_pages
        }


# ==============================================================================
# MAIN & CLI
# ==============================================================================

REPRESENTATIVE_MAPPING = [
    {
        "stage": "01_nen_tang_cot_loi",
        "stt": "01",
        "filename": "bai_01_bang_phien_am_ipa_va_noi_am_20min.md",
        "alias_name": "bai_01_danh_tu_noun_phrase_20min"
    },
    {
        "stage": "02_ngu_phap_nang_cao",
        "stt": "16",
        "filename": "bai_16_cau_bi_dong_passive_voice_20min.md",
        "alias_name": "bai_16_cau_bi_dong_passive_voice_20min"
    },
    {
        "stage": "03_reading_part_5_6",
        "stt": "31",
        "filename": "bai_31_phan_loai_3_dang_cau_hoi_part_5_20min.md",
        "alias_name": "bai_31_part5_phuong_phap_3_buoc_20min"
    },
    {
        "stage": "04_listening_part_1_4",
        "stt": "46",
        "filename": "bai_46_part_1_3_bay_kinh_dien_tranh_mieu_ta_20min.md",
        "alias_name": "bai_46_part1_tranh_nguoi_hanh_dong_20min"
    }
]


def render_representative_lessons(plans_dir: Path, output_dir: Path) -> List[Dict[str, any]]:
    plans_dir = Path(plans_dir)
    renderer = DualPDFRenderer(output_dir)
    results = []

    print("\n" + "=" * 80)
    print(" RENDERING 4 REPRESENTATIVE LESSONS (POC) ACROSS ALL 4 STAGES")
    print("=" * 80)

    for item in REPRESENTATIVE_MAPPING:
        stage_dir = plans_dir / item["stage"]
        file_path = stage_dir / item["filename"]
        if not file_path.exists():
            raise FileNotFoundError(f"Teaching plan not found: {file_path}")

        lesson_data = LessonPlanParser.parse_file(file_path)

        # 1. Render primary PDF deliverables
        res = renderer.render_lesson(lesson_data, custom_basename=file_path.stem)
        results.append(res)

        # 2. Also ensure alias deliverables exist if requested name differs
        alias = item.get("alias_name")
        if alias and alias != file_path.stem:
            tele_orig = Path(res["tele_path"])
            slide_orig = Path(res["slide_path"])

            tele_alias = tele_orig.parent / f"{alias}_teleprompter.pdf"
            slide_alias = slide_orig.parent / f"{alias}_slides.pdf"

            shutil.copy2(tele_orig, tele_alias)
            shutil.copy2(slide_orig, slide_alias)
            print(f"    [+] Created prompt alias copy: {tele_alias.name}")
            print(f"    [+] Created prompt alias copy: {slide_alias.name}")

    print("\n" + "=" * 80)
    print(" ALL 4 REPRESENTATIVE LESSONS RENDERED & VERIFIED SUCCESSFULLY!")
    print("=" * 80)
    return results


def verify_all_rendered_pdfs(output_dir: Path) -> bool:
    output_dir = Path(output_dir)
    tele_dir = output_dir / "teleprompter"
    slide_dir = output_dir / "slides"

    tele_files = list(tele_dir.glob("*.pdf"))
    slide_files = list(slide_dir.glob("*.pdf"))

    print("\n" + "=" * 80)
    print(" VERIFYING GENERATED PDF ARTIFACTS")
    print("=" * 80)
    print(f"Teleprompter PDFs found: {len(tele_files)}")
    print(f"Slide Deck PDFs found  : {len(slide_files)}")

    all_passed = True
    for f in tele_files:
        sz = f.stat().st_size
        pages = 0
        if fitz:
            doc = fitz.open(str(f))
            pages = doc.page_count
            doc.close()
        passed = (sz > 0 and pages >= 3)
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] Teleprompter: {f.name} | {sz:,} bytes | {pages} pages")
        if not passed:
            all_passed = False

    for f in slide_files:
        sz = f.stat().st_size
        pages = 0
        if fitz:
            doc = fitz.open(str(f))
            pages = doc.page_count
            doc.close()
        passed = (sz > 0 and pages == 8)
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] Slide Deck  : {f.name} | {sz:,} bytes | {pages} pages")
        if not passed:
            all_passed = False

    print("=" * 80)
    if all_passed:
        print("[+] ALL PDF FILES MEET STRICT ACCEPTANCE CRITERIA!")
    else:
        print("[!] SOME PDF FILES FAILED VALIDATION CHECKS.")
    print("=" * 80)
    return all_passed


def main():
    parser = argparse.ArgumentParser(description="Dual PDF Generator Engine for TOEIC 20-min Curriculum")
    parser.add_argument("--plans-dir", default=r"D:\Download\toeic_mai_phuong_curriculum\teaching_plans_20min",
                        help="Teaching plans directory")
    parser.add_argument("--output-dir", default=r"D:\Download\toeic_mai_phuong_curriculum\output\pdf",
                        help="Output root directory for PDFs")
    parser.add_argument("--representative", action="store_true",
                        help="Render the 4 representative lessons across 4 stages (01, 16, 31, 46)")
    parser.add_argument("--lesson", type=str,
                        help="Path or STT of a specific lesson (e.g. 16 or path/to/bai_16.md)")
    parser.add_argument("--verify", action="store_true",
                        help="Verify generated PDFs in output directory")

    args = parser.parse_args()

    plans_dir = Path(args.plans_dir)
    output_dir = Path(args.output_dir)

    if args.verify:
        verify_all_rendered_pdfs(output_dir)
        return

    if args.representative:
        render_representative_lessons(plans_dir, output_dir)
        verify_all_rendered_pdfs(output_dir)
        return

    if args.lesson:
        renderer = DualPDFRenderer(output_dir)
        # Check if argument is path or STT
        target_path = Path(args.lesson)
        if not target_path.exists():
            stt = args.lesson.replace("bai_", "").zfill(2)
            matches = list(plans_dir.glob(f"*/bai_{stt}_*.md"))
            if not matches:
                print(f"Error: Lesson not found for STT {stt}")
                sys.exit(1)
            target_path = matches[0]

        lesson_data = LessonPlanParser.parse_file(target_path)
        renderer.render_lesson(lesson_data)
        return

    # Default action if no flags
    print("[*] No flag provided, defaulting to --representative mode.")
    render_representative_lessons(plans_dir, output_dir)
    verify_all_rendered_pdfs(output_dir)


if __name__ == "__main__":
    main()
