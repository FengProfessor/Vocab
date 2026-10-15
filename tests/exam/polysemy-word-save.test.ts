/**
 * Comprehensive Test Suite for Polysemy & Per-Meaning Word Saving Engine
 *
 * Verifies:
 * 1. Independent per-meaning saving for polysemous words (từ đa nghĩa).
 * 2. Distinct meanings of the same word can be saved individually without locking other meanings.
 * 3. Exact & normalized meaning matching prevents duplicate saves of the same sense.
 * 4. Full backwards compatibility with lingo_saved_words array in localStorage.
 * 5. Multi-sense extraction in parseDictPayload for ExamDictResult.
 */

import { TestRunner, expect } from '../toeic/test-harness';
import {
  isWordSavedLocally,
  saveWordLocally,
  isMeaningSavedLocally,
  saveMeaningLocally,
  getSavedMeaningsLocally,
  parseDictPayload,
} from '../../src/lib/exam-dict-cache';

function setupMockLocalStorage() {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  (global as any).window = {};
  (global as any).localStorage = mockStorage;
  return mockStorage;
}

export async function runPolysemyWordSaveTests(runner: TestRunner): Promise<void> {
  runner.describe('Polysemy & Per-Meaning Vocabulary Saving Engine', () => {

    runner.it('POLY-1: Saving meaning A does NOT mark meaning B as saved', () => {
      const storage = setupMockLocalStorage();
      const word = 'bank';
      const meaningA = 'ngân hàng, tổ chức tài chính';
      const meaningB = 'bờ sông, bờ đê';

      expect(isWordSavedLocally(word)).toBe(false);
      expect(isWordSavedLocally(word, meaningA)).toBe(false);
      expect(isWordSavedLocally(word, meaningB)).toBe(false);

      // Save only meaning A
      saveWordLocally(word, meaningA);

      // Word is generally saved
      expect(isWordSavedLocally(word)).toBe(true);
      // Meaning A is saved
      expect(isWordSavedLocally(word, meaningA)).toBe(true);
      expect(isMeaningSavedLocally(word, meaningA)).toBe(true);

      // Meaning B is strictly NOT saved!
      expect(isWordSavedLocally(word, meaningB)).toBe(false);
      expect(isMeaningSavedLocally(word, meaningB)).toBe(false);
    });

    runner.it('POLY-2: Multiple distinct meanings of the same word can be saved sequentially', () => {
      setupMockLocalStorage();
      const word = 'plant';
      const meaning1 = 'thực vật, cây cối';
      const meaning2 = 'nhà máy, xí nghiệp';
      const meaning3 = 'gieo hạt, trồng cây';

      saveWordLocally(word, meaning1);
      expect(isMeaningSavedLocally(word, meaning1)).toBe(true);
      expect(isMeaningSavedLocally(word, meaning2)).toBe(false);
      expect(isMeaningSavedLocally(word, meaning3)).toBe(false);

      // Now save meaning 2
      saveWordLocally(word, meaning2);
      expect(isMeaningSavedLocally(word, meaning1)).toBe(true);
      expect(isMeaningSavedLocally(word, meaning2)).toBe(true);
      expect(isMeaningSavedLocally(word, meaning3)).toBe(false);

      const savedList = getSavedMeaningsLocally(word);
      expect(savedList.length).toBe(2);
      expect(savedList).toContain(meaning1);
      expect(savedList).toContain(meaning2);
    });

    runner.it('POLY-3: Duplicate saving of the exact same meaning is deduplicated', () => {
      setupMockLocalStorage();
      const word = 'address';
      const meaning = 'địa chỉ nhà ở';

      saveWordLocally(word, meaning);
      saveWordLocally(word, meaning);
      saveWordLocally(word, '  địa chỉ nhà ở  ');

      const savedList = getSavedMeaningsLocally(word);
      expect(savedList.length).toBe(1);
      expect(savedList[0]).toBe(meaning);
    });

    runner.it('POLY-4: Full backwards compatibility with lingo_saved_words string array', () => {
      const storage = setupMockLocalStorage();
      saveWordLocally('strategy');

      // lingo_saved_words must be an array of lowercase strings
      const rawStored = JSON.parse(storage.getItem('lingo_saved_words') || '[]');
      expect(Array.isArray(rawStored)).toBe(true);
      expect(rawStored).toEqual(['strategy']);
      expect(isWordSavedLocally('strategy')).toBe(true);
    });

    runner.it('POLY-5: parseDictPayload extracts multiple distinct senses into meanings array', () => {
      const mockPayload = {
        word: 'bank',
        results: [
          {
            meanings: [
              { definition: 'ngân hàng', pos: 'noun', example: 'I went to the bank.' },
              { definition: 'bờ sông', pos: 'noun', example: 'They walked along the river bank.' },
              { definition: 'chất đống', pos: 'verb', example: 'Snow banked against the door.' },
            ],
          },
        ],
      };

      const result = parseDictPayload(mockPayload, 'bank', 'bank');
      expect(result).not.toBeNull();
      expect(result?.definition).toBe('ngân hàng');
      expect(Array.isArray(result?.meanings)).toBe(true);
      expect(result?.meanings?.length).toBe(3);
      expect(result?.meanings?.[0].definition).toBe('ngân hàng');
      expect(result?.meanings?.[1].definition).toBe('bờ sông');
      expect(result?.meanings?.[2].definition).toBe('chất đống');
    });

    runner.it('POLY-6: Core senses from Oxford/Cambridge take priority and populate meanings', () => {
      const mockPayload = {
        word: 'interest',
        core_senses: [
          { definition_vi: 'tiền lãi, lãi suất', pos: 'noun', popularity: 1 },
          { definition_vi: 'sự quan tâm, sở thích', pos: 'noun', popularity: 2 },
        ],
      };

      const result = parseDictPayload(mockPayload, 'interest', 'interest');
      expect(result).not.toBeNull();
      expect(result?.definition).toBe('tiền lãi, lãi suất');
      expect(result?.meanings?.length).toBe(2);
      expect(result?.meanings?.[0].definition).toBe('tiền lãi, lãi suất');
      expect(result?.meanings?.[1].definition).toBe('sự quan tâm, sở thích');
    });

  });
}

// Auto-run if executed directly
if (require.main === module || process.env.TSX_TEST === '1') {
  const runner = new TestRunner();
  runPolysemyWordSaveTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log('\n================================================================================');
      console.log('  POLYSEMY & PER-MEANING SAVING ENGINE TEST SUMMARY');
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
      console.error(err);
      process.exit(1);
    });
}
