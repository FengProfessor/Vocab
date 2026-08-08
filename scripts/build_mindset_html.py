import os

HTML_DOWNLOADS = r'C:\Users\tapho\Downloads\MINDSET_WRITING_SPEAKING.html'
HTML_LOCAL = r'd:\Vibe\Vocab\docs\ielts-research\MINDSET_WRITING_SPEAKING.html'

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MINDSET ĐÚNG CHO WRITING & SPEAKING IELTS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #111827;
            line-height: 1.6;
            margin: 0;
            padding: 40px 20px;
        }

        .container {
            max-width: 850px;
            margin: 0 auto;
        }

        header {
            border-bottom: 2px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 32px;
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }

        .subtitle {
            font-size: 14px;
            color: #4b5563;
            margin: 0;
        }

        .card {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 24px;
            margin-bottom: 28px;
            background-color: #ffffff;
        }

        .card-title {
            font-size: 18px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #111827;
            text-transform: uppercase;
        }

        .old-vs-new {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }

        .old-mindset {
            background-color: #fef2f2;
            border-left: 3px solid #ef4444;
            padding: 12px 16px;
            font-size: 13.5px;
        }

        .new-mindset {
            background-color: #f0fdf4;
            border-left: 3px solid #22c55e;
            padding: 12px 16px;
            font-size: 13.5px;
        }

        .pillar-title {
            font-weight: 700;
            font-size: 15px;
            margin-top: 16px;
            margin-bottom: 6px;
        }

        .formula-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 14px 18px;
            font-family: monospace;
            font-size: 14px;
            margin: 12px 0;
        }

        ul {
            margin: 0;
            padding-left: 20px;
        }

        li {
            margin-bottom: 8px;
            font-size: 14px;
        }

        .highlight-text {
            font-weight: 600;
            color: #111827;
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>BỘ MINDSET TƯ DUY NỀN TẢNG CHO WRITING & SPEAKING</h1>
        <p class="subtitle">Chìa khóa tháo gỡ sự sợ hãi, bí ý tưởng và ngập ngùng khi viết/nói tiếng Anh</p>
    </header>

    <!-- WRITING MINDSET -->
    <div class="card">
        <div class="card-title">✍️ 1. MINDSET CHO WRITING (KỸ NĂNG VIẾT)</div>

        <div class="old-vs-new">
            <div class="old-mindset">
                <b>❌ SA LẦM CŨ:</b><br>
                Nghĩ rằng viết IELTS phải dùng từ vựng khủng, câu rắc rối 4 dòng ➔ Dẫn đến viết sai ngữ pháp, lạc đề, bí ý tưởng.
            </div>
            <div class="new-mindset">
                <b>✅ TƯ DUY CHUẨN:</b><br>
                "Viết Đúng quan trọng hơn Viết Khủng". Câu ngắn đúng cấu trúc được điểm cao hơn câu dài rắc rối mà sai.
            </div>
        </div>

        <div class="pillar-title">📌 3 QUY TẮC VÀNG WRITING:</div>
        <ul>
            <li><span class="highlight-text">Quy tắc 1: Task 1 chỉ là Báo cáo Số liệu</span> — Tuyệt đối không đưa nhận định cá nhân ("tôi thấy...", "tôi nghĩ..."). Chỉ chọn cột Cao nhất, Thấp nhất, Xu hướng Tăng/Giảm để mô tả.</li>
            <li><span class="highlight-text">Quy tắc 2: Task 2 dùng Công thức PEEL</span> — Mỗi đoạn thân bài chỉ viết duy nhất 1 Ý CHÍNH, phát triển sâu theo 4 câu:</li>
        </ul>

        <div class="formula-box">
            <b>CÔNG THỨC PEEL (MỖI ĐOẠN THÂN BÀI 4 CÂU):</b><br>
            • Câu 1 (P - Point): Nêu ý chính trực tiếp (State your main point).<br>
            • Câu 2 (E - Explain): Giải thích tại sao lại như vậy (Why is this true?).<br>
            • Câu 3 (E - Example): Đưa 1 ví dụ thực tế cụ thể (Give a real-world example).<br>
            • Câu 4 (L - Link): Chốt lại câu kết nối về đề bài (Link back to prompt).
        </div>

        <ul>
            <li><span class="highlight-text">Quy tắc 3: Luôn dành 3 phút lập dàn ý</span> — Đừng viết ngay khi đọc đề! Hãy gạch ra giấy 2 ý chính trước khi đặt bút.</li>
        </ul>
    </div>

    <!-- SPEAKING MINDSET -->
    <div class="card">
        <div class="card-title">🗣️ 2. MINDSET CHO SPEAKING (KỸ NĂNG NÓI)</div>

        <div class="old-vs-new">
            <div class="old-mindset">
                <b>❌ SA LẦM CŨ:</b><br>
                Sợ nói sai từ vựng/ngữ pháp nên ngập ngùng ừ ữ, hoặc cố học thuộc lòng bài mẫu dài ngoẵng như học vẹt.
            </div>
            <div class="new-mindset">
                <b>✅ TƯ DUY CHUẨN:</b><br>
                Speaking là Trò Chuyện (Communication). Giám khảo chấm độ Trôi Chảy (Fluency). Nói sai 1 từ không sao, ngập ngùng 5 giây mới bị trừ điểm!
            </div>
        </div>

        <div class="pillar-title">📌 3 QUY TẮC VÀNG SPEAKING:</div>
        <ul>
            <li><span class="highlight-text">Quy tắc 1 (Part 1): Công thức A-E-E</span> — Không bao giờ trả lời 1 từ hay 1 câu cộc lốc! Tuân thủ 3 vế:</li>
        </ul>

        <div class="formula-box">
            <b>CÔNG THỨC A-E-E (SPEAKING PART 1):</b><br>
            Ví dụ câu hỏi: "Do you like rain?"<br>
            • A (Answer): "Yes, I absolutely love rainy days." (Trả lời trực tiếp)<br>
            • E (Explain): "Because it creates a cozy vibe to unwind at home." (Giải thích lý do)<br>
            • E (Example): "For instance, I enjoy sipping hot tea while reading." (Ví dụ bản thân)
        </div>

        <ul>
            <li><span class="highlight-text">Quy tắc 2 (Part 2): Kể một câu chuyện (Storytelling 4 bước)</span> — Đừng liệt kê ý khô khan. Hãy kể câu chuyện cá nhân trong 2 phút theo trình tự: <i>Bối cảnh ➔ Chi tiết ➔ Sự việc cao trào ➔ Cảm xúc bản thân</i>.</li>
            <li><span class="highlight-text">Quy tắc 3: Dùng từ nối câu kéo dài thời gian suy nghĩ</span> — Khi cần 1-2 giây nghĩ từ vựng, hãy dùng từ nối tự nhiên như: <i>"To be completely honest...", "That's an intriguing question...", "From my perspective..."</i> thay vì im lặng hoặc ừ ữ!</li>
        </ul>
    </div>
</div>

</body>
</html>
"""

with open(HTML_DOWNLOADS, 'w', encoding='utf-8') as f:
    f.write(html_content)

with open(HTML_LOCAL, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Writing & Speaking Mindset HTML generated successfully!")
