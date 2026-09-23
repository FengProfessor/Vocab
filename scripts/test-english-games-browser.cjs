// Run engine tests first, then this script with the Next dev server on port 3000.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const { GAME_TOPICS, GRAMMAR_PUZZLES, SENTENCE_PUZZLES, DETECTIVE_PUZZLES } = require('../tmp/english-games-test/data/english-games.js');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const text = () => page.evaluate(() => document.body.innerText);
  async function click(label) {
    const found = await page.evaluate((value) => {
      const target = [...document.querySelectorAll('button')].find((b) => !b.disabled && ((!b.hasAttribute('aria-label') && b.textContent.trim() === value) || b.getAttribute('aria-label') === value));
      if (!target) return false;
      target.click(); return true;
    }, label);
    assert.ok(found, `Button found: ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 65));
  }
  async function start(title) { await click(`Chơi ${title}`); await page.waitForSelector('fieldset'); }
  async function next() { await click((await text()).includes('Xem kết quả') ? 'Xem kết quả' : 'Câu tiếp theo'); }
  async function overflow() { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'No horizontal overflow'); }
  try {
    await page.setViewport({ width: 1365, height: 900 });
    await page.goto('http://localhost:3000/practice/games', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('article');
    assert.equal(await page.$$eval('article', (cards) => cards.length), 6);
    await overflow();
    await page.screenshot({ path: 'tmp/english-games-desktop.png', fullPage: true });
    await click('Ngữ pháp');
    assert.equal(await page.$$eval('article', (cards) => cards.length), 3);
    await click('Tất cả');
    await click('📚 Từ đã lưu');
    assert.match(await text(), /Đăng nhập để chơi/);
    await click('☀️ Đời sống');
    console.log('[EnglishGamesBrowser] PASS hub, filters, guest saved-word state, desktop layout');

    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: 'tmp/english-games-mobile.png', fullPage: true });
    await overflow();
    await start('Cầu ngữ pháp');
    for (let i = 0; i < 8; i++) {
      const prompt = await page.$eval('fieldset h2', (node) => node.textContent);
      const q = GRAMMAR_PUZZLES.find((q) => q.prompt === prompt);
      assert.ok(q);
      await click(i === 0 ? q.options.find((o) => o !== q.answer) : q.answer);
      assert.ok(await page.$('[role="status"]'));
      if (i === 0) { await page.screenshot({ path: 'tmp/english-games-feedback-mobile.png', fullPage: true }); await overflow(); }
      await next();
    }
    assert.match(await text(), /7\/8/);
    await click('Ôn lại 1 câu sai');
    const prompt = await page.$eval('fieldset h2', (node) => node.textContent);
    await click(GRAMMAR_PUZZLES.find((q) => q.prompt === prompt).answer);
    await next();
    assert.match(await text(), /Ôn lại hoàn tất/i);
    await click('Chọn game / chơi ván mới');
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('lingopro:english-games:v1:guest')).grammar > 0));
    console.log('[EnglishGamesBrowser] PASS grammar completion, wrong-answer review, retry, local record');

    for (const [mode, title] of [['scramble', 'Giải mã chữ cái'], ['sentence', 'Xưởng lắp ráp câu']]) {
      await start(title);
      for (let i = 0; i < 8; i++) {
        const prompt = await page.$eval('fieldset h2', (node) => node.textContent);
        const answer = mode === 'scramble' ? GAME_TOPICS.daily.words.find((w) => w.translation === prompt).word.toLowerCase() : SENTENCE_PUZZLES.find((q) => q.prompt === prompt).answer;
        for (const token of answer.split(mode === 'scramble' ? '' : ' ')) await click(token);
        await click('Kiểm tra đáp án');
        assert.match(await page.$eval('fieldset [role="status"]', (node) => node.textContent), /Chính xác/);
        await next();
      }
      assert.match(await text(), /8\/8/);
      await click('Chọn game / chơi ván mới');
      console.log(`[EnglishGamesBrowser] PASS ${mode} full session, duplicate tokens, scoring`);
    }

    await start('Thám tử săn lỗi');
    for (let i = 0; i < 8; i++) {
      const tokens = await page.$$eval('fieldset > div:first-child button:not(:disabled)', (buttons) => buttons.map((button) => button.textContent.trim()).filter((t) => !t.includes('Chưa biết')));
      const q = DETECTIVE_PUZZLES.find((q) => q.sentence === tokens.join(' '));
      assert.ok(q);
      await page.$$eval('fieldset > div:first-child button:not(:disabled)', (buttons, index) => buttons[index].click(), q.wrongIndex);
      await page.waitForSelector('fieldset [role="status"]');
      assert.match(await page.$eval('fieldset [role="status"]', (node) => node.textContent), /Chính xác/);
      await next();
    }
    assert.match(await text(), /8\/8/);
    await click('Chọn game / chơi ván mới');
    console.log('[EnglishGamesBrowser] PASS detective full session');

    await start('Đường đua từ vựng');
    const meaning = await page.$eval('fieldset h2', (node) => node.textContent);
    await click(GAME_TOPICS.daily.words.find((w) => w.translation === meaning).word);
    const clock = await page.$eval('[aria-label^="Còn "]', (node) => node.getAttribute('aria-label'));
    await new Promise((resolve) => setTimeout(resolve, 1200));
    assert.equal(await page.$eval('[aria-label^="Còn "]', (node) => node.getAttribute('aria-label')), clock);
    await next();
    await page.evaluate(() => { const original = Date.now; Date.now = () => original() + 61000; });
    await page.waitForFunction(() => document.body.innerText.includes('Hết giờ!'));
    assert.match(await text(), /1\/1/);
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('[EnglishGamesBrowser] PASS sprint pauses for feedback, expires, ignores unanswered item');

    await start('Lật thẻ tìm đôi');
    const known = new Map();
    const cardCount = await page.$$eval('fieldset button[aria-label]', (buttons) => buttons.length);
    for (let i = 0; i < cardCount; i += 2) {
      for (const at of [i, i + 1]) {
        await page.$$eval('fieldset button[aria-label]', (buttons, index) => buttons[index].click(), at);
        await new Promise((resolve) => setTimeout(resolve, 80));
        known.set(at, await page.$$eval('fieldset button[aria-label]', (buttons, index) => buttons[index].getAttribute('aria-label'), at));
      }
      await click('Lật tiếp');
    }
    for (const word of GAME_TOPICS.daily.words) {
      const left = [...known].find(([, value]) => value === word.word)?.[0];
      const right = [...known].find(([, value]) => value === word.translation)?.[0];
      if (left === undefined || right === undefined) continue;
      const disabled = await page.$$eval('fieldset button[aria-label]', (buttons, index) => buttons[index].disabled, left);
      if (disabled) continue;
      for (const at of [left, right]) {
        await page.$$eval('fieldset button[aria-label]', (buttons, index) => buttons[index].click(), at);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      await click((await text()).includes('Xem kết quả') ? 'Xem kết quả' : 'Lật tiếp');
    }
    assert.match(await text(), /Kết thúc ván chơi/i);
    await click('Chọn game / chơi ván mới');
    await start('Cầu ngữ pháp');
    await click('Rời ván chơi');
    assert.match(await text(), /Điểm của ván chưa hoàn thành/);
    await click('Tiếp tục chơi');
    await click('Rời ván chơi');
    await click('Rời ván');
    console.log('[EnglishGamesBrowser] PASS memory full session, exit confirmation, mobile layout');
    assert.deepEqual(errors, []);
    console.log('[EnglishGamesBrowser] PASS all 6 games; 0 uncaught browser errors');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });
