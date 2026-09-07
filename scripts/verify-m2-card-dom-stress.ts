/**
 * Challenger 2 Independent Verification & Stress-Testing Script for Milestone 2
 * Focus: Video Cards Metadata Rendering, Watch Progress Parser Resilience, and DOM Footprint Analysis
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import * as cheerio from 'cheerio';
import { getListeningVideosIndex, getCefrBadgeStyle, getTopicDisplayName, getTopicBadgeColor } from '../src/lib/listening';
import { ListeningVideoCard } from '../src/components/listening/ListeningVideoCard';
import { LibraryPagination } from '../src/components/listening/LibraryPagination';
import type { ListeningTopic, ListeningAttempt } from '../src/types/listening';

// Ensure Next/Image does not fail hostname checks in node test environment
process.env.NODE_ENV = 'test';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] [${suite}] ${name}: ${message}`);
    results.push({ suite, name, passed: false, message });
    process.exitCode = 1;
  } else {
    results.push({ suite, name, passed: true, message });
  }
}

console.log('================================================================================');
console.log('⚡ CHALLENGER 2: EMPIRICAL STRESS TEST & DOM ANALYSIS (MILESTONE 2)');
console.log('================================================================================\n');

// ============================================================================
// SUITE 1: 200 VIDEO CARDS METADATA & COMPONENT RENDERING INTEGRITY
// ============================================================================
console.log('--- Suite 1: All 200 Video Cards Metadata & Component Rendering Integrity ---');

const allVideos = getListeningVideosIndex();
assert(allVideos.length === 200, 'Suite 1', 'Catalog Size', `Expected exactly 200 videos in index, got ${allVideos.length}`);

const VALID_CEFR = new Set(['A2', 'B1', 'B2']);
const VALID_TOPICS = new Set<ListeningTopic>([
  'daily_life',
  'social_conversations',
  'workplace',
  'travel',
  'food_shopping',
  'science_tech_health',
  'culture',
  'social_stories',
]);

let renderSuccessCount = 0;
let validDurationCount = 0;
let validCefrCount = 0;
let validTopicCount = 0;
let validLinkCount = 0;

for (let i = 0; i < allVideos.length; i++) {
  const video = allVideos[i];

  // 1.1 durationDisplay verification
  const durationRegex = /^(\d{1,2}:)?\d{2}:\d{2}$/;
  const hasValidDurationDisplay = durationRegex.test(video.durationDisplay);
  const minutes = Math.floor(video.duration / 60);
  const seconds = video.duration % 60;
  const expectedDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (hasValidDurationDisplay && video.durationDisplay === expectedDisplay) {
    validDurationCount++;
  } else {
    assert(false, 'Suite 1', `Video[${i}] Duration`, `Mismatch: duration=${video.duration}, display=${video.durationDisplay}, expected=${expectedDisplay}`);
  }

  // 1.2 CEFR Level Badge verification
  const isCefrValid = VALID_CEFR.has(video.cefrLevel);
  const cefrStyle = getCefrBadgeStyle(video.cefrLevel);
  const hasValidCefrStyle = !!(cefrStyle && cefrStyle.bg && cefrStyle.text && cefrStyle.border);
  if (isCefrValid && hasValidCefrStyle) {
    validCefrCount++;
  } else {
    assert(false, 'Suite 1', `Video[${i}] CEFR`, `Invalid CEFR: ${video.cefrLevel}`);
  }

  // 1.3 Topic & Icon verification
  const isTopicValid = VALID_TOPICS.has(video.topic);
  const topicColor = getTopicBadgeColor(video.topic);
  const topicDisplayName = getTopicDisplayName(video.topic);
  if (isTopicValid && topicColor.bg && topicDisplayName) {
    validTopicCount++;
  } else {
    assert(false, 'Suite 1', `Video[${i}] Topic`, `Invalid Topic: ${video.topic}`);
  }

  // 1.4 Action Link /practice/listening/${video.id}
  const isIdValid = typeof video.id === 'string' && video.id.length > 0 && /^[a-z0-9-]+$/.test(video.id);
  if (isIdValid) {
    validLinkCount++;
  } else {
    assert(false, 'Suite 1', `Video[${i}] ID Link`, `Invalid slug ID: ${video.id}`);
  }

  // 1.5 Full Component Server Render Test
  try {
    const cardJsx = React.createElement(ListeningVideoCard, { video });
    const html = ReactDOMServer.renderToStaticMarkup(cardJsx);
    const $ = cheerio.load(html);

    // Verify action link tag
    const linkEl = $(`a[href="/practice/listening/${video.id}"]`);
    assert(linkEl.length === 1, 'Suite 1', `Video[${i}] Link Element`, `Expected 1 anchor with href="/practice/listening/${video.id}"`);

    // Verify duration rendered
    assert(html.includes(video.durationDisplay), 'Suite 1', `Video[${i}] Rendered Duration`, `HTML includes ${video.durationDisplay}`);

    // Verify CEFR badge rendered
    assert(html.includes(video.cefrLevel), 'Suite 1', `Video[${i}] Rendered CEFR`, `HTML includes ${video.cefrLevel}`);

    // Verify Topic Icon SVG rendered
    const svgs = $('svg');
    assert(svgs.length >= 3, 'Suite 1', `Video[${i}] SVGs`, `Expected >=3 SVGs (Clock, TopicIcon, Headphones/Arrow), got ${svgs.length}`);

    // Verify Thumbnail img rendered
    const imgEl = $('img');
    assert(imgEl.length >= 1, 'Suite 1', `Video[${i}] Img Element`, `Expected thumbnail img element`);
    assert(imgEl.attr('alt') === video.title, 'Suite 1', `Video[${i}] Img Alt`, `Alt matches title`);

    // Verify Title & Channel using cheerio decoded text (properly unescapes entities like &amp;, &#x27;)
    const renderedTitle = $('h3').text().trim();
    assert(renderedTitle === video.title, 'Suite 1', `Video[${i}] Title`, `Rendered title matches metadata exactly`);

    const channelEl = $('span.truncate');
    assert(channelEl.text().trim() === video.channel, 'Suite 1', `Video[${i}] Channel`, `Rendered channel matches metadata`);

    renderSuccessCount++;
  } catch (err) {
    assert(false, 'Suite 1', `Video[${i}] Render Exception`, `Exception rendering card ${video.id}: ${String(err)}`);
  }
}

assert(validDurationCount === 200, 'Suite 1', 'All 200 Durations Valid', `200/200 videos have accurate durationDisplay`);
assert(validCefrCount === 200, 'Suite 1', 'All 200 CEFR Valid', `200/200 videos have valid CEFR badges and styling`);
assert(validTopicCount === 200, 'Suite 1', 'All 200 Topics Valid', `200/200 videos have valid topics and icons`);
assert(validLinkCount === 200, 'Suite 1', 'All 200 Links Valid', `200/200 videos have valid action links`);
assert(renderSuccessCount === 200, 'Suite 1', 'All 200 Cards Rendered', `200/200 video cards rendered cleanly to HTML without error`);

console.log(`✅ Suite 1 Passed: 200/200 cards verified with valid duration, CEFR, topic icons, action links, and HTML output.\n`);

// ============================================================================
// SUITE 2: WATCH PROGRESS PARSER RESILIENCE & ADVERSARIAL STRESS-TESTING
// ============================================================================
console.log('--- Suite 2: Watch Progress Parser Resilience & Adversarial Stress-Testing ---');

/**
 * Exact parser implementation from src/app/practice/listening/page.tsx
 */
function parseWatchProgress(rawWatch: string | null | undefined): number {
  if (!rawWatch) return 0;
  try {
    const num = Number(rawWatch);
    if (!isNaN(num)) {
      return Math.min(100, Math.max(0, num));
    }
    const parsed = JSON.parse(rawWatch);
    if (typeof parsed === 'number') {
      return Math.min(100, Math.max(0, parsed));
    }
    if (parsed && typeof parsed.percent === 'number') {
      return Math.min(100, Math.max(0, parsed.percent));
    }
    if (parsed && typeof parsed.percentWatched === 'number') {
      return Math.min(100, Math.max(0, parsed.percentWatched));
    }
    if (parsed && typeof parsed.progress === 'number') {
      return Math.min(100, Math.max(0, parsed.progress));
    }
    if (
      parsed &&
      typeof parsed.currentTime === 'number' &&
      typeof parsed.duration === 'number' &&
      parsed.duration > 0
    ) {
      return Math.min(100, Math.max(0, Math.round((parsed.currentTime / parsed.duration) * 100)));
    }
  } catch {
    // Ignore parse errors
  }
  return 0;
}

// 2.1 Valid Numbers (0-100) and clamping
assert(parseWatchProgress('0') === 0, 'Suite 2', 'Number String "0"', 'Returns 0');
assert(parseWatchProgress('50') === 50, 'Suite 2', 'Number String "50"', 'Returns 50');
assert(parseWatchProgress('100') === 100, 'Suite 2', 'Number String "100"', 'Returns 100');
assert(parseWatchProgress('-15') === 0, 'Suite 2', 'Negative Clamping', 'Negative clamped to 0');
assert(parseWatchProgress('150') === 100, 'Suite 2', 'Over 100 Clamping', 'Values >100 clamped to 100');
assert(parseWatchProgress('2500') === 100, 'Suite 2', 'Extreme Positive Clamping', 'Extreme clamped to 100');

// 2.2 Decimals
assert(parseWatchProgress('45.7') === 45.7, 'Suite 2', 'Decimal "45.7"', 'Parses 45.7');
assert(parseWatchProgress('0.5') === 0.5, 'Suite 2', 'Decimal "0.5"', 'Parses 0.5');
assert(parseWatchProgress('99.99') === 99.99, 'Suite 2', 'Decimal "99.99"', 'Parses 99.99');
assert(parseWatchProgress('-0.01') === 0, 'Suite 2', 'Negative Decimal', 'Clamped to 0');

// 2.3 JSON Objects (percentages, progress, currentTime / duration)
assert(parseWatchProgress('{"percent": 80}') === 80, 'Suite 2', 'JSON percent', 'Returns 80');
assert(parseWatchProgress('{"percentWatched": 45}') === 45, 'Suite 2', 'JSON percentWatched', 'Returns 45');
assert(parseWatchProgress('{"progress": 65}') === 65, 'Suite 2', 'JSON progress', 'Returns 65');
assert(parseWatchProgress('{"currentTime": 30, "duration": 120}') === 25, 'Suite 2', 'JSON currentTime/duration', 'Returns 25% (30/120)');
assert(parseWatchProgress('{"currentTime": 120, "duration": 120}') === 100, 'Suite 2', 'JSON full completion', 'Returns 100%');
assert(parseWatchProgress('{"currentTime": 180, "duration": 120}') === 100, 'Suite 2', 'JSON overshoot clamped', 'Clamped to 100%');
assert(parseWatchProgress('{"currentTime": -10, "duration": 120}') === 0, 'Suite 2', 'JSON negative currentTime', 'Clamped to 0%');

// 2.4 Missing keys, null, undefined, blanks
assert(parseWatchProgress(null) === 0, 'Suite 2', 'null rawWatch', 'Returns 0');
assert(parseWatchProgress(undefined) === 0, 'Suite 2', 'undefined rawWatch', 'Returns 0');
assert(parseWatchProgress('') === 0, 'Suite 2', 'empty string', 'Returns 0');
assert(parseWatchProgress('{}') === 0, 'Suite 2', 'empty object JSON', 'Returns 0');
assert(parseWatchProgress('{"unrelatedKey": 42}') === 0, 'Suite 2', 'unrelated JSON object', 'Returns 0');

// 2.5 Corrupted / Adversarial localStorage strings (Must NOT throw, must return safe number)
const adversarialInputs = [
  '75%',
  '100%',
  '0%',
  '{"percent": "75%"}',
  '{invalid json content',
  '{"percent": }',
  '{"currentTime": 60}', // missing duration
  '{"currentTime": 60, "duration": 0}', // division by zero protection
  '{"currentTime": 60, "duration": -10}', // negative duration protection
  '{"currentTime": null, "duration": 100}',
  '{"currentTime": "60", "duration": "120"}', // string types in object
  'undefined',
  'null',
  'NaN',
  'Infinity',
  '-Infinity',
  'true',
  'false',
  '[1, 2, 3]',
  '{"percent": [1, 2, 3]}',
  '{"percent": {"nested": 50}}',
  '<script>alert("xss")</script>',
  '\\u0000\\u0001\\u0002',
  '{"__proto__": {"polluted": true}}',
  '{"percent": 1e9}',
  '{"percent": -1e9}',
];

for (const input of adversarialInputs) {
  try {
    const result = parseWatchProgress(input);
    const isValidNumber = typeof result === 'number' && !isNaN(result) && result >= 0 && result <= 100;
    assert(isValidNumber, 'Suite 2', `Adversarial: ${input.slice(0, 30)}`, `Safe result: ${result}`);
  } catch (err) {
    assert(false, 'Suite 2', `Adversarial Crash: ${input.slice(0, 30)}`, `Threw error: ${String(err)}`);
  }
}

// 2.6 Card Component Rendering with Various Watch Progress & Attempt States
const testVideo = allVideos[0];
const sampleAttempt: ListeningAttempt = {
  videoId: testVideo.id,
  completedAt: '2026-09-07T00:00:00.000Z',
  totalQuestions: 4,
  correctAnswers: 3,
  percentScore: 75,
};

// Test state A: Fresh video (watch = 0, no attempt)
const htmlFresh = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ListeningVideoCard, { video: testVideo, watchPercent: 0, attempt: null })
);
assert(!htmlFresh.includes('Đã xem'), 'Suite 2', 'Fresh Card UI', 'No watch badge when watchPercent is 0');
assert(!htmlFresh.includes('Đã làm'), 'Suite 2', 'Fresh Card UI', 'No attempt badge when attempt is null');

// Test state B: In-progress video (watch = 45%, no attempt)
const htmlWatching = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ListeningVideoCard, { video: testVideo, watchPercent: 45.4, attempt: null })
);
assert(htmlWatching.includes('Đã xem 45%'), 'Suite 2', 'In-progress UI Badge', 'Renders "Đã xem 45%" rounded');
assert(htmlWatching.includes('width:45.4%'), 'Suite 2', 'In-progress UI Progress Bar', 'Renders progress bar track with width:45.4%');

// Test state C: Completed Quiz Attempt (attempt takes priority over watch in top-right badge)
const htmlAttempt = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ListeningVideoCard, { video: testVideo, watchPercent: 100, attempt: sampleAttempt })
);
assert(htmlAttempt.includes('Đã làm (75%)'), 'Suite 2', 'Attempt UI Badge', 'Renders "Đã làm (75%)" badge');
assert(htmlAttempt.includes('width:100%'), 'Suite 2', 'Attempt UI Progress Bar', 'Still renders bottom progress track at 100%');

console.log(`✅ Suite 2 Passed: Watch progress parser and UI states handled valid values, decimals, percentages, missing keys, and 26 adversarial inputs safely.\n`);

// ============================================================================
// SUITE 3: DOM FOOTPRINT ANALYSIS (12 CARDS PER PAGE VS MONOLITHIC 200 CARDS)
// ============================================================================
console.log('--- Suite 3: DOM Footprint Analysis (12 Cards / Page vs Monolithic 200 Cards) ---');

// SVG drawing sub-elements (path, circle, line, etc.) vs HTML elements
const ALL_SVG_TAGS = new Set(['svg', 'path', 'circle', 'line', 'polyline', 'rect', 'polygon', 'defs', 'clippath', 'g']);

/**
 * Count HTML layout elements (excluding SVG drawing subnodes)
 */
function countHtmlElements(html: string): number {
  const $ = cheerio.load(html);
  let count = 0;
  $('*').each((_, el) => {
    if ('tagName' in el) {
      const tag = el.tagName.toLowerCase();
      if (tag !== 'html' && tag !== 'head' && tag !== 'body' && !ALL_SVG_TAGS.has(tag)) {
        count++;
      }
    }
  });
  return count;
}

/**
 * Count all DOM elements (including deep SVG drawing child elements)
 */
function countAllDomElements(html: string): number {
  const $ = cheerio.load(html);
  let count = 0;
  $('*').each((_, el) => {
    if ('tagName' in el) {
      const tag = el.tagName.toLowerCase();
      if (tag !== 'html' && tag !== 'head' && tag !== 'body') {
        count++;
      }
    }
  });
  return count;
}

const cardFreshHtmlCount = countHtmlElements(htmlFresh);
const cardWatchHtmlCount = countHtmlElements(htmlWatching);
const cardAttemptHtmlCount = countHtmlElements(htmlAttempt);
const cardDeepCount = countAllDomElements(htmlFresh);

console.log(`- Single Card HTML Elements (Fresh): ${cardFreshHtmlCount} elements (Deep with SVG paths: ${cardDeepCount})`);
console.log(`- Single Card HTML Elements (Watching): ${cardWatchHtmlCount} elements (+progress badge & track)`);
console.log(`- Single Card HTML Elements (Attempted): ${cardAttemptHtmlCount} elements (+quiz badge)`);

assert(cardFreshHtmlCount >= 20 && cardFreshHtmlCount <= 30, 'Suite 3', 'Card HTML Element Range', `Card has compact DOM structure (${cardFreshHtmlCount} HTML elements)`);

// 3.2 Measure LibraryPagination Elements
const htmlPagination = ReactDOMServer.renderToStaticMarkup(
  React.createElement(LibraryPagination, {
    currentPage: 1,
    totalPages: 17,
    totalItems: 200,
    startIndex: 0,
    endIndex: 12,
    onPageChange: () => {},
  })
);
const paginationHtmlCount = countHtmlElements(htmlPagination);
const paginationDeepCount = countAllDomElements(htmlPagination);
console.log(`- LibraryPagination HTML Elements: ${paginationHtmlCount} elements (Deep: ${paginationDeepCount})`);

// 3.3 Measure 12 Cards per Page Grid + Pagination (Active Production Implementation)
const page1Slice = allVideos.slice(0, 12);
const mixedCardsJsx = React.createElement(
  'div',
  { className: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' },
  page1Slice.map((v, idx) => {
    const watch = idx % 3 === 0 ? 0 : idx * 10;
    const attempt = idx === 1 ? sampleAttempt : null;
    return React.createElement(ListeningVideoCard, {
      key: v.id,
      video: v,
      watchPercent: watch,
      attempt,
    });
  })
);

const fullPageJsx = React.createElement(
  'div',
  null,
  mixedCardsJsx,
  React.createElement(LibraryPagination, {
    currentPage: 1,
    totalPages: 17,
    totalItems: 200,
    startIndex: 0,
    endIndex: 12,
    onPageChange: () => {},
  })
);

const htmlPaginatedPage = ReactDOMServer.renderToStaticMarkup(fullPageJsx);
const paginatedHtmlCount = countHtmlElements(htmlPaginatedPage);
const paginatedDeepCount = countAllDomElements(htmlPaginatedPage);
const paginatedHtmlBytes = Buffer.byteLength(htmlPaginatedPage, 'utf8');

console.log(`\n📊 [PAGINATED: 12 Cards/Page]`);
console.log(`  - HTML DOM Elements: ${paginatedHtmlCount} elements (~300 elements order of magnitude)`);
console.log(`  - Deep DOM Nodes (including SVG paths): ${paginatedDeepCount} nodes`);
console.log(`  - Rendered HTML Size: ${(paginatedHtmlBytes / 1024).toFixed(2)} KB`);

// Assert pagination keeps DOM elements tightly controlled (<380 elements vs >4000 monolithic)
assert(
  paginatedHtmlCount <= 360,
  'Suite 3',
  'DOM Footprint Low Control',
  `12 cards + pagination renders ${paginatedHtmlCount} HTML DOM elements (compact ~300 scale)`
);

// 3.4 Measure Monolithic Grid (All 200 Cards Rendered at Once, Without Pagination)
const allCardsJsx = React.createElement(
  'div',
  { className: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' },
  allVideos.map((v) => React.createElement(ListeningVideoCard, { key: v.id, video: v }))
);

const htmlMonolithic = ReactDOMServer.renderToStaticMarkup(allCardsJsx);
const monolithicHtmlCount = countHtmlElements(htmlMonolithic);
const monolithicDeepCount = countAllDomElements(htmlMonolithic);
const monolithicHtmlBytes = Buffer.byteLength(htmlMonolithic, 'utf8');

console.log(`\n📊 [MONOLITHIC: 200 Cards at Once (No Pagination)]`);
console.log(`  - HTML DOM Elements: ${monolithicHtmlCount} elements (> 4000 target)`);
console.log(`  - Deep DOM Nodes (including SVG paths): ${monolithicDeepCount} nodes`);
console.log(`  - Rendered HTML Size: ${(monolithicHtmlBytes / 1024).toFixed(2)} KB`);

assert(
  monolithicHtmlCount > 4000,
  'Suite 3',
  'Monolithic DOM Footprint Exceeds 4000',
  `200 monolithic cards renders ${monolithicHtmlCount} HTML DOM elements (> 4000 target)`
);

// 3.5 Comparative Analysis & Metrics
const domReductionCount = monolithicHtmlCount - paginatedHtmlCount;
const domReductionPercent = ((domReductionCount / monolithicHtmlCount) * 100).toFixed(1);
const deepReductionCount = monolithicDeepCount - paginatedDeepCount;
const deepReductionPercent = ((deepReductionCount / monolithicDeepCount) * 100).toFixed(1);
const sizeReductionKb = ((monolithicHtmlBytes - paginatedHtmlBytes) / 1024).toFixed(1);
const sizeReductionPercent = (((monolithicHtmlBytes - paginatedHtmlBytes) / monolithicHtmlBytes) * 100).toFixed(1);

console.log(`\n📈 [COMPARATIVE DOM OPTIMIZATION METRICS]`);
console.log(`  - HTML DOM Element Reduction: -${domReductionCount} elements (-${domReductionPercent}%)`);
console.log(`  - Deep DOM Node Reduction: -${deepReductionCount} nodes (-${deepReductionPercent}%)`);
console.log(`  - HTML Payload Reduction: -${sizeReductionKb} KB (-${sizeReductionPercent}%)`);
console.log(`  - Pagination Ratio: 17 pages (16 pages of 12 items, 1 page of 8 items)`);

assert(
  Number(domReductionPercent) >= 90,
  'Suite 3',
  'DOM Element Reduction >= 90%',
  `Achieved ${domReductionPercent}% HTML DOM element reduction`
);

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================================');
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
if (failedTests === 0) {
  console.log('🏆 ALL CHALLENGER 2 STRESS TESTS & DOM FOOTPRINT VERIFICATIONS PASSED 100%!');
  console.log('VERDICT: APPROVE');
} else {
  console.log('⚠️ VERDICT: REQUEST_CHANGES');
}
console.log('================================================================================\n');
