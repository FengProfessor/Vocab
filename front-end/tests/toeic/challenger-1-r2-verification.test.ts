/**
 * Challenger 1 Round 2: Deep Empirical Re-Verification Test Suite
 *
 * Verifies 100% resolution of:
 * 1. parseQuestionOption regex over-matching (preservation of initial letters in words starting with A-D).
 * 2. Positional option keys guarantee (strictly 'ABC' for Part 2, 'ABCD' for other parts).
 * 3. Content-first answer resolution (full option text matching to correct positional index).
 * 4. Exhaustive scan of 100% of catalog tests (all full tests and all 231 practice sets).
 */

import {
  parseQuestionOption,
  resolveEstudymeAnswer,
  loadAnyToeicTest,
  getToeicCatalogIndex,
} from '../../src/lib/toeic-test-loader';

let totalChecks = 0;
let passedChecks = 0;
const failures: { testName: string; error: string }[] = [];

function check(name: string, fn: () => void) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    failures.push({ testName: name, error: err.message || String(err) });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

console.log('========================================================================');
console.log('  CHALLENGER 1 (ROUND 2): DEEP EMPIRICAL VERIFICATION SUITE');
console.log('========================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. OPTION TEXT PRESERVATION ORACLE
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- SUITE 1: Option Text Preservation & Initial Letter Integrity ---');

check('Preserves words starting with C ("Cream", "Chocolate chips", "Coffee")', () => {
  const r1 = parseQuestionOption('Cream', 'A');
  assert(r1.key === 'A', `Expected fallback key 'A', got '${r1.key}'`);
  assert(r1.text === 'Cream', `Expected text 'Cream', got '${r1.text}'`);

  const r2 = parseQuestionOption('Chocolate chips', 'D');
  assert(r2.key === 'D', `Expected fallback key 'D', got '${r2.key}'`);
  assert(r2.text === 'Chocolate chips', `Expected text 'Chocolate chips', got '${r2.text}'`);

  const r3 = parseQuestionOption('Coffee maker', 'B');
  assert(r3.key === 'B', `Expected fallback key 'B', got '${r3.key}'`);
  assert(r3.text === 'Coffee maker', `Expected text 'Coffee maker', got '${r3.text}'`);
});

check('Preserves words starting with B ("Break the eggs", "Baking powder", "Business")', () => {
  const r1 = parseQuestionOption('Break the eggs', 'A');
  assert(r1.key === 'A', `Expected fallback key 'A', got '${r1.key}'`);
  assert(r1.text === 'Break the eggs', `Expected text 'Break the eggs', got '${r1.text}'`);

  const r2 = parseQuestionOption('Baking powder', 'C');
  assert(r2.key === 'C', `Expected fallback key 'C', got '${r2.key}'`);
  assert(r2.text === 'Baking powder', `Expected text 'Baking powder', got '${r2.text}'`);

  const r3 = parseQuestionOption('Business strategy', 'D');
  assert(r3.key === 'D', `Expected fallback key 'D', got '${r3.key}'`);
  assert(r3.text === 'Business strategy', `Expected text 'Business strategy', got '${r3.text}'`);
});

check('Preserves words starting with A ("Apple", "Agreement", "Afternoon meeting")', () => {
  const r1 = parseQuestionOption('Apple', 'B');
  assert(r1.key === 'B', `Expected fallback key 'B', got '${r1.key}'`);
  assert(r1.text === 'Apple', `Expected text 'Apple', got '${r1.text}'`);

  const r2 = parseQuestionOption('Agreement terms', 'C');
  assert(r2.key === 'C', `Expected fallback key 'C', got '${r2.key}'`);
  assert(r2.text === 'Agreement terms', `Expected text 'Agreement terms', got '${r2.text}'`);

  const r3 = parseQuestionOption('Afternoon meeting', 'D');
  assert(r3.key === 'D', `Expected fallback key 'D', got '${r3.key}'`);
  assert(r3.text === 'Afternoon meeting', `Expected text 'Afternoon meeting', got '${r3.text}'`);
});

check('Preserves words starting with D ("Date", "Decision", "Department")', () => {
  const r1 = parseQuestionOption('Date of departure', 'A');
  assert(r1.key === 'A', `Expected fallback key 'A', got '${r1.key}'`);
  assert(r1.text === 'Date of departure', `Expected text 'Date of departure', got '${r1.text}'`);

  const r2 = parseQuestionOption('Decision-making process', 'B');
  assert(r2.key === 'B', `Expected fallback key 'B', got '${r2.key}'`);
  assert(r2.text === 'Decision-making process', `Expected text 'Decision-making process', got '${r2.text}'`);
});

check('Delimited options correctly extract key and strip prefix', () => {
  const t1 = parseQuestionOption('(A) highly qualified', 'D');
  assert(t1.key === 'A' && t1.text === 'highly qualified', `Got ${t1.key}: "${t1.text}"`);

  const t2 = parseQuestionOption('B. commercial district', 'A');
  assert(t2.key === 'B' && t2.text === 'commercial district', `Got ${t2.key}: "${t2.text}"`);

  const t3 = parseQuestionOption('C: urgent memo', 'A');
  assert(t3.key === 'C' && t3.text === 'urgent memo', `Got ${t3.key}: "${t3.text}"`);

  const t4 = parseQuestionOption('D) submit invoice', 'A');
  assert(t4.key === 'D' && t4.text === 'submit invoice', `Got ${t4.key}: "${t4.text}"`);

  // Lowercase letters in delimiter
  const t5 = parseQuestionOption('(b) lowercase parens', 'A');
  assert(t5.key === 'B' && t5.text === 'lowercase parens', `Got ${t5.key}: "${t5.text}"`);

  const t6 = parseQuestionOption('c. lowercase dot', 'A');
  assert(t6.key === 'C' && t6.text === 'lowercase dot', `Got ${t6.key}: "${t6.text}"`);
});

check('Isolated letter tokens return key and empty text', () => {
  const iso1 = parseQuestionOption('(A)', 'B');
  assert(iso1.key === 'A' && iso1.text === '', `Got ${iso1.key}: "${iso1.text}"`);

  const iso2 = parseQuestionOption('B.', 'A');
  assert(iso2.key === 'B' && iso2.text === '', `Got ${iso2.key}: "${iso2.text}"`);

  const iso3 = parseQuestionOption('C', 'A');
  assert(iso3.key === 'C' && iso3.text === '', `Got ${iso3.key}: "${iso3.text}"`);

  const iso4 = parseQuestionOption('(d)', 'A');
  assert(iso4.key === 'D' && iso4.text === '', `Got ${iso4.key}: "${iso4.text}"`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. ANSWER RESOLUTION ACCURACY (resolveEstudymeAnswer)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 2: Answer Resolution Accuracy & Content Matching ---');

check('Content matching: exact match against plain option text', () => {
  const options = ['Cream', 'Eggs', 'Flour', 'Margarine'];
  assert(resolveEstudymeAnswer(['Cream'], options) === 'A', '["Cream"] -> A');
  assert(resolveEstudymeAnswer(['Eggs'], options) === 'B', '["Eggs"] -> B');
  assert(resolveEstudymeAnswer(['Flour'], options) === 'C', '["Flour"] -> C');
  assert(resolveEstudymeAnswer(['Margarine'], options) === 'D', '["Margarine"] -> D');
});

check('Content matching: exact match against delimited options', () => {
  const options = ['(A) Cream', '(B) Eggs', '(C) Flour', '(D) Margarine'];
  assert(resolveEstudymeAnswer(['Cream'], options) === 'A', '["Cream"] -> A');
  assert(resolveEstudymeAnswer(['Eggs'], options) === 'B', '["Eggs"] -> B');
  assert(resolveEstudymeAnswer(['Flour'], options) === 'C', '["Flour"] -> C');
  assert(resolveEstudymeAnswer(['Margarine'], options) === 'D', '["Margarine"] -> D');

  // Answer itself is delimited
  assert(resolveEstudymeAnswer(['(B) Eggs'], options) === 'B', '["(B) Eggs"] -> B');
  assert(resolveEstudymeAnswer(['C. Flour'], options) === 'C', '["C. Flour"] -> C');
});

check('Letter token matching: strict boundary tokens', () => {
  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  assert(resolveEstudymeAnswer(['A'], options) === 'A', '["A"] -> A');
  assert(resolveEstudymeAnswer(['(B)'], options) === 'B', '["(B)"] -> B');
  assert(resolveEstudymeAnswer(['C.'], options) === 'C', '["C."] -> C');
  assert(resolveEstudymeAnswer(['d)'], options) === 'D', '["d)"] -> D');
  assert(resolveEstudymeAnswer('B', options) === 'B', '"B" -> B');
});

check('Answer resolution fallbacks on unrecognized or empty input', () => {
  const options = ['Alpha', 'Beta', 'Gamma', 'Delta'];
  assert(resolveEstudymeAnswer(null, options, 'A') === 'A', 'null -> A');
  assert(resolveEstudymeAnswer(undefined, options, 'B') === 'B', 'undefined -> B');
  assert(resolveEstudymeAnswer([], options, 'C') === 'C', '[] -> C');
  assert(resolveEstudymeAnswer([''], options, 'D') === 'D', '[""] -> D');
  assert(resolveEstudymeAnswer(['Non-matching string'], options, 'B') === 'B', 'unmatched -> fallback B');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SPECIFIC FORMER DEFECT SPOT-CHECKS (estudyme-part_7_single_passages-part-7)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 3: Real Dataset Spot-Checks on Previously Defective Questions ---');

check('estudyme-part_7_single_passages-part-7 questions 1-4 integrity', () => {
  const qs = loadAnyToeicTest('estudyme-part_7_single_passages-part-7');
  assert(qs.length > 0, 'Must load questions for estudyme-part_7_single_passages-part-7');

  // Q1: Baking recipe ingredients question
  const q1 = qs[0];
  assert(q1.questionNumber === 1, 'Q1 questionNumber must be 1');
  assert(q1.options.length === 4, 'Q1 must have 4 options');
  const q1Keys = q1.options.map((o) => o.key).join('');
  assert(q1Keys === 'ABCD', `Q1 keys must be ABCD, got "${q1Keys}"`);

  // Verify option text preservation
  assert(q1.options[0].text === 'Cream', `Q1 Option A text must be 'Cream' (got '${q1.options[0].text}')`);
  assert(q1.options[1].text === 'Eggs', `Q1 Option B text must be 'Eggs' (got '${q1.options[1].text}')`);
  assert(q1.options[2].text === 'Flour', `Q1 Option C text must be 'Flour' (got '${q1.options[2].text}')`);
  assert(q1.options[3].text === 'Margarine', `Q1 Option D text must be 'Margarine' (got '${q1.options[3].text}')`);
  // Verify correct answer is 'A' (Cream)
  assert(q1.correctAnswer === 'A', `Q1 correctAnswer must be 'A' for Cream (got '${q1.correctAnswer}')`);

  // Q2: "Break the eggs"
  const q2 = qs[1];
  assert(q2.questionNumber === 2, 'Q2 questionNumber must be 2');
  const q2Keys = q2.options.map((o) => o.key).join('');
  assert(q2Keys === 'ABCD', `Q2 keys must be ABCD, got "${q2Keys}"`);
  assert(
    q2.options[0].text === 'Break the eggs',
    `Q2 Option A text must be 'Break the eggs' (got '${q2.options[0].text}')`
  );

  // Q3: knife, microwave, saucepan, sieve
  const q3 = qs[2];
  assert(q3.questionNumber === 3, 'Q3 questionNumber must be 3');
  const q3Keys = q3.options.map((o) => o.key).join('');
  assert(q3Keys === 'ABCD', `Q3 keys must be ABCD (was AAAA), got "${q3Keys}"`);

  // Q4: Baking powder, Chocolate chips
  const q4 = qs[3];
  assert(q4.questionNumber === 4, 'Q4 questionNumber must be 4');
  const q4Keys = q4.options.map((o) => o.key).join('');
  assert(q4Keys === 'ABCD', `Q4 keys must be ABCD (was BCCD), got "${q4Keys}"`);
  assert(
    q4.options[0].text === 'Baking powder',
    `Q4 Option A text must be 'Baking powder' (got '${q4.options[0].text}')`
  );
  assert(
    q4.options[1].text === 'Chocolate chips',
    `Q4 Option B text must be 'Chocolate chips' (got '${q4.options[1].text}')`
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXHAUSTIVE CATALOG AUDIT (100% OF FULL TESTS & 100% OF PRACTICE SETS)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 4: Exhaustive Audit of 100% of Catalog Datasets ---');

check('Exhaustive Full Tests Audit (all 28+ full tests)', () => {
  const catalog = getToeicCatalogIndex();
  let fullTestQuestions = 0;

  for (const item of catalog.fullTests) {
    const qs = loadAnyToeicTest(item.id);
    assert(qs.length === item.questionCount, `${item.id}: expected ${item.questionCount} questions, got ${qs.length}`);
    for (const q of qs) {
      fullTestQuestions++;
      const expectedKeys = q.part === 2 ? 'ABC' : 'ABCD';
      const actualKeys = q.options.map((o) => o.key).join('');
      assert(
        actualKeys === expectedKeys,
        `${item.id} Q${q.questionNumber} (Part ${q.part}): keys "${actualKeys}" !== "${expectedKeys}"`
      );
      assert(
        q.options.some((o) => o.key === q.correctAnswer),
        `${item.id} Q${q.questionNumber}: correctAnswer "${q.correctAnswer}" not in options`
      );
    }
  }
  console.log(`    Audited ${catalog.fullTests.length} Full Tests (${fullTestQuestions} questions): 0 defects.`);
});

check('Exhaustive Practice Sets Audit (all 231 sets across Parts 1-7)', () => {
  const catalog = getToeicCatalogIndex();
  let practiceQuestions = 0;
  let totalSetsChecked = 0;

  for (let p = 1; p <= 7; p++) {
    const sets = catalog.practiceParts[String(p)] || [];
    for (const s of sets) {
      totalSetsChecked++;
      const qs = loadAnyToeicTest(s.id);
      assert(qs.length > 0, `Practice set ${s.id} returned 0 questions`);

      for (const q of qs) {
        practiceQuestions++;
        const expectedKeys = q.part === 2 ? 'ABC' : 'ABCD';
        const actualKeys = q.options.map((o) => o.key).join('');
        assert(
          actualKeys === expectedKeys,
          `${s.id} Q${q.questionNumber} (Part ${q.part}): keys "${actualKeys}" !== "${expectedKeys}"`
        );
        assert(
          q.options.some((o) => o.key === q.correctAnswer),
          `${s.id} Q${q.questionNumber}: correctAnswer "${q.correctAnswer}" not in options`
        );
        for (const opt of q.options) {
          assert(typeof opt.text === 'string', `${s.id} Q${q.questionNumber}: option text must be string`);
        }
      }
    }
  }
  console.log(`    Audited all ${totalSetsChecked} practice sets (${practiceQuestions} questions): 0 defects.`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================================================');
console.log('  CHALLENGER 1 ROUND 2 DEEP VERIFICATION SUMMARY');
console.log(`  Total Checks:  ${totalChecks}`);
console.log(`  Passed Checks: ${passedChecks}`);
console.log(`  Failed Checks: ${failures.length}`);
if (failures.length > 0) {
  console.log('\n  FAILURES:');
  for (const f of failures) {
    console.log(`  - [${f.testName}]: ${f.error}`);
  }
  console.log('========================================================================\n');
  process.exit(1);
} else {
  console.log('  VERDICT: 100% EMPIRICAL CONFIRMATION — ALL DEFECTS COMPLETELY RESOLVED!');
  console.log('========================================================================\n');
}
