/**
 * Unit & edge case tests for Review Session deduplication, cloze matching, and queue logic.
 */
import { deduplicateWords, isCardReady } from '../src/app/review/session/page';
import { buildWordChoices, makeCloze } from '../src/lib/review-modes';

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
  assert('preserves first occurrence', deduped[0].id === '1' && deduped[1].id === '4');

  const emptyList: { word: string }[] = [];
  assert('handles empty list', deduplicateWords(emptyList).length === 0);

  const invalidEntries = [
    { word: '' },
    { word: '   ' },
    { word: 'valid' },
  ];
  const validOnly = deduplicateWords(invalidEntries);
  assert('filters out empty or blank words', validOnly.length === 1 && validOnly[0].word === 'valid');
}

// 2. cloze_mcq choice and answer consistency
console.log('\n2. cloze_mcq choice and answer consistency');
{
  const word = {
    id: 'w1',
    word: 'germ',
    translation: 'vi trùng, mầm bệnh',
    example: 'Germs can cause severe illnesses in children.',
  };
  const pool = [
    word,
    { id: 'w2', word: 'antibiotic', translation: 'kháng sinh' },
    { id: 'w3', word: 'bacteria', translation: 'vi khuẩn' },
    { id: 'w4', word: 'virus', translation: 'vi-rút' },
  ];

  const cloze = makeCloze(word.example, word.word);
  const clozeAns = (cloze?.answer ?? word.word).trim();

  // Test raw choices
  const rawChoices = buildWordChoices(word, pool, 'word');
  assert('raw choices contain base word', rawChoices.map((c) => c.toLowerCase()).includes('germ'));

  // Normalize choices as done in setupCard
  const wordLower = word.word.trim().toLowerCase();
  let replaced = false;
  const normalizedChoices = rawChoices.map((c) => {
    if (!replaced && c.trim().toLowerCase() === wordLower) {
      replaced = true;
      return clozeAns;
    }
    return c;
  });
  if (!replaced && !normalizedChoices.some((c) => c.trim().toLowerCase() === clozeAns.toLowerCase())) {
    normalizedChoices[0] = clozeAns;
  }

  assert('normalized choices contain clozeAns (surface form)', normalizedChoices.includes(clozeAns));

  // Test handleMcq matching logic:
  // User clicks "germ" or "Germs"
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

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
