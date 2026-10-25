import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const outDir = 'C:\\Users\\tapho\\.gemini\\antigravity\\brain\\004ccdfd-5129-476a-b275-5e1f76fef44c\\screenshots';
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,920'],
    defaultViewport: { width: 1400, height: 920, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/grammar', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // Directly open Present Simple card
  const opened = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(
      (d) => (d.innerText || '').includes('Present Simple') && (d.innerText || '').includes('HỌC LÝ THUYẾT')
    );
    if (cards.length > 0) {
      const targetCard = cards[cards.length - 1];
      const btn = Array.from(targetCard.querySelectorAll('button')).find((b) =>
        (b.innerText || '').toUpperCase().includes('HỌC LÝ THUYẾT')
      );
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('Opened Present Simple drawer:', opened);
  await sleep(1500);

  // 1. Capture Lý thuyết tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.innerText || '').toUpperCase().includes('LÝ THUYẾT CỐT LÕI'));
    if (btn) btn.click();
  });
  await sleep(1000);
  await page.screenshot({
    path: path.join(outDir, '11_present_simple_theory_tab.png'),
    fullPage: false,
  });

  // 2. Click Bảng tra cứu tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find((b) => (b.innerText || '').toUpperCase().includes('BẢNG TRA CỨU'));
    if (tableBtn) tableBtn.click();
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '09_present_simple_dynamic_table.png'),
    fullPage: false,
  });

  // 3. Scroll down to show rules & common mistakes
  await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = 320;
  });
  await sleep(1000);

  await page.screenshot({
    path: path.join(outDir, '09b_present_simple_rules_and_mistakes.png'),
    fullPage: false,
  });

  // 4. Click Video tab for Present Simple
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const videoBtn = btns.find((b) => (b.innerText || '').toUpperCase().includes('VIDEO BÀI GIẢNG'));
    if (videoBtn) videoBtn.click();
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '09c_present_simple_video_tab.png'),
    fullPage: false,
  });

  // 5. Click Hình ảnh & Ngữ cảnh tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const mediaBtn = btns.find((b) => (b.innerText || '').toUpperCase().includes('HÌNH ẢNH THỰC TẾ'));
    if (mediaBtn) mediaBtn.click();
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '12_present_simple_media_tab.png'),
    fullPage: false,
  });

  // 6. Also capture Articles (A / An / The)
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button svg.lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1000);

  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(
      (d) => (d.innerText || '').includes('Articles') && (d.innerText || '').includes('HỌC LÝ THUYẾT')
    );
    if (cards.length > 0) {
      const targetCard = cards[cards.length - 1];
      const btn = Array.from(targetCard.querySelectorAll('button')).find((b) =>
        (b.innerText || '').toUpperCase().includes('HỌC LÝ THUYẾT')
      );
      if (btn) btn.click();
    }
  });
  await sleep(1500);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find((b) => (b.innerText || '').toUpperCase().includes('BẢNG TRA CỨU'));
    if (tableBtn) tableBtn.click();
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '10_articles_reference_table.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('All targeted screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
