import puppeteer from 'puppeteer';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/tapho/.gemini/antigravity/brain/7ad1c4cb-881c-4299-9a96-64c414c01e10';

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Capture /toeic Tab 1: Full Test Catalog
  console.log('Navigating to http://localhost:3000/toeic ...');
  await page.goto('http://localhost:3000/toeic', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
  const path1 = path.join(ARTIFACT_DIR, 'toeic_catalog_full_tests.png');
  await page.screenshot({ path: path1, fullPage: false });
  console.log('Captured:', path1);

  // 2. Capture /toeic Tab 2: 7-Part Practice Catalog (Part 5 selected)
  console.log('Switching to Tab 2 (Part 5) ...');
  await page.goto('http://localhost:3000/toeic?tab=practice_parts&part=5', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
  const path2 = path.join(ARTIFACT_DIR, 'toeic_catalog_part5_practice.png');
  await page.screenshot({ path: path2, fullPage: false });
  console.log('Captured:', path2);

  // 3. Capture /toeic/exam/6852 (Split-Pane Exam Room Q1)
  console.log('Navigating to exam room http://localhost:3000/toeic/exam/6852 ...');
  await page.goto('http://localhost:3000/toeic/exam/6852', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));
  const path3 = path.join(ARTIFACT_DIR, 'toeic_exam_room_splitpane.png');
  await page.screenshot({ path: path3, fullPage: false });
  console.log('Captured:', path3);

  // 4. Open Question Palette in Exam Room
  console.log('Opening Question Palette ...');
  try {
    const paletteBtn = await page.$('button[title="Mở bảng câu hỏi"]');
    if (paletteBtn) {
      await paletteBtn.click();
      await page.evaluate(() => new Promise((r) => setTimeout(r, 1000)));
    }
  } catch (e) {
    console.log('Palette button click warning:', e.message);
  }
  const path4 = path.join(ARTIFACT_DIR, 'toeic_exam_room_palette.png');
  await page.screenshot({ path: path4, fullPage: false });
  console.log('Captured:', path4);

  // 5. Navigate to Part Practice exam room (Part 5 Set 1)
  console.log('Navigating to Part practice exam room ...');
  await page.goto('http://localhost:3000/toeic/exam/estudyme-part_5_incomplete_sentences-test-1?mode=practice', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));
  const path5 = path.join(ARTIFACT_DIR, 'toeic_part5_practice_exam.png');
  await page.screenshot({ path: path5, fullPage: false });
  console.log('Captured:', path5);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
