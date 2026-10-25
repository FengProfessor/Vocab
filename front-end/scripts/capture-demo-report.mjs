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

    // 1. TOEIC Catalog Desktop (Clean Authentic Specs, No Fake FNV-1a)
    console.log('Capturing TOEIC Desktop...');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/toeic', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(outDir, 'demo_toeic_desktop.png'), fullPage: false });

    // 2. TOEIC Catalog Mobile
    console.log('Capturing TOEIC Mobile...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await sleep(1000);
    await page.screenshot({ path: path.join(outDir, 'demo_toeic_mobile.png'), fullPage: false });

    // 3. Password Recovery Card (Redesigned from barebones HTML to branded card)
    console.log('Capturing Password Recovery Desktop...');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/auth/forgot-password', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, 'demo_password_recovery.png'), fullPage: false });

    // 4. Library Mobile (Single Clean Sticky Header, No Double Header)
    console.log('Capturing Library Mobile...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/library', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(outDir, 'demo_library_mobile.png'), fullPage: false });

    // 5. Import Page Desktop (No Double Sticky Header)
    console.log('Capturing Import Page Desktop...');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/import', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, 'demo_import_desktop.png'), fullPage: false });

    // 6. Admin Portal Layout Desktop
    console.log('Capturing Admin Portal Desktop...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(outDir, 'demo_admin_portal.png'), fullPage: false });

    console.log('All screenshots captured successfully in', outDir);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error capturing demo screenshots:', err);
  process.exit(1);
});
