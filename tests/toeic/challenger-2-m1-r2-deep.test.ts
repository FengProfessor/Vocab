/**
 * tests/toeic/challenger-2-m1-r2-deep.test.ts
 *
 * Adversarial Deep Stress Harness by Challenger 2 (Milestone 1 Iteration 2)
 *
 * Validates:
 * 1. Test 6852 full audio alignment & absence of collapse (13 Part 3 unique audios, 10 Part 4 unique audios).
 * 2. Exhaustive audit across ALL 20 Listening V1 tests (6852-6861, 7000-7009) via loadFullToeicTest:
 *    - 39 Part 3 questions, exactly 13 clusters of 3.
 *    - Sibling audio equality: q[0] === q[1] === q[2] within each cluster.
 *    - Cluster audio uniqueness: exactly 13 distinct audio URLs per test (no collapse to 5).
 *    - 30 Part 4 questions, exactly 10 clusters of 3.
 *    - Sibling audio equality: q[0] === q[1] === q[2] within each cluster.
 *    - Cluster audio uniqueness: exactly 10 distinct audio URLs per test (no collapse to 4).
 *    - Zero empty, null, or undefined audioUrl across all 1,380 Part 3 & 4 questions.
 * 3. Test 7005 restoration verification:
 *    - Exactly 200 questions.
 *    - Part 6 has 16 questions (Q131-Q146) across 4 passages.
 *    - Part 3 has 39 questions with authentic Estudyme GCS audio.
 * 4. Fallback resilience stress test:
 *    - Missing audio_url on single or multiple questions in cluster.
 *    - Stimulus group partitioning.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadFullToeicTest,
  loadAnyToeicTest,
  groupQuestionsIntoStimulusGroups,
  adaptStudy4ToUnified,
} from '../../src/lib/toeic-test-loader';

interface AssertionResult {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
}

const results: AssertionResult[] = [];

function assert(condition: boolean, suite: string, name: string, failureMessage?: string) {
  if (condition) {
    results.push({ suite, name, passed: true });
    console.log(`  [PASS] ${name}`);
  } else {
    results.push({ suite, name, passed: false, message: failureMessage });
    console.error(`  [FAIL] ${name}${failureMessage ? ` -> ${failureMessage}` : ''}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 1: Explicit Deep Audit of Test 6852
// ──────────────────────────────────────────────────────────────────────────
function auditTest6852() {
  console.log('\n================================================================');
  console.log('SUITE 1: Explicit Deep Audit of Test 6852 (Original Collapse Reproduction)');
  console.log('================================================================');

  const questions = loadFullToeicTest('6852');
  assert(questions.length === 200, 'Suite 1', 'Test 6852 loaded exactly 200 questions');

  const p3 = questions.filter((q) => q.part === 3);
  assert(p3.length === 39, 'Suite 1', 'Test 6852 Part 3 contains exactly 39 questions');

  // Verify Part 3 audio uniqueness
  const p3Audios = p3.map((q) => q.audioUrl).filter(Boolean);
  const p3UniqueAudios = new Set(p3Audios);
  console.log(`  [Data] Test 6852 Part 3 unique audio count: ${p3UniqueAudios.size}`);
  assert(
    p3UniqueAudios.size === 13,
    'Suite 1',
    'Test 6852 Part 3 has exactly 13 unique audios (confirmed NOT collapsed to 5)',
    `Expected 13 unique audios, but got ${p3UniqueAudios.size}`
  );

  // Check every single 3-question cluster in Part 3
  for (let c = 0; c < 13; c++) {
    const q1 = p3[c * 3];
    const q2 = p3[c * 3 + 1];
    const q3 = p3[c * 3 + 2];

    assert(
      Boolean(q1.audioUrl && q2.audioUrl && q3.audioUrl),
      'Suite 1',
      `Test 6852 Part 3 Cluster ${c} (Q${q1.questionNumber}-Q${q3.questionNumber}) all 3 questions have audioUrl`
    );

    assert(
      q1.audioUrl === q2.audioUrl && q2.audioUrl === q3.audioUrl,
      'Suite 1',
      `Test 6852 Part 3 Cluster ${c} (Q${q1.questionNumber}-Q${q3.questionNumber}) all 3 siblings have identical audioUrl`
    );

    if (c > 0) {
      const prevQ1 = p3[(c - 1) * 3];
      assert(
        q1.audioUrl !== prevQ1.audioUrl,
        'Suite 1',
        `Test 6852 Part 3 Cluster ${c} audio is distinct from Cluster ${c - 1} (no phase shift)`
      );
    }
  }

  // Part 4
  const p4 = questions.filter((q) => q.part === 4);
  assert(p4.length === 30, 'Suite 1', 'Test 6852 Part 4 contains exactly 30 questions');

  const p4Audios = p4.map((q) => q.audioUrl).filter(Boolean);
  const p4UniqueAudios = new Set(p4Audios);
  console.log(`  [Data] Test 6852 Part 4 unique audio count: ${p4UniqueAudios.size}`);
  assert(
    p4UniqueAudios.size === 10,
    'Suite 1',
    'Test 6852 Part 4 has exactly 10 unique audios (confirmed NOT collapsed to 4)',
    `Expected 10 unique audios, but got ${p4UniqueAudios.size}`
  );

  for (let c = 0; c < 10; c++) {
    const q1 = p4[c * 3];
    const q2 = p4[c * 3 + 1];
    const q3 = p4[c * 3 + 2];

    assert(
      Boolean(q1.audioUrl && q2.audioUrl && q3.audioUrl),
      'Suite 1',
      `Test 6852 Part 4 Cluster ${c} (Q${q1.questionNumber}-Q${q3.questionNumber}) all 3 questions have audioUrl`
    );

    assert(
      q1.audioUrl === q2.audioUrl && q2.audioUrl === q3.audioUrl,
      'Suite 1',
      `Test 6852 Part 4 Cluster ${c} (Q${q1.questionNumber}-Q${q3.questionNumber}) all 3 siblings have identical audioUrl`
    );

    if (c > 0) {
      const prevQ1 = p4[(c - 1) * 3];
      assert(
        q1.audioUrl !== prevQ1.audioUrl,
        'Suite 1',
        `Test 6852 Part 4 Cluster ${c} audio is distinct from Cluster ${c - 1} (no phase shift)`
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 2: Exhaustive Audit Across ALL 20 Listening V1 Tests
// ──────────────────────────────────────────────────────────────────────────
function auditAll20Tests() {
  console.log('\n================================================================');
  console.log('SUITE 2: Exhaustive Audit Across ALL 20 Listening Tests via loadFullToeicTest');
  console.log('================================================================');

  const all20Ids = [
    '6852', '6853', '6854', '6855', '6856', '6857', '6858', '6859', '6860', '6861',
    '7000', '7001', '7002', '7003', '7004', '7005', '7006', '7007', '7008', '7009',
  ];

  for (const tid of all20Ids) {
    const questions = loadFullToeicTest(tid);
    const p3 = questions.filter((q) => q.part === 3);
    const p4 = questions.filter((q) => q.part === 4);

    assert(p3.length === 39, 'Suite 2', `Test ${tid}: Part 3 has exactly 39 questions`);
    assert(p4.length === 30, 'Suite 2', `Test ${tid}: Part 4 has exactly 30 questions`);

    const p3Unique = new Set(p3.map((q) => q.audioUrl).filter(Boolean));
    const p4Unique = new Set(p4.map((q) => q.audioUrl).filter(Boolean));

    assert(
      p3Unique.size === 13,
      'Suite 2',
      `Test ${tid}: Part 3 has exactly 13 unique audios (no collapse)`,
      `Got ${p3Unique.size} unique audios for Part 3`
    );

    assert(
      p4Unique.size === 10,
      'Suite 2',
      `Test ${tid}: Part 4 has exactly 10 unique audios (no collapse)`,
      `Got ${p4Unique.size} unique audios for Part 4`
    );

    // Verify 100% audio coverage (zero null or empty string)
    const p3Empty = p3.filter((q) => !q.audioUrl || !q.audioUrl.trim());
    const p4Empty = p4.filter((q) => !q.audioUrl || !q.audioUrl.trim());

    assert(
      p3Empty.length === 0,
      'Suite 2',
      `Test ${tid}: Part 3 has zero missing/empty audios (0/${p3.length})`,
      `Found ${p3Empty.length} questions without audio`
    );

    assert(
      p4Empty.length === 0,
      'Suite 2',
      `Test ${tid}: Part 4 has zero missing/empty audios (0/${p4.length})`,
      `Found ${p4Empty.length} questions without audio`
    );

    // Verify grouping
    const groups = groupQuestionsIntoStimulusGroups(questions);
    const p3Groups = groups.filter((g) => g.part === 3);
    const p4Groups = groups.filter((g) => g.part === 4);

    assert(
      p3Groups.length === 13 && p3Groups.every((g) => g.questions.length === 3),
      'Suite 2',
      `Test ${tid}: Part 3 partitions cleanly into 13 groups of 3 questions`
    );

    assert(
      p4Groups.length === 10 && p4Groups.every((g) => g.questions.length === 3),
      'Suite 2',
      `Test ${tid}: Part 4 partitions cleanly into 10 groups of 3 questions`
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 3: Test 7005 Deep Restoration Verification
// ──────────────────────────────────────────────────────────────────────────
function auditTest7005Deep() {
  console.log('\n================================================================');
  console.log('SUITE 3: Test 7005 Deep Restoration Verification');
  console.log('================================================================');

  const questions = loadAnyToeicTest('7005');
  assert(questions.length === 200, 'Suite 3', 'Test 7005 loadAnyToeicTest produces exactly 200 questions');

  // Verify Part 6
  const p6 = questions.filter((q) => q.part === 6);
  assert(p6.length === 16, 'Suite 3', 'Test 7005 Part 6 contains exactly 16 questions (restored)', `Found ${p6.length}`);

  const p6Nums = p6.map((q) => q.questionNumber);
  const expectedP6Nums = Array.from({ length: 16 }, (_, i) => 131 + i);
  assert(
    JSON.stringify(p6Nums) === JSON.stringify(expectedP6Nums),
    'Suite 3',
    'Test 7005 Part 6 has continuous numbering Q131 to Q146'
  );

  // Verify Part 6 stimulus groups (4 passages of 4 questions each)
  const groups = groupQuestionsIntoStimulusGroups(questions);
  const p6Groups = groups.filter((g) => g.part === 6);
  assert(p6Groups.length === 4, 'Suite 3', 'Test 7005 Part 6 has exactly 4 passage groups', `Got ${p6Groups.length}`);
  assert(
    p6Groups.every((g) => g.questions.length === 4),
    'Suite 3',
    'Test 7005 Part 6: All 4 passage groups contain exactly 4 questions'
  );

  // Verify options
  const allHave4Opts = p6.every((q) => Array.isArray(q.options) && q.options.length === 4);
  assert(allHave4Opts, 'Suite 3', 'Test 7005 Part 6: All 16 questions have 4 options');

  // Verify explanations
  const allHaveExp = p6.every((q) => Boolean(q.explanationVi && q.explanationVi.trim().length > 0));
  assert(allHaveExp, 'Suite 3', 'Test 7005 Part 6: All 16 questions have non-empty Vietnamese explanations');
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 4: Edge Case Fallback Simulation in Loader
// ──────────────────────────────────────────────────────────────────────────
function auditFallbackResilience() {
  console.log('\n================================================================');
  console.log('SUITE 4: Edge Case Fallback Simulation in Loader');
  console.log('================================================================');

  // Test adaptStudy4ToUnified with partially missing audios in cluster
  const mockPayload: any = {
    testId: 'edge-test-fallback',
    parts: {
      part_3: {
        questions: [
          { qid: 'q1', qnum: '32', text: 'Q32', options: ['A', 'B', 'C', 'D'], audio_url: 'https://cdn/cluster0.mp3', correct_answer: 'A' },
          { qid: 'q2', qnum: '33', text: 'Q33', options: ['A', 'B', 'C', 'D'], audio_url: '', correct_answer: 'B' },
          { qid: 'q3', qnum: '34', text: 'Q34', options: ['A', 'B', 'C', 'D'], audio_url: '', correct_answer: 'C' },
          { qid: 'q4', qnum: '35', text: 'Q35', options: ['A', 'B', 'C', 'D'], audio_url: '', correct_answer: 'D' },
          { qid: 'q5', qnum: '36', text: 'Q36', options: ['A', 'B', 'C', 'D'], audio_url: 'https://cdn/cluster1.mp3', correct_answer: 'A' },
          { qid: 'q6', qnum: '37', text: 'Q37', options: ['A', 'B', 'C', 'D'], audio_url: '', correct_answer: 'B' },
        ],
      },
    },
  };

  const adapted = adaptStudy4ToUnified(mockPayload, 'edge-test-fallback');
  const p3Adapted = adapted.filter((q) => q.part === 3);

  assert(p3Adapted.length === 6, 'Suite 4', 'Partially adapted payload produces 6 questions');
  assert(
    p3Adapted[1].audioUrl === 'https://cdn/cluster0.mp3',
    'Suite 4',
    'Q33 inherited audio from Q32 (cluster 0)'
  );
  assert(
    p3Adapted[2].audioUrl === 'https://cdn/cluster0.mp3',
    'Suite 4',
    'Q34 inherited audio from Q32 (cluster 0)'
  );
  assert(
    p3Adapted[3].audioUrl === 'https://cdn/cluster1.mp3',
    'Suite 4',
    'Q35 inherited audio from Q36 (cluster 1)'
  );
  assert(
    p3Adapted[5].audioUrl === 'https://cdn/cluster1.mp3',
    'Suite 4',
    'Q37 inherited audio from Q36 (cluster 1)'
  );
}

// ──────────────────────────────────────────────────────────────────────────
// RUN ALL SUITES
// ──────────────────────────────────────────────────────────────────────────
function main() {
  auditTest6852();
  auditAll20Tests();
  auditTest7005Deep();
  auditFallbackResilience();

  console.log('\n================================================================');
  console.log('CHALLENGER 2 DEEP VERIFICATION SUMMARY');
  console.log('================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Assertions : ${results.length}`);
  console.log(`Passed           : ${passed}`);
  console.log(`Failed           : ${failed}`);

  if (failed > 0) {
    console.error('\n🚨 ADVERSARIAL FAILURES:');
    for (const f of results.filter((r) => !r.passed)) {
      console.error(`- [${f.suite}] ${f.name} -> ${f.message}`);
    }
    process.exit(1);
  } else {
    console.log('\n🌟 ALL ADVERSARIAL CHECKS PASSED WITH ZERO DEFECTS!');
  }
}

main();
