const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const TEST_EMAIL = 'onboarding-test@lingopro.vn';
const TEST_PASSWORD = 'password123';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'public', 'onboarding-test');

// Detect Chrome path on Windows
function getChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\tapho\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function runTest() {
  console.log('[DOMTest] Starting onboarding DOM test...');
  
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log('[DOMTest] Created screenshot directory:', SCREENSHOT_DIR);
  }

  const chromePath = getChromePath();
  if (!chromePath) {
    console.error('[DOMTest] Chrome executable not found in common Windows paths!');
    process.exit(1);
  }
  console.log('[DOMTest] Launching Chrome from:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // 1. Navigate to auth page
    console.log('[DOMTest] Navigating to login page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });
    
    // Fill credentials
    console.log('[DOMTest] Logging in...');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    
    // Click submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('[DOMTest] Login successful. Current URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_login_success.png') });

    // 2. Clear localStorage to trigger onboarding
    console.log('[DOMTest] Clearing localStorage key...');
    await page.evaluate(() => {
      localStorage.removeItem('lingopro_onboarding_completed');
    });

    // Reload page
    console.log('[DOMTest] Reloading dashboard...');
    await page.reload({ waitUntil: 'networkidle0' });

    // 3. Wait for welcome modal (1.5s delay)
    console.log('[DOMTest] Waiting for Welcome Modal to appear...');
    await page.waitForFunction(() => document.body.textContent.includes('Chào mừng'), { timeout: 10000 });
    // Add extra 500ms to let animations settle
    await delay(500);
    console.log('[DOMTest] Welcome Modal is now visible!');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '1_welcome_modal.png') });

    // Click "Bắt đầu! 🚀"
    console.log('[DOMTest] Clicking Bắt đầu...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Bắt đầu'));
      if (btn) btn.click();
      else console.error('Bắt đầu button not found!');
    });

    // 4. Spotlight steps loop
    const spotlightSteps = [
      { name: '2_spotlight_library', desc: 'Thư viện' },
      { name: '3_spotlight_learn', desc: 'Học từ' },
      { name: '4_spotlight_review', desc: 'Ôn tập' },
      { name: '5_spotlight_quiz', desc: 'Quiz' },
      { name: '6_spotlight_advanced', desc: 'Grammar & Speaking' }
    ];

    for (let i = 0; i < spotlightSteps.length; i++) {
      const step = spotlightSteps[i];
      await delay(1200); // wait for transitions
      console.log(`[DOMTest] Spotlight step ${i + 1}: ${step.desc}`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${step.name}.png`) });
      
      // Click "Tiếp"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('Tiếp') && !b.textContent.includes('Tiếp tục'));
        if (btn) btn.click();
        else console.error('Tiếp button not found!');
      });
    }

    // 5. Survey Modal
    console.log('[DOMTest] Waiting for Survey Modal...');
    await page.waitForFunction(() => document.body.textContent.includes('Khảo sát nhỏ'), { timeout: 5000 });
    await delay(400); // let modal zoom in settle
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '7_survey_modal.png') });

    // Select TikTok
    console.log('[DOMTest] Selecting TikTok option in survey...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('TikTok'));
      if (btn) btn.click();
      else console.error('TikTok option not found!');
    });

    // 5.5. Setup Modal (Notifications & PWA)
    console.log('[DOMTest] Waiting for Setup Modal...');
    await page.waitForFunction(() => document.body.textContent.includes('Bật Thông Báo & Cài App'), { timeout: 5000 });
    await delay(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '8_setup_modal.png') });

    // Click "Tiếp theo"
    console.log('[DOMTest] Clicking Tiếp theo in Setup Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Tiếp theo'));
      if (btn) btn.click();
      else console.error('Tiếp theo button not found!');
    });

    // 6. Reward Modal
    console.log('[DOMTest] Waiting for Reward Modal...');
    await page.waitForFunction(() => document.body.textContent.includes('Tuyệt vời!'), { timeout: 5000 });
    await delay(1200); // let count up XP finish
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '9_reward_modal.png') });

    // Click "Kích hoạt Pro 2 tuần"
    console.log('[DOMTest] Clicking Kích hoạt Pro 2 tuần...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Kích Hoạt 2 Tuần PRO'));
      if (btn) btn.click();
      else console.error('Kích hoạt button not found!');
    });

    // Wait for API activation request
    console.log('[DOMTest] Processing Pro activation...');
    await page.waitForFunction(() => document.body.textContent.includes('Kích hoạt Pro thành công!'), { timeout: 8000 });
    await delay(500); // let settle
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_activation_success.png') });

    // Complete onboarding
    console.log('[DOMTest] Clicking Bắt đầu học ngay to complete onboarding...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Bắt đầu học ngay'));
      if (btn) btn.click();
    });

    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_onboarding_finished.png') });
    console.log('[DOMTest] Onboarding finished successfully! All screenshots saved.');

  } catch (err) {
    console.error('[DOMTest] Error during test execution:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') });
  } finally {
    await browser.close();
    console.log('[DOMTest] Browser closed.');
  }
}

runTest();
