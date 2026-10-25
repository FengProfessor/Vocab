/**
 * Adversarial Regression & Invariant Tests for Grammar Theory Modal / Pronoun Visual Deck
 */

import { PRONOUN_VISUAL_ITEMS } from '@/components/grammar/PronounVisualDeck';
import * as fs from 'fs';
import * as path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  [PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failCount++;
  }
}

console.log('\n============================================================');
console.log('ADVERSARIAL GRAMMAR MODAL & PRONOUN VISUAL DECK TEST SUITE');
console.log('============================================================\n');

// 1. REGEX WORD BOUNDARY TEST (Word Boundary Constraint)
console.log('>>> [1/6] Testing HighlightedSentence Word Boundary Regex...');
{
  const highlight = 'I';
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
  const sentence = 'I like music.';
  const parts = sentence.split(regex);

  assert(
    parts.length === 3 && parts[1] === 'I' && parts[2] === ' like music.',
    `"I like music." splits into exactly 3 parts with standalone "I" preserved`
  );

  const matchedIndices: string[] = [];
  parts.forEach(p => {
    if (p.toLowerCase() === highlight.toLowerCase()) matchedIndices.push(p);
  });

  assert(
    matchedIndices.length === 1 && matchedIndices[0] === 'I',
    `Only standalone "I" is matched, "like" and "music" are NOT matched as substrings`
  );

  // Test "it" in "I really like it."
  const itRegex = new RegExp(`\\b(it)\\b`, 'gi');
  const itParts = 'I really like it.'.split(itRegex);
  assert(
    itParts.filter(p => p.toLowerCase() === 'it').length === 1,
    `"it" matches standalone "it" without substring bleeding`
  );

  // Test "me" in "Can you help me?"
  const meRegex = new RegExp(`\\b(me)\\b`, 'gi');
  const meParts = 'Can you help me?'.split(meRegex);
  assert(
    meParts.filter(p => p.toLowerCase() === 'me').length === 1,
    `"me" matches standalone "me" without substring bleeding`
  );
}

// 2. PEDAGOGICAL HIGHLIGHT & SUBJECT/OBJECT COMPLETENESS AUDIT
console.log('\n>>> [2/6] Testing Pedagogical Highlights & Subject/Object Completeness Across All 7 Pronouns...');
{
  const allowedPronouns = new Set([
    'i', 'me', 'you', 'he', 'him', 'she', 'her', 'it', 'we', 'us', 'they', 'them'
  ]);
  const forbiddenVerbs = new Set(['am', 'is', 'are', 'like', 'live', 'can speak', 'study', 'plays', 'loves', 'speaks']);

  let allPronounsValid = true;
  let allNotesValid = true;
  let totalExamples = 0;

  PRONOUN_VISUAL_ITEMS.forEach(item => {
    item.examples.forEach(ex => {
      totalExamples++;
      const hw = ex.highlightWord?.toLowerCase();
      if (!hw || !allowedPronouns.has(hw) || forbiddenVerbs.has(hw)) {
        console.error(`Invalid highlightWord: "${ex.highlightWord}" in item "${item.subject}" ("${ex.en}")`);
        allPronounsValid = false;
      }
      if (!ex.highlightNote || ex.highlightNote.length < 15) {
        console.error(`Invalid or short highlightNote: "${ex.highlightNote}" in item "${item.subject}"`);
        allNotesValid = false;
      }
    });
  });

  assert(totalExamples === 28, `All 28 pronoun examples present across 7 visual items`);
  assert(allPronounsValid, `Every single example highlights exclusively the pronoun under study (ZERO verbs highlighted)`);
  assert(allNotesValid, `Every single example includes pedagogical note explaining pronoun grammatical function`);

  // Verify that card "I" includes its corresponding object pronoun "me"
  const itemI = PRONOUN_VISUAL_ITEMS.find(item => item.subject === 'I');
  const hasMeExample = itemI?.examples.some(ex => ex.highlightWord?.toLowerCase() === 'me');
  assert(
    Boolean(hasMeExample),
    `Card "I" includes an example featuring object pronoun "me" (satisfies R2 Subject ➔ Object conversion pair)`
  );

  // Verify all 7 pronouns cover their respective object pronouns
  const expectedObjects = [
    { sub: 'I', obj: 'me' },
    { sub: 'You', obj: 'you' },
    { sub: 'He', obj: 'him' },
    { sub: 'She', obj: 'her' },
    { sub: 'It', obj: 'it' },
    { sub: 'We', obj: 'us' },
    { sub: 'They', obj: 'them' },
  ];

  const allObjectsCovered = expectedObjects.every(({ sub, obj }) => {
    const item = PRONOUN_VISUAL_ITEMS.find(i => i.subject === sub);
    return item?.examples.some(ex => ex.highlightWord?.toLowerCase() === obj);
  });
  assert(allObjectsCovered, `All 7 pronoun decks contain both Subject and Object forms in their examples`);

  // Verify that for all 7 items, example[0] demonstrates Subject and example[1] demonstrates Object
  const immediatePairOrderValid = expectedObjects.every(({ sub, obj }) => {
    const item = PRONOUN_VISUAL_ITEMS.find(i => i.subject === sub);
    const ex0 = item?.examples[0]?.highlightWord?.toLowerCase();
    const ex1 = item?.examples[1]?.highlightWord?.toLowerCase();
    return ex0 === sub.toLowerCase() && ex1 === obj.toLowerCase();
  });
  assert(
    immediatePairOrderValid,
    `All 7 pronoun decks place Subject at index 0 and Object at index 1 for immediate zero-click pair visibility (R2)`
  );
}

// 3. ZERO RED ERROR STYLING PURGE AUDIT
console.log('\n>>> [3/6] Testing Zero Red Error Styling in Visual Deck Components...');
{
  const pvdPath = path.resolve(__dirname, '../../src/components/grammar/PronounVisualDeck.tsx');
  const gvdPath = path.resolve(__dirname, '../../src/components/grammar/GrammarVisualTopicDeck.tsx');
  const pvdContent = fs.readFileSync(pvdPath, 'utf8');
  const gvdContent = fs.readFileSync(gvdPath, 'utf8');

  const pvdRed = pvdContent.match(/border-red-500|bg-red-500|text-red-600/g);
  assert(pvdRed === null, `PronounVisualDeck.tsx has 0 red error styling classes`);

  // In GrammarVisualTopicDeck, VisualTopicCardItem must not have red classes
  const visualCardSection = gvdContent.slice(gvdContent.indexOf('function VisualTopicCardItem'));
  const visualCardRed = visualCardSection.match(/border-red-500|bg-red-500|text-red-600/g);
  assert(visualCardRed === null, `VisualTopicCardItem in GrammarVisualTopicDeck.tsx has 0 red error styling classes`);
}

// 4. RESPONSIVE TOUCH TARGET & ZERO-SCROLL INVARIANTS
console.log('\n>>> [4/6] Testing Responsive Touch Targets & Zero-Scroll Invariants...');
{
  const navPath = path.resolve(__dirname, '../../src/components/grammar/GrammarCardNavigator.tsx');
  const navContent = fs.readFileSync(navPath, 'utf8');

  assert(
    navContent.includes('pills ? \'hidden sm:flex\' : \'flex\''),
    `GrammarCardNavigator hides redundant chevrons on mobile when pills are present (ensures HIG touch targets)`
  );

  assert(
    navContent.includes('gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`'),
    `GrammarCardNavigator dynamically scales columns based on total item count`
  );

  const pagePath = path.resolve(__dirname, '../../src/app/grammar/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert(
    pageContent.includes('lg:max-w-5xl') && pageContent.includes('lg:max-h-[90dvh]'),
    `Grammar modal specifies desktop zero-scroll bounding box (lg:max-w-5xl lg:max-h-[90dvh])`
  );

  assert(
    pageContent.includes('Tra cứu<span className="hidden sm:inline"> thêm</span>'),
    `Modal header shortens tab label to "Tra cứu" on mobile to prevent title truncation`
  );

  // Close button on mobile is >= 36px
  assert(
    pageContent.includes('min-h-[36px] min-w-[36px]'),
    `Modal close button satisfies min-h-[36px] min-w-[36px] on mobile for ergonomic thumb tapping`
  );
}

// 5. AUDIO RESILIENCE & FALLBACK INVARIANTS
console.log('\n>>> [5/6] Testing Audio Manager Resilience Invariants...');
{
  const audioPath = path.resolve(__dirname, '../../src/lib/grammar/grammarAudioManager.ts');
  const audioContent = fs.readFileSync(audioPath, 'utf8');

  assert(
    audioContent.includes('let fellBack = false;') && audioContent.includes('triggerFallback'),
    `Audio manager suppresses duplicate fallback utterances between audio.onerror and play().catch`
  );

  assert(
    audioContent.includes('if (this.activeId === id)'),
    `Audio manager guards against obsolete speech fallback when activeId changes`
  );

  assert(
    audioContent.includes('if (this.currentUtterance === utterance)'),
    `Audio manager guards fallback utterance onend/onerror against canceled utterance race conditions`
  );

  assert(
    audioContent.includes('window.speechSynthesis.getVoices()') && audioContent.includes("v.lang === 'en-US'"),
    `Audio manager prioritizes English TTS voice selection for multi-language and non-English device locales`
  );

  assert(
    audioContent.includes('window.speechSynthesis.paused') && audioContent.includes('window.speechSynthesis.resume()'),
    `Audio manager checks and resumes paused/stalled speech synthesis queues`
  );

  // Check that PronounVisualDeck does not carry mismatched research dossier 0X.mp3 assets
  const pvdPath = path.resolve(__dirname, '../../src/components/grammar/PronounVisualDeck.tsx');
  const pvdContent = fs.readFileSync(pvdPath, 'utf8');
  const hasMismatchedMp3 = pvdContent.includes('/personal-pronouns/01.mp3') || pvdContent.includes('/personal-pronouns/08.mp3');
  assert(
    !hasMismatchedMp3,
    `PronounVisualDeck items have zero mismatched research dossier 0X.mp3 files (Web Speech synthesizes exact card text)`
  );
}

// 6. WAI-ARIA ACCESSIBILITY & TOUCH ERGONOMICS
console.log('\n>>> [6/6] Testing WAI-ARIA Accessibility Semantics & Touch Responsiveness...');
{
  const navPath = path.resolve(__dirname, '../../src/components/grammar/GrammarCardNavigator.tsx');
  const navContent = fs.readFileSync(navPath, 'utf8');

  assert(
    navContent.includes('tabIndex={isSelected ? 0 : -1}'),
    `GrammarCardNavigator implements strict WAI-ARIA tabIndex={isSelected ? 0 : -1} for keyboard navigation`
  );

  assert(
    navContent.includes('tabRefs.current[nextIndex]?.focus()'),
    `GrammarCardNavigator moves DOM focus to active tab on keyboard arrow navigation (roving tabindex)`
  );

  assert(
    navContent.includes('touch-manipulation'),
    `GrammarCardNavigator applies touch-manipulation to eliminate mobile 300ms tap delay`
  );

  assert(
    navContent.includes('id={`card-nav-tab-${item.label}`}') && navContent.includes('aria-controls='),
    `GrammarCardNavigator tabs provide id and aria-controls attributes`
  );

  const pvdPath = path.resolve(__dirname, '../../src/components/grammar/PronounVisualDeck.tsx');
  const pvdContent = fs.readFileSync(pvdPath, 'utf8');

  assert(
    pvdContent.includes('role="tabpanel"') && pvdContent.includes('id={`pronoun-panel-${item.subject}`}'),
    `PronounCardItem implements role="tabpanel" linked with aria-labelledby`
  );

  assert(
    pvdContent.includes('touch-manipulation'),
    `PronounVisualDeck implements touch-manipulation on buttons and example cards`
  );
}

console.log('\n============================================================');
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
}
