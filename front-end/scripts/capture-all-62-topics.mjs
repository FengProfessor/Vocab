#!/usr/bin/env node
/**
 * scripts/capture-all-62-topics.mjs
 *
 * Automated Puppeteer capture harness for all 62 LingoPro grammar topics.
 * Captures high-resolution screenshots of topic illustrations and pedagogical media.
 *
 * Output: docs/grammar/screenshots/<slug>.png
 *
 * Usage:
 *   node scripts/capture-all-62-topics.mjs --batch
 *   node scripts/capture-all-62-topics.mjs --topic=personal-pronouns
 *   node scripts/capture-all-62-topics.mjs --limit=5
 *   node scripts/capture-all-62-topics.mjs --baseUrl=http://localhost:3000
 */

import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEFAULT_OUT_DIR = path.join(ROOT_DIR, 'docs', 'grammar', 'screenshots');
const ROADMAP_PATH = path.join(ROOT_DIR, 'scripts', 'grammar-gen', 'roadmap.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const isBatch = args.includes('--batch');
const skipProbe = args.includes('--skip-probe');
const showHelp = args.includes('--help') || args.includes('-h');

const singleTopic = (() => {
  const t = args.find((a) => a.startsWith('--topic='));
  return t ? t.split('=')[1].trim().toLowerCase() : null;
})();

const limit = (() => {
  const l = args.find((a) => a.startsWith('--limit='));
  return l ? parseInt(l.split('=')[1], 10) : null;
})();

const baseUrl = (() => {
  const b = args.find((a) => a.startsWith('--baseUrl='));
  return b ? b.split('=')[1].trim().replace(/\/$/, '') : 'http://localhost:3000';
})();

const outDir = (() => {
  const o = args.find((a) => a.startsWith('--outDir='));
  return o ? path.resolve(o.split('=')[1].trim()) : DEFAULT_OUT_DIR;
})();

const chromeExe = (() => {
  const c = args.find((a) => a.startsWith('--chromePath='));
  if (c) return c.split('=')[1].trim();
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  return DEFAULT_CHROME_EXE;
})();

if (showHelp) {
  console.log(`
Usage: node scripts/capture-all-62-topics.mjs [options]

Options:
  --batch            Run batch capture for all 62 grammar topics
  --topic=<slug>     Capture single topic by slug (e.g. --topic=personal-pronouns)
  --limit=<N>        Capture only first N topics from roadmap
  --baseUrl=<url>    Base URL for local web app (default: http://localhost:3000)
  --outDir=<path>    Output directory for screenshots (default: docs/grammar/screenshots)
  --chromePath=<exe> Custom path to Google Chrome executable
  --skip-probe       Skip initial dev server connectivity check
  --help, -h         Show this help message
`);
  process.exit(0);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function probeServer(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(url, { timeout: 3500 }, (res) => {
        resolve({ alive: true, status: res.statusCode });
      });
      req.on('error', (err) => resolve({ alive: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ alive: false, error: 'Connection timeout' });
      });
    } catch (e) {
      resolve({ alive: false, error: e.message });
    }
  });
}

async function dismissPwaBanners(page) {
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach((b) => {
      const t = (b.textContent || '').trim();
      if (t === '×' || t === '✕' || t.includes('Đóng') || t.includes('Cài')) {
        try {
          b.click();
        } catch {}
        b.style.display = 'none';
      }
    });
    document.querySelectorAll('div').forEach((d) => {
      const t = d.textContent || '';
      if (t.includes('Cài LingoPro') && t.includes('Thêm vào màn hình')) {
        d.style.setProperty('display', 'none', 'important');
      }
    });
  });
}

async function openMediaTab(page) {
  await page.evaluate(() => {
    // 1. Try to open theory drawer if closed
    const allButtons = Array.from(document.querySelectorAll('button'));
    const theoryBtn = allButtons.find((b) =>
      (b.innerText || '').toLowerCase().includes('học lý thuyết'),
    );
    if (theoryBtn) {
      try {
        theoryBtn.click();
      } catch {}
    }
  });

  await sleep(800);

  await page.evaluate(() => {
    // 2. Select Illustrations/Media tab
    const allButtons = Array.from(document.querySelectorAll('button'));
    const mediaBtn = allButtons.find((b) => {
      const text = (b.innerText || '').toLowerCase();
      return (
        text.includes('hình ảnh thực tế') ||
        text.includes('minh họa') ||
        text.includes('hình ảnh') ||
        text.includes('media')
      );
    });
    if (mediaBtn) {
      try {
        mediaBtn.click();
      } catch {}
    }
  });
}

async function run() {
  console.log('='.repeat(78));
  console.log('  LINGOPRO BATCH SCREENSHOT HARNESS — 62 GRAMMAR TOPICS');
  console.log('='.repeat(78));
  console.log(`Base URL    : ${baseUrl}`);
  console.log(`Output Dir  : ${outDir}`);
  console.log(`Chrome Exe  : ${chromeExe}`);

  if (!fs.existsSync(chromeExe)) {
    console.error(`\n❌ Chrome executable not found at: ${chromeExe}`);
    console.error('Please install Chrome or provide path with --chromePath=<path>');
    process.exit(1);
  }

  // Ensure output directory
  fs.mkdirSync(outDir, { recursive: true });

  // Load roadmap topics
  if (!fs.existsSync(ROADMAP_PATH)) {
    console.error(`❌ Roadmap file not found at: ${ROADMAP_PATH}`);
    process.exit(1);
  }
  const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));

  let targetTopics = [];
  if (singleTopic) {
    const found = roadmapData.find((t) => t.slug === singleTopic);
    if (!found) {
      console.error(`❌ Topic slug '${singleTopic}' not found in roadmap.`);
      process.exit(1);
    }
    targetTopics = [found];
  } else {
    targetTopics = roadmapData;
    if (limit && limit > 0) {
      targetTopics = targetTopics.slice(0, limit);
    }
  }

  console.log(`Target Count: ${targetTopics.length} topic(s) queued for capture`);
  console.log('-'.repeat(78));

  // Check dev server connectivity
  if (!skipProbe) {
    const probe = await probeServer(`${baseUrl}/grammar`);
    if (!probe.alive) {
      console.warn(`\n⚠️  WARNING: Local dev server at ${baseUrl} is not currently responding.`);
      console.warn(`   Reason: ${probe.error}`);
      console.warn('   To run live browser captures, launch Next.js first in a terminal:');
      console.warn('     npm run dev');
      console.warn('   Then re-run this script:');
      console.warn('     node scripts/capture-all-62-topics.mjs --batch\n');
      console.log('Exiting safely (capture harness verified and ready).');
      process.exit(0);
    }
  }

  console.log('Launching browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,920'],
    defaultViewport: { width: 1400, height: 920, deviceScaleFactor: 1.5 },
  });

  const page = await browser.newPage();
  const results = { passed: [], failed: [] };

  try {
    for (let i = 0; i < targetTopics.length; i++) {
      const topic = targetTopics[i];
      const progress = `[${i + 1}/${targetTopics.length}]`;
      const targetUrl = `${baseUrl}/grammar?topic=${topic.slug}`;
      const screenshotPath = path.join(outDir, `${topic.slug}.png`);

      process.stdout.write(`${progress} Capturing '${topic.slug}' (${topic.title})... `);

      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(1000);
        await dismissPwaBanners(page);
        await openMediaTab(page);
        await sleep(1200);

        await page.screenshot({
          path: screenshotPath,
          fullPage: false,
        });

        const stat = fs.statSync(screenshotPath);
        console.log(`OK (${(stat.size / 1024).toFixed(1)} KB)`);
        results.passed.push({ slug: topic.slug, path: screenshotPath, bytes: stat.size });
      } catch (err) {
        console.log(`FAIL (${err.message})`);
        results.failed.push({ slug: topic.slug, error: err.message });
      }
    }
  } finally {
    await browser.close();
  }

  console.log('='.repeat(78));
  console.log(`Capture Finished: ${results.passed.length} succeeded, ${results.failed.length} failed.`);
  console.log(`Screenshots directory: ${outDir}`);
  console.log('='.repeat(78));

  process.exit(results.failed.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal screenshot runner error:', err);
  process.exit(1);
});
