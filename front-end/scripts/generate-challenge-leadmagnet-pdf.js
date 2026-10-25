const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generateChallengeHandbookPdf() {
  console.log('Generating Sổ Tay 3000 Từ Vựng Trọng Tâm LingoPro PDF...');

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sổ Tay 3000 Từ Vựng Tiếng Anh Trọng Tâm - LingoPro</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      page-break-after: always;
      position: relative;
      padding: 20mm 18mm 18mm 18mm;
      overflow: hidden;
      background: #ffffff;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24mm 20mm;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .cover-title {
      font-size: 34pt;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.5px;
      margin-bottom: 16px;
    }

    .cover-title span {
      background: linear-gradient(90deg, #f59e0b, #fbbf24, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 13.5pt;
      line-height: 1.5;
      color: #cbd5e1;
      max-width: 90%;
      margin-bottom: 30px;
    }

    .cover-card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 20px;
    }

    .cover-card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 14px;
    }

    .cover-card-num {
      font-size: 18pt;
      font-weight: 800;
      color: #fbbf24;
      margin-bottom: 2px;
    }

    .cover-card-label {
      font-size: 8.5pt;
      color: #94a3b8;
      font-weight: 600;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9pt;
      color: #94a3b8;
    }

    /* Inner Pages Header / Footer */
    .page-header {
      position: absolute;
      top: 10mm;
      left: 18mm;
      right: 18mm;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .page-footer {
      position: absolute;
      bottom: 8mm;
      left: 18mm;
      right: 18mm;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
    }

    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 10px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 14px;
      margin-bottom: 8px;
      border-left: 3.5px solid #f59e0b;
      padding-left: 8px;
    }

    h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    p {
      font-size: 9pt;
      line-height: 1.55;
      color: #334155;
      margin-bottom: 8px;
    }

    .lead-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 12px;
      font-size: 8pt;
    }

    .table-custom th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 8px;
      text-align: left;
      font-weight: 700;
      border: 0.5px solid #334155;
    }

    .table-custom td {
      padding: 5px 8px;
      border: 0.5px solid #cbd5e1;
      vertical-align: top;
      line-height: 1.4;
    }

    .table-custom tr:nth-child(even) {
      background: #f8fafc;
    }

    .tag {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 700;
    }

    .tag-blue { background: #e0e7ff; color: #3730a3; }
    .tag-amber { background: #fef3c7; color: #92400e; }
    .tag-emerald { background: #d1fae5; color: #065f46; }

    .ipa {
      font-family: 'JetBrains Mono', monospace;
      color: #b45309;
      font-size: 7.5pt;
      font-weight: 600;
    }

    .contract-box {
      border: 2px dashed #f59e0b;
      background: #fffbeb;
      border-radius: 12px;
      padding: 16px;
      margin-top: 14px;
    }

    .voucher-stamp {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <!-- TRANG 1: BÌA SỔ TAY -->
  <div class="page cover-page">
    <div>
      <div class="cover-badge">★ Tài liệu độc quyền từ LingoPro Challenge</div>
      <div class="cover-title">
        SỔ TAY <span>3.000 TỪ VỰNG</span> TRỌNG TÂM
      </div>
      <div class="cover-subtitle">
        Lộ trình 3 Chặng Đột Phá bám sát chuẩn Oxford 3000™ và Ma trận đề thi ETS TOEIC 2024 - 2026. Xây dựng phản xạ từ vựng chỉ với 15 phút rèn luyện mỗi ngày.
      </div>

      <div class="cover-card-grid">
        <div class="cover-card">
          <div class="cover-card-num">34</div>
          <div class="cover-card-label">Chủ đề thực tế</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">3.000</div>
          <div class="cover-card-label">Từ vựng tần suất cao</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-num">100%</div>
          <div class="cover-card-label">Phiên âm IPA chuẩn</div>
        </div>
      </div>
    </div>

    <div>
      <div style="background: rgba(255, 255, 255, 0.08); padding: 14px 18px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
        <div style="font-size: 10pt; font-weight: 800; color: #fbbf24; margin-bottom: 4px;">QUY TẮC VÀNG CỦA KỶ LUẬT:</div>
        <div style="font-size: 8.5pt; color: #e2e8f0; line-height: 1.45;">
          "Học 15 phút mỗi ngày trong 180 ngày liên tục mang lại hiệu quả ghi nhớ gấp 10 lần so với nhồi nhét 5 tiếng vào cuối tuần rồi bỏ bẵng."
        </div>
      </div>

      <div class="cover-footer">
        <div><strong>LingoPro EdTech Platform</strong> • https://challenge.lingopro.online</div>
        <div>Phiên bản Khảo thí 2026</div>
      </div>
    </div>
  </div>

  <!-- TRANG 2: NGUYÊN LÝ SPACED REPETITION -->
  <div class="page">
    <div class="page-header">
      <span>LingoPro Challenge • Sổ Tay 3000 Từ Vựng</span>
      <span>Nguyên Lý Ghi Nhớ Khoa Học</span>
    </div>

    <h1>Phương Pháp Spaced Repetition & Đường Cong Quên Lãng</h1>
    
    <div class="lead-box">
      <p><strong>Vấn đề kinh điển của người học từ vựng:</strong> Cố gắng chép kín hàng chục trang sổ, nhưng chỉ sau 48 giờ não bộ đã quên mất hơn 70% lượng từ vựng vừa học. Đây là hiện tượng sinh học tự nhiên được nhà tâm lý học Hermann Ebbinghaus chứng minh qua <em>Đường cong quên lãng (Forgetting Curve)</em>.</p>
    </div>

    <h2>1. Tại sao lặp lại ngắt quãng (Spaced Repetition) lại hiệu quả?</h2>
    <p>Thay vì ôn tập dồn dập trong 1 ngày, thuật toán Spaced Repetition sẽ nhắc bạn ôn lại từ vựng vào <strong>đúng thời điểm não bộ chuẩn bị quên nó</strong>:</p>
    <ul style="padding-left: 20px; font-size: 8.5pt; line-height: 1.6; color: #334155; margin-bottom: 12px;">
      <li><strong>Lần ôn 1:</strong> Ngay sau khi học 15 phút.</li>
      <li><strong>Lần ôn 2:</strong> Sau 24 giờ (cố định vào buổi sáng hôm sau).</li>
      <li><strong>Lần ôn 3:</strong> Sau 3 ngày (khi thông tin bắt đầu phai nhạt).</li>
      <li><strong>Lần ôn 4:</strong> Sau 7 ngày (chuyển dần sang trí nhớ trung hạn).</li>
      <li><strong>Lần ôn 5:</strong> Sau 30 ngày (khắc sâu vĩnh viễn vào trí nhớ dài hạn).</li>
    </ul>

    <h2>2. Bố cục 3 Chặng Đột Phá Trong Thử Thách</h2>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 22%;">Chặng</th>
          <th style="width: 38%;">Phạm vi chủ đề</th>
          <th style="width: 20%;">Mục tiêu vốn từ</th>
          <th style="width: 20%;">Trình độ tương đương</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #4338ca;">Chặng 1: Nền Tảng</strong></td>
          <td>9 Chủ đề: Gia đình, Thời gian, Mua sắm, Đồ ăn, Đồ gia dụng, Sức khỏe...</td>
          <td><strong>1.000 từ đầu tiên</strong></td>
          <td><span class="tag tag-blue">A2 - B1 (TOEIC 450)</span></td>
        </tr>
        <tr>
          <td><strong style="color: #0369a1;">Chặng 2: Tăng Tốc</strong></td>
          <td>10 Chủ đề: Công sở, Nghề nghiệp, Công nghệ, Du lịch, Cảm xúc, Thể thao...</td>
          <td><strong>1.000 từ tiếp theo</strong></td>
          <td><span class="tag tag-amber">B1 - B2 (TOEIC 650)</span></td>
        </tr>
        <tr>
          <td><strong style="color: #b45309;">Chặng 3: Bứt Phá</strong></td>
          <td>15 Chủ đề: Kinh doanh, Đầu tư, AI & Khoa học, Pháp luật, Thuyết trình...</td>
          <td><strong>1.000 từ nâng cao</strong></td>
          <td><span class="tag tag-emerald">B2 - C1 (TOEIC 800+)</span></td>
        </tr>
      </tbody>
    </table>

    <h2>3. Thói quen 15 phút mỗi ngày</h2>
    <p>Chỉ cần mở ứng dụng LingoPro mỗi sáng hoặc giờ nghỉ trưa, hoàn thành 20 thẻ flashcard và 1 bài kiểm tra phản xạ 5 phút. Khi duy trì liên tục chuỗi ngày streak, bạn không chỉ làm chủ 3.000 từ mà còn nhận lại 100% tiền cọc!</p>

    <div class="page-footer">
      <span>Trang 2 • Bản quyền LingoPro</span>
      <span>https://challenge.lingopro.online</span>
    </div>
  </div>

  <!-- TRANG 3: TỪ VỰNG TIÊU BIỂU CHẶNG 1 & 2 -->
  <div class="page">
    <div class="page-header">
      <span>LingoPro Challenge • Sổ Tay 3000 Từ Vựng</span>
      <span>Trích Đoạn Từ Vựng Trọng Tâm</span>
    </div>

    <h1>Bộ Từ Vựng Thực Chiến ETS TOEIC Thường Gặp</h1>
    <p>Dưới đây là một số từ vựng tiêu biểu trích xuất từ 34 chủ đề cốt lõi kèm ngữ cảnh thi cử thực tế:</p>

    <h2>Chặng 1 & 2: Môi Trường Công Sở & Đời Sống</h2>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 18%;">Từ vựng & Loại</th>
          <th style="width: 18%;">Phiên âm IPA</th>
          <th style="width: 26%;">Ý nghĩa trọng tâm</th>
          <th style="width: 38%;">Câu ví dụ ngữ cảnh đề thi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>accommodate</strong> <span class="tag tag-blue">v</span></td>
          <td class="ipa">/əˈkɑː.mə.deɪt/</td>
          <td>Cung cấp chỗ ở; đáp ứng yêu cầu</td>
          <td>The conference hall can <em>accommodate</em> up to 500 attendees.</td>
        </tr>
        <tr>
          <td><strong>itinerary</strong> <span class="tag tag-blue">n</span></td>
          <td class="ipa">/aɪˈtɪn.ə.rer.i/</td>
          <td>Lịch trình chuyến đi chi tiết</td>
          <td>Please review the revised travel <em>itinerary</em> before boarding.</td>
        </tr>
        <tr>
          <td><strong>collaborate</strong> <span class="tag tag-blue">v</span></td>
          <td class="ipa">/kəˈlæb.ə.reɪt/</td>
          <td>Hợp tác làm việc cùng nhau</td>
          <td>Our marketing team will <em>collaborate</em> with the designers.</td>
        </tr>
        <tr>
          <td><strong>reimburse</strong> <span class="tag tag-blue">v</span></td>
          <td class="ipa">/ˌriː.ɪmˈbɜːrs/</td>
          <td>Hoàn trả lại chi phí đã chi</td>
          <td>The company will <em>reimburse</em> all valid travel expenses.</td>
        </tr>
        <tr>
          <td><strong>initiative</strong> <span class="tag tag-blue">n</span></td>
          <td class="ipa">/ɪˈnɪʃ.ə.tɪv/</td>
          <td>Sáng kiến, kế hoạch khởi xướng</td>
          <td>The CEO praised her green energy <em>initiative</em>.</td>
        </tr>
        <tr>
          <td><strong>mandatory</strong> <span class="tag tag-blue">adj</span></td>
          <td class="ipa">/ˈmæn.də.tɔːr.i/</td>
          <td>Bắt buộc theo quy định</td>
          <td>Attendance at the safety orientation is <em>mandatory</em>.</td>
        </tr>
      </tbody>
    </table>

    <h2>Chặng 3: Thương Mại, Tài Chính & Đàm Phán (TOEIC 750+)</h2>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 18%;">Từ vựng & Loại</th>
          <th style="width: 18%;">Phiên âm IPA</th>
          <th style="width: 26%;">Ý nghĩa trọng tâm</th>
          <th style="width: 38%;">Câu ví dụ ngữ cảnh đề thi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>lucrative</strong> <span class="tag tag-amber">adj</span></td>
          <td class="ipa">/ˈluː.krə.tɪv/</td>
          <td>Sinh lời cao, béo bở</td>
          <td>They successfully negotiated a <em>lucrative</em> export contract.</td>
        </tr>
        <tr>
          <td><strong>consolidate</strong> <span class="tag tag-amber">v</span></td>
          <td class="ipa">/kənˈsɑː.lɪ.deɪt/</td>
          <td>Hợp nhất, củng cố vị thế</td>
          <td>The firm merged branches to <em>consolidate</em> market share.</td>
        </tr>
        <tr>
          <td><strong>discrepancy</strong> <span class="tag tag-amber">n</span></td>
          <td class="ipa">/dɪˈskrep.ən.si/</td>
          <td>Sự khác biệt, sai lệch số liệu</td>
          <td>The audit revealed a slight <em>discrepancy</em> in the quarterly figures.</td>
        </tr>
        <tr>
          <td><strong>unprecedented</strong> <span class="tag tag-amber">adj</span></td>
          <td class="ipa">/ʌnˈpres.ə.den.tɪd/</td>
          <td>Chưa từng có tiền lệ</td>
          <td>The startup experienced <em>unprecedented</em> user growth.</td>
        </tr>
        <tr>
          <td><strong>contingency</strong> <span class="tag tag-amber">n</span></td>
          <td class="ipa">/kənˈtɪn.dʒən.si/</td>
          <td>Phương án dự phòng rủi ro</td>
          <td>We must prepare a <em>contingency</em> plan in case shipments stall.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-footer">
      <span>Trang 3 • Bản quyền LingoPro</span>
      <span>https://challenge.lingopro.online</span>
    </div>
  </div>

  <!-- TRANG 4: BẢN CAM KẾT KỶ LUẬT (LOSS AVERSION) -->
  <div class="page">
    <div class="page-header">
      <span>LingoPro Challenge • Sổ Tay 3000 Từ Vựng</span>
      <span>Bản Cam Kết Kỷ Luật Cá Nhân</span>
    </div>

    <h1>Bản Cam Kết Tự Rèn Luyện 180 Ngày</h1>
    <p>Hãy in trang này ra, điền tên và ký nhận, sau đó dán ngay trước bàn học để nhắc nhở bản thân mỗi khi có ý định lười biếng hay trì hoãn:</p>

    <div class="contract-box">
      <div style="text-align: center; font-size: 13pt; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 8px;">
        CAM KẾT VƯỢT QUA VÒNG LẶP TRÌ HOÃN
      </div>
      <p style="font-size: 9pt; color: #78350f; text-align: center; margin-bottom: 16px;">
        <em>"Tôi hiểu rằng sự kiên trì 15 phút mỗi ngày quý giá hơn bất kỳ khoá học đắt tiền nào."</em>
      </p>

      <div style="font-size: 9pt; line-height: 1.8; color: #1e293b;">
        <div>Tôi tên là: .....................................................................................................................................</div>
        <div>Mục tiêu tiếng Anh (TOEIC / Giao tiếp): ....................................................................................</div>
        <div>Thời gian học cố định trong ngày: .................. giờ .................. phút mỗi ngày.</div>
      </div>

      <div style="margin-top: 14px; font-size: 8.5pt; color: #334155; line-height: 1.6;">
        <strong>3 NGUYÊN TẮC BẤT DI BẤT DỊCH:</strong>
        <ol style="padding-left: 18px; margin-top: 4px;">
          <li>Không bao giờ để đứt chuỗi streak quá 1 ngày liên tục.</li>
          <li>Tập trung trọn vẹn 15 phút, không lướt mạng xã hội khi đang mở ứng dụng.</li>
          <li>Bền bỉ về đích để lấy lại 100% tiền cọc và chứng minh năng lực bản thân!</li>
        </ol>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 9pt;">
        <div>
          <div>Ngày bắt đầu: ...... / ...... / 2026</div>
        </div>
        <div style="text-align: center;">
          <div>Chữ ký người cam kết</div>
          <div style="height: 40px;"></div>
          <div>(Ký và ghi rõ họ tên)</div>
        </div>
      </div>
    </div>

    <!-- Voucher Stamp -->
    <div class="voucher-stamp">
      <div>
        <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">VOUCHER ĐẶC QUYỀN HỌC VIÊN</div>
        <div style="font-size: 16pt; font-weight: 800; font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px;">CHALLENGE50K</div>
        <div style="font-size: 8pt; opacity: 0.9;">Giảm trực tiếp 50.000đ khi đăng ký Thử Thách tại LingoPro</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11pt; font-weight: 800;">QUÉT MÃ / TRUY CẬP:</div>
        <div style="font-size: 8pt;">challenge.lingopro.online</div>
      </div>
    </div>

    <div class="page-footer">
      <span>Trang 4 • Bản quyền LingoPro</span>
      <span>https://challenge.lingopro.online</span>
    </div>
  </div>

</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await browser.close();

  const destinations = [
    path.join(__dirname, '../public/resources/So-Tay-3000-Tu-Vung-LingoPro.pdf'),
    path.join(__dirname, '../public/downloads/So-Tay-3000-Tu-Vung-LingoPro.pdf'),
  ];

  for (const dest of destinations) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dest, pdfBuffer);
    console.log(`Saved PDF to ${dest} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log('Finished generating Challenge Handbook PDF successfully!');
}

generateChallengeHandbookPdf().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
