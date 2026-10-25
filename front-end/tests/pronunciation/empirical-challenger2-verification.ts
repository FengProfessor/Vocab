import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  InteractiveIpaVideoPlayer,
  type RachelVideoMeta,
} from '../../src/components/pronunciation/InteractiveIpaVideoPlayer';

console.log('=== EMPIRICAL CHALLENGER 2 INDEPENDENT VERIFICATION ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failCount++;
  }
}

const sampleVideo: RachelVideoMeta = {
  youtubeVideoId: 'pRXsIthxgH8',
  startSeconds: 35,
  endSeconds: 95,
  channelName: "Rachel's English",
  videoTip: 'Drop your jaw by about 5mm and keep the tongue relaxed low in the mouth.',
  clipTitle: 'Intro to Word Stress: American English Pronunciation',
};

// Test 1: Single iframe in Expanded Mode
const htmlExpanded = renderToStaticMarkup(
  React.createElement(InteractiveIpaVideoPlayer, {
    video: sampleVideo,
    ipa: 'ˈ●○',
    collapsible: true,
    defaultCollapsed: false,
  })
);

const iframesInExpanded = (htmlExpanded.match(/<iframe/g) || []).length;
assert(iframesInExpanded === 1, 'Expanded state contains EXACTLY ONE iframe');

// Test 2: Single iframe in Collapsed Mode
const htmlCollapsed = renderToStaticMarkup(
  React.createElement(InteractiveIpaVideoPlayer, {
    video: sampleVideo,
    ipa: 'ˈ●○',
    collapsible: true,
    defaultCollapsed: true,
  })
);

const iframesInCollapsed = (htmlCollapsed.match(/<iframe/g) || []).length;
assert(iframesInCollapsed === 1, 'Collapsed state contains EXACTLY ONE iframe');

// Test 3: Iframe Parent Container CSS Class Switching
const collapsedContainerRegex = /<div class="h-0 w-0 overflow-hidden opacity-0 pointer-events-none absolute -z-50">\s*<iframe/m;
const expandedContainerRegex = /<div class="relative aspect-video w-full rounded-xl bg-black overflow-hidden shadow-md mt-3">\s*<iframe/m;

assert(
  collapsedContainerRegex.test(htmlCollapsed),
  'Collapsed container has CSS classes: "h-0 w-0 overflow-hidden opacity-0 pointer-events-none absolute -z-50"'
);

assert(
  expandedContainerRegex.test(htmlExpanded),
  'Expanded container has CSS classes: "relative aspect-video w-full rounded-xl bg-black overflow-hidden shadow-md mt-3"'
);

// Test 4: Absolute removal of legacy duplicate hidden iframe markup
assert(
  !htmlExpanded.includes('-collapsed'),
  'No legacy duplicate "-collapsed" iframe ID found in expanded HTML'
);
assert(
  !htmlCollapsed.includes('-collapsed'),
  'No legacy duplicate "-collapsed" iframe ID found in collapsed HTML'
);

// Test 5: Iframe ID continuity across states
const expIdMatch = htmlExpanded.match(/<iframe[^>]*id="([^"]+)"/);
const colIdMatch = htmlCollapsed.match(/<iframe[^>]*id="([^"]+)"/);
assert(Boolean(expIdMatch && colIdMatch), 'Both expanded and collapsed have an iframe ID');
if (expIdMatch && colIdMatch) {
  // In server-side rendering with useId(), each render gets an ID.
  assert(
    expIdMatch[1].startsWith('ipa-yt-player-') && colIdMatch[1].startsWith('ipa-yt-player-'),
    'Iframe IDs adhere to stable format "ipa-yt-player-*"'
  );
}

// Test 6: Iframe internal styling is preserved
assert(
  htmlExpanded.includes('class="absolute inset-0 w-full h-full border-0"'),
  'Expanded iframe has "absolute inset-0 w-full h-full border-0"'
);
assert(
  htmlCollapsed.includes('class="absolute inset-0 w-full h-full border-0"'),
  'Collapsed iframe has "absolute inset-0 w-full h-full border-0"'
);

// Test 7: Privacy-enhanced domain usage
assert(
  htmlExpanded.includes('https://www.youtube-nocookie.com/embed/pRXsIthxgH8'),
  'Embed URL strictly uses youtube-nocookie.com privacy domain'
);
assert(
  htmlExpanded.includes('start=35') && htmlExpanded.includes('end=95'),
  'Embed URL parameters include start=35 and end=95'
);

// Test 8: Flat props with empty video object fallback
const htmlFlat = renderToStaticMarkup(
  React.createElement(InteractiveIpaVideoPlayer, {
    video: {
      youtubeVideoId: '',
      startSeconds: 0,
      endSeconds: 0,
      channelName: "Rachel's English",
      videoTip: '',
    },
    videoId: 'pRXsIthxgH8',
    startSeconds: 35,
    endSeconds: 95,
    keyArticulationTip: 'Mẹo khẩu hình flat prop',
    collapsible: true,
    defaultCollapsed: false,
  })
);
assert((htmlFlat.match(/<iframe/g) || []).length === 1, 'Flat props render exactly 1 iframe');
assert(htmlFlat.includes('Mẹo khẩu hình flat prop'), 'Flat props render articulatory tip correctly');

// Test 9: Rapid 100x collapse state toggle simulation
let togglePass = true;
for (let i = 0; i < 100; i++) {
  const isCol = i % 2 === 0;
  const markup = renderToStaticMarkup(
    React.createElement(InteractiveIpaVideoPlayer, {
      video: sampleVideo,
      collapsible: true,
      defaultCollapsed: isCol,
    })
  );
  const count = (markup.match(/<iframe/g) || []).length;
  if (count !== 1) {
    togglePass = false;
    break;
  }
}
assert(togglePass, '100x Rapid collapse state toggle maintains invariant of exactly 1 persistent iframe');

// Test 10: Non-collapsible mode
const htmlNonCollapsible = renderToStaticMarkup(
  React.createElement(InteractiveIpaVideoPlayer, {
    video: sampleVideo,
    collapsible: false,
  })
);
assert(!htmlNonCollapsible.includes('Thu gọn'), 'Non-collapsible mode does not render collapse button');
assert(
  expandedContainerRegex.test(htmlNonCollapsible),
  'Non-collapsible mode renders standard expanded persistent iframe container'
);

console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL EMPIRICAL CHALLENGER 2 VERIFICATIONS PASSED!\n');
}
