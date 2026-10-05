import puppeteer from 'puppeteer-core';
import path from 'path';

const outDir = 'C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4\\demo-shots';
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850, deviceScaleFactor: 1.5 },
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to TOEIC Exam Runner...');
    await page.goto('http://localhost:3000/toeic/exam/estudyme-test-1?mode=practice', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(3000);
    const shotPath = path.join(outDir, 'demo_toeic_exam_runner.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('Saved to', shotPath);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
