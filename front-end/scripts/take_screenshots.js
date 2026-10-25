const puppeteer = require('puppeteer');
const path = require('path');

const outputDir = 'C:/Users/tapho/.gemini/antigravity/brain/ef3d867c-9836-4e11-989f-7bd87d4cc2ce';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });

  console.log('Navigating to http://localhost:3000/grammar/learn ...');
  await page.goto('http://localhost:3000/grammar/learn', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // --- BUOI 1 ---
  console.log('Expanding Buoi 1 topic...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const t = btns.find(b => b.textContent.includes('Khởi động — Xương câu'));
    if (t) t.click();
  });
  await page.waitForSelector('.border-t.divide-y button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  console.log('Opening Buoi 1 lesson...');
  await page.evaluate(() => {
    const lessonBtn = document.querySelector('.border-t.divide-y button');
    if (lessonBtn) lessonBtn.click();
  });
  await page.waitForSelector('article h1', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Capturing Buoi 1 Summary...');
  await page.screenshot({ path: path.join(outputDir, '18_buoi01_clean_summary.png') });

  console.log('Switching to Buoi 1 Theory tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.textContent.includes('Lý thuyết chi tiết'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '19_buoi01_clean_theory_accordion.png') });

  // Return to topic list
  console.log('Returning to topic list...');
  await page.evaluate(() => {
    const backBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Lộ trình'));
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // --- BUOI 6 ---
  console.log('Expanding Buoi 6 topic...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const t = btns.find(b => b.textContent.includes('Câu Hỏi Đuôi Toàn Diện'));
    if (t) t.click();
  });
  await page.waitForSelector('.border-t.divide-y button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  console.log('Opening Buoi 6 lesson...');
  await page.evaluate(() => {
    const lessonBtn = document.querySelector('.border-t.divide-y button');
    if (lessonBtn) lessonBtn.click();
  });
  await page.waitForSelector('article h1', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Switching to Buoi 6 Summary/Trọng tâm tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sumBtn = btns.find(b => b.textContent.includes('Trọng tâm & Sơ đồ'));
    if (sumBtn) sumBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll down slightly to show Bẫy đề thi & Cặp đối chiếu
  await page.evaluate(() => window.scrollBy(0, 400));
  await new Promise(r => setTimeout(r, 500));
  console.log('Capturing Buoi 6 Summary with Traps...');
  await page.screenshot({ path: path.join(outputDir, '20_buoi06_clean_summary_traps.png') });

  // Scroll back up and switch to Lý thuyết tab
  await page.evaluate(() => window.scrollTo(0, 0));
  console.log('Switching to Buoi 6 Theory tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.textContent.includes('Lý thuyết chi tiết'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click Mở tất cả to expand all sections
  console.log('Clicking Mở tất cả in Buoi 6 theory...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expandAllBtn = btns.find(b => b.textContent.includes('Mở tất cả'));
    if (expandAllBtn) expandAllBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll down a bit to see expanded section content
  await page.evaluate(() => window.scrollBy(0, 350));
  await new Promise(r => setTimeout(r, 500));
  console.log('Capturing Buoi 6 expanded theory...');
  await page.screenshot({ path: path.join(outputDir, '21_buoi06_clean_theory_expanded.png') });

  // Open Quiz Modal
  console.log('Opening Quiz Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const quizBtn = btns.find(b => b.textContent.includes('Làm bài tập ngay'));
    if (quizBtn) quizBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing clean quiz modal...');
  await page.screenshot({ path: path.join(outputDir, '23_buoi06_clean_quiz_modal.png') });

  // Fill in gap and submit to trigger explanation
  console.log('Filling in gap and submitting...');
  await page.type('input[placeholder*="chỗ trống"]', "haven't you");
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const checkBtn = btns.find(b => b.textContent.includes('Kiểm tra đáp án'));
    if (checkBtn) checkBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing clean quiz explanation...');
  await page.screenshot({ path: path.join(outputDir, '24_buoi06_clean_quiz_explanation.png') });

  await browser.close();
  console.log('✅ Captured all clean screenshots successfully!');
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
