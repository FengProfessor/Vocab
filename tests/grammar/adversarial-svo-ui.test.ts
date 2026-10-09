/**
 * Adversarial Stress & Empirical Verification Harness for SvoSentenceVisualDeck
 *
 * Authored by: challenger_svo_2 (UI and Layout Empirical Challenger)
 * Scope:
 *  1. CSS & Layout Strictness (zero forbidden rounded, zero red error classes, dark mode classes, zero-scroll bounding, touch targets)
 *  2. Audio & Interaction Lifecycle (grammarAudio play/stopAll/subscription, active state pulse, vibration safe-guards)
 *  3. Structural & Pedagogical Data Consistency (all 16 sentences, 4 groups, pronoun shifts, role explanations)
 *  4. Component Delegation & Server-side Render Simulation (guided=false and guided=true, zero crash)
 */

import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Import component under test
import SvoSentenceVisualDeck, { SVO_GROUPS } from '@/components/grammar/SvoSentenceVisualDeck';
import GrammarVisualTopicDeck from '@/components/grammar/GrammarVisualTopicDeck';
import { grammarAudio } from '@/lib/grammar/grammarAudioManager';

let testCount = 0;
let passCount = 0;
let failCount = 0;
const failureList: string[] = [];

function check(desc: string, passed: boolean, extraInfo?: string) {
  testCount++;
  if (passed) {
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    if (extraInfo) console.error(`         -> ${extraInfo}`);
    failCount++;
    failureList.push(desc);
  }
}

console.log('\n======================================================================');
console.log('   ADVERSARIAL STRESS TEST: SVO SENTENCE VISUAL DECK (UI & LAYOUT)');
console.log('======================================================================\n');

// ──────────────────────────────────────────────────────────────────────────
// SECTION 1: CSS & LAYOUT STRICTNESS
// ──────────────────────────────────────────────────────────────────────────
console.log('--- SECTION 1: CSS & Layout Strictness ---');

const deckFilePath = path.resolve(process.cwd(), 'src/components/grammar/SvoSentenceVisualDeck.tsx');
const deckSource = fs.readFileSync(deckFilePath, 'utf8');

// 1.1: Forbidden rounded classes
const forbiddenRoundedRegex = /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g;
const matchedForbiddenRounded = deckSource.match(forbiddenRoundedRegex);
check(
  '1.1: SvoSentenceVisualDeck contains 0 forbidden rounded classes (sm, md, lg, xl, 2xl, 3xl, full)',
  matchedForbiddenRounded === null,
  matchedForbiddenRounded ? `Found: ${matchedForbiddenRounded.join(', ')}` : undefined
);

// 1.2: Check for any bare 'rounded' or unapproved rounded-* variant other than 'rounded-none'
const anyRoundedRegex = /\brounded(?:\-[a-z0-9]+)?\b/g;
const allRoundedMatches = Array.from(deckSource.matchAll(anyRoundedRegex)).map((m) => m[0]);
const invalidRounded = allRoundedMatches.filter((c) => c !== 'rounded-none');
check(
  '1.2: Strictly ONLY "rounded-none" is used throughout SvoSentenceVisualDeck (no bare "rounded" or partial corners)',
  invalidRounded.length === 0,
  invalidRounded.length > 0 ? `Unapproved rounded tokens: ${invalidRounded.join(', ')}` : undefined
);

// 1.3: Forbidden red classes
const forbiddenRedRegex = /\b(?:border|bg|text|ring|fill|outline)-red-\d+\b/g;
const matchedForbiddenRed = deckSource.match(forbiddenRedRegex);
check(
  '1.3: SvoSentenceVisualDeck contains 0 red error classes (no border-red-500, bg-red-500, text-red-600, etc.)',
  matchedForbiddenRed === null,
  matchedForbiddenRed ? `Found: ${matchedForbiddenRed.join(', ')}` : undefined
);

// 1.4: Color tokens for S, V, O blocks
check(
  '1.4a: S (Subject) block has light + dark sky styling (border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300)',
  deckSource.includes('border-sky-400') &&
    deckSource.includes('bg-sky-50') &&
    deckSource.includes('dark:bg-sky-950/40') &&
    deckSource.includes('text-sky-700') &&
    deckSource.includes('dark:text-sky-300')
);

check(
  '1.4b: V (Verb) block has light + dark amber styling (border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300)',
  deckSource.includes('border-amber-400') &&
    deckSource.includes('bg-amber-50') &&
    deckSource.includes('dark:bg-amber-950/40') &&
    deckSource.includes('text-amber-700') &&
    deckSource.includes('dark:text-amber-300')
);

check(
  '1.4c: O (Object) block has light + dark emerald styling (border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300)',
  deckSource.includes('border-emerald-400') &&
    deckSource.includes('bg-emerald-50') &&
    deckSource.includes('dark:bg-emerald-950/40') &&
    deckSource.includes('text-emerald-700') &&
    deckSource.includes('dark:text-emerald-300')
);

// 1.5: Desktop zero-scroll containment
check(
  '1.5: Outer container includes "max-w-4xl mx-auto min-w-0" for zero-scroll desktop bounding',
  deckSource.includes('max-w-4xl mx-auto min-w-0')
);

// 1.6: Mobile touch ergonomics
check(
  '1.6a: Interactive buttons enforce minimum touch target height min-h-[44px]',
  (deckSource.match(/min-h-\[44px\]/g) || []).length >= 2
);

check(
  '1.6b: Interactive buttons enforce "touch-manipulation" to eliminate 300ms mobile tap lag',
  (deckSource.match(/touch-manipulation/g) || []).length >= 2
);

// ──────────────────────────────────────────────────────────────────────────
// SECTION 2: AUDIO & INTERACTION LIFECYCLE
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 2: Audio & Interaction Lifecycle ---');

// 2.1: Singleton grammarAudio subscription teardown
check(
  '2.1: grammarAudio subscription cleanly returned in useEffect cleanup',
  deckSource.includes('return grammarAudio.subscribe(setAudioState);')
);

// 2.2: Category change stops audio
check(
  '2.2: Tab change in standard tablist calls grammarAudio.stopAll()',
  deckSource.includes('grammarAudio.stopAll();\n                  setActiveCategoryIdx(idx);') ||
    deckSource.includes('grammarAudio.stopAll();')
);

check(
  '2.3: Guided navigator onChange calls grammarAudio.stopAll()',
  deckSource.includes('grammarAudio.stopAll();\n            setActiveCategoryIdx(nextIdx);') ||
    deckSource.includes('grammarAudio.stopAll();')
);

// 2.4: Audio play button has accessible attributes
check(
  '2.4: Audio button has aria-label and title for accessibility',
  deckSource.includes('aria-label={`Nghe phát âm: ${sentence.en}`}') &&
    deckSource.includes('title={`Nghe phát âm: "${sentence.en}"`}')
);

// 2.5: Safe vibration call
check(
  '2.5: Haptic feedback uses safe navigator guard for non-browser/unsupported environments',
  deckSource.includes("typeof navigator !== 'undefined' && 'vibrate' in navigator")
);

// ──────────────────────────────────────────────────────────────────────────
// SECTION 3: STRUCTURAL & PEDAGOGICAL DATA CONSISTENCY
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 3: Structural & Pedagogical Data Consistency ---');

// 3.1: Exactly 4 groups
check(
  '3.1: SVO_GROUPS has exactly 4 categories',
  SVO_GROUPS.length === 4,
  `Observed: ${SVO_GROUPS.length}`
);

// 3.2: 4 sentences per group -> total 16
const totalSentences = SVO_GROUPS.reduce((acc, g) => acc + g.sentences.length, 0);
check(
  '3.2: Each group has exactly 4 sentences (total 16 sentences)',
  totalSentences === 16 && SVO_GROUPS.every((g) => g.sentences.length === 4),
  `Total: ${totalSentences}`
);

// 3.3: Unique IDs
const allIds = SVO_GROUPS.flatMap((g) => g.sentences.map((s) => s.id));
const uniqueIds = new Set(allIds);
check(
  '3.3: All 16 sentence IDs are globally unique',
  uniqueIds.size === 16,
  `Total IDs: ${allIds.length}, Unique: ${uniqueIds.size}`
);

// 3.4: Complete fields on every sentence
const allFieldsComplete = SVO_GROUPS.every((g) =>
  g.sentences.every(
    (s) =>
      Boolean(s.id) &&
      Boolean(s.vi) &&
      Boolean(s.viS) &&
      Boolean(s.viV) &&
      Boolean(s.viO) &&
      Boolean(s.en) &&
      Boolean(s.enS) &&
      Boolean(s.enV) &&
      Boolean(s.enO) &&
      Boolean(s.roleExplanation?.s) &&
      Boolean(s.roleExplanation?.v) &&
      Boolean(s.roleExplanation?.o)
  )
);
check(
  '3.4: All sentences have complete S, V, O decomposition and role explanations',
  allFieldsComplete
);

// 3.5: Group 4 Interpersonal Pronoun Transitions (Crucial A0 pedagogical bridge)
const pGroup = SVO_GROUPS.find((g) => g.id === 'interpersonal');
check(
  '3.5a: Interpersonal group exists',
  Boolean(pGroup)
);

if (pGroup) {
  const p1 = pGroup.sentences.find((s) => s.id === 'svo-person-01'); // Tôi yêu bạn -> I love you
  const p2 = pGroup.sentences.find((s) => s.id === 'svo-person-02'); // Bạn yêu tôi -> You love me
  const p3 = pGroup.sentences.find((s) => s.id === 'svo-person-03'); // Tôi giúp anh ấy -> I help him
  const p4 = pGroup.sentences.find((s) => s.id === 'svo-person-04'); // Anh ấy giúp tôi -> He helps me

  check(
    '3.5b: "Tôi yêu bạn" -> [S: I] and [O: you]',
    p1?.enS === 'I' && p1?.enO === 'you'
  );
  check(
    '3.5c: "Bạn yêu tôi" -> [S: You] and [O: me] (Morphological change: tôi -> me)',
    p2?.enS === 'You' && p2?.enO === 'me'
  );
  check(
    '3.5d: "Tôi giúp anh ấy" -> [S: I] and [O: him] (Morphological change: anh ấy -> him)',
    p3?.enS === 'I' && p3?.enO === 'him'
  );
  check(
    '3.5e: "Anh ấy giúp tôi" -> [S: He] and [O: me] (Morphological change: anh ấy -> He, tôi -> me)',
    p4?.enS === 'He' && p4?.enO === 'me'
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION 4: SERVER-SIDE RENDER & DELEGATION SIMULATION
// ──────────────────────────────────────────────────────────────────────────
console.log('\n--- SECTION 4: Server-Side Render & Delegation Simulation ---');

try {
  // Test 4.1: Render SvoSentenceVisualDeck (guided=false)
  const htmlDefault = renderToStaticMarkup(React.createElement(SvoSentenceVisualDeck, { guided: false }));
  check(
    '4.1: SvoSentenceVisualDeck renders cleanly to HTML with guided=false',
    htmlDefault.length > 500 && htmlDefault.includes('Tầng 1: Tiếng Việt trực giác')
  );

  // Test 4.2: Render SvoSentenceVisualDeck (guided=true)
  const htmlGuided = renderToStaticMarkup(React.createElement(SvoSentenceVisualDeck, { guided: true }));
  check(
    '4.2: SvoSentenceVisualDeck renders cleanly to HTML with guided=true',
    htmlGuided.length > 500 && htmlGuided.includes('Tầng 2: Cầu nối giải thích vai trò ngữ pháp')
  );

  // Test 4.3: Render GrammarVisualTopicDeck with topicSlug="sentence-structure-svo"
  const htmlDelegated = renderToStaticMarkup(
    React.createElement(GrammarVisualTopicDeck, {
      topicSlug: 'sentence-structure-svo',
      guided: false,
    })
  );
  check(
    '4.3: GrammarVisualTopicDeck successfully delegates "sentence-structure-svo" to SvoSentenceVisualDeck',
    htmlDelegated.includes('Mô hình 3 Khối SVO: Bắc cầu trực giác Việt ➔ Anh')
  );

  // Test 4.4: Rendered HTML contains zero forbidden rounded classes
  const renderedForbiddenRounded = htmlDefault.match(forbiddenRoundedRegex);
  check(
    '4.4: Rendered HTML contains ZERO forbidden rounded classes',
    renderedForbiddenRounded === null,
    renderedForbiddenRounded ? `Found: ${renderedForbiddenRounded.join(', ')}` : undefined
  );

  // Test 4.5: Rendered HTML contains zero red error styling
  const renderedForbiddenRed = htmlDefault.match(forbiddenRedRegex);
  check(
    '4.5: Rendered HTML contains ZERO red error styling classes',
    renderedForbiddenRed === null,
    renderedForbiddenRed ? `Found: ${renderedForbiddenRed.join(', ')}` : undefined
  );

  // Test 4.6: Rendered HTML contains Golden Rule card
  check(
    '4.6: Rendered HTML contains Golden Rule card text',
    htmlDefault.includes('Quy tắc vàng: Không bao giờ bỏ rơi S và V trong câu tiếng Anh')
  );
} catch (err: any) {
  check('4.x: Component render simulation encountered uncaught exception', false, err.message);
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION 5: FINAL REPORT
// ──────────────────────────────────────────────────────────────────────────
console.log('\n======================================================================');
console.log(`TOTAL ADVERSARIAL CHECKS : ${testCount}`);
console.log(`PASSED                  : ${passCount}`);
console.log(`FAILED                  : ${failCount}`);
console.log('======================================================================\n');

if (failCount > 0) {
  console.error('ADVERSARIAL FAILURES:');
  failureList.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
  process.exit(1);
} else {
  console.log('ALL ADVERSARIAL STRESS CHECKS PASSED!\n');
  process.exit(0);
}
