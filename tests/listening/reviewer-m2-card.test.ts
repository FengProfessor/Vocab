/**
 * Independent Reviewer 1 Verification & Stress Tests for Milestone 2:
 * ListeningVideoCard.tsx
 */

// Set NODE_ENV = test so next/image does not throw unconfigured hostname in unit test environment
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';

import React from 'react';

import ReactDOMServer from 'react-dom/server';
import * as cheerio from 'cheerio';

import { ListeningVideoCard } from '../../src/components/listening/ListeningVideoCard';
import { getListeningVideosIndex } from '../../src/lib/listening';
import type { ListeningVideoIndexItem, ListeningAttempt } from '../../src/types/listening';

console.log('================================================================================');
console.log('REVIEWER 1 (M2): INDEPENDENT COMPONENT VERIFICATION & ADVERSARIAL AUDIT');
console.log('Component: src/components/listening/ListeningVideoCard.tsx');
console.log('================================================================================\n');

const videos = getListeningVideosIndex();
console.log(`Loaded ${videos.length} videos from dataset.`);

let failures = 0;

function assert(condition: boolean, testName: string, detail: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}: ${detail}`);
  } else {
    console.error(`  [FAIL] ${testName}: ${detail}`);
    failures++;
  }
}

// ----------------------------------------------------------------------------
// 1. Channel name truncation removed & flex-wrap layout
// ----------------------------------------------------------------------------
console.log('\n--- Test Group 1: Channel Name Display & Truncation Removal ---');

let foundTruncate = 0;
let foundMaxW150 = 0;
let foundFlexWrap = 0;

for (const v of videos) {
  const html = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: v }));
  if (html.includes('truncate')) foundTruncate++;
  if (html.includes('max-w-[150px]')) foundMaxW150++;
  if (html.includes('flex flex-wrap items-center justify-between gap-1.5')) foundFlexWrap++;
}

assert(foundTruncate === 0, '1.1 Zero Truncate Class', `Found 'truncate' in ${foundTruncate} / ${videos.length} cards (expected 0)`);
assert(foundMaxW150 === 0, '1.2 Zero max-w-[150px]', `Found 'max-w-[150px]' in ${foundMaxW150} / ${videos.length} cards (expected 0)`);
assert(foundFlexWrap === videos.length, '1.3 Flex-Wrap Row', `All ${foundFlexWrap} / ${videos.length} cards use flex flex-wrap for channel container`);

// Adversarial test: Extremely long channel name
const longChannelVideo: ListeningVideoIndexItem = {
  ...videos[0],
  channel: 'Extremely Long YouTube Channel Name With Multiple English Learning Pedagogical Keywords And Many Words That Would Previously Overflow',
};
const longChannelHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: longChannelVideo }));
assert(longChannelHtml.includes(longChannelVideo.channel), '1.4 Long Channel Renders Fully', 'Unabbreviated channel text preserved in DOM');
assert(!longChannelHtml.includes('truncate'), '1.5 No Truncate On Long Channel', 'No truncation applied to extreme channel name');

// ----------------------------------------------------------------------------
// 2. Title strictly 2 lines (line-clamp-2) with uniform height reservation
// ----------------------------------------------------------------------------
console.log('\n--- Test Group 2: Title 2-Line Clamping & Height Reservation ---');

const sampleHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: videos[0] }));
const $ = cheerio.load(sampleHtml);
const titleEl = $('h3');

assert(titleEl.hasClass('line-clamp-2'), '2.1 line-clamp-2 present', 'Title element has line-clamp-2 class');
assert(titleEl.hasClass('min-h-[2.5rem]'), '2.2 min-h-[2.5rem] (mobile)', 'Title element has min-h-[2.5rem] for mobile uniform height');
assert(titleEl.attr('class')?.includes('sm:min-h-[2.75rem]') === true, '2.3 sm:min-h-[2.75rem] (desktop)', 'Title element has sm:min-h-[2.75rem] for tablet/desktop height reservation');

// Adversarial test: 1-line title vs 4-line title
const shortTitleVideo: ListeningVideoIndexItem = { ...videos[0], title: 'Hi' };
const multiLineTitleVideo: ListeningVideoIndexItem = {
  ...videos[0],
  title: 'This is a very long title designed to span across multiple lines in responsive views to stress test vertical alignment across cards',
};
const shortTitleHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: shortTitleVideo }));
const multiLineTitleHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: multiLineTitleVideo }));

assert(shortTitleHtml.includes('min-h-[2.5rem]'), '2.4 Short Title Reservation', '1-line title card retains min-h-[2.5rem] height reservation');
assert(multiLineTitleHtml.includes('line-clamp-2'), '2.5 Long Title Clamped', 'Long title card enforces line-clamp-2');

// ----------------------------------------------------------------------------
// 3. Exercise counters (quiz count and cloze count) rendered cleanly
// ----------------------------------------------------------------------------
console.log('\n--- Test Group 3: Exercise Counters (Quiz & Cloze Pills) ---');

assert(sampleHtml.includes('câu trắc nghiệm'), '3.1 Quiz Count Text', 'Card renders Vietnamese "câu trắc nghiệm" counter label');
assert(sampleHtml.includes('câu điền từ'), '3.2 Cloze Count Text', 'Card renders Vietnamese "câu điền từ" counter label');

// Custom counters test
const customCountVideo: ListeningVideoIndexItem = {
  ...videos[0],
  quizCount: 8,
  clozeCount: 6,
};
const customCountHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: customCountVideo }));
assert(customCountHtml.includes('8 câu trắc nghiệm'), '3.3 Dynamic Quiz Count', 'Renders custom quizCount 8 cleanly');
assert(customCountHtml.includes('6 câu điền từ'), '3.4 Dynamic Cloze Count', 'Renders custom clozeCount 6 cleanly');

// Default fallback when undefined/0
const fallbackCountVideo: ListeningVideoIndexItem = {
  ...videos[0],
  quizCount: undefined as any,
  clozeCount: undefined as any,
};
const fallbackCountHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(ListeningVideoCard, { video: fallbackCountVideo }));
assert(fallbackCountHtml.includes('4 câu trắc nghiệm'), '3.5 Default Quiz Fallback', 'Defaults to 4 when quizCount is undefined');
assert(fallbackCountHtml.includes('4 câu điền từ'), '3.6 Default Cloze Fallback', 'Defaults to 4 when clozeCount is undefined');

// ----------------------------------------------------------------------------
// 4. Redesigned CTA button & Modern Card Interaction
// ----------------------------------------------------------------------------
console.log('\n--- Test Group 4: Redesigned CTA Button & Card Interaction ---');

assert(!sampleHtml.includes('w-full bg-indigo-600 py-2.5'), '4.1 Monolithic Button Removed', 'Old purple block button is completely absent');
assert(sampleHtml.includes('Luyện nghe'), '4.2 Interactive Pill "Luyện nghe"', 'Modern action pill "Luyện nghe" is present');
assert(sampleHtml.includes('đoạn phụ đề'), '4.3 Transcript Cue Counter', 'Transcript cue count rendered beside CTA pill');
assert(sampleHtml.includes('group-hover:translate-x-1'), '4.4 Animated Arrow Micro-interaction', 'ArrowRight has group-hover:translate-x-1 animation');

// Whole card clickable & Root anchor
const rootAnchor = $('a').first();
assert(rootAnchor.attr('href') === `/practice/listening/${videos[0].id}`, '4.5 Root Link Element', 'Entire card is wrapped in Next.js Link pointing to video detail');
assert(rootAnchor.hasClass('group'), '4.6 Group Class for Coordinated Hover', 'Root Link has group class for synchronizing hover effects');
assert(rootAnchor.hasClass('hover:-translate-y-1'), '4.7 Elevation Micro-interaction', 'Card has hover:-translate-y-1 elevation');

// Check no nested <a> tags
const nestedAnchors = $('a a');
assert(nestedAnchors.length === 0, '4.8 Valid HTML Semantics', 'No nested <a> tags inside outer card Link');

// Hover Play Overlay in Thumbnail
assert(sampleHtml.includes('group-hover:opacity-100'), '4.9 Hover Play Overlay', 'Thumbnail contains hover play button overlay');

// ----------------------------------------------------------------------------
// 5. Completion badge state
// ----------------------------------------------------------------------------
console.log('\n--- Test Group 5: Attempt & Completion Status Rendering ---');

const completedAttempt: ListeningAttempt = {
  videoId: videos[0].id,
  completedAt: '2026-09-07T00:00:00.000Z',
  clozeScore: 4,
  clozeTotal: 4,
  quizScore: 4,
  quizTotal: 4,
  percentScore: 100,
};
const inProgressAttempt: ListeningAttempt = {
  videoId: videos[0].id,
  completedAt: '2026-09-07T00:00:00.000Z',
  clozeScore: 2,
  clozeTotal: 4,
  quizScore: 2,
  quizTotal: 4,
  percentScore: 50,
};

const completedHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ListeningVideoCard, { video: videos[0], attempt: completedAttempt })
);
const inProgressHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ListeningVideoCard, { video: videos[0], attempt: inProgressAttempt })
);

assert(completedHtml.includes('Đã hoàn thành (100%)'), '5.1 Completion Badge (>=80%)', 'Shows "Đã hoàn thành (100%)" for high score');
assert(completedHtml.includes('ring-emerald-400/50'), '5.2 Emerald Ring Accent', 'Completed card has emerald ring accent');
assert(inProgressHtml.includes('Đã làm (50%)'), '5.3 Attempted Badge (<80%)', 'Shows "Đã làm (50%)" for in-progress score');

// ----------------------------------------------------------------------------
// Final Summary
// ----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`TOTAL FAILURES: ${failures}`);
if (failures === 0) {
  console.log('✅ ALL REVIEWER 1 ADVERSARIAL PROBES PASSED 100%!');
} else {
  console.error(`❌ ${failures} PROBE(S) FAILED!`);
  process.exit(1);
}
console.log('================================================================================\n');
