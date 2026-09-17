/**
 * Comprehensive Unit Test Suite for RAM Fuzzy Search & Spell Corrector Engine
 *
 * Verifies:
 * 1. Damerau-Levenshtein distance calculations (insertions, deletions, substitutions, transpositions).
 * 2. Real-world typo test cases (double consonants, vowel confusion, missing letters, adjacent swaps).
 * 3. Smart suggestion combining prefix + fuzzy matches with deduplication.
 * 4. In-memory RAM benchmark: sub-50ms execution on 40,860 words.
 */

import { TestRunner, expect } from '../toeic/test-harness';
import {
  damerauLevenshtein,
  fuzzySuggestFromRAM,
  getSmartSuggestionsFromRAM,
  getInMemWordList,
} from '../../src/lib/dict-trie-engine';

export async function runFuzzyDictTests(runner: TestRunner): Promise<void> {
  runner.describe('RAM Fuzzy Search & Spell Correction Test Suite', () => {});

  // Pre-load words into RAM before tests run
  await getInMemWordList();

  await runner.it('FT-1.1: damerauLevenshtein accurately calculates edit distances for all 4 basic operations', () => {
    // Exact match
    expect(damerauLevenshtein('test', 'test')).toBe(0);

    // Substitution: cost 1
    expect(damerauLevenshtein('cat', 'bat')).toBe(1);

    // Deletion: cost 1
    expect(damerauLevenshtein('word', 'wod')).toBe(1);

    // Insertion: cost 1
    expect(damerauLevenshtein('word', 'words')).toBe(1);

    // Transposition: adjacent letters swapped (e.g. 'ab' -> 'ba' is 1 edit in Damerau-Levenshtein, but 2 in classic Levenshtein)
    expect(damerauLevenshtein('cheif', 'chief')).toBe(1);
    expect(damerauLevenshtein('recieve', 'receive')).toBe(1);

    // Length difference exceeding maxDist pruned immediately
    expect(damerauLevenshtein('a', 'aaaaa', 2)).toBe(3);
  });

  await runner.it('FT-1.2: fuzzySuggestFromRAM detects double consonant typos with d <= 2', () => {
    // accomodate -> accommodate
    const res1 = fuzzySuggestFromRAM('accomodate', 2, 5);
    expect(res1.some((m) => m.word.toLowerCase() === 'accommodate')).toBe(true);

    // ocassion -> occasion
    const res2 = fuzzySuggestFromRAM('ocassion', 2, 5);
    expect(res2.some((m) => m.word.toLowerCase() === 'occasion')).toBe(true);

    // commitee -> committee
    const res3 = fuzzySuggestFromRAM('commitee', 2, 5);
    expect(res3.some((m) => m.word.toLowerCase() === 'committee')).toBe(true);
  });

  await runner.it('FT-1.3: fuzzySuggestFromRAM detects vowel confusion / schwa sound typos', () => {
    // defenite -> definite
    const res1 = fuzzySuggestFromRAM('defenite', 2, 5);
    expect(res1.some((m) => m.word.toLowerCase() === 'definite')).toBe(true);
    expect(res1[0].word.toLowerCase()).toBe('definite');

    // seperate -> separate
    const res2 = fuzzySuggestFromRAM('seperate', 2, 5);
    expect(res2.some((m) => m.word.toLowerCase() === 'separate')).toBe(true);
  });

  await runner.it('FT-1.4: fuzzySuggestFromRAM detects missing or fat-fingered characters', () => {
    // applcant -> applicant
    const res1 = fuzzySuggestFromRAM('applcant', 2, 5);
    expect(res1.some((m) => m.word.toLowerCase() === 'applicant')).toBe(true);

    // stratgy -> strategy
    const res2 = fuzzySuggestFromRAM('stratgy', 2, 5);
    expect(res2.some((m) => m.word.toLowerCase() === 'strategy')).toBe(true);

    // convinient -> convenient
    const res3 = fuzzySuggestFromRAM('convinient', 2, 5);
    expect(res3.some((m) => m.word.toLowerCase() === 'convenient')).toBe(true);
  });

  await runner.it('FT-1.5: getSmartSuggestionsFromRAM returns prefix matches for correct queries without fuzzy overhead', () => {
    const res = getSmartSuggestionsFromRAM('appl', 5);
    expect(res.isFuzzy).toBe(false);
    expect(res.suggestions.length > 0).toBe(true);
    // All prefix suggestions start with 'appl'
    for (const w of res.suggestions) {
      expect(w.toLowerCase().startsWith('appl')).toBe(true);
    }
  });

  await runner.it('FT-1.6: getSmartSuggestionsFromRAM falls back to fuzzy matching when prefix returns 0 results', () => {
    const res = getSmartSuggestionsFromRAM('defenite', 5);
    expect(res.isFuzzy).toBe(true);
    expect(res.suggestions.includes('definite')).toBe(true);
    expect(res.didYouMean.includes('definite')).toBe(true);
  });

  await runner.it('FT-1.7: Performance benchmark: 10 distinct fuzzy queries across 40k words execute in under 500ms total', () => {
    const typos = [
      'defenite',
      'accomodate',
      'applcant',
      'ocassion',
      'cheif',
      'experince',
      'convinient',
      'stratgy',
      'commitee',
      'embaras',
    ];

    const start = performance.now();
    for (const typo of typos) {
      const matches = fuzzySuggestFromRAM(typo, 2, 3);
      expect(matches.length > 0).toBe(true);
    }
    const elapsed = performance.now() - start;
    // 10 queries across 40,860 words must take < 500ms total (average < 50ms per query)
    expect(elapsed < 500).toBe(true);
  });
}

// Direct execution when invoked via `npx tsx tests/exam/fuzzy-dict.test.ts`
if (require.main === module) {
  const runner = new TestRunner();
  runFuzzyDictTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log('\n================================================================================');
      console.log('  RAM FUZZY SEARCH & SPELL CORRECTOR ENGINE TEST SUMMARY');
      console.log('================================================================================');
      console.log(`  Total Tests : ${stats.total}`);
      console.log(`  Passed      : ${stats.passed}`);
      console.log(`  Failed      : ${stats.failed}`);
      console.log(`  Duration    : ${stats.durationMs}ms`);
      console.log('================================================================================\n');

      if (stats.failed > 0) {
        console.error(`❌ FAILURE: ${stats.failed} test(s) failed.`);
        process.exit(1);
      } else {
        console.log(`✅ SUCCESS: All ${stats.passed} tests passed cleanly!`);
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal error running tests:', err);
      process.exit(1);
    });
}
