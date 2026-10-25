import puppeteer from 'puppeteer';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/tapho/.gemini/antigravity/brain/7ad1c4cb-881c-4299-9a96-64c414c01e10';

async function main() {
  console.log('Launching browser for white-labeling verification...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture TOEIC Hub Page (Tabs and Dropdowns)
  console.log('1. Navigating to http://localhost:3000/toeic...');
  await page.goto('http://localhost:3000/toeic', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('button');

  const hubScreenshotPath = path.join(ARTIFACT_DIR, 'toeic_whitelabel_hub.png');
  await page.screenshot({ path: hubScreenshotPath, fullPage: false });
  console.log('✓ Captured hub screenshot:', hubScreenshotPath);

  // Switch to Tab 2 (Part Practice Configurator) to view the dropdown optgroups
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && text.includes('LUYỆN TẬP THEO 7 PART')) {
      await b.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));

  const partPracticeScreenshotPath = path.join(ARTIFACT_DIR, 'toeic_whitelabel_part_config.png');
  await page.screenshot({ path: partPracticeScreenshotPath, fullPage: false });
  console.log('✓ Captured part configurator screenshot:', partPracticeScreenshotPath);

  // 2. Capture Part Practice Exam Room with specific test estudyme-test-1
  console.log('2. Navigating to Part Practice exam room with specific test...');
  await page.goto('http://localhost:3000/toeic/exam/practice?part=5&testId=estudyme-test-1&limit=10&mode=practice', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  await page.waitForSelector('button');
  await new Promise((r) => setTimeout(r, 1500));

  // Find option A button and click it
  await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const optA = allButtons.find((b) => b.textContent && b.textContent.includes('productive'));
    if (optA) optA.click();
  });

  await new Promise((r) => setTimeout(r, 1000));

  const examScreenshotPath = path.join(ARTIFACT_DIR, 'toeic_whitelabel_exam_explanation.png');
  await page.screenshot({ path: examScreenshotPath, fullPage: false });
  console.log('✓ Captured exam explanation screenshot:', examScreenshotPath);

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Puppeteer capture error:', err);
  process.exit(1);
});
