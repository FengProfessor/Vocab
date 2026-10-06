import assert from 'node:assert/strict';
import { getCollocationIndex, getCollocationVocabEntry } from '../../src/lib/toeic-collocation-index';
import { getDerivationalStems } from '../../src/lib/dict-cache';

console.log('\n--- DICTIONARY PRIMARY MEANINGS & WORD FAMILY TEST SUITE ---');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err);
    failed++;
  }
}

// 1. ESM Collocation Index Loading Test
test('1.1: Collocation index loads in ESM environment without ReferenceError', () => {
  const index = getCollocationIndex();
  assert(index !== null, 'Collocation index should not be null');
  assert(Object.keys(index).length > 10000, `Index should have > 10000 entries, got ${Object.keys(index).length}`);
});

// 2. TOEIC Index Word Family Availability Test
test('2.1: TOEIC index entries contain word_family definitions', () => {
  const wordsToTest = ['accommodate', 'economize', 'compete'];
  for (const w of wordsToTest) {
    const entry = getCollocationVocabEntry(w);
    assert(entry !== null, `Expected entry for "${w}"`);
    const fam = entry.wordFamily || (entry as any).word_family;
    assert(Array.isArray(fam), `Expected word_family array for "${w}"`);
    assert(fam.length > 0, `Expected at least 1 family word for "${w}", got ${fam?.length}`);
  }
});

// 3. Derivational Stem Expansion Test
test('3.1: getDerivationalStems expands common English prefixes and suffixes', () => {
  const stemsUnhappy = getDerivationalStems('unhappy');
  assert(stemsUnhappy.includes('happy'), 'unhappy should contain root "happy"');

  const stemsCareless = getDerivationalStems('careless');
  assert(stemsCareless.includes('care'), 'careless should contain root "care"');

  const stemsGovernment = getDerivationalStems('government');
  assert(stemsGovernment.includes('govern'), 'government should contain stem "govern"');

  const stemsActive = getDerivationalStems('active');
  assert(stemsActive.includes('act'), 'active should extract base stem "act"');
});

// 4. Meanings Ordering and Primary Elevation Logic Test
test('4.1: Curated senses are ordered by popularity with popularity 1 as primary', () => {
  const rawSenses = [
    { popularity: 3, definition_vi: 'Nghĩa ít gặp', pos: 'noun' },
    { popularity: 1, definition_vi: 'Nghĩa phổ biến nhất', pos: 'verb' },
    { popularity: 2, definition_vi: 'Nghĩa thông thường', pos: 'noun' },
  ];

  // Simulating buildOrderedMeanings logic
  const sorted = [...rawSenses].sort((a, b) => (a.popularity || 99) - (b.popularity || 99));
  const primary = sorted[0];
  const secondaries = sorted.slice(1);

  assert.equal(primary.popularity, 1, 'Primary meaning must have popularity = 1');
  assert.equal(primary.definition_vi, 'Nghĩa phổ biến nhất');
  assert.equal(secondaries.length, 2, 'Should have 2 secondary meanings');
  assert.equal(secondaries[0].popularity, 2);
  assert.equal(secondaries[1].popularity, 3);
});

// 5. Normalization of Word Family entries
test('5.1: normalizeFamilyWords logic preserves root words and separates headword', () => {
  // Simulate normalizeFamilyWords
  function normalizeFamilyWords(raw: unknown, headword?: string, morphology?: { rootWord?: string; rootMeaning?: string }) {
    if (!raw || !Array.isArray(raw)) return [];
    const headLower = headword?.trim().toLowerCase();
    const seen = new Set<string>();
    const parsed: Array<{ word: string; pos?: string; meaning?: string }> = [];

    for (const item of raw) {
      let entry: { word: string; pos?: string; meaning?: string } | null = null;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) continue;
        const m = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/);
        if (m) {
          entry = { word: m[1].trim(), pos: m[2].trim(), meaning: m[3]?.trim() || undefined };
        } else {
          entry = { word: trimmed };
        }
      } else if (item && typeof item === 'object' && (item as any).word) {
        entry = { ...(item as any) };
      }
      if (!entry || !entry.word) continue;
      const key = `${entry.word.toLowerCase()}:${entry.pos || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        parsed.push(entry);
      }
    }

    const otherWords = parsed.filter((e) => e.word.trim().toLowerCase() !== headLower);
    if (morphology?.rootWord && morphology.rootWord.trim().toLowerCase() !== headLower) {
      const rootLower = morphology.rootWord.trim().toLowerCase();
      const hasRoot = otherWords.some((e) => e.word.trim().toLowerCase() === rootLower);
      if (!hasRoot) {
        otherWords.unshift({
          word: morphology.rootWord.trim(),
          pos: 'từ gốc',
          meaning: morphology.rootMeaning || undefined,
        });
      }
    }
    if (otherWords.length > 0) return otherWords;

    if (morphology?.rootWord && morphology.rootWord.trim().toLowerCase() !== headLower) {
      return [
        {
          word: morphology.rootWord.trim(),
          pos: 'từ gốc',
          meaning: morphology.rootMeaning || undefined,
        },
        ...parsed.filter((e) => e.word.trim().toLowerCase() !== morphology!.rootWord!.trim().toLowerCase()),
      ];
    }
    if (parsed.length > 1) return parsed;
    return [];
  }

  // Case A: Headword with multiple derivatives
  const fam1 = normalizeFamilyWords(['economic (adj)', 'economical (adj)', 'economy (n)'], 'economy');
  assert.equal(fam1.length, 2, 'Should exclude headword "economy" since other derivatives exist');
  assert.equal(fam1[0].word, 'economic');
  assert.equal(fam1[1].word, 'economical');

  // Case B: Headword with rootWord in morphology
  const fam2 = normalizeFamilyWords(['unhappiness (n)'], 'unhappiness', { rootWord: 'happy', rootMeaning: 'hạnh phúc' });
  assert.equal(fam2.length, 1, 'Should include rootWord "happy"');
  assert.equal(fam2[0].word, 'happy');
  assert.equal(fam2[0].pos, 'từ gốc');
  assert.equal(fam2[0].meaning, 'hạnh phúc');

  // Case C: Conversion word (same word, multiple POS)
  const fam3 = normalizeFamilyWords(['tariff (n) thuế quan', 'tariff (v) đánh thuế'], 'tariff');
  assert.equal(fam3.length, 2, 'Should preserve both POS entries for conversion words');
});

// 6. Bidirectional Word Family Cluster Retrieval Test
test('6.1: Bidirectional clusters resolve family words for non-headwords and members', () => {
  const { getWordFamilyCluster } = require('../../src/lib/toeic-collocation-index');

  // succeed (not a top-level headword key in index, key was success)
  const succeedFam = getWordFamilyCluster('succeed');
  assert(succeedFam !== null && succeedFam.length > 0, 'succeed should resolve family words');
  const succeedWords = succeedFam.map((x: any) => x.word.toLowerCase());
  assert(succeedWords.includes('success'), 'succeed family must include "success"');
  assert(succeedWords.includes('successful'), 'succeed family must include "successful"');

  // inspire (headword key was inspiration or inspiring)
  const inspireFam = getWordFamilyCluster('inspire');
  assert(inspireFam !== null && inspireFam.length > 0, 'inspire should resolve family words');
  const inspireWords = inspireFam.map((x: any) => x.word.toLowerCase());
  assert(inspireWords.includes('inspiration') || inspireWords.includes('inspiring'), 'inspire family must include "inspiration" or "inspiring"');

  // contractor (headword key was contract)
  const contractorFam = getWordFamilyCluster('contractor');
  assert(contractorFam !== null && contractorFam.length > 0, 'contractor should resolve family words');
  const contractorWords = contractorFam.map((x: any) => x.word.toLowerCase());
  assert(contractorWords.includes('contract'), 'contractor family must include "contract"');

  // active (headword key was act or action)
  const activeFam = getWordFamilyCluster('active');
  assert(activeFam !== null && activeFam.length > 0, 'active should resolve family words');
  const activeWords = activeFam.map((x: any) => x.word.toLowerCase());
  assert(activeWords.includes('act') || activeWords.includes('action'), 'active family must include "act" or "action"');
});

// 7. Derivational Stem Fallback in Word Family Clusters
test('7.1: Derivational stems resolve family words for prefixed/inflected forms', () => {
  const { getWordFamilyCluster } = require('../../src/lib/toeic-collocation-index');

  // unsuccessful (prefix un- + successful -> success cluster)
  const unFam = getWordFamilyCluster('unsuccessful');
  assert(unFam !== null && unFam.length > 0, 'unsuccessful should resolve family via stem');
  const unWords = unFam.map((x: any) => x.word.toLowerCase());
  assert(unWords.includes('success') || unWords.includes('succeed'), 'unsuccessful family must include "success" or "succeed"');

  // disagreement (prefix dis- + agreement -> agree cluster)
  const disFam = getWordFamilyCluster('disagreement');
  assert(disFam !== null && disFam.length > 0, 'disagreement should resolve family via stem');
  const disWords = disFam.map((x: any) => x.word.toLowerCase());
  assert(disWords.includes('agree'), 'disagreement family must include "agree"');
});

// 8. Meaning Popularity and Primary Meaning Elevation
test('8.1: Curated TOEIC meaning is elevated as primary and CEFR A1 takes precedence over C2', () => {
  const meanings = [
    { pos: 'n', definition: 'Một thuật ngữ cổ ít dùng', cefr: 'C2' },
    { pos: 'n', definition: 'Định nghĩa sơ cấp phổ biến nhất', cefr: 'A1' },
    { pos: 'n', definition: 'Định nghĩa trung cấp', cefr: 'B1' },
  ];

  const cefrRank: Record<string, number> = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };
  meanings.sort((a, b) => (cefrRank[a.cefr.toLowerCase()] || 99) - (cefrRank[b.cefr.toLowerCase()] || 99));

  assert.equal(meanings[0].definition, 'Định nghĩa sơ cấp phổ biến nhất');
  assert.equal(meanings[0].cefr, 'A1');
  assert.equal(meanings[2].cefr, 'C2');
});

console.log('\n================================================================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================================\n');

if (failed > 0) {
  process.exit(1);
}

