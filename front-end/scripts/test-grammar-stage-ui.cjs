const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/grammar/learn', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Lộ trình ngữ pháp theo cấp độ'));
    const result = await page.evaluate(() => ({
      stages: [...document.querySelectorAll('h3')].map((element) => element.textContent).filter((label) => /^(A0|A1|A2|B1|B2) ·/.test(label ?? '')),
      a1Link: Boolean(document.querySelector('a[href="/grammar/foundation/a1"]')),
    }));
    if (result.stages.length !== 5 || !result.a1Link) throw new Error(JSON.stringify(result));
    console.log('[GrammarUI]', JSON.stringify(result));
    await page.goto('http://localhost:3000/grammar/learn?topic=countable-uncountable', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Học qua tình huống'), { timeout: 20000 });
    const micro = await page.evaluate(() => ({
      image: document.querySelector('main img')?.getAttribute('src') ?? null,
      listen: Boolean(document.querySelector('button[aria-label^="Nghe "]')),
      options: [...document.querySelectorAll('button')].filter((button) => button.textContent?.includes('Tôi') || button.textContent?.includes('nước')).length,
    }));
    if (!micro.image || !micro.listen || micro.options < 1) throw new Error(JSON.stringify(micro));
    console.log('[GrammarMicro]', JSON.stringify(micro));
    const imageResponse = await fetch('http://localhost:3000/grammar/topics/countable-uncountable/01.svg');
    const audioResponse = await fetch('http://localhost:3000/grammar/topics/countable-uncountable/01.mp3');
    if (imageResponse.status !== 200 || audioResponse.status !== 200) throw new Error('Grammar media HTTP failure');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Tôi có hai cuốn sách.')?.click());
    await page.waitForFunction(() => document.body.innerText.includes('Luyện câu đúng'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Luyện câu đúng'))?.click());
    await page.waitForFunction(() => document.body.innerText.includes('Câu nào đúng ngữ pháp?'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'I have two bottles of water.')?.click());
    await page.waitForFunction(() => document.body.innerText.includes('Thẻ tiếp theo'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Thẻ tiếp theo'))?.click());
    await page.waitForFunction(() => document.body.innerText.includes('Thẻ 2/4'));
    console.log('[GrammarMicro] answer feedback and next card OK, media 200');
    await page.goto('http://localhost:3000/grammar/learn?topic=hedging-language', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Học qua tình huống'), { timeout: 20000 });
    const upperLevel = await page.evaluate(() => ({
      heading: document.querySelector('header p')?.textContent ?? '',
      image: document.querySelector('main img')?.getAttribute('src') ?? null,
    }));
    if (!upperLevel.heading.startsWith('B2') || !upperLevel.image?.includes('/grammar/topics/hedging-language/')) throw new Error(JSON.stringify(upperLevel));
    console.log('[GrammarMicro] B2 route and media OK');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
