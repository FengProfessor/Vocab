import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const outDir = 'C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4\\demo-shots';
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850, deviceScaleFactor: 1.5 },
  });

  try {
    const page = await browser.newPage();

    // 1. TOEIC Exam Runner
    console.log('Capturing TOEIC Exam Runner...');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/toeic/exam/estudyme-test-1?mode=practice', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(outDir, 'demo_toeic_exam_runner.png'), fullPage: false });

    // 2. Challenge Portal (Clean schedule, no spam popups)
    console.log('Capturing Challenge Portal...');
    await page.goto('http://localhost:3000/challenge', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, 'demo_challenge_page.png'), fullPage: false });

    // 3. Grammar Portal
    console.log('Capturing Grammar Portal...');
    await page.goto('http://localhost:3000/grammar', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, 'demo_grammar_portal.png'), fullPage: false });

    console.log('Extra screenshots captured successfully in', outDir);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error capturing extra screenshots:', err);
  process.exit(1);
});
