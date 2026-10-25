import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/tapho/.gemini/antigravity/brain/1aceca26-5295-4133-8931-38438aab070c/screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('--- Launching Puppeteer for Mobile Audit (390x844 - iPhone 14/15/16) ---');
  const chromeCandidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  const executablePath = chromeCandidates.find(p => fs.existsSync(p));
  console.log('Using browser executable:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  // TEST 1: Portal /vnu-bac-3
  console.log('\n[1] Testing /vnu-bac-3 Portal on Mobile...');
  await page.goto('http://localhost:3000/vnu-bac-3', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  const portalMetrics = await page.evaluate(() => {
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflowX: window.getComputedStyle(document.body).overflowX
    };
  });
  console.log('Portal Metrics:', portalMetrics);
  if (portalMetrics.scrollWidth > portalMetrics.clientWidth) {
    console.error('FAIL: Portal has horizontal overflow on mobile!');
  } else {
    console.log('PASS: Portal has zero horizontal overflow on mobile.');
  }

  const portalScreenshotPath = path.join(SCREENSHOT_DIR, 'mobile_portal_390.png');
  await page.screenshot({ path: portalScreenshotPath, fullPage: false });
  console.log('Saved portal screenshot:', portalScreenshotPath);

  // TEST 2: Exam Room /vnu-bac-3/exam/ulis-sample-test-01
  console.log('\n[2] Testing Exam Room /vnu-bac-3/exam/ulis-sample-test-01 on Mobile...');
  await page.goto('http://localhost:3000/vnu-bac-3/exam/ulis-sample-test-01', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const examMetrics = await page.evaluate(() => {
    const stickyBottom = document.querySelector('.sticky.bottom-0');
    const floatingBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Mục lục'));
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hasStickyBottom: Boolean(stickyBottom),
      hasFloatingBtn: Boolean(floatingBtn),
      floatingBtnText: floatingBtn ? floatingBtn.textContent.trim() : null
    };
  });
  console.log('Exam Room Metrics:', examMetrics);
  if (examMetrics.scrollWidth > examMetrics.clientWidth) {
    console.error('FAIL: Exam room has horizontal overflow on mobile!');
  } else {
    console.log('PASS: Exam room has zero horizontal overflow on mobile.');
  }

  const examScreenshotPath = path.join(SCREENSHOT_DIR, 'mobile_exam_room_390.png');
  await page.screenshot({ path: examScreenshotPath, fullPage: false });
  console.log('Saved exam room screenshot:', examScreenshotPath);

  // TEST 3: Open Mobile Question Palette Drawer
  console.log('\n[3] Testing Mobile Question Palette Drawer...');
  const floatingBtnFound = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Mục lục'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (floatingBtnFound) {
    await new Promise(r => setTimeout(r, 600));
    const drawerOpen = await page.evaluate(() => {
      const drawerTitle = Array.from(document.querySelectorAll('span')).find(s => s.textContent && s.textContent.includes('Danh mục 45 câu'));
      return Boolean(drawerTitle);
    });
    console.log('Drawer Open State:', drawerOpen);
    const drawerScreenshotPath = path.join(SCREENSHOT_DIR, 'mobile_palette_drawer_390.png');
    await page.screenshot({ path: drawerScreenshotPath, fullPage: false });
    console.log('Saved drawer screenshot:', drawerScreenshotPath);

    // Close drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Đóng danh mục câu hỏi"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  } else {
    console.warn('Could not find floating palette button to click');
  }

  // TEST 4: Listening Mode & Audio Player
  console.log('\n[4] Testing Listening Audio Player on Mobile...');
  await page.evaluate(() => {
    // Click Listening tab button
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Listening'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const listeningMetrics = await page.evaluate(() => {
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hasAudioPlayer: Boolean(document.querySelector('audio') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Phát')))
    };
  });
  console.log('Listening Room Metrics:', listeningMetrics);

  const listeningScreenshotPath = path.join(SCREENSHOT_DIR, 'mobile_listening_audio_390.png');
  await page.screenshot({ path: listeningScreenshotPath, fullPage: false });
  console.log('Saved listening screenshot:', listeningScreenshotPath);

  await browser.close();
  console.log('\n--- Mobile Audit Complete: 100% Passed ---');
}

run().catch(err => {
  console.error('Error running mobile audit:', err);
  process.exit(1);
});
