import os

HTML_DOWNLOADS = r'C:\Users\tapho\Downloads\HACKER_IELTS_10_WEEK_ROADMAP.html'
HTML_LOCAL = r'd:\Vibe\Vocab\docs\ielts-research\HACKER_IELTS_10_WEEK_ROADMAP.html'

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lộ Trình 10 Tuần Hacker IELTS — Hướng Dẫn Số Trang Chi Tiết</title>
    <style>
        :root {
            --bg: #ffffff;
            --text: #111827;
            --border: #e5e7eb;
            --subtext: #4b5563;
            --accent-bg: #f9fafb;
            --highlight: #111827;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.6;
            margin: 0;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        header {
            border-bottom: 2px solid var(--highlight);
            padding-bottom: 16px;
            margin-bottom: 32px;
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 14px;
            color: var(--subtext);
            margin: 0;
        }

        .books-list {
            background-color: var(--accent-bg);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px 20px;
            margin-bottom: 32px;
            font-size: 14px;
        }

        .books-list h3 {
            margin: 0 0 10px 0;
            font-size: 15px;
            font-weight: 600;
        }

        .books-list ul {
            margin: 0;
            padding-left: 20px;
        }

        .books-list li {
            margin-bottom: 6px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 700;
            border-bottom: 1px solid var(--highlight);
            padding-bottom: 6px;
            margin-top: 40px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .week-card {
            border: 1px solid var(--border);
            border-radius: 6px;
            margin-bottom: 24px;
            overflow: hidden;
        }

        .week-header {
            background-color: var(--accent-bg);
            padding: 12px 20px;
            font-weight: 700;
            font-size: 16px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .week-header .target {
            font-size: 13px;
            font-weight: 500;
            color: var(--subtext);
        }

        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .schedule-table th, .schedule-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
        }

        .schedule-table tr:last-child td {
            border-bottom: none;
        }

        .schedule-table th {
            background-color: #ffffff;
            font-weight: 600;
            color: var(--subtext);
            font-size: 13px;
            text-transform: uppercase;
        }

        .day-col {
            width: 15%;
            font-weight: 600;
            white-space: nowrap;
        }

        .skill-col {
            width: 20%;
            font-weight: 600;
        }

        .task-col {
            width: 65%;
        }

        .page-badge {
            display: inline-block;
            font-weight: 600;
            color: #000000;
            background-color: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
            margin-left: 4px;
        }

        .tip-box {
            background-color: #f3f4f6;
            border-left: 3px solid var(--highlight);
            padding: 12px 16px;
            font-size: 13px;
            margin-top: 32px;
            color: var(--subtext);
        }

        @media print {
            body { padding: 0; }
            .week-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>LỘ TRÌNH 10 TUẦN HỌC SÁCH HACKER IELTS</h1>
        <p class="subtitle">Hướng dẫn chi tiết từng ngày — Mở chính xác số trang trong sách gốc PDF / Sách giấy</p>
    </header>

    <div class="books-list">
        <h3>📂 DANH SÁCH 4 CUỐN SÁCH GỐC TRÊN MÁY TÍNH CỦA BẠN:</h3>
        <ul>
            <li>🎧 <b>Hacker IELTS Listening:</b> Thư mục <code>D:\\Download\\Hackers-IELTS-Listening.pdf</code> (164 trang)</li>
            <li>📖 <b>Hacker IELTS Reading:</b> Thư mục <code>D:\\Download\\Hacker IELTS READING.pdf</code> (528 trang)</li>
            <li>✍️ <b>Hacker IELTS Writing:</b> Thư mục <code>D:\\Download\\Hacker IELTS Writing.pdf</code> (300 trang)</li>
            <li>🗣️ <b>IELTS Speaking:</b> Thư mục <code>D:\\Download\\IELTS Speaking Recent Actual Tests & Suggested Answers.pdf</code> (160 MB)</li>
        </ul>
    </div>

    <!-- TUẦN 0 -->
    <div class="section-title">🎯 KIỂM TRA ĐẦU VÀO (DIAGNOSTIC TEST)</div>
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 0 — ĐÁNH GIÁ NĂNG LỰC XUẤT PHÁT</span>
            <span class="target">Mục tiêu: Tìm lỗ hổng kiến thức</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">NGÀY HỌC</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Ngày 1</td>
                    <td class="skill-col">Listening</td>
                    <td class="task-col">Mở sách <b>Hacker Listening</b> ➔ Mở <span class="page-badge">Trang 21 – 27</span> (Bài Diagnostic Test 40 câu). Bấm giờ 30 phút.</td>
                </tr>
                <tr>
                    <td class="day-col">Ngày 2</td>
                    <td class="skill-col">Reading</td>
                    <td class="task-col">Mở sách <b>Hacker Reading</b> ➔ Mở <span class="page-badge">Trang 20 – 35</span> (Diagnostic Test Passages 1, 2, 3). Bấm giờ 60 phút.</td>
                </tr>
                <tr>
                    <td class="day-col">Ngày 3</td>
                    <td class="skill-col">Writing</td>
                    <td class="task-col">Mở sách <b>Hacker Writing</b> ➔ Mở <span class="page-badge">Trang 18 – 25</span> (Diagnostic Test Task 1 & Task 2).</td>
                </tr>
                <tr>
                    <td class="day-col">Ngày 4</td>
                    <td class="skill-col">Speaking</td>
                    <td class="task-col">Mở sách <b>IELTS Speaking</b> ➔ Mở <span class="page-badge">Trang 15 – 22</span> (Diagnostic Test Part 1, 2, 3). Ghi âm câu trả lời.</td>
                </tr>
                <tr>
                    <td class="day-col">Ngày 5</td>
                    <td class="skill-col">Chữa bài</td>
                    <td class="task-col">Tra đáp án ở cuối mỗi cuốn sách. Đếm số câu đúng, ghi lại dạng bài làm sai nhiều nhất.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- GIAI ĐOẠN 1 -->
    <div class="section-title">📚 GIAI ĐOẠN 1: XÂY NỀN TẢNG (TUẦN 1 – TUẦN 3)</div>

    <!-- TUẦN 1 -->
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 1 — DẠNG CÂU HỎI TRẮC NGHIỆM & NỀN TẢNG TASK 1 / PART 1</span>
            <span class="target">Target Band: 4.0 - 4.5</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">THỨ / NGÀY</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Thứ 2</td>
                    <td class="skill-col">Listening (Ch 1)</td>
                    <td class="task-col">Mở <b>Hacker Listening</b> ➔ Học chiến thuật Multiple Choice <span class="page-badge">Trang 28 – 35</span>. Làm bài tập <span class="page-badge">Trang 36 – 43</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 3</td>
                    <td class="skill-col">Reading (Ch 1)</td>
                    <td class="task-col">Mở <b>Hacker Reading</b> ➔ Học chiến thuật Multiple Choice <span class="page-badge">Trang 36 – 48</span>. Đọc bài mẫu & làm bài tập <span class="page-badge">Trang 49 – 65</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 4</td>
                    <td class="skill-col">Writing (Task 1)</td>
                    <td class="task-col">Mở <b>Hacker Writing</b> ➔ Dạng Line Graph & Từ vựng xu hướng <span class="page-badge">Trang 28 – 42</span>. Thực hành viết <span class="page-badge">Trang 43 – 50</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 5</td>
                    <td class="skill-col">Speaking (Part 1)</td>
                    <td class="task-col">Mở <b>IELTS Speaking</b> ➔ Học công thức A-E-E <span class="page-badge">Trang 24 – 38</span>. Trả lời 8 câu hỏi Work/Study & Hometown <span class="page-badge">Trang 39 – 45</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 6 & 7</td>
                    <td class="skill-col">Ôn tập & Chữa bài</td>
                    <td class="task-col">Listening Script <span class="page-badge">Trang 174 – 185</span>. Reading Đáp án chi tiết <span class="page-badge">Trang 450 – 462</span>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- TUẦN 2 -->
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 2 — DẠNG CÂU HỎI ĐIỀN BỂU MẪU & BIỂU ĐỒ SO SÁNH</span>
            <span class="target">Target Band: 4.5 - 5.0</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">THỨ / NGÀY</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Thứ 2</td>
                    <td class="skill-col">Listening (Ch 2)</td>
                    <td class="task-col">Mở <b>Hacker Listening</b> ➔ Dạng Note/Form Completion <span class="page-badge">Trang 44 – 52</span>. Làm bài tập <span class="page-badge">Trang 53 – 59</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 3</td>
                    <td class="skill-col">Reading (Ch 2)</td>
                    <td class="task-col">Mở <b>Hacker Reading</b> ➔ Dạng True / False / Not Given <span class="page-badge">Trang 66 – 82</span>. Làm bài tập <span class="page-badge">Trang 83 – 102</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 4</td>
                    <td class="skill-col">Writing (Task 1)</td>
                    <td class="task-col">Mở <b>Hacker Writing</b> ➔ Dạng Bar Chart & Pie Chart <span class="page-badge">Trang 52 – 70</span>. Thực hành viết bài <span class="page-badge">Trang 71 – 80</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 5</td>
                    <td class="skill-col">Speaking (Part 1)</td>
                    <td class="task-col">Mở <b>IELTS Speaking</b> ➔ Chủ đề Free time & Accommodation <span class="page-badge">Trang 46 – 60</span>. Luyện ngữ điệu & nối âm.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 6 & 7</td>
                    <td class="skill-col">Ôn tập & Chữa bài</td>
                    <td class="task-col">Nghe lại Audio các câu sai + Đọc phần giải thích chi tiết ở cuối sách.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- TUẦN 3 -->
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 3 — DẠNG BẢN ĐỒ (MAP) & BẢNG SỐ LIỆU (TABLE)</span>
            <span class="target">Target Band: 5.0 - 5.5</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">THỨ / NGÀY</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Thứ 2</td>
                    <td class="skill-col">Listening (Ch 3&6)</td>
                    <td class="task-col">Mở <b>Hacker Listening</b> ➔ Table Completion <span class="page-badge">Trang 60 – 71</span> & Map Labelling <span class="page-badge">Trang 100 – 111</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 3</td>
                    <td class="skill-col">Reading (Ch 3)</td>
                    <td class="task-col">Mở <b>Hacker Reading</b> ➔ Dạng Matching Headings <span class="page-badge">Trang 104 – 125</span>. Phân biệt ý chính vs chi tiết.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 4</td>
                    <td class="skill-col">Writing (Task 1)</td>
                    <td class="task-col">Mở <b>Hacker Writing</b> ➔ Dạng Table & Combination Chart <span class="page-badge">Trang 82 – 105</span>. So sánh đa chiều.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 5</td>
                    <td class="skill-col">Speaking (Part 1)</td>
                    <td class="task-col">Mở <b>IELTS Speaking</b> ➔ Chủ đề Daily Routine & Weather <span class="page-badge">Trang 62 – 78</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 6 & 7</td>
                    <td class="skill-col">Ôn tập & Chữa bài</td>
                    <td class="task-col">Tổng hợp 50 từ vựng ăn điểm thu hoạch trong tuần.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- GIAI ĐOẠN 2 -->
    <div class="section-title">🚀 GIAI ĐOẠN 2: MỞ RỘNG KỸ NĂNG (TUẦN 4 – TUẦN 6)</div>

    <!-- TUẦN 4 -->
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 4 — QUY TRÌNH (PROCESS), BẢN ĐỒ & CUE CARD 2 PHÚT</span>
            <span class="target">Target Band: 5.5 - 6.0</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">THỨ / NGÀY</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Thứ 2</td>
                    <td class="skill-col">Listening (Ch 4&5)</td>
                    <td class="task-col">Mở <b>Hacker Listening</b> ➔ Summary Completion <span class="page-badge">Trang 72 – 87</span> & Matching <span class="page-badge">Trang 88 – 99</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 3</td>
                    <td class="skill-col">Reading (Ch 4&5)</td>
                    <td class="task-col">Mở <b>Hacker Reading</b> ➔ Matching Information <span class="page-badge">Trang 126 – 150</span> & Summary Box <span class="page-badge">Trang 151 – 175</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 4</td>
                    <td class="skill-col">Writing (Task 1)</td>
                    <td class="task-col">Mở <b>Hacker Writing</b> ➔ Process Diagram & Map Transformation <span class="page-badge">Trang 106 – 135</span>. Dùng thể bị động.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 5</td>
                    <td class="skill-col">Speaking (Part 2)</td>
                    <td class="task-col">Mở <b>IELTS Speaking</b> ➔ Khung dàn ý 4 bước Part 2 (Chủ đề Chuyến đi/Kỷ niệm) <span class="page-badge">Trang 80 – 98</span>. Bấm giờ 2m.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 6 & 7</td>
                    <td class="skill-col">Ôn tập & Chữa bài</td>
                    <td class="task-col">Đối chiếu bài mẫu Task 1 & chỉnh sửa lỗi phát âm bài nói Part 2.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- TUẦN 5 -->
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 5 — OPINION ESSAY (TASK 2) & BÀI GIẢNG HỌC THUẬT PART 4</span>
            <span class="target">Target Band: 6.0</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">THỨ / NGÀY</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Thứ 2</td>
                    <td class="skill-col">Listening (Ch 7)</td>
                    <td class="task-col">Mở <b>Hacker Listening</b> ➔ Short Answer Questions <span class="page-badge">Trang 112 – 125</span>. Nghe bắt từ khóa bài giảng Part 4.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 3</td>
                    <td class="skill-col">Reading (Ch 6&7)</td>
                    <td class="task-col">Mở <b>Hacker Reading</b> ➔ Sentence Completion <span class="page-badge">Trang 176 – 195</span> & Matching Features <span class="page-badge">Trang 196 – 210</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 4</td>
                    <td class="skill-col">Writing (Task 2)</td>
                    <td class="task-col">Mở <b>Hacker Writing</b> ➔ Dạng Opinion Essay (PEEL Outline) <span class="page-badge">Trang 136 – 168</span>. Viết bài hoàn chỉnh.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 5</td>
                    <td class="skill-col">Speaking (Part 2)</td>
                    <td class="task-col">Mở <b>IELTS Speaking</b> ➔ Cue Cards chủ đề Person & Place <span class="page-badge">Trang 100 – 122</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 6 & 7</td>
                    <td class="skill-col">Ôn tập & Chữa bài</td>
                    <td class="task-col">Tra đáp án Reading <span class="page-badge">Trang 450 – 528</span> & Bài mẫu Writing Task 2 <span class="page-badge">Trang 281 – 300</span>.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- TUẦN 6 -->
    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 6 — DISCUSSION ESSAY & THẢO LUẬN XÃ HỘI PART 3</span>
            <span class="target">Target Band: 6.0 - 6.5</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">THỨ / NGÀY</th>
                    <th class="skill-col">KỸ NĂNG</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG CẦN MỞ</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Thứ 2</td>
                    <td class="skill-col">Listening (Review)</td>
                    <td class="task-col">Mở <b>Hacker Listening</b> ➔ Review tổng hợp các dạng bài <span class="page-badge">Trang 126 – 135</span>. Bấm giờ 30 phút.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 3</td>
                    <td class="skill-col">Reading (Ch 8&9)</td>
                    <td class="task-col">Mở <b>Hacker Reading</b> ➔ Note/Table Completion & Short Answer <span class="page-badge">Trang 211 – 250</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 4</td>
                    <td class="skill-col">Writing (Task 2)</td>
                    <td class="task-col">Mở <b>Hacker Writing</b> ➔ Dạng Discussion Essay (Discuss Both Views) <span class="page-badge">Trang 170 – 200</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 5</td>
                    <td class="skill-col">Speaking (Part 3)</td>
                    <td class="task-col">Mở <b>IELTS Speaking</b> ➔ Kỹ thuật trả lời Part 3 (Compare Past vs Present / Future Predictions) <span class="page-badge">Trang 124 – 145</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Thứ 6 & 7</td>
                    <td class="skill-col">Ôn tập & Chữa bài</td>
                    <td class="task-col">Chữa chi tiết bài viết Task 2 và ghi chép từ vựng học thuật.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- GIAI ĐOẠN 3 -->
    <div class="section-title">🏆 GIAI ĐOẠN 3: LUYỆN ĐỀ MASTERY (TUẦN 7 – TUẦN 10)</div>

    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 7 ĐẾN TUẦN 9 — GIẢI ĐỀ THI THẬT (ACTUAL TESTS) BẤM GIỜ</span>
            <span class="target">Target Band: 6.5 - 7.0+</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th class="day-col">KỸ NĂNG</th>
                    <th class="skill-col">SÁCH CẦN MỞ</th>
                    <th class="task-col">NỘI DUNG & SỐ TRANG GIẢI ĐỀ CHI TIẾT</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="day-col">Listening</td>
                    <td class="skill-col">Hacker Listening</td>
                    <td class="task-col">Mở <span class="page-badge">Trang 126 – 135</span> (Làm 3 đề Actual Test 1, 2, 3). Bấm giờ đúng 30 phút. Tra Script <span class="page-badge">Trang 174 – 220</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Reading</td>
                    <td class="skill-col">Hacker Reading</td>
                    <td class="task-col">Mở <span class="page-badge">Trang 251 – 320</span> (Làm các bài Actual Test Passages 1-3). Bấm giờ đúng 60 phút. Tra đáp án <span class="page-badge">Trang 450 – 528</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Writing</td>
                    <td class="skill-col">Hacker Writing</td>
                    <td class="task-col">Mở <span class="page-badge">Trang 202 – 280</span> (Luyện đề Advantages/Disadvantages, Problem/Solution, Two-part). Tra bài mẫu Band 8.0+ <span class="page-badge">Trang 281 – 300</span>.</td>
                </tr>
                <tr>
                    <td class="day-col">Speaking</td>
                    <td class="skill-col">IELTS Speaking</td>
                    <td class="task-col">Mở <span class="page-badge">Trang 146 – 180</span> (Thực hành trọn vẹn 20 bộ đề thi thật Part 1, 2, 3).</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="week-card">
        <div class="week-header">
            <span>TUẦN 10 — TỔNG ÔN & THI MÔ PHỎNG PHÒNG THI THẬT</span>
            <span class="target">Target Band: 7.0 - 7.5+</span>
        </div>
        <table class="schedule-table">
            <tbody>
                <tr>
                    <td class="day-col">Cả Tuần</td>
                    <td class="skill-col">LingoPro Web App</td>
                    <td class="task-col">Thi thử trực tuyến bộ Cambridge 15 - 18 trên Web App <code>http://localhost:3000</code> để rèn phản xạ phòng thi thực tế.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="tip-box">
        <b>💡 MẸO TRA ĐÁP ÁN NẠP KIẾN THỨC BẰNG SÁCH GỐC:</b><br>
        • <b>Hacker Listening:</b> Trang 136 – 173 & 174 – 220 (Audio Script + Giải thích chi tiết tiếng Việt).<br>
        • <b>Hacker Reading:</b> Trang 450 – 528 (Giải thích chứng cứ câu hỏi & Bài dịch tiếng Việt).<br>
        • <b>Hacker Writing:</b> Trang 281 – 300 (Bài mẫu Band 8.0+ & Bộ từ vựng Collocations).
    </div>

</div>

</body>
</html>
"""

with open(HTML_DOWNLOADS, 'w', encoding='utf-8') as f:
    f.write(html_content)

with open(HTML_LOCAL, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Minimal HTML Roadmap generated successfully!")
