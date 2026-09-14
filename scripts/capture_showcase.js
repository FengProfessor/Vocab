const puppeteer = require('puppeteer');
const path = require('path');

const outputDir = 'C:/Users/tapho/.gemini/antigravity/brain/ef3d867c-9836-4e11-989f-7bd87d4cc2ce';

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1.5 });

  console.log('1. Navigating to Grammar Topics list...');
  await page.goto('http://localhost:3000/grammar/learn', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outputDir, 'showcase_01_topics.png') });

  // --- BUOI 1 ---
  console.log('2. Opening Buoi 1...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const t = btns.find(b => b.textContent.includes('Khởi động — Xương câu'));
    if (t) t.click();
  });
  await page.waitForSelector('.border-t.divide-y button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const lessonBtn = document.querySelector('.border-t.divide-y button');
    if (lessonBtn) lessonBtn.click();
  });
  await page.waitForSelector('article h1', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, 'showcase_02_buoi01_overview.png') });

  // Buoi 1 Accordion
  console.log('3. Buoi 1 Theory Accordion...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.textContent.includes('Lý thuyết chi tiết'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, 'showcase_03_buoi01_accordion.png') });

  // --- BUOI 6 ---
  console.log('4. Returning to topics and opening Buoi 6...');
  await page.evaluate(() => {
    const backBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Lộ trình'));
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const t = btns.find(b => b.textContent.includes('Câu Hỏi Đuôi Toàn Diện'));
    if (t) t.click();
  });
  await page.waitForSelector('.border-t.divide-y button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const lessonBtn = document.querySelector('.border-t.divide-y button');
    if (lessonBtn) lessonBtn.click();
  });
  await page.waitForSelector('article h1', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1200));

  // Buoi 6 Traps & Pairs
  console.log('5. Buoi 6 Traps & Pairs...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sumBtn = btns.find(b => b.textContent.includes('Trọng tâm & Sơ đồ'));
    if (sumBtn) sumBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => window.scrollBy(0, 420));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outputDir, 'showcase_04_buoi06_traps.png') });

  // Buoi 6 Theory Expanded
  console.log('6. Buoi 6 Theory Expanded...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.textContent.includes('Lý thuyết chi tiết'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expandAllBtn = btns.find(b => b.textContent.includes('Mở tất cả'));
    if (expandAllBtn) expandAllBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollBy(0, 320));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outputDir, 'showcase_05_buoi06_expanded_theory.png') });

  // Split View (Desktop)
  console.log('7. Buoi 6 Split View...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const splitBtn = btns.find(b => b.textContent.includes('Split View') || b.textContent.includes('Vừa đọc vừa làm'));
    if (splitBtn) splitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, 'showcase_06_split_view.png') });

  // Quiz Modal & Instant Feedback
  console.log('8. Quiz Modal & Instant Feedback...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const quizBtn = btns.find(b => b.textContent.includes('Làm bài tập ngay'));
    if (quizBtn) quizBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  });
  await page.keyboard.type("haven't you", { delay: 20 });
  await new Promise(r => setTimeout(r, 400));
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, 'showcase_07_quiz_explanation.png') });

  // 9. Projector Mode (Chế độ máy chiếu chữ lớn)
  console.log('9. Projector Mode in Slide...');
  await page.evaluate(() => {
    const container = document.querySelector('.fixed.inset-0.z-50') || document;
    const btns = Array.from(container.querySelectorAll('button'));
    const projBtn = btns.find(b => b.title && b.title.includes('máy chiếu'));
    if (projBtn) projBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, 'showcase_08_projector_slide.png') });

  // 10. Question Selector Grid
  console.log('10. Question Selector Grid...');
  await page.evaluate(() => {
    const container = document.querySelector('.fixed.inset-0.z-50') || document;
    const btns = Array.from(container.querySelectorAll('button'));
    const gridBtn = btns.find(b => b.title && b.title.includes('nhảy nhanh'));
    if (gridBtn) gridBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, 'showcase_09_question_grid.png') });

  // 11. Worksheet Mode (Tờ đề bài tập cho lớp học)
  console.log('11. Worksheet Mode...');
  await page.evaluate(() => {
    const container = document.querySelector('.fixed.inset-0.z-50') || document;
    const btns = Array.from(container.querySelectorAll('button'));
    const closeGrid = btns.find(b => b.textContent.includes('Đóng') && b.className.includes('text-xs'));
    if (closeGrid) closeGrid.click();
    const wsBtn = btns.find(b => b.textContent.includes('Tờ Đề'));
    if (wsBtn) wsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outputDir, 'showcase_10_worksheet_mode.png') });

  // 12. Worksheet with Revealed Explanations
  console.log('12. Revealing answers in Worksheet Mode...');
  await page.evaluate(() => {
    const container = document.querySelector('.fixed.inset-0.z-50') || document;
    const btns = Array.from(container.querySelectorAll('button'));
    const revealBtns = btns.filter(b => b.textContent.includes('Xem đáp án'));
    if (revealBtns.length > 0) revealBtns[0].click();
    if (revealBtns.length > 1) revealBtns[1].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outputDir, 'showcase_11_worksheet_revealed.png') });

  await browser.close();
  console.log('Done all showcase screenshots!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
