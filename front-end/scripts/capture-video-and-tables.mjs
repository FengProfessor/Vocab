import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const outDir = 'C:\\Users\\tapho\\.gemini\\antigravity\\brain\\004ccdfd-5129-476a-b275-5e1f76fef44c\\screenshots';
fs.mkdirSync(outDir, { recursive: true });

const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dismissPwaBanners(page) {
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach((b) => {
      const t = (b.textContent || '').trim();
      if (t === '×' || t === '✕' || t.includes('Đóng') || t.includes('Cài')) {
        try { b.click(); } catch {}
        b.style.display = 'none';
      }
    });
    document.querySelectorAll('div').forEach((d) => {
      const t = d.textContent || '';
      if (t.includes('Cài LingoPro') && t.includes('Thêm vào màn hình')) {
        d.style.setProperty('display', 'none', 'important');
      }
    });
  });
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,920'],
    defaultViewport: { width: 1400, height: 920, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();

  // 1. Capture Video tab for Personal Pronouns
  console.log('1. Capturing Video tab for personal-pronouns...');
  await page.goto('http://localhost:3000/grammar', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await dismissPwaBanners(page);

  // Click first "Học lý thuyết" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.innerText || '').toUpperCase().includes('HỌC LÝ THUYẾT'));
    if (btn) btn.click();
  });
  await sleep(1500);

  // Click Video tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const videoBtn = btns.find((b) => (b.innerText || '').toUpperCase().includes('VIDEO BÀI GIẢNG'));
    if (videoBtn) videoBtn.click();
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '08_video_player_curated_youtube.png'),
    fullPage: false,
  });

  // 2. Scroll to show YouTube link attachment form
  console.log('2. Capturing YouTube attachment form...');
  await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = 380;
  });
  await sleep(800);
  await page.screenshot({
    path: path.join(outDir, '08b_video_attach_youtube_form.png'),
    fullPage: false,
  });

  // 3. Test attaching a custom YouTube link (e.g. YouTube short)
  console.log('3. Typing custom YouTube short URL into form...');
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Dán link YouTube"]');
    if (input) {
      input.value = 'https://www.youtube.com/shorts/sw63V_3i6aM';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '08c_custom_youtube_attached.png'),
    fullPage: false,
  });

  // Close modal by clicking X button (svg.lucide-x or top right button in fixed modal)
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed button svg')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1000);

  // 4. Capture dynamic Reference Table for Present Simple (Search & Open)
  console.log('4. Searching and opening Present Simple...');
  await page.evaluate(() => {
    const searchInput = document.querySelector('input[placeholder*="Tìm kiếm theo tên"]');
    if (searchInput) {
      searchInput.value = 'present simple';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1000);

  // Click "Học lý thuyết" on filtered card
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.innerText || '').toUpperCase().includes('HỌC LÝ THUYẾT'));
    if (btn) btn.click();
  });
  await sleep(1500);

  // Click Reference Table tab
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

  // 4b. Scroll down to show rules & common mistakes table for Present Simple
  console.log('4b. Capturing Present Simple rules & mistakes table...');
  await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = 380;
  });
  await sleep(1000);
  await page.screenshot({
    path: path.join(outDir, '09b_present_simple_rules_and_mistakes.png'),
    fullPage: false,
  });

  // 5. Check Video tab for Present Simple as well!
  console.log('5. Capturing Video tab for Present Simple...');
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

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
