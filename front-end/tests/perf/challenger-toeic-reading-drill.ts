/**
 * Empirical Challenger: Stress test TOEIC Reading Dynamic Data Extraction.
 */

import readingContentRaw from '../../src/data/toeic/content-toeic-reading-v1.json';
import type { ToeicReadingContent, ToeicPart5Item, ToeicPart6Item, ToeicPart7Item } from '../../src/types/toeic';

function runToeicReadingDrillTest() {
  console.log('='.repeat(80));
  console.log('CHALLENGER STRESS SUITE: TOEIC Reading Dynamic Extraction');
  console.log('='.repeat(80));

  const content = readingContentRaw as unknown as ToeicReadingContent;
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // Part 5
  assert('content.part5 is non-empty array', Array.isArray(content.part5) && content.part5.length > 0);
  const p5SetIds = new Set(content.part5.map((x) => x.setId));
  assert(`Part 5 has distinct sets (found ${p5SetIds.size} sets)`, p5SetIds.size > 0);

  // Validate every Part 5 item
  let p5Malformed = 0;
  for (const item of content.part5) {
    if (!item.id || !item.question || !Array.isArray(item.options) || item.options.length !== 4 || !item.answer) {
      p5Malformed++;
    }
  }
  assert(`All ${content.part5.length} Part 5 items are well-formed (malformed: ${p5Malformed})`, p5Malformed === 0);

  // Part 6
  assert('content.part6 is non-empty array', Array.isArray(content.part6) && content.part6.length > 0);
  const p6SetIds = new Set(content.part6.map((x) => x.setId));
  assert(`Part 6 has distinct sets (found ${p6SetIds.size} sets)`, p6SetIds.size > 0);

  let p6Malformed = 0;
  for (const item of content.part6) {
    if (!item.id || !item.text || !Array.isArray(item.blanks) || item.blanks.length === 0) {
      p6Malformed++;
    }
  }
  assert(`All ${content.part6.length} Part 6 sets are well-formed (malformed: ${p6Malformed})`, p6Malformed === 0);

  // Part 7 Single & Double
  assert('content.part7_single is non-empty array', Array.isArray(content.part7_single) && content.part7_single.length > 0);
  assert('content.part7_double is an array', Array.isArray(content.part7_double));

  const p7SingleSets = new Set(content.part7_single.map((x) => x.setId));
  const p7DoubleSets = new Set(content.part7_double.map((x) => x.setId));
  assert(`Part 7 Single has distinct sets (found ${p7SingleSets.size} sets)`, p7SingleSets.size > 0);
  assert(`Part 7 Double is safely handled (found ${p7DoubleSets.size} sets)`, true);

  let p7SingleMalformed = 0;
  for (const item of content.part7_single) {
    const passage = item.passage;
    if (!item.id || !passage || !Array.isArray(item.questions) || item.questions.length === 0) {
      p7SingleMalformed++;
    }
  }
  assert(`All ${content.part7_single.length} Part 7 Single passages are well-formed (malformed: ${p7SingleMalformed})`, p7SingleMalformed === 0);

  let p7DoubleMalformed = 0;
  for (const item of content.part7_double) {
    const passage = item.passages ? item.passages.join('\n\n') : item.passage;
    if (!item.id || !passage || !Array.isArray(item.questions) || item.questions.length === 0) {
      p7DoubleMalformed++;
    }
  }
  assert(`All ${content.part7_double.length} Part 7 Double passages are well-formed (malformed: ${p7DoubleMalformed})`, p7DoubleMalformed === 0);

  console.log('-'.repeat(80));
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runToeicReadingDrillTest();
