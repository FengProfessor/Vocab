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
  // Split into individual pages
  const pageSections = rawMd.split(/<div\s+style=["']page-break-after:\s*always;?["']><\/div>/i);
  console.log(`Detected ${pageSections.length} structured page sections.`);

  const renderedPagesHtml = pageSections
    .map((sectionMd, idx) => {
      const html = marked.parse(sectionMd.trim());
      return `<div class="pdf-page" id="page-${idx + 1}">${html}</div>`;
    })
    .join('\n');

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

    @page {
      size: A4 portrait;
      margin-top: 14mm;
      margin-bottom: 14mm;
      margin-left: 12mm;
      margin-right: 12mm;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 8.8pt;
      line-height: 1.48;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
    }

    .pdf-page {
      page-break-after: always;
      break-after: page;
      position: relative;
      width: 100%;
      height: 269mm;
      max-height: 269mm;
      overflow: hidden;
      padding: 0;
      margin: 0;
    }

    .pdf-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4pt;
      margin-bottom: 8pt;
      line-height: 1.25;
      page-break-after: avoid;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 6pt;
      margin-bottom: 6pt;
      padding-bottom: 3pt;
      border-bottom: 1.2pt solid #e2e8f0;
      page-break-after: avoid;
    }

    h3 {
      font-size: 10.2pt;
      font-weight: 700;
      color: #312e81;
      margin-top: 6pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }

    h4 {
      font-size: 9.2pt;
      font-weight: 700;
      color: #047857;
      margin-top: 5pt;
      margin-bottom: 3pt;
      page-break-after: avoid;
    }

    h5 {
      font-size: 8.8pt;
      font-weight: 600;
      color: #475569;
      margin-top: 4pt;
      margin-bottom: 2pt;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 5pt 0;
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
      margin: 6pt 0;
      padding: 6pt 10pt;
      background: #f8fafc;
      border-left: 3pt solid #6366f1;
      border-radius: 0 4pt 4pt 0;
      color: #334155;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 2pt 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6pt 0 8pt 0;
      font-size: 7.6pt;
      line-height: 1.35;
      page-break-inside: avoid;
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
      padding: 4pt 6pt;
      border: 0.5pt solid #334155;
    }

    td {
      padding: 3.5pt 5.5pt;
      border: 0.5pt solid #cbd5e1;
      vertical-align: top;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 6pt 8pt;
      border-radius: 4pt;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 7pt;
      line-height: 1.35;
      overflow-x: auto;
      margin: 6pt 0;
      page-break-inside: avoid;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8pt;
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
      margin: 0 0 6pt 0;
      padding-left: 16pt;
    }

    li {
      margin-bottom: 2pt;
    }

    hr {
      border: none;
      border-top: 1pt solid #cbd5e1;
      margin: 8pt 0;
    }
  </style>
</head>
<body>
  ${renderedPagesHtml}
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  // Evaluate height of each page to ensure no content overflow
  const pageMetrics = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll('.pdf-page'));
    return pages.map((p, i) => ({
      index: i + 1,
      scrollHeight: p.scrollHeight,
      clientHeight: p.clientHeight,
      overflow: p.scrollHeight > p.clientHeight + 2,
    }));
  });

  console.log('--- Page Render Diagnostics ---');
  let hasOverflow = false;
  for (const m of pageMetrics) {
    if (m.overflow) {
      console.warn(`⚠️ Page ${m.index} overflows: scrollHeight=${m.scrollHeight}px > clientHeight=${m.clientHeight}px`);
      hasOverflow = true;
    } else {
      console.log(`✔ Page ${m.index}: fits perfectly (${m.scrollHeight}px / ${m.clientHeight}px)`);
    }
  }

  const headerHtml = `
    <div style="font-size: 7pt; font-family: sans-serif; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-bottom: 0.5pt solid #e2e8f0; padding-bottom: 3px;">
      <span>LingoPro EdTech Platform • Khảo Thí ETS 2024 - 2026</span>
      <span>CẨM NANG THỰC CHIẾN: SÁT THỦ BÀI NGHE TOEIC (15 TRANG)</span>
    </div>
  `;

  const footerHtml = `
    <div style="font-size: 7pt; font-family: sans-serif; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-top: 0.5pt solid #e2e8f0; padding-top: 3px;">
      <span>https://lingopro.vn/sat-thu-toeic-listening</span>
      <span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `;

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '14mm',
      bottom: '14mm',
      left: '12mm',
      right: '12mm',
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
