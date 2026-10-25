import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PROD_URL = 'https://lingopro.online/practice/listening/video-sc-15';
const ARTIFACT_PATH = 'C:/Users/tapho/.gemini/antigravity/brain/36ebcdef-2855-40b3-b034-6dd32311e66b/live_sc15_cues.png';

async function main() {
  console.log('Launching browser to test live production video-sc-15...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${PROD_URL}...`);
    await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 45000 });

    // Wait for video title and transcript container
    await page.waitForSelector('h1', { timeout: 15000 });
    const title = await page.$eval('h1', (el) => el.textContent?.trim());
    console.log(`Page Title: "${title}"`);

    // Wait for transcript cues to load
    await page.waitForSelector('[data-cue-index]', { timeout: 15000 });

    // Get subtitle header text
    const headerText = await page.evaluate(() => {
      const el = document.querySelector('h3');
      return el ? el.textContent?.trim() : '';
    });
    console.log(`Transcript Header: "${headerText}"`);

    // Get first 6 cues timestamps and preview
    const cueInfo = await page.evaluate(() => {
      const cueElements = Array.from(document.querySelectorAll('[data-cue-index]')).slice(0, 8);
      return cueElements.map((el, i) => {
        const timeBadge = el.querySelector('span.font-mono')?.textContent?.trim() || '';
        const text = el.querySelector('.text-sm')?.textContent?.trim() || '';
        return { index: i, time: timeBadge, text: text.slice(0, 60) };
      });
    });

    console.log('First 8 cues on live production:');
    cueInfo.forEach((c) => console.log(`  [${c.index}] (${c.time}) ${c.text}`));

    // Click on cue index 4 (00:24) to simulate seeking to 00:24
    await page.evaluate(() => {
      const cue4 = document.querySelector('[data-cue-index="4"]');
      if (cue4) cue4.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    const isCue4Active = await page.evaluate(() => {
      const cue4 = document.querySelector('[data-cue-index="4"]');
      return cue4?.className.includes('border-indigo-500');
    });
    console.log('Is cue 4 (00:24) actively highlighted?:', isCue4Active);

    const SEEK_PATH = 'C:/Users/tapho/.gemini/antigravity/brain/36ebcdef-2855-40b3-b034-6dd32311e66b/live_sc15_cue4_active.png';
    await page.screenshot({ path: SEEK_PATH, fullPage: false });
    console.log(`Saved screenshot to ${SEEK_PATH}`);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

main();
