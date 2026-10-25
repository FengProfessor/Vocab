/**
 * Unit & edge case tests for Review Session deduplication, cloze matching, and queue logic.
 */
import { deduplicateWords, isCardReady } from '../src/app/review/session/page';
import { buildWordChoices, makeCloze, verdictAndQuality, shuffle } from '../src/lib/review-modes';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

console.log('\n[ReviewSession] Unit & Edge Case Tests\n');

// 1. deduplicateWords
console.log('1. deduplicateWords');
{
  const words = [
    { id: '1', word: 'apple', translation: 'quả táo' },
    { id: '2', word: 'Apple', translation: 'quả táo (lớp 2)' },
    { id: '3', word: '  apple  ', translation: 'quả táo (lớp 3)' },
    { id: '4', word: 'banana', translation: 'quả chuối' },
    { id: '5', word: 'BANANA', translation: 'quả chuối' },
  ];
  const deduped = deduplicateWords(words);
  assert('deduplicates case-insensitively and whitespace-trimmed', deduped.length === 2);
  assert('preserves first occurrence when counts are equal', deduped[0].id === '1' && deduped[1].id === '4');

  // Cross-classroom SRS priority: prefers higher reviewCount or srsLevel
  const crossClassWords = [
    { id: 'c1', word: 'antibiotic', srsLevel: 1, reviewCount: 1 },
    { id: 'c2', word: 'Antibiotic', srsLevel: 4, reviewCount: 8 },
    { id: 'c3', word: 'ANTIBIOTIC', srsLevel: 2, reviewCount: 2 },
  ];
  const priorityDedup = deduplicateWords(crossClassWords);
  assert('prefers entry with higher reviewCount across classrooms', priorityDedup.length === 1 && priorityDedup[0].id === 'c2' && priorityDedup[0].reviewCount === 8);

  const emptyList: { word: string }[] = [];
  assert('handles empty list', deduplicateWords(emptyList).length === 0);

  const invalidEntries = [
    { word: '' },
    { word: '   ' },
    { word: null as unknown as string },
    { word: undefined as unknown as string },
    { word: 123 as unknown as string },
    { word: 'valid' },
  ];
  const validOnly = deduplicateWords(invalidEntries);
  assert('filters out empty, blank, or non-string words without throwing', validOnly.length === 1 && validOnly[0].word === 'valid');
}

// 2. cloze_mcq choice and answer consistency & collision prevention
console.log('\n2. cloze_mcq choice and answer consistency & collision prevention');
{
  const word = {
    id: 'w1',
    word: 'germ',
    translation: 'vi trùng, mầm bệnh',
    example: 'Germs can cause severe illnesses in children.',
  };
  const poolWithCollision = [
    word,
    { id: 'w2', word: 'germs', translation: 'các vi trùng' }, // collision with clozeAns
    { id: 'w3', word: 'antibiotic', translation: 'kháng sinh' },
    { id: 'w4', word: 'bacteria', translation: 'vi khuẩn' },
    { id: 'w5', word: 'virus', translation: 'vi-rút' },
  ];

  const cloze = makeCloze(word.example, word.word);
  const clozeAns = (cloze?.answer ?? word.word).trim();
  assert('cloze answer matches surface form "Germs"', clozeAns === 'Germs');

  // New collision-free distractor selection algorithm
  const clozeAnsLower = clozeAns.toLowerCase();
  const wordLower = word.word.trim().toLowerCase();
  const candidateWords = poolWithCollision
    .map((w) => w.word?.trim())
    .filter((w): w is string => Boolean(w));
  const distinctDistractors: string[] = [];
  const seen = new Set<string>([clozeAnsLower, wordLower]);
  for (const cand of shuffle(candidateWords)) {
    const candLower = cand.toLowerCase();
    if (!seen.has(candLower)) {
      seen.add(candLower);
      distinctDistractors.push(cand);
      if (distinctDistractors.length >= 3) break;
    }
  }
  let padIdx = 1;
  while (distinctDistractors.length < 3) {
    distinctDistractors.push(`(option ${padIdx++})`);
  }
  const finalChoices = [clozeAns, ...distinctDistractors];

  assert('contains exactly 4 choices', finalChoices.length === 4);
  assert('contains clozeAns ("Germs")', finalChoices.includes(clozeAns));
  assert('does NOT contain duplicate "germs" distractor', !distinctDistractors.some((d) => d.toLowerCase() === clozeAnsLower));
  assert('does NOT contain base lemma "germ" distractor', !distinctDistractors.some((d) => d.toLowerCase() === wordLower));
  const uniqueNormalized = new Set(finalChoices.map((c) => c.toLowerCase()));
  assert('all choices are completely unique (no duplicates)', uniqueNormalized.size === 4);

  // Test handleMcq matching logic:
  const testMatch = (choice: string, answer: string, currentWord: string, itemMode: string) => {
    const cLower = choice.trim().toLowerCase();
    const ansLower = answer.trim().toLowerCase();
    const wordLower = currentWord.trim().toLowerCase();
    return cLower === ansLower || (itemMode === 'cloze_mcq' && cLower === wordLower);
  };

  assert('matches when user selects surface form "Germs"', testMatch('Germs', clozeAns, word.word, 'cloze_mcq'));
  assert('matches when user selects base form "germ"', testMatch('germ', clozeAns, word.word, 'cloze_mcq'));
  assert('does NOT match wrong distractor "virus"', !testMatch('virus', clozeAns, word.word, 'cloze_mcq'));
}

// 3. cloze_type typing evaluation
console.log('\n3. cloze_type typing evaluation (exact lemma promotion)');
{
  const word = { id: 'w1', word: 'germ', example: 'Germs can cause disease.' };
  const clozeAns = 'Germs';

  const evaluateClozeType = (guess: string, answer: string, currentWord: string) => {
    let { verdict: v, quality } = verdictAndQuality(guess, answer, 'cloze_type', 1500);
    if (v !== 'correct' && currentWord) {
      const alt = verdictAndQuality(guess, currentWord, 'cloze_type', 1500);
      if (alt.verdict === 'correct') {
        v = 'correct';
        quality = alt.quality;
      } else if (v === 'wrong' && alt.verdict === 'close') {
        v = 'close';
        quality = alt.quality;
      }
    }
    return { v, quality };
  };

  const resExactSurface = evaluateClozeType('Germs', clozeAns, word.word);
  assert('typing exact surface form "Germs" produces correct + Easy', resExactSurface.v === 'correct' && resExactSurface.quality === 5);

  const resExactLemma = evaluateClozeType('germ', clozeAns, word.word);
  assert('typing exact lemma "germ" is promoted to correct + Easy (NOT stuck at close)', resExactLemma.v === 'correct' && resExactLemma.quality === 5);

  const resTypoLemma = evaluateClozeType('gem', clozeAns, word.word);
  assert('typing typo in lemma "gem" results in close (Hard)', resTypoLemma.v === 'close' && resTypoLemma.quality === 3);

  const resWrong = evaluateClozeType('banana', clozeAns, word.word);
  assert('typing unrelated word "banana" results in wrong (0)', resWrong.v === 'wrong' && resWrong.quality === 0);
}

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
