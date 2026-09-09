import puppeteer from 'puppeteer';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/tapho/.gemini/antigravity/brain/7ad1c4cb-881c-4299-9a96-64c414c01e10';

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture /toeic Tab 2: New Part Practice Configurator (Full page)
  console.log('1. Navigating to http://localhost:3000/toeic?tab=practice_parts&part=1 ...');
  await page.goto('http://localhost:3000/toeic?tab=practice_parts&part=1', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));
  const path1 = path.join(ARTIFACT_DIR, 'toeic_part_practice_configurator.png');
  await page.screenshot({ path: path1, fullPage: true });
  console.log('Captured:', path1);

  // 2. Capture /toeic/exam/bank?part=1&limit=6&mode=practice
  console.log('2. Navigating to Part 1 Exam Room http://localhost:3000/toeic/exam/bank?part=1&limit=6&mode=practice ...');
  await page.goto('http://localhost:3000/toeic/exam/bank?part=1&limit=6&mode=practice', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)));
  const path2 = path.join(ARTIFACT_DIR, 'toeic_part1_exam_room.png');
  await page.screenshot({ path: path2, fullPage: false });
  console.log('Captured:', path2);

  // 3. Answer question and submit to test Part Practice Scorecard
  console.log('3. Answering question and submitting...');
  try {
    // Select option A for question 1
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('(Nghe phương án)')) {
        await b.click();
        console.log('Selected option A');
        break;
      }
    }
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1000)));

    // Click submit button in header
    for (const b of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Nộp bài') && !text.includes('ngay')) {
        await b.click();
        console.log('Clicked Nộp bài in header');
        break;
      }
    }
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));

    // In submit confirm modal, click confirm button "Nộp bài ngay"
    for (const b of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Nộp bài ngay')) {
        await b.click();
        console.log('Clicked Nộp bài ngay in modal');
        break;
      }
    }
    await page.evaluate(() => new Promise((r) => setTimeout(r, 4000)));
  } catch (err) {
    console.warn('Submit interaction warning:', err.message);
  }

  const path3 = path.join(ARTIFACT_DIR, 'toeic_part_practice_score_report.png');
  await page.screenshot({ path: path3, fullPage: true });
  console.log('Captured:', path3);

  // 4. Test Part 5 Practice Mode Instant Explanation
  console.log('4. Navigating to Part 5 Practice Mode http://localhost:3000/toeic/exam/bank?part=5&limit=5&mode=practice ...');
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (_) {}
  });
  await page.goto('http://localhost:3000/toeic/exam/bank?part=5&limit=5&mode=practice', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));

  // Click option B for question 1 (word "write")
  for (const b of await page.$$('button')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('write')) {
      await b.click();
      console.log('Clicked option B (write) in Part 5 practice');
      break;
    }
  }
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

  const path4 = path.join(ARTIFACT_DIR, 'toeic_practice_mode_instant_explanation.png');
  await page.screenshot({ path: path4, fullPage: false });
  console.log('Captured:', path4);

  await browser.close();
  console.log('Done capturing verification screenshots.');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
