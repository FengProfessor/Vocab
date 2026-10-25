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

    // 1. Desktop view: Academic Reflex Arena
    console.log('Capturing Academic Reflex Arena Desktop...');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/practice/games', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    const dest1 = path.join(outDir, 'demo_academic_reflex_arena_desktop.png');
    await page.screenshot({ path: dest1, fullPage: false });
    fs.copyFileSync(dest1, path.join('C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4', 'demo_academic_reflex_arena_desktop.png'));
    console.log('Saved:', dest1);

    // 2. Mobile view: Academic Reflex Arena
    console.log('Capturing Academic Reflex Arena Mobile...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/practice/games', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    const dest2 = path.join(outDir, 'demo_academic_reflex_arena_mobile.png');
    await page.screenshot({ path: dest2, fullPage: false });
    fs.copyFileSync(dest2, path.join('C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4', 'demo_academic_reflex_arena_mobile.png'));
    console.log('Saved:', dest2);

    // 3. Interactive session: Start "Săn Bẫy Đề Thi Part 5"
    console.log('Capturing Interactive Session: Săn Bẫy Đề Thi Part 5...');
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/practice/games', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    // Find the button for "Săn Bẫy Đề Thi Part 5"
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      const aria = await page.evaluate(el => el.getAttribute('aria-label') || '', b);
      if (aria.includes('Săn Bẫy Đề Thi') || text.includes('Bắt đầu huấn luyện')) {
        // Let's click the detective one if possible
        if (aria.includes('Săn Bẫy') || text.includes('Bắt đầu huấn luyện')) {
          await b.click();
          break;
        }
      }
    }
    await sleep(2000);
    const dest3 = path.join(outDir, 'demo_academic_drill_session.png');
    await page.screenshot({ path: dest3, fullPage: false });
    fs.copyFileSync(dest3, path.join('C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4', 'demo_academic_drill_session.png'));
    console.log('Saved:', dest3);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

main();
