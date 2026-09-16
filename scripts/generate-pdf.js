const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

marked.setOptions({
  gfm: true,
  breaks: true,
});

async function buildPdf() {
  console.log('Starting PDF generation for Sát Thủ Bài Nghe TOEIC...');
  const mdPath = path.join(__dirname, '../docs/sat-thu-toeic-listening-lead-magnet.md');
  if (!fs.existsSync(mdPath)) {
    throw new Error('Master markdown not found at ' + mdPath);
  }

  const rawMd = fs.readFileSync(mdPath, 'utf8');
  const parsedHtml = marked.parse(rawMd);

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Bách Khoa Toàn Thư Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 - 2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }

    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 24pt;
      margin-bottom: 12pt;
      line-height: 1.25;
      page-break-after: avoid;
    }

    h2 {
      font-size: 13.5pt;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 18pt;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      border-bottom: 1.5pt solid #e2e8f0;
      page-break-after: avoid;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #312e81;
      margin-top: 14pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
    }

    h4 {
      font-size: 10pt;
      font-weight: 700;
      color: #047857;
      margin-top: 10pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }

    h5 {
      font-size: 9.5pt;
      font-weight: 600;
      color: #475569;
      margin-top: 8pt;
      margin-bottom: 3pt;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 7pt 0;
      text-align: justify;
    }

    strong {
      font-weight: 700;
      color: #0f172a;
    }

    em {
      font-style: italic;
    }

    a {
      color: #4f46e5;
      text-decoration: none;
    }

    blockquote {
      margin: 10pt 0;
      padding: 8pt 12pt;
      background: #f8fafc;
      border-left: 3pt solid #6366f1;
      border-radius: 0 4pt 4pt 0;
      color: #334155;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 3pt 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 14pt 0;
      font-size: 8pt;
      line-height: 1.45;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }

    th {
      background: #0f172a;
      color: #f8fafc;
      font-weight: 700;
      text-align: left;
      padding: 5pt 7pt;
      border: 0.5pt solid #334155;
    }

    td {
      padding: 4.5pt 6.5pt;
      border: 0.5pt solid #cbd5e1;
      vertical-align: top;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 8pt 10pt;
      border-radius: 4pt;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 7.5pt;
      line-height: 1.4;
      overflow-x: auto;
      margin: 8pt 0;
      page-break-inside: avoid;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #4338ca;
      padding: 1pt 3pt;
      border-radius: 2pt;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    ul, ol {
      margin: 0 0 8pt 0;
      padding-left: 18pt;
    }

    li {
      margin-bottom: 3pt;
    }

    hr {
      border: none;
      border-top: 1pt solid #cbd5e1;
      margin: 14pt 0;
    }
  </style>
</head>
<body>
  ${parsedHtml}
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const headerHtml = `
    <div style="font-size: 7.5pt; font-family: sans-serif; color: #94a3b8; width: 100%; padding: 0 20mm; display: flex; justify-content: space-between; border-bottom: 0.5pt solid #e2e8f0; padding-bottom: 4px;">
      <span>LingoPro EdTech Platform • Khảo Thí ETS 2024 - 2026</span>
      <span>BÁCH KHOA TOÀN THƯ: SÁT THỦ BÀI NGHE TOEIC</span>
    </div>
  `;

  const footerHtml = `
    <div style="font-size: 7.5pt; font-family: sans-serif; color: #94a3b8; width: 100%; padding: 0 20mm; display: flex; justify-content: space-between; border-top: 0.5pt solid #e2e8f0; padding-top: 4px;">
      <span>https://lingopro.vn/sat-thu-toeic-listening</span>
      <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `;

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '14mm',
      right: '14mm',
    },
    displayHeaderFooter: true,
    headerTemplate: headerHtml,
    footerTemplate: footerHtml,
  });

  await browser.close();

  const targets = [
    path.join(__dirname, '../docs/Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.pdf'),
    path.join(__dirname, '../public/downloads/Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.pdf'),
    path.join(__dirname, '../public/downloads/sat-thu-toeic-listening-lead-magnet.pdf'),
  ];

  for (const t of targets) {
    const dir = path.dirname(t);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(t, pdfBuffer);
    console.log('✔ Saved PDF (' + (pdfBuffer.length / 1024).toFixed(1) + ' KB) to ' + t);
  }

  console.log('PDF generation finished successfully!');
}

buildPdf().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
