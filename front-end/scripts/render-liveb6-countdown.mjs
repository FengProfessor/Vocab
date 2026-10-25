import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.resolve(root, 'public/marketing/liveb6-countdown.html');
const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 2000, deviceScaleFactor: 2 });
await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
await page.evaluateHandle('document.fonts.ready');
// freeze countdown at render time (already from deadline in page)
await new Promise((r) => setTimeout(r, 400));
const frame = await page.$('.frame');
const box = await frame.boundingBox();
const out = path.resolve(root, 'public/marketing/liveb6-countdown.png');
await page.screenshot({
  path: out,
  type: 'png',
  clip: { x: 0, y: 0, width: 1080, height: Math.ceil(box.height) },
});
console.log('[LIVEB6 countdown]', Math.ceil(box.height), fs.statSync(out).size);

// square variant
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
await page.evaluateHandle('document.fonts.ready');
await page.addStyleTag({
  content: `
    body{width:1080px!important;height:1080px!important;overflow:hidden!important}
    .frame{padding:36px 40px 28px!important;height:100%!important;display:flex;flex-direction:column}
    h1{font-size:34px!important;margin-bottom:8px!important}
    .code{margin-bottom:18px!important}
    .code b{font-size:28px!important;padding:8px 20px!important}
    .cd{margin-bottom:22px!important;gap:10px!important}
    .cd-box{width:130px!important;padding:14px 8px 12px!important;border-radius:16px!important}
    .cd-num{font-size:48px!important}
    .cd-unit{font-size:13px!important}
    .cd-sep{font-size:28px!important;padding-bottom:12px!important}
    .cd-label{font-size:14px!important;margin-bottom:10px!important}
    .thead{padding:12px 20px!important;font-size:13px!important}
    .row{padding:14px 20px!important}
    .period{font-size:18px!important}
    .old{font-size:17px!important}
    .new{font-size:22px!important}
    .row.hot .new{font-size:24px!important}
    .save{font-size:16px!important}
    .tag{font-size:11px!important;padding:2px 7px!important}
    .foot{margin-top:auto!important;padding-top:14px!important;font-size:15px!important}
    .top{margin-bottom:14px!important}
    .table{margin-top:0!important}
  `,
});
await new Promise((r) => setTimeout(r, 300));
const sq = path.resolve(root, 'public/marketing/liveb6-countdown-square.png');
await page.screenshot({ path: sq, type: 'png' });
console.log('[LIVEB6 countdown] square', fs.statSync(sq).size);

await browser.close();
