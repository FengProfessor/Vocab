import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.resolve(root, 'public/marketing/liveb6-before-after.html');
const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
});
const page = await browser.newPage();

// Compact portrait (height = content)
await page.setViewport({ width: 1080, height: 2000, deviceScaleFactor: 2 });
await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
await page.evaluateHandle('document.fonts.ready');
await page.addStyleTag({
  content:
    'html,body{height:auto!important;min-height:0!important}body{width:1080px!important}.frame{height:auto!important;min-height:0!important;padding:48px 48px 44px!important}',
});
await new Promise((r) => setTimeout(r, 500));
const frame = await page.$('.frame');
const box = await frame.boundingBox();
const tallPath = path.resolve(root, 'public/marketing/liveb6-before-after.png');
await page.screenshot({
  path: tallPath,
  type: 'png',
  clip: { x: 0, y: 0, width: 1080, height: Math.ceil(box.height) },
});
console.log('[LIVEB6 card] tall', Math.ceil(box.height), fs.statSync(tallPath).size);

// Square 1080
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
await page.evaluateHandle('document.fonts.ready');
await page.addStyleTag({
  content: `
    body{width:1080px!important;height:1080px!important;overflow:hidden!important}
    .frame{height:100%!important;padding:36px 40px 28px!important;justify-content:space-between!important}
    h1{font-size:36px!important;margin-bottom:6px!important}
    .sub{font-size:17px!important;margin-bottom:16px!important}
    .code-pill{font-size:18px!important;margin-top:6px!important;padding:7px 12px!important}
    .brand{margin-bottom:12px!important}
    .cols{gap:16px!important}
    .col{padding:14px 12px!important;border-radius:18px!important}
    .col-title{font-size:20px!important;margin-bottom:10px!important}
    .col-label{font-size:13px!important}
    .row{padding:11px 10px!important}
    .rows{gap:8px!important}
    .period{font-size:15px!important}
    .price{font-size:20px!important}
    .row.hot .price{font-size:22px!important}
    .tag{font-size:10px!important}
    .foot{margin-top:14px!important;gap:10px!important}
    .save-bar{padding:11px 12px!important}
    .save-bar strong{font-size:16px!important}
    .save-bar span{font-size:13px!important}
    .step{padding:9px 6px!important}
    .step p{font-size:13px!important}
    .step b{font-size:11px!important}
    .deadline{font-size:12px!important}
    .arrow-wrap{width:48px!important;height:48px!important;font-size:24px!important;border-width:3px!important}
  `,
});
await new Promise((r) => setTimeout(r, 400));
const squarePath = path.resolve(root, 'public/marketing/liveb6-before-after-square.png');
await page.screenshot({ path: squarePath, type: 'png' });
console.log('[LIVEB6 card] square', fs.statSync(squarePath).size);

await browser.close();
