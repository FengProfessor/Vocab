const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const mdContent = fs.readFileSync('D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi/buoi01/03-SAU-BUOI-HOC/BTVN-buoi01-Combined.md', 'utf8');
  
  // Custom script to render markdown with marked.js inside the browser
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; margin: 0 auto; padding: 20px; color: #111; font-size: 14px; }
        h1, h2, h3 { color: #222; margin-top: 24px; }
        h1 { text-align: center; }
        p { margin-bottom: 12px; }
        strong { font-weight: 600; }
        hr { border: none; border-top: 1px solid #ccc; margin: 40px 0; page-break-before: always; }
      </style>
    </head>
    <body>
      <div id="content"></div>
      <script>
        // Replace --- with <hr> so we get a page break
        let rawMd = ${JSON.stringify(mdContent)};
        rawMd = rawMd.replace(/^---$/gm, '<hr>');
        document.getElementById('content').innerHTML = marked.parse(rawMd);
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ 
    path: 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi/buoi01/03-SAU-BUOI-HOC/phieu-baitap-buoi01.pdf', 
    format: 'A4', 
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  });
  
  await browser.close();
  console.log('PDF generated at D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi/buoi01/03-SAU-BUOI-HOC/phieu-baitap-buoi01.pdf');
})();
