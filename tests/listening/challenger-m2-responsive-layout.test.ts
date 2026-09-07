/**
 * Challenger 1 Milestone 2: Empirical Responsive & Layout Stress Test Harness
 *
 * Requirements Tested:
 * 1. ListeningVideoCard title lengths (short 1-line, standard 2-line, extreme long 4-line & 8-line)
 *    - line-clamp-2 prevents layout breaking
 *    - min-h-[2.5rem] (mobile) and sm:min-h-[2.75rem] (desktop) preserve uniform height alignment
 * 2. Long channel names ("Learn English with Bob the Canadian", "BBC Learning English - 6 Minute English")
 *    - Rendered across viewports: 375px, 768px, 1024px, 1440px
 *    - Zero text truncation ellipses
 *    - flex-wrap behavior prevents horizontal overflow
 * 3. Typecheck verification and empirical layout verdict
 */

import fs from 'fs';
import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];
let currentSuite = '';

function suite(name: string) {
  currentSuite = name;
  console.log(`\n================================================================`);
  console.log(`SUITE: ${name}`);
  console.log(`================================================================`);
}

function assert(condition: boolean, testName: string, detail: string) {
  if (!condition) {
    const msg = `FAILED: [${currentSuite}] ${testName} -> ${detail}`;
    console.error(`  ❌ ${msg}`);
    results.push({ suite: currentSuite, testName, passed: false, detail });
    throw new Error(msg);
  }
  console.log(`  ✅ [PASS] ${testName} (${detail})`);
  results.push({ suite: currentSuite, testName, passed: true, detail });
}

// ──────────────────────────────────────────────────────────────────────────
// HTML Generator for ListeningVideoCard
// ──────────────────────────────────────────────────────────────────────────
interface CardPayload {
  id: string;
  title: string;
  channel: string;
  topicDisplay: string;
  topicBadgeBg: string;
  topicBadgeText: string;
  topicBadgeBorder: string;
  cefrLevel: string;
  durationDisplay: string;
  description: string;
  quizCount: number;
  clozeCount: number;
  cuesCount: number;
  vocab: string[];
}

function generateCardHtml(c: CardPayload): string {
  return `
    <div class="card-item group flex flex-col cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" data-card-id="${c.id}">
      <!-- Thumbnail -->
      <div class="relative aspect-video w-full overflow-hidden bg-slate-950">
        <div style="width: 100%; height: 100%; background: #1e293b;"></div>
        <div class="absolute top-2.5 left-2.5 z-10">
          <span class="rounded-md border px-2 py-0.5 text-xs font-black bg-sky-50 text-sky-700 border-sky-300">
            ${c.cefrLevel}
          </span>
        </div>
        <div class="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-white">
          <span>${c.durationDisplay}</span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="card-body flex flex-1 flex-col p-4 sm:p-5">
        <!-- Topic + Channel row -->
        <div class="channel-row mb-2.5 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <span class="topic-badge inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold shrink-0 ${c.topicBadgeBg} ${c.topicBadgeText} ${c.topicBadgeBorder}">
            <span>${c.topicDisplay}</span>
          </span>
          <span class="channel-name text-[11px] font-medium text-slate-500">
            ${c.channel}
          </span>
        </div>

        <!-- Title -->
        <h3 class="card-title line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] text-sm font-bold text-slate-900 sm:text-base leading-snug">
          ${c.title}
        </h3>

        <!-- Description -->
        <p class="card-desc mt-1.5 line-clamp-2 min-h-[2rem] text-xs text-slate-500 leading-relaxed">
          ${c.description}
        </p>

        <!-- Counter Pills -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-sky-200/70 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
            <span>${c.quizCount} câu trắc nghiệm</span>
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <span>${c.clozeCount} câu điền từ</span>
          </span>
        </div>

        <!-- Vocab Preview -->
        ${
          c.vocab.length > 0
            ? `
          <div class="mt-3.5 border-t border-slate-100 pt-2.5">
            <div class="flex items-center gap-1 text-[11px] font-bold text-slate-600">
              <span>${c.vocab.length} từ vựng trọng tâm:</span>
            </div>
            <div class="mt-1.5 flex flex-wrap gap-1">
              ${c.vocab
                .map(
                  (v) => `
                <span class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  ${v}
                </span>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <!-- Bottom Action Bar -->
        <div class="card-action-bar mt-auto pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span>${c.cuesCount} đoạn phụ đề</span>
            </div>
            <div class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              <span>Luyện nghe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildHtmlDocument(cardsHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listening Video Card Responsive Test</title>
  <style>
    *, ::before, ::after {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: #e2e8f0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .container {
      width: 100%;
      max-width: 80rem;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1rem;
      padding-right: 1rem;
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }
    @media (min-width: 640px) {
      .container {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
    }
    .video-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 640px) {
      .video-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (min-width: 1024px) {
      .video-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    /* Card utility styles matching Tailwind classes */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1 1 0%; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .shrink-0 { flex-shrink: 0; }
    .overflow-hidden { overflow: hidden; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .top-2\\.5 { top: 0.625rem; }
    .left-2\\.5 { left: 0.625rem; }
    .right-2\\.5 { right: 0.625rem; }
    .bottom-2\\.5 { bottom: 0.625rem; }
    .z-10 { z-index: 10; }
    .aspect-video { aspect-ratio: 16 / 9; }
    .w-full { width: 100%; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-2xl { border-radius: 1rem; }
    .border { border-width: 1px; }
    .border-slate-100 { border-color: #f1f5f9; }
    .border-slate-200 { border-color: #e2e8f0; }
    .bg-white { background-color: #ffffff; }
    .bg-slate-950 { background-color: #020617; }
    .bg-black\\/80 { background-color: rgba(0, 0, 0, 0.8); }
    .bg-indigo-50 { background-color: #eef2ff; }
    .bg-sky-50 { background-color: #f0f9ff; }
    .border-sky-200\\/70 { border-color: rgba(186, 230, 253, 0.7); }
    .border-sky-300 { border-color: #7dd3fc; }
    .text-sky-700 { color: #0369a1; }
    .bg-amber-50 { background-color: #fffbeb; }
    .border-amber-200\\/70 { border-color: rgba(253, 230, 138, 0.7); }
    .text-amber-700 { color: #b45309; }
    .bg-slate-100 { background-color: #f1f5f9; }
    .text-slate-500 { color: #64748b; }
    .text-slate-600 { color: #475569; }
    .text-slate-700 { color: #334155; }
    .text-slate-900 { color: #0f172a; }
    .text-white { color: #ffffff; }
    .text-indigo-700 { color: #4338ca; }
    .p-4 { padding: 1rem; }
    @media (min-width: 640px) {
      .sm\\:p-5 { padding: 1.25rem; }
    }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
    .pt-2\\.5 { padding-top: 0.625rem; }
    .pt-4 { padding-top: 1rem; }
    .mt-1\\.5 { margin-top: 0.375rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-3\\.5 { margin-top: 0.875rem; }
    .mt-auto { margin-top: auto; }
    .mb-2\\.5 { margin-bottom: 0.625rem; }
    .gap-1 { gap: 0.25rem; }
    .gap-1\\.5 { gap: 0.375rem; }
    .gap-2 { gap: 0.5rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-\\[11px\\] { font-size: 11px; line-height: 15px; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    @media (min-width: 640px) {
      .sm\\:text-base { font-size: 1rem; line-height: 1.5rem; }
    }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .leading-snug { line-height: 1.375; }
    .leading-relaxed { line-height: 1.625; }

    /* Core line-clamp-2 and min-height styles */
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .min-h-\\[2\\.5rem\\] {
      min-height: 2.5rem;
    }
    @media (min-width: 640px) {
      .sm\\:min-h-\\[2\\.75rem\\] {
        min-height: 2.75rem;
      }
    }
    .min-h-\\[2rem\\] {
      min-height: 2rem;
    }
    .shadow-xs {
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="video-grid">
      ${cardsHtml}
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────────────────
// Main Test Runner
// ──────────────────────────────────────────────────────────────────────────
async function runResponsiveLayoutStressTests() {
  console.log('🚀 Starting Challenger 1 Milestone 2: Responsive & Layout Stress Test Harness');

  // ========================================================================
  // SUITE 1: Source Code Static Contract Inspection
  // ========================================================================
  suite('1. Source Code Static Contract Verification');

  const cardPath = path.resolve(process.cwd(), 'src/components/listening/ListeningVideoCard.tsx');
  assert(fs.existsSync(cardPath), 'ListeningVideoCard.tsx exists', cardPath);

  const cardCode = fs.readFileSync(cardPath, 'utf8');

  // Verify line-clamp-2 presence
  assert(
    cardCode.includes('line-clamp-2'),
    'Title has line-clamp-2',
    'Verified line-clamp-2 class is present'
  );

  // Verify min-height reservation on title
  assert(
    cardCode.includes('min-h-[2.5rem]') && cardCode.includes('sm:min-h-[2.75rem]'),
    'Title has min-h-[2.5rem] sm:min-h-[2.75rem]',
    'Guarantees identical 2-line vertical reservation across viewports'
  );

  // Verify description min-height
  assert(
    cardCode.includes('min-h-[2rem]'),
    'Description has min-h-[2rem]',
    'Provides baseline height for descriptions'
  );

  // Verify flex-wrap on topic + channel row
  assert(
    cardCode.includes('flex flex-wrap items-center justify-between gap-1.5'),
    'Topic & Channel header has flex-wrap',
    'Allows channel to wrap cleanly without clipping'
  );

  // Verify removal of max-w-[150px] and truncate
  assert(
    !cardCode.includes('max-w-[150px]'),
    'Channel does NOT have max-w-[150px]',
    'Arbitrary width truncation successfully eliminated'
  );

  // Verify mt-auto on bottom action bar
  assert(
    cardCode.includes('mt-auto pt-4 border-t'),
    'Action bar has mt-auto',
    'Ensures action bar aligns at bottom across varying content heights'
  );

  // Verify exercise counter pills
  assert(
    cardCode.includes('câu trắc nghiệm') && cardCode.includes('câu điền từ'),
    'Exercise counter pills present',
    'Both quiz and cloze pills are rendered'
  );

  // ========================================================================
  // SUITE 2: Catalog Channel Name & Title Distribution Analysis
  // ========================================================================
  suite('2. Catalog Distribution Analysis (All 200 Videos)');

  const indexPath = path.resolve(process.cwd(), 'src/data/listening/videos-index.json');
  assert(fs.existsSync(indexPath), 'videos-index.json exists', indexPath);

  const catalog = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  assert(catalog.length === 200, 'Catalog Size is 200', `Found ${catalog.length} items`);

  let longestTitle = '';
  let shortestTitle = 'A'.repeat(500);
  let longestChannel = '';
  const channelCounts: Record<string, number> = {};

  for (const item of catalog) {
    if (item.title.length > longestTitle.length) longestTitle = item.title;
    if (item.title.length < shortestTitle.length) shortestTitle = item.title;
    if (item.channel.length > longestChannel.length) longestChannel = item.channel;
    channelCounts[item.channel] = (channelCounts[item.channel] || 0) + 1;
  }

  assert(
    longestTitle.length >= 70,
    'Longest Title >= 70 characters',
    `"${longestTitle}" (${longestTitle.length} chars)`
  );
  assert(
    shortestTitle.length <= 35,
    'Shortest Title <= 35 characters',
    `"${shortestTitle}" (${shortestTitle.length} chars)`
  );
  assert(
    longestChannel === 'Learn English with Bob the Canadian' || longestChannel.length >= 35,
    'Longest Channel Identified',
    `"${longestChannel}" (${longestChannel.length} chars)`
  );

  // Check that no channel name contains hardcoded ellipsis '...'
  const ellipsisChannels = catalog.filter((v: any) => v.channel.includes('...'));
  assert(
    ellipsisChannels.length === 0,
    'Zero Hardcoded Ellipses in Channel Names',
    `Found ${ellipsisChannels.length} truncated channels`
  );

  // ========================================================================
  // SUITE 3: Headless Browser Layout & Height Alignment Stress Test
  // Viewports: 375px, 768px, 1024px, 1440px
  // ========================================================================
  suite('3. Empirical Headless Browser Layout & Alignment Verification');

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const testPayloads: CardPayload[] = [
    {
      id: 'card-short',
      title: 'Morning Coffee', // 1 line
      channel: 'BBC',
      topicDisplay: 'Đời sống',
      topicBadgeBg: 'bg-blue-50',
      topicBadgeText: 'text-blue-700',
      topicBadgeBorder: 'border-blue-200',
      cefrLevel: 'A2',
      durationDisplay: '04:15',
      description: 'Quick morning chat.',
      quizCount: 4,
      clozeCount: 4,
      cuesCount: 18,
      vocab: ['coffee', 'cup', 'morning'],
    },
    {
      id: 'card-standard',
      title: 'How to Order Food in English: Essential Restaurant Vocabulary and Useful Expressions', // 2 lines
      channel: 'BBC Learning English',
      topicDisplay: 'Ẩm thực & Mua sắm',
      topicBadgeBg: 'bg-emerald-50',
      topicBadgeText: 'text-emerald-700',
      topicBadgeBorder: 'border-emerald-200',
      cefrLevel: 'B1',
      durationDisplay: '08:30',
      description: 'Learn everyday phrases to order appetizers, drinks, and meals with confidence.',
      quizCount: 4,
      clozeCount: 4,
      cuesCount: 32,
      vocab: ['menu', 'appetizer', 'beverage', 'bill'],
    },
    {
      id: 'card-extreme-long',
      title:
        'Complete Advanced Business English Course: 50 Real-World Office Phrases, Executive Meeting Dialogues, Professional Presentation Idioms, and Cross-Cultural Negotiation Strategies', // 4-5 lines unclamped
      channel: 'Learn English with Bob the Canadian',
      topicDisplay: 'Công việc & Phỏng vấn',
      topicBadgeBg: 'bg-purple-50',
      topicBadgeText: 'text-purple-700',
      topicBadgeBorder: 'border-purple-200',
      cefrLevel: 'B2',
      durationDisplay: '18:45',
      description:
        'An in-depth guide designed for professionals preparing for global interviews, executive meetings, and corporate negotiations in English.',
      quizCount: 5,
      clozeCount: 4,
      cuesCount: 65,
      vocab: ['agenda', 'consensus', 'deliverable', 'leverage'],
    },
    {
      id: 'card-ultra-extreme',
      title:
        'Mastering English Fluency: The Ultimate Comprehensive Guide with Daily Conversational Practice, Grammar Drills, Phrasal Verbs, Slang, Formal Pronunciation, Listening Exercises, and Natural Speaking Habits for Everyday Life in International Environments', // 8 lines unclamped
      channel: 'BBC Learning English - 6 Minute English',
      topicDisplay: 'Giao tiếp xã hội',
      topicBadgeBg: 'bg-indigo-50',
      topicBadgeText: 'text-indigo-700',
      topicBadgeBorder: 'border-indigo-200',
      cefrLevel: 'B1',
      durationDisplay: '14:20',
      description:
        'Explore everyday conversational nuances, practical vocabulary, and pronunciation rules to speak naturally with native speakers.',
      quizCount: 4,
      clozeCount: 4,
      cuesCount: 48,
      vocab: ['fluency', 'intonation', 'dialogue', 'expression'],
    },
  ];

  const htmlContent = buildHtmlDocument(testPayloads.map(generateCardHtml).join('\n'));

  const viewports = [
    { width: 375, height: 812, label: '375px (Mobile Portrait)', isMobile: true },
    { width: 768, height: 1024, label: '768px (Tablet)', isMobile: false },
    { width: 1024, height: 768, label: '1024px (Laptop)', isMobile: false },
    { width: 1440, height: 900, label: '1440px (Wide Desktop)', isMobile: false },
  ];

  const page: Page = await browser.newPage();

  for (const vp of viewports) {
    console.log(`\n--- Probing Viewport: ${vp.label} ---`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // 1. Check title line clamping and height alignment
    const titleMetrics = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.card-title'));
      return titles.map((el, i) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          index: i,
          height: Math.round(rect.height * 100) / 100,
          lineClamp: style.webkitLineClamp || (style as any).lineClamp,
          overflow: style.overflow,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        };
      });
    });

    console.log(`  Title Heights at ${vp.label}:`, titleMetrics.map((t) => `${t.height}px`).join(', '));

    // Expected title heights:
    // Mobile (<640px): min-h-[2.5rem] = 40px
    // Desktop (>=640px): sm:min-h-[2.75rem] = 44px
    const expectedTitleHeight = vp.isMobile ? 40 : 44;

    for (const tm of titleMetrics) {
      assert(
        Math.abs(tm.height - expectedTitleHeight) <= 1,
        `Title ${tm.index} Height Alignment @ ${vp.label}`,
        `Measured: ${tm.height}px, Expected: ~${expectedTitleHeight}px (clamped to 2 lines)`
      );
      assert(
        tm.lineClamp === '2',
        `Title ${tm.index} Line Clamp @ ${vp.label}`,
        `-webkit-line-clamp is ${tm.lineClamp}`
      );
    }

    // 2. Title Height Invariance across 1-line, 2-line, 4-line, 8-line
    const titleHeights = titleMetrics.map((t) => t.height);
    const minHeight = Math.min(...titleHeights);
    const maxHeight = Math.max(...titleHeights);
    const heightDelta = Math.round((maxHeight - minHeight) * 100) / 100;

    assert(
      heightDelta <= 1,
      `Zero Ragged Title Heights Delta <= 1px @ ${vp.label}`,
      `Max delta between 1-line and 8-line titles is ${heightDelta}px`
    );

    // 3. Clamping Verification on 4-line and 8-line titles
    const card2 = titleMetrics[2];
    const card3 = titleMetrics[3];
    assert(
      card2.clientHeight <= expectedTitleHeight + 1,
      `4-Line Title strictly clamped @ ${vp.label}`,
      `clientHeight: ${card2.clientHeight}px <= ${expectedTitleHeight + 1}px`
    );
    assert(
      card3.clientHeight <= expectedTitleHeight + 1,
      `8-Line Title strictly clamped @ ${vp.label}`,
      `clientHeight: ${card3.clientHeight}px <= ${expectedTitleHeight + 1}px`
    );

    // 4. Probe Long Channel Names across viewports
    const channelMetrics = await page.evaluate(() => {
      const channels = Array.from(document.querySelectorAll('.channel-name'));
      const cards = Array.from(document.querySelectorAll('.card-item'));
      return channels.map((el, i) => {
        const rect = el.getBoundingClientRect();
        const cardRect = cards[i].getBoundingClientRect();
        const text = (el as HTMLElement).innerText.trim();
        const style = window.getComputedStyle(el);
        return {
          index: i,
          text,
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          cardRight: Math.round(cardRect.right),
          hasEllipsis: text.includes('...') || style.textOverflow === 'ellipsis',
          overflowsCard: rect.right > cardRect.right + 2, // Allow subpixel
        };
      });
    });

    for (const cm of channelMetrics) {
      assert(
        !cm.hasEllipsis,
        `Channel "${cm.text}" No Ellipsis @ ${vp.label}`,
        `Rendered fully without truncation ellipsis: "${cm.text}"`
      );
      assert(
        !cm.overflowsCard,
        `Channel "${cm.text}" No Horizontal Overflow @ ${vp.label}`,
        `Right bound ${cm.width}px stays inside card boundaries`
      );
    }

    // Specific check for "Learn English with Bob the Canadian" and "BBC Learning English - 6 Minute English"
    const bobChannel = channelMetrics.find((c) => c.text === 'Learn English with Bob the Canadian');
    assert(
      Boolean(bobChannel && !bobChannel.hasEllipsis && !bobChannel.overflowsCard),
      `Bob the Canadian Channel Integrity @ ${vp.label}`,
      `Text intact and within card bounds`
    );

    const bbc6MinChannel = channelMetrics.find(
      (c) => c.text === 'BBC Learning English - 6 Minute English'
    );
    assert(
      Boolean(bbc6MinChannel && !bbc6MinChannel.hasEllipsis && !bbc6MinChannel.overflowsCard),
      `BBC 6-Minute English Channel Integrity @ ${vp.label}`,
      `Text intact and within card bounds`
    );

    // 5. Global Viewport Horizontal Scroll Check
    const viewportScrollCheck = await page.evaluate(() => {
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hasHorizontalScrollbar: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    assert(
      !viewportScrollCheck.hasHorizontalScrollbar,
      `Zero Horizontal Viewport Overflow @ ${vp.label}`,
      `docScrollWidth: ${viewportScrollCheck.docScrollWidth}px <= docClientWidth: ${viewportScrollCheck.docClientWidth}px`
    );

    // 6. Grid Row Equalization and Bottom Action Bar Alignment
    if (!vp.isMobile) {
      // In 2-col or 3-col grid, check card height matching within the same row
      const rowMetrics = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.card-item'));
        const actionBars = Array.from(document.querySelectorAll('.card-action-bar'));
        return cards.map((c, i) => {
          const cRect = c.getBoundingClientRect();
          const aRect = actionBars[i].getBoundingClientRect();
          return {
            index: i,
            top: Math.round(cRect.top),
            bottom: Math.round(cRect.bottom),
            height: Math.round(cRect.height),
            actionBottom: Math.round(aRect.bottom),
          };
        });
      });

      // Group by row (cards with similar top coordinate)
      const rows: Record<number, typeof rowMetrics> = {};
      for (const rm of rowMetrics) {
        const existingKey = Object.keys(rows).find((k) => Math.abs(Number(k) - rm.top) < 5);
        if (existingKey) {
          rows[Number(existingKey)].push(rm);
        } else {
          rows[rm.top] = [rm];
        }
      }

      for (const [top, rowCards] of Object.entries(rows)) {
        if (rowCards.length > 1) {
          const heights = rowCards.map((c) => c.height);
          const maxH = Math.max(...heights);
          const minH = Math.min(...heights);
          const rowDelta = maxH - minH;

          assert(
            rowDelta <= 1,
            `Equal Card Heights in Grid Row (top=${top}) @ ${vp.label}`,
            `Row cards [${rowCards.map((c) => c.index).join(', ')}] heights: [${heights.join(', ')}] delta: ${rowDelta}px`
          );

          // Check bottom action bar alignment
          const actionBottoms = rowCards.map((c) => c.actionBottom);
          const maxAction = Math.max(...actionBottoms);
          const minAction = Math.min(...actionBottoms);
          const actionDelta = maxAction - minAction;

          assert(
            actionDelta <= 1,
            `Bottom Action Bar Alignment in Grid Row (top=${top}) @ ${vp.label}`,
            `Bottom action bar bottoms: [${actionBottoms.join(', ')}] delta: ${actionDelta}px`
          );
        }
      }
    }
  }

  // ========================================================================
  // SUITE 4: Real-Catalog Batch Visual Stress Test
  // Renders real catalog videos including longest and shortest items
  // ========================================================================
  suite('4. Real-Catalog Batch Visual Stress Test');

  // Select 6 contrasting real videos from catalog
  const realSelectedVideos = [
    catalog.find((v: any) => v.id === 'video-medium-social-stories'), // Steve Jobs commencement (longest title 73 chars)
    catalog.find((v: any) => v.id === 'video-short-daily-life'), // Bob the Canadian (longest channel 35 chars)
    catalog.find((v: any) => v.id === 'video-dl-03'), // My Relaxing Weekend Routine (shortest title 27 chars)
    catalog.find((v: any) => v.id === 'video-medium-workplace'), // Job interview guide (64 chars)
    catalog.find((v: any) => v.id === 'video-cs-14'), // Evolution of written language (62 chars)
    catalog.find((v: any) => v.id === 'video-sth-28'), // Immunology of mRNA vaccines (31 chars)
  ];

  const realPayloads: CardPayload[] = realSelectedVideos.map((v: any) => ({
    id: v.id,
    title: v.title,
    channel: v.channel,
    topicDisplay: v.topicDisplay,
    topicBadgeBg: 'bg-indigo-50',
    topicBadgeText: 'text-indigo-700',
    topicBadgeBorder: 'border-indigo-200',
    cefrLevel: v.cefrLevel,
    durationDisplay: v.durationDisplay,
    description: v.description,
    quizCount: v.quizCount || 4,
    clozeCount: v.clozeCount || 4,
    cuesCount: v.transcriptCuesCount || 25,
    vocab: v.coreVocabularyPreview?.slice(0, 4) || [],
  }));

  const realBatchHtml = buildHtmlDocument(realPayloads.map(generateCardHtml).join('\n'));

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.setContent(realBatchHtml, { waitUntil: 'domcontentloaded' });

    const batchCheck = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('.card-title'));
      const channels = Array.from(document.querySelectorAll('.channel-name'));
      const cards = Array.from(document.querySelectorAll('.card-item'));

      const titleHeights = titles.map((t) => Math.round(t.getBoundingClientRect().height));
      const hasHorizontalScroll =
        document.documentElement.scrollWidth > document.documentElement.clientWidth;

      let anyChannelOverflow = false;
      channels.forEach((ch, idx) => {
        const cRect = cards[idx].getBoundingClientRect();
        const chRect = ch.getBoundingClientRect();
        if (chRect.right > cRect.right + 2) anyChannelOverflow = true;
      });

      return {
        titleHeights,
        minTitleHeight: Math.min(...titleHeights),
        maxTitleHeight: Math.max(...titleHeights),
        hasHorizontalScroll,
        anyChannelOverflow,
      };
    });

    assert(
      !batchCheck.hasHorizontalScroll,
      `Real Batch Zero Horizontal Scroll @ ${vp.label}`,
      `docScrollWidth <= clientWidth`
    );
    assert(
      !batchCheck.anyChannelOverflow,
      `Real Batch Zero Channel Overflow @ ${vp.label}`,
      `All 6 channels remain inside cards`
    );
    assert(
      batchCheck.maxTitleHeight - batchCheck.minTitleHeight <= 1,
      `Real Batch Title Height Uniformity @ ${vp.label}`,
      `Min: ${batchCheck.minTitleHeight}px, Max: ${batchCheck.maxTitleHeight}px, Delta <= 1px`
    );
  }

  await browser.close();

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  console.log('\n================================================================');
  console.log('CHALLENGER 1 MILESTONE 2: STRESS TEST VERDICT');
  console.log('================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Assertions: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ EMPIRICAL VERDICT: REQUEST_CHANGES (${failed} failures)`);
    process.exit(1);
  } else {
    console.log(`\n✅ EMPIRICAL VERDICT: APPROVE (100% assertions passed)`);
  }
}

runResponsiveLayoutStressTests().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
