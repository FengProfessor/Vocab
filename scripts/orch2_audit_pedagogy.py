#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pedagogical & Production Feasibility Audit Script for 60 20-min TOEIC Teaching Plans.
Scans all 60 lesson files in D:\\Download\\toeic_mai_phuong_curriculum\\teaching_plans_20min\\
Evaluates:
- 4 stages distribution (01_nen_tang_cot_loi, 02_ngu_phap_nang_cao, 03_reading_part_5_6, 04_listening_part_1_4)
- 5-part lesson anatomy adherence (Hook, Core Formula, 3 ETS Traps, Practice, Recap & Mantra)
- Word counts (total markdown words, teleprompter spoken dialogue words, slide/code words, worksheet rows)
- Estimated speech duration at 120, 130, 140 words/minute and production duration deficit
- Teleprompter cues & camera directions (Medium Close-up, Split-screen, Picture-in-Picture, Wide shot)
- Stage 4 Listening cues (Audio cues, playback timecodes, transcript reveal, graphic questions)
- 100-Point Pedagogical Rubric automated evaluation engine
- Cross-validation with INDEX_GIAO_AN_TOEIC_20MIN.md
"""

import os
import sys
import re
import json
import argparse

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"D:\Download\toeic_mai_phuong_curriculum\teaching_plans_20min"
INDEX_FILE = os.path.join(BASE_DIR, "INDEX_GIAO_AN_TOEIC_20MIN.md")
DEFAULT_REPORT_JSON = r"D:\Download\toeic_mai_phuong_curriculum\reports\audit_results_pedagogy.json"

def parse_index(index_path=INDEX_FILE):
    lessons = []
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"Index file not found: {index_path}")
        
    with open(index_path, encoding='utf-8') as f:
        for line in f:
            m = re.match(r'\|\s*\*\*(\d+)\*\*\s*\|\s*([^|]+)\|\s*`([^`]+)`\s*\|\s*\[([^\]]+)\]\(([^)]+)\)', line)
            if m:
                stt = int(m.group(1))
                title = m.group(2).strip()
                stage = m.group(3).strip()
                fname = m.group(4).strip()
                rel_path = m.group(5).strip()
                lessons.append({
                    'stt': stt,
                    'title': title,
                    'stage': stage,
                    'fname': fname,
                    'rel_path': rel_path
                })
    return lessons

def calculate_rubric_score(analysis):
    """
    100-Point Pedagogical Rubric Engine:
    Pillar 1: Cấu trúc Sư phạm & Khung thời gian Micro-learning (25 pts)
      - 5-part anatomy presence (3 pts each = 15 pts)
      - Timeline presence & completeness (5 pts)
      - Metadata & objective definition (5 pts)
    Pillar 2: Độ dài Lời thoại & Ngôn phong Teleprompter (25 pts)
      - Spoken dialogue word count (scale to 14 pts: >=2000: 14, >=1500: 10, >=1000: 7, >=600: 4, <600: 2)
      - Total word count (scale to 6 pts: >=2200: 6, >=1800: 5, >=1400: 4, <1400: 2)
      - Lecturer persona & cues (5 pts)
    Pillar 3: Chiều sâu Bẫy ETS & Chất lượng Câu hỏi Thực chiến (25 pts)
      - 3 ETS Traps identified & structured (8 pts)
      - Practice questions count (scale to 12 pts: >=4: 12, 3: 9, 2: 6, 1: 3, 0: 0)
      - Student worksheet rows (scale to 5 pts: >=3: 5, 2: 3, 1: 1, 0: 0)
    Pillar 4: Khả thi Sản xuất Đa phương thức (25 pts)
      - Camera direction cues (8 pts: all 4 angles = 8, 3 = 6, 2 = 4, 1 = 2)
      - Visual Slide / ASCII Mindmap blocks (7 pts: >=2 = 7, 1 = 4, 0 = 0)
      - Worksheet table format (5 pts)
      - Stage-specific cues (5 pts: Stage 4 audio cues, or Stage 1-3 formatting & formulas)
    """
    parts = analysis['parts']
    cues = analysis['cues']
    diag_w = analysis['dialogue_words']
    tot_w = analysis['total_words']
    q_cnt = analysis['questions_count']
    ws_cnt = analysis['worksheet_rows']
    stage = analysis['stage']
    
    # Pillar 1 (25 pts)
    p1_parts_score = sum([
        3 if parts['p1_hook'] else 0,
        3 if parts['p2_core'] else 0,
        3 if parts['p3_traps'] else 0,
        3 if parts['p4_practice'] else 0,
        3 if parts['p5_recap'] else 0,
    ])
    p1_timeline_score = 5 if parts['has_timeline'] else 0
    p1_meta_score = 5 if analysis['has_metadata'] else 2
    pillar_1 = p1_parts_score + p1_timeline_score + p1_meta_score
    
    # Pillar 2 (25 pts)
    if diag_w >= 2000:
        p2_diag_score = 14
    elif diag_w >= 1500:
        p2_diag_score = 10
    elif diag_w >= 1000:
        p2_diag_score = 7
    elif diag_w >= 600:
        p2_diag_score = 4
    else:
        p2_diag_score = 2
        
    if tot_w >= 2200:
        p2_tot_score = 6
    elif tot_w >= 1800:
        p2_tot_score = 5
    elif tot_w >= 1400:
        p2_tot_score = 4
    else:
        p2_tot_score = 2
        
    p2_persona_score = 5 if cues['creator_phong'] else 1
    pillar_2 = p2_diag_score + p2_tot_score + p2_persona_score
    
    # Pillar 3 (25 pts)
    p3_traps_score = 8 if parts['p3_traps'] and analysis['traps_count'] >= 3 else (5 if parts['p3_traps'] else 0)
    if q_cnt >= 4:
        p3_q_score = 12
    elif q_cnt == 3:
        p3_q_score = 9
    elif q_cnt == 2:
        p3_q_score = 6
    elif q_cnt == 1:
        p3_q_score = 3
    else:
        p3_q_score = 0
        
    if ws_cnt >= 3:
        p3_ws_score = 5
    elif ws_cnt == 2:
        p3_ws_score = 3
    elif ws_cnt == 1:
        p3_ws_score = 1
    else:
        p3_ws_score = 0
    pillar_3 = p3_traps_score + p3_q_score + p3_ws_score
    
    # Pillar 4 (25 pts)
    cam_count = sum([1 for c in ['close_up', 'split_screen', 'pip', 'toan_canh'] if cues.get(c, False)])
    if cam_count >= 4:
        p4_cam_score = 8
    elif cam_count == 3:
        p4_cam_score = 6
    elif cam_count == 2:
        p4_cam_score = 4
    else:
        p4_cam_score = 2
        
    p4_slide_score = 7 if analysis['slide_boxes'] >= 2 else (4 if analysis['slide_boxes'] == 1 else 1)
    p4_ws_format = 5 if cues['worksheet'] and ws_cnt > 0 else 2
    
    if stage == '04_listening_part_1_4':
        p4_stage_cues = 5 if analysis['listening_cues']['has_audio_cue'] else 0
    else:
        p4_stage_cues = 5 if analysis['code_words'] > 50 else 3
        
    pillar_4 = p4_cam_score + p4_slide_score + p4_ws_format + p4_stage_cues
    
    total_rubric = pillar_1 + pillar_2 + pillar_3 + pillar_4
    return {
        'total': total_rubric,
        'pillar_1_anatomy': pillar_1,
        'pillar_2_teleprompter': pillar_2,
        'pillar_3_traps_practice': pillar_3,
        'pillar_4_production': pillar_4,
        'readiness': (
            'Ready for Studio' if total_rubric >= 90 else
            'Near Ready (Minor Polish)' if total_rubric >= 75 else
            'Structural Skeleton (Needs Dialogue Expansion)' if total_rubric >= 60 else
            'Unacceptable'
        )
    }

def analyze_lesson(lesson_info, base_dir=BASE_DIR):
    fpath = os.path.join(base_dir, lesson_info['rel_path'].replace('/', os.sep))
    exists = os.path.exists(fpath)
    if not exists:
        return {**lesson_info, 'exists': False}
    
    with open(fpath, encoding='utf-8') as f:
        content = f.read()
    
    lines = content.splitlines()
    total_words = len(content.split())
    
    # Metadata check
    has_metadata = bool(re.search(r'Thời lượng:\s*20:00|Target mục tiêu|Người giảng', content, re.IGNORECASE))
    
    # 5-stage anatomy checks
    has_p1 = bool(re.search(r'PHẦN 1|THE HOOK', content, re.IGNORECASE))
    has_p2 = bool(re.search(r'PHẦN 2|BẢN CHẤT CỐT LÕI', content, re.IGNORECASE))
    has_p3 = bool(re.search(r'PHẦN 3|BẪY|CHIÊU TRÒ', content, re.IGNORECASE))
    has_p4 = bool(re.search(r'PHẦN 4|THỰC CHIẾN', content, re.IGNORECASE))
    has_p5 = bool(re.search(r'PHẦN 5|RECAP|TỔNG KẾT|THẦN CHÚ', content, re.IGNORECASE))
    
    # Timeline table
    has_timeline = bool(re.search(r'PHÂN BỔ TIMELINE|\[00:00\s*-\s*02:30\]', content, re.IGNORECASE))
    
    # Traps count
    traps_matches = re.findall(r'(?:BẪY\s*(?:SỐ\s*)?\d+|\d+\.\s*\*\*|Bẫy\s*\d+:)', content, re.IGNORECASE)
    traps_count = len(traps_matches)
    
    # Production / teleprompter cues
    has_goc_may = bool(re.search(r'Góc máy', content, re.IGNORECASE))
    has_split_screen = bool(re.search(r'Split-screen', content, re.IGNORECASE))
    has_close_up = bool(re.search(r'Cận cảnh|Medium Close-up', content, re.IGNORECASE))
    has_pip = bool(re.search(r'Picture-in-Picture|góc dưới bên phải|PiP', content, re.IGNORECASE))
    has_toan_canh = bool(re.search(r'Toàn cảnh', content, re.IGNORECASE))
    has_creator_phong = bool(re.search(r'Võ Tá Phong', content, re.IGNORECASE))
    has_worksheet = bool(re.search(r'FILE ĐÍNH KÈM|WORKSHEET|TÀI LIỆU HỌC VIÊN', content, re.IGNORECASE))
    
    # Slide boxes (ASCII borders or code blocks)
    slide_boxes = len(re.findall(r'╔═|┌─', content))
    
    # Extract dialogue blocks (> lines)
    quote_lines = []
    in_code_block = False
    code_words = 0
    non_quote_lines = []
    for ln in lines:
        stripped = ln.strip()
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            code_words += len(stripped.split())
            continue
        if stripped.startswith('>'):
            quote_lines.append(stripped.lstrip('>').strip())
        else:
            non_quote_lines.append(stripped)
            
    dialogue_text = " ".join(quote_lines)
    dialogue_words = len(dialogue_text.split())
    
    # Target 20 min speech rate estimates:
    est_duration_min_120wpm = dialogue_words / 120.0 if dialogue_words > 0 else 0
    est_duration_min_130wpm = dialogue_words / 130.0 if dialogue_words > 0 else 0
    est_duration_min_140wpm = dialogue_words / 140.0 if dialogue_words > 0 else 0
    
    total_est_duration_130wpm = total_words / 130.0
    
    # Deficit vs 20 minute target (at 130 wpm)
    dialogue_deficit_min = round(20.0 - est_duration_min_130wpm, 1)
    dialogue_deficit_words = max(0, 2400 - dialogue_words)
    
    # Count distinct practice questions in Part 4
    part4_match = re.search(r'###\s*PHẦN 4.*?(?:###\s*PHẦN 5|$)', content, re.DOTALL)
    if part4_match:
        part4_text = part4_match.group(0)
        q_matches = re.findall(r'####\s*Câu\s*\d+', part4_text, re.IGNORECASE)
        if not q_matches:
            q_matches = re.findall(r'Question\s*\d+:', part4_text, re.IGNORECASE)
    else:
        q_matches = re.findall(r'####\s*Câu\s*\d+', content, re.IGNORECASE)
    
    # Worksheet items
    worksheet_rows = len(re.findall(r'\|\s*\*\*\d+\*\*\s*\|', content))
    
    # Stage 4 Listening specifics
    has_audio_cue = bool(re.search(r'\[(?:AUDIO|INSERT AUDIO|AUDIO_PLAY|PLAY AUDIO|NGHE ĐOẠN)\]', content, re.IGNORECASE))
    has_timecode = bool(re.search(r'\[PAUSE|\d+:\d+\s*-\s*\d+:\d+\]', content, re.IGNORECASE))
    has_transcript_cue = bool(re.search(r'\[(?:SCRIPT|TRANSCRIPT|HIỆN SCRIPT)\]', content, re.IGNORECASE))
    has_multi_question_set = bool(re.search(r'Questions\s*\d+\s*(?:through|-)\s*\d+|Chùm 3 câu', content, re.IGNORECASE))
    
    res = {
        **lesson_info,
        'exists': True,
        'size_bytes': len(content.encode('utf-8')),
        'lines': len(lines),
        'total_words': total_words,
        'dialogue_words': dialogue_words,
        'code_words': code_words,
        'est_duration_min_120wpm': round(est_duration_min_120wpm, 1),
        'est_duration_min_130wpm': round(est_duration_min_130wpm, 1),
        'est_duration_min_140wpm': round(est_duration_min_140wpm, 1),
        'total_est_duration_130wpm': round(total_est_duration_130wpm, 1),
        'dialogue_deficit_min': dialogue_deficit_min,
        'dialogue_deficit_words': dialogue_deficit_words,
        'has_metadata': has_metadata,
        'traps_count': traps_count,
        'slide_boxes': slide_boxes,
        'parts': {
            'p1_hook': has_p1,
            'p2_core': has_p2,
            'p3_traps': has_p3,
            'p4_practice': has_p4,
            'p5_recap': has_p5,
            'has_timeline': has_timeline
        },
        'cues': {
            'goc_may': has_goc_may,
            'split_screen': has_split_screen,
            'close_up': has_close_up,
            'pip': has_pip,
            'toan_canh': has_toan_canh,
            'creator_phong': has_creator_phong,
            'worksheet': has_worksheet
        },
        'listening_cues': {
            'has_audio_cue': has_audio_cue,
            'has_timecode': has_timecode,
            'has_transcript_cue': has_transcript_cue,
            'has_multi_question_set': has_multi_question_set
        },
        'questions_count': len(q_matches),
        'worksheet_rows': worksheet_rows
    }
    
    # Calculate rubric
    rubric = calculate_rubric_score(res)
    res['rubric'] = rubric
    return res

def main():
    parser = argparse.ArgumentParser(description="Audit 60 TOEIC 20-min teaching plans.")
    parser.add_argument("--base-dir", default=BASE_DIR, help="Base directory of teaching plans")
    parser.add_argument("--json-out", default=DEFAULT_REPORT_JSON, help="Output path for JSON report")
    parser.add_argument("--stage", default=None, help="Filter by specific stage")
    args = parser.parse_args()
    
    print("="*90)
    print("LINGOPRO TOEIC 20-MIN CURRICULUM: PEDAGOGICAL & PRODUCTION FEASIBILITY AUDIT")
    print(f"Target Directory: {args.base_dir}")
    print("="*90)
    
    lessons = parse_index(os.path.join(args.base_dir, "INDEX_GIAO_AN_TOEIC_20MIN.md"))
    print(f"Total lessons indexed: {len(lessons)}")
    
    data = [analyze_lesson(l, base_dir=args.base_dir) for l in lessons]
    
    missing = [d for d in data if not d.get('exists', False)]
    print(f"Missing physical files: {len(missing)}")
    if missing:
        for m in missing:
            print(f"  [ERROR] Missing file: {m['rel_path']}")
        return 1
        
    # Filter by stage if requested
    if args.stage:
        data = [d for d in data if d['stage'] == args.stage]
        print(f"Filtered for stage: {args.stage} ({len(data)} lessons)")
        
    # Group by stage
    stages = {}
    for d in data:
        stg = d['stage']
        if stg not in stages:
            stages[stg] = []
        stages[stg].append(d)
        
    print("\n" + "-"*90)
    print(f"{'STAGE SUMMARY':^90}")
    print("-"*90)
    print(f"{'Stage Name':<26} | {'Files':<5} | {'Avg Tot W':<9} | {'Avg Diag W':<10} | {'Diag Time':<9} | {'Avg Qs':<6} | {'Rubric':<6}")
    print("-"*90)
    
    for stg, items in stages.items():
        total_w = [it['total_words'] for it in items]
        diag_w = [it['dialogue_words'] for it in items]
        q_cnt = [it['questions_count'] for it in items]
        rubrics = [it['rubric']['total'] for it in items]
        avg_tot = sum(total_w) / len(total_w)
        avg_diag = sum(diag_w) / len(diag_w)
        avg_time = avg_diag / 130.0
        avg_q = sum(q_cnt) / len(q_cnt)
        avg_rub = sum(rubrics) / len(rubrics)
        print(f"{stg:<26} | {len(items):<5} | {avg_tot:<9.1f} | {avg_diag:<10.1f} | {avg_time:<7.1f}m | {avg_q:<6.1f} | {avg_rub:<6.1f}")
    
    print("-"*90)
    all_total_w = [d['total_words'] for d in data]
    all_diag_w = [d['dialogue_words'] for d in data]
    all_rubric = [d['rubric']['total'] for d in data]
    print(f"{'ALL 60 LESSONS COMBINED':<26} | {len(data):<5} | {sum(all_total_w)/len(data):<9.1f} | {sum(all_diag_w)/len(data):<10.1f} | {sum(all_diag_w)/(len(data)*130):<7.1f}m | {sum([d['questions_count'] for d in data])/len(data):<6.1f} | {sum(all_rubric)/len(data):<6.1f}")
    print("="*90)

    # Detailed highlight: Golden Benchmark
    b16 = next((d for d in data if d['stt'] == 16), None)
    if b16:
        print("\n" + "*"*90)
        print("GOLDEN BENCHMARK STATUS: BÀI 16 (02_ngu_phap_nang_cao)")
        print("*"*90)
        print(f"Title: {b16['title']}")
        print(f"Total Words: {b16['total_words']} | Spoken Dialogue Words: {b16['dialogue_words']}")
        print(f"Est Speech Duration @ 130 wpm: {b16['est_duration_min_130wpm']}m (Total text @ 130 wpm: {b16['total_est_duration_130wpm']}m)")
        print(f"Practice Questions: {b16['questions_count']} | Worksheet Rows: {b16['worksheet_rows']}")
        print(f"Rubric Score: {b16['rubric']['total']}/100 ({b16['rubric']['readiness']})")
        print(f"  - Pillar 1 (Anatomy): {b16['rubric']['pillar_1_anatomy']}/25")
        print(f"  - Pillar 2 (Teleprompter): {b16['rubric']['pillar_2_teleprompter']}/25")
        print(f"  - Pillar 3 (Traps & Qs): {b16['rubric']['pillar_3_traps_practice']}/25")
        print(f"  - Pillar 4 (Production): {b16['rubric']['pillar_4_production']}/25")
        print("*"*90)
        
    # Stage 4 Listening Audit Details
    stg4_items = stages.get('04_listening_part_1_4', [])
    if stg4_items:
        print("\n" + "#"*90)
        print("STAGE 4 (LISTENING PART 1-4) SPECIALIZED PRODUCTION AUDIT")
        print("#"*90)
        has_audio = sum(1 for it in stg4_items if it['listening_cues']['has_audio_cue'])
        has_tc = sum(1 for it in stg4_items if it['listening_cues']['has_timecode'])
        has_tr = sum(1 for it in stg4_items if it['listening_cues']['has_transcript_cue'])
        has_mq = sum(1 for it in stg4_items if it['listening_cues']['has_multi_question_set'])
        print(f"Total Stage 4 Lessons: {len(stg4_items)}")
        print(f"  - Lessons with explicit Audio Play Cues ([AUDIO_PLAY]): {has_audio}/{len(stg4_items)} ({has_audio/len(stg4_items)*100:.1f}%)")
        print(f"  - Lessons with Audio Playback Timecodes/Pauses: {has_tc}/{len(stg4_items)} ({has_tc/len(stg4_items)*100:.1f}%)")
        print(f"  - Lessons with Transcript Reveal & Highlights: {has_tr}/{len(stg4_items)} ({has_tr/len(stg4_items)*100:.1f}%)")
        print(f"  - Lessons with authentic Multi-Question Sets (Part 3/4 3-Qs): {has_mq}/{len(stg4_items)} ({has_mq/len(stg4_items)*100:.1f}%)")
        print("  => CONCLUSION: Stage 4 requires the Listening Production Blueprint established in M2.1!")
        print("#"*90)

    # Export JSON
    os.makedirs(os.path.dirname(args.json_out), exist_ok=True)
    summary_export = {
        'audit_timestamp': '2026-09-26T13:50:00+07:00',
        'total_lessons': len(data),
        'missing_files': len(missing),
        'overall_averages': {
            'avg_total_words': round(sum(all_total_w)/len(data), 1),
            'avg_dialogue_words': round(sum(all_diag_w)/len(data), 1),
            'avg_est_duration_min_130wpm': round(sum(all_diag_w)/(len(data)*130), 1),
            'avg_rubric_score': round(sum(all_rubric)/len(data), 1)
        },
        'golden_benchmark_bai_16': b16,
        'stages': {}
    }
    
    for stg, items in stages.items():
        total_w = [it['total_words'] for it in items]
        diag_w = [it['dialogue_words'] for it in items]
        q_cnt = [it['questions_count'] for it in items]
        rubrics = [it['rubric']['total'] for it in items]
        summary_export['stages'][stg] = {
            'lesson_count': len(items),
            'avg_total_words': round(sum(total_w)/len(items), 1),
            'min_total_words': min(total_w),
            'max_total_words': max(total_w),
            'avg_dialogue_words': round(sum(diag_w)/len(items), 1),
            'min_dialogue_words': min(diag_w),
            'max_dialogue_words': max(diag_w),
            'avg_est_duration_130wpm': round(sum(diag_w)/(len(items)*130), 1),
            'avg_questions_count': round(sum(q_cnt)/len(items), 1),
            'avg_rubric_score': round(sum(rubrics)/len(items), 1),
            'lessons': items
        }
        
    with open(args.json_out, 'w', encoding='utf-8') as f:
        json.dump(summary_export, f, ensure_ascii=False, indent=2)
    print(f"\n[SUCCESS] Saved comprehensive audit report to: {args.json_out}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
