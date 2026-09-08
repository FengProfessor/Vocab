#!/usr/bin/env python3
"""
Playwright Crawler for 4Tests TOEIC Exam
Extracts questions, choices, answers, and explanations.
Outputs to crawlers/toeic/toeic_data/toeic_aggregate.json
"""

import sys
import os
import io
import json
import re
import time
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "crawlers", "toeic", "toeic_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "toeic_aggregate.json")

def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def run_crawler(max_questions: int = 25):
    print("🚀 Bắt đầu Playwright TOEIC Crawler từ 4Tests.com...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Chặn quảng cáo và trackers để tải trang cực nhanh (dưới 500ms)
        def block_ads(route):
            url = route.request.url.lower()
            if any(ad in url for ad in ['google', 'doubleclick', 'analytics', 'adsystem', 'facebook', 'syndication', 'amazon-adsystem', 'criteo', 'outbrain', 'taboola']):
                route.abort()
            else:
                route.continue_()

        context.route("**/*", block_ads)
        page = context.new_page()

        print("1. Đang mở https://www.4tests.com/toeic...")
        page.goto("https://www.4tests.com/toeic", wait_until="domcontentloaded", timeout=20000)

        # Chọn các phần Reading (Incomplete Sentences, Error Recognition, Reading Comprehension)
        print("2. Cấu hình các phần thi...")
        form = page.query_selector('form[action*="examcreate"]')
        if not form:
            print("❌ Không tìm thấy form thi trên 4tests!")
            browser.close()
            return

        # Submit form để khởi tạo bài thi
        with page.expect_navigation(wait_until="domcontentloaded", timeout=20000):
            form.evaluate("f => f.submit()")
        print(f"✅ Đã vào phòng thi: {page.url}")

        questions_crawled = []

        for q_idx in range(1, max_questions + 1):
            try:
                # 1. Thu thập dữ liệu câu hỏi hiện tại
                data = page.evaluate("""() => {
                    const form = document.frmQuestion;
                    if (!form) return null;

                    const qid = form.qid ? form.qid.value : '';
                    const nqid = form.nqid ? form.nqid.value : '';
                    const qc = form.qc ? form.qc.value : '';

                    const bodyText = document.body.innerText;
                    const secMatch = bodyText.match(/Section:\\s*([^\\n]+)/i);
                    const qNumMatch = bodyText.match(/Question\\s+(\\d+)\\s+of\\s+(\\d+)/i);

                    // Lấy các lựa chọn đáp án
                    const radios = Array.from(document.querySelectorAll('input[name="answer"]')).map((r, i) => {
                        const label = r.parentElement ? r.parentElement.innerText.trim() : '';
                        return label;
                    });

                    // Lấy nội dung câu hỏi
                    // Tìm đoạn text giữa số thứ tự câu và các lựa chọn
                    const lines = bodyText.split('\\n').map(l => l.trim()).filter(Boolean);
                    let prompt = '';
                    let foundNum = false;
                    for (let l of lines) {
                        if (l.match(/^\\d+\\)/)) {
                            foundNum = true;
                            continue;
                        }
                        if (foundNum) {
                            if (radios.includes(l) || l.includes('Mark For Review') || l.includes('Don\\'t have time')) {
                                break;
                            }
                            prompt += (prompt ? ' ' : '') + l;
                        }
                    }

                    return {
                        qid,
                        nqid,
                        qc,
                        section: secMatch ? secMatch[1].trim() : 'General',
                        qNum: qNumMatch ? qNumMatch[1] : '',
                        total: qNumMatch ? qNumMatch[2] : '',
                        prompt,
                        radios
                    };
                }""")

                if not data or not data.get('qid'):
                    print(f"⚠️ Không đọc được câu {q_idx}, dừng lại.")
                    break

                section = data['section']
                prompt = clean_text(data['prompt'])
                radios = [clean_text(r) for r in data['radios'] if r]
                qid = data['qid']
                nqid = data['nqid']

                print(f"[{q_idx}/{data['total']}] Section: {section} | QID: {qid}")

                # 2. Bấm "View Answer" để lấy đáp án đúng & giải thích
                with page.expect_navigation(wait_until="domcontentloaded", timeout=15000):
                    page.evaluate(f"submitQuestion('v', {qid})")

                # 3. Đọc đáp án và giải thích từ trang View Answer
                exp_data = page.evaluate("""() => {
                    const bodyText = document.body.innerText;
                    let explain = '';
                    let answer = '';

                    const expHeader = Array.from(document.querySelectorAll('h2, h3, b')).find(el => el.innerText.includes('Explanation'));
                    if (expHeader && expHeader.parentElement) {
                        explain = expHeader.parentElement.innerText.replace('Explanation', '').trim();
                    }

                    // Tìm "The correct answer is ..."
                    const ansMatch = bodyText.match(/The correct answer is\\s+([^\\.\\n]+)/i);
                    if (ansMatch) {
                        answer = ansMatch[1].trim();
                    }

                    return { explain, answer };
                }""")

                explanation = clean_text(exp_data.get('explain', ''))
                correct_text = exp_data.get('answer', '')

                # Xác định letter A/B/C/D thông minh dựa vào explanation
                correct_letter = "A"
                if radios:
                    exp_lower = explanation.lower()
                    best_letter = "A"
                    max_score = -1

                    for r_i, opt in enumerate(radios[:4]):
                        opt_lower = opt.lower()
                        score = 0
                        # Nếu từ trong option xuất hiện trong explanation
                        words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', opt_lower)]
                        for w in words:
                            if w in exp_lower:
                                score += 2
                        # Nếu option xuất hiện trọn vẹn trong explanation
                        if opt_lower in exp_lower:
                            score += 5
                        
                        if score > max_score and score > 0:
                            max_score = score
                            best_letter = ['A', 'B', 'C', 'D'][r_i]

                    correct_letter = best_letter

                # Map section sang Part chuẩn của TOEIC
                part_num = 5
                if 'Incomplete' in section or 'Error' in section:
                    part_num = 5
                elif 'Reading Comprehension' in section:
                    part_num = 7
                elif 'Photographs' in section:
                    part_num = 1
                elif 'Question-Response' in section:
                    part_num = 2
                elif 'Short Conversation' in section:
                    part_num = 3
                elif 'Short Talks' in section:
                    part_num = 4

                formatted_opts = []
                for idx, r in enumerate(radios[:4]):
                    letter = ['(A)', '(B)', '(C)', '(D)'][idx]
                    formatted_opts.append(f"{letter} {r}")

                # Đảm bảo đủ 4 options
                while len(formatted_opts) < 4:
                    letter = ['(A)', '(B)', '(C)', '(D)'][len(formatted_opts)]
                    formatted_opts.append(f"{letter} Option {letter}")

                q_record = {
                    "id": f"4tests-{qid}",
                    "source": "4tests",
                    "part": part_num,
                    "section": section,
                    "question": prompt or f"Select the correct answer for question {q_idx}",
                    "options": formatted_opts,
                    "answer": correct_letter,
                    "answerText": correct_text,
                    "explain": explanation or f"Đáp án đúng là {correct_text}.",
                    "crawled_at": time.strftime("%Y-%m-%dT%H:%M:%S")
                }
                questions_crawled.append(q_record)

                # 4. Chuyển sang câu tiếp theo
                if not nqid:
                    print("🏁 Đã đến câu cuối cùng của đề thi.")
                    break

                with page.expect_navigation(wait_until="domcontentloaded", timeout=15000):
                    page.evaluate(f"submitQuestion('n', {nqid})")

            except Exception as ex:
                print(f"❌ Lỗi khi xử lý câu {q_idx}: {ex}")
                break

        browser.close()

    # 5. Lưu toàn bộ dữ liệu cào được thành format TOEIC aggregate JSON
    output_data = {
        "metadata": {
            "source": "4tests.com",
            "total_crawled": len(questions_crawled),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
        },
        "reading": [
            {
                "source": "4tests",
                "type": "reading",
                "part": 5,
                "questions": [q for q in questions_crawled if q['part'] == 5]
            },
            {
                "source": "4tests",
                "type": "reading",
                "part": 7,
                "questions": [q for q in questions_crawled if q['part'] == 7]
            }
        ],
        "listening": [
            {
                "source": "4tests",
                "type": "listening",
                "part": q['part'],
                "questions": [q]
            } for q in questions_crawled if q['part'] in [1, 2, 3, 4]
        ],
        "all_questions": questions_crawled
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 CÀO THÀNH CÔNG {len(questions_crawled)} CÂU HỎI THẬT!")
    print(f"📁 Dữ liệu lưu tại: {OUTPUT_FILE}")

if __name__ == "__main__":
    count = 15
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
    run_crawler(count)
