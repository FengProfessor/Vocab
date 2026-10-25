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

async function capture() {
  console.log('Launching browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,920'],
    defaultViewport: { width: 1400, height: 920, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();

  // 1. Roadmap Overview Hub
  console.log('1. Capturing 01_roadmap_canonical_hub.png...');
  await page.goto('http://localhost:3000/grammar', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await dismissPwaBanners(page);
  await page.screenshot({
    path: path.join(outDir, '01_roadmap_canonical_hub.png'),
    fullPage: false,
  });

  // 2. CEFR Level Filtered (A0)
  console.log('2. Capturing 02_roadmap_cefr_a0_filtered.png...');
  await page.goto('http://localhost:3000/grammar?level=A0', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await dismissPwaBanners(page);
  await page.screenshot({
    path: path.join(outDir, '02_roadmap_cefr_a0_filtered.png'),
    fullPage: false,
  });

  // 3. Theory Drawer (Pedagogical Theory for personal-pronouns)
  console.log('3. Capturing 03_theory_drawer_pedagogical.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.innerText || '').toLowerCase().includes('học lý thuyết'));
    if (btn) btn.click();
  });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '03_theory_drawer_pedagogical.png'),
    fullPage: false,
  });

  // 4. Pronoun Matrix Reference Table
  console.log('4. Capturing 04_pronoun_matrix_paradigm_table.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find((b) => (b.innerText || '').includes('BẢNG TRA CỨU') || (b.innerText || '').includes('Bảng tra cứu'));
    if (tableBtn) tableBtn.click();
  });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '04_pronoun_matrix_paradigm_table.png'),
    fullPage: false,
  });

  // 4b. Pronoun Matrix 4 Golden Rules (Scrolled)
  console.log('4b. Capturing 04b_pronoun_matrix_rules.png...');
  await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  });
  await sleep(1000);
  await page.screenshot({
    path: path.join(outDir, '04b_pronoun_matrix_rules.png'),
    fullPage: false,
  });

  // 4c. Verb to be Reference Table
  console.log('4c. Capturing 04c_verb_to_be_reference_table.png...');
  await page.goto('http://localhost:3000/grammar?topic=verb-to-be', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await dismissPwaBanners(page);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.innerText || '').toLowerCase().includes('học lý thuyết'));
    if (btn) btn.click();
  });
  await sleep(1000);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tableBtn = btns.find((b) => (b.innerText || '').includes('BẢNG TRA CỨU') || (b.innerText || '').includes('Bảng tra cứu'));
    if (tableBtn) tableBtn.click();
  });
  await sleep(1200);
  await page.screenshot({
    path: path.join(outDir, '04c_verb_to_be_reference_table.png'),
    fullPage: false,
  });

  // 5. Clean Real Photographs (No bureaucratic bar, student-focused)
  console.log('5. Capturing 05_vetted_media_real_photos.png...');
  await page.goto('http://localhost:3000/grammar?topic=personal-pronouns', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await dismissPwaBanners(page);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.innerText || '').toLowerCase().includes('học lý thuyết'));
    if (btn) btn.click();
  });
  await sleep(1000);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const mediaBtn = btns.find((b) => (b.innerText || '').includes('HÌNH ẢNH THỰC TẾ') || (b.innerText || '').includes('Hình ảnh thực tế'));
    if (mediaBtn) mediaBtn.click();
  });
  await sleep(2500);
  await page.screenshot({
    path: path.join(outDir, '05_vetted_media_real_photos.png'),
    fullPage: false,
  });

  // 5b. Real Photos Scrolled (Me & You)
  console.log('5b. Capturing 05b_vetted_media_he_she_it_photos.png...');
  await page.evaluate(() => {
    const scroller = document.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = 580;
  });
  await sleep(1200);
  await page.screenshot({
    path: path.join(outDir, '05b_vetted_media_he_she_it_photos.png'),
    fullPage: false,
  });

  // 6. Interactive Practice Runner
  console.log('6. Capturing 06_interactive_practice_runner.png...');
  await page.goto('http://localhost:3000/grammar/practice?topic=personal-pronouns', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await dismissPwaBanners(page);
  await page.screenshot({
    path: path.join(outDir, '06_interactive_practice_runner.png'),
    fullPage: false,
  });

  // 7. Feedback Drill (Clean "Giải thích:", "Lỗi hay gặp:")
  console.log('7. Capturing 07_pedagogical_feedback_drill.png...');
  const inputEl = await page.$('input[type="text"]');
  if (inputEl) {
    await page.type('input[type="text"]', 'They');
    await sleep(600);
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
  } else {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const opt = btns.find((b) => (b.innerText || '').includes('A.') || (b.innerText || '').includes('B.'));
      if (opt) opt.click();
    });
  }
  await sleep(2500);
  await page.screenshot({
    path: path.join(outDir, '07_pedagogical_feedback_drill.png'),
    fullPage: false,
  });

  console.log('All screenshots refreshed and saved successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
