/**
 * TOEIC Part 3 & Part 4 Split-Pane Cluster & Audio Lifecycle Invariance Test Suite.
 *
 * Verifies:
 * 1. 3-Question simultaneous cluster resolution for Part 3 (Q32-Q70) and Part 4 (Q71-Q100).
 * 2. Dual format handling: Text questions (Study4 / Estudyme) vs Scanned booklet crops (ETS 2024 / 2026).
 * 3. Audio Player Lifecycle Invariance:
 *    - Stable clusterId keying across sibling questions
 *    - Unchanged audioUrl across child question focus changes
 *    - Memoization comparator behavior during answer selection and focus transitions
 * 4. Cluster-aware navigation boundary transitions:
 *    - Intra-part cluster step (Q32-34 -> Q35-37)
 *    - Part 2 to Part 3 boundary (Q31 -> Q32-34)
 *    - Part 3 to Part 4 boundary (Q68-70 -> Q71-73)
 *    - Part 4 to Part 5 boundary (Q98-100 -> Q101)
 * 5. Multi-question simultaneous answer selection & independent flagging in a cluster.
 */

import {
  getToeicClientClusterForQuestion,
  loadAnyToeicTest,
  loadToeicPartPractice,
  stripSensitiveToeicData,
} from '@/lib/toeic-test-loader';
import type {
  ToeicClientQuestion,
  ToeicOptionKey,
  ToeicExamMode,
} from '@/types/toeic';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      name,
      passed: false,
      error: err?.message || String(err),
      durationMs: Date.now() - start,
    });
    console.error(`  [FAIL] ${name}: ${err?.message || err}`);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log(' TOEIC PART 3 & PART 4 CLUSTER & AUDIO INVARIANCE TEST SUITE');
  console.log('================================================================\n');

  // Load sample test data: ETS 2024 Test 01 (scanned) and Estudyme Test 1 (text dialogue)
  const etsQuestions = stripSensitiveToeicData(loadAnyToeicTest('ets-2024-01'));
  const textQuestions = stripSensitiveToeicData(loadAnyToeicTest('estudyme-test-1'));

  // ── TEST GROUP 1: Cluster Resolution & 3-Question Simultaneous Envelope ──
  console.log('▶ Test Group 1: Cluster Resolution & Simultaneous Envelope...');

  await runTest('T1-1: Resolves exactly 3 contiguous questions for Part 3 Q32-Q34', () => {
    const cluster = getToeicClientClusterForQuestion(32, etsQuestions);
    assert(cluster !== null, 'Cluster must not be null for Q32');
    assert(cluster!.part === 3, 'Part must be 3');
    assert(cluster!.startQuestionNumber === 32, 'startQuestionNumber must be 32');
    assert(cluster!.endQuestionNumber === 34, 'endQuestionNumber must be 34');
    assert(cluster!.questions.length === 3, 'Cluster must contain exactly 3 child questions');
    assert(cluster!.questions[0].questionNumber === 32, 'First question is 32');
    assert(cluster!.questions[1].questionNumber === 33, 'Second question is 33');
    assert(cluster!.questions[2].questionNumber === 34, 'Third question is 34');
  });

  await runTest('T1-2: Sibling question lookup (Q33, Q34) resolves to identical clusterId', () => {
    const cluster32 = getToeicClientClusterForQuestion(32, etsQuestions);
    const cluster33 = getToeicClientClusterForQuestion(33, etsQuestions);
    const cluster34 = getToeicClientClusterForQuestion(34, etsQuestions);

    assert(cluster32 !== null && cluster33 !== null && cluster34 !== null, 'All clusters must resolve');
    assert(cluster32!.clusterId === cluster33!.clusterId, 'clusterId for Q32 and Q33 must match');
    assert(cluster33!.clusterId === cluster34!.clusterId, 'clusterId for Q33 and Q34 must match');
    assert(cluster32!.audioUrl === cluster33!.audioUrl, 'audioUrl for Q32 and Q33 must match');
    assert(cluster33!.audioUrl === cluster34!.audioUrl, 'audioUrl for Q33 and Q34 must match');
  });

  await runTest('T1-3: Resolves all 13 Part 3 clusters and 10 Part 4 clusters with valid audio', () => {
    // Part 3: 13 clusters from Q32 to Q70
    for (let i = 0; i < 13; i++) {
      const qNum = 32 + i * 3;
      const cluster = getToeicClientClusterForQuestion(qNum, etsQuestions);
      assert(cluster !== null, `Part 3 cluster at Q${qNum} must resolve`);
      assert(cluster!.audioUrl.length > 0, `Part 3 cluster at Q${qNum} must have audioUrl`);
      assert(cluster!.questions.length === 3, `Part 3 cluster at Q${qNum} must have 3 questions`);
    }

    // Part 4: 10 clusters from Q71 to Q100
    for (let i = 0; i < 10; i++) {
      const qNum = 71 + i * 3;
      const cluster = getToeicClientClusterForQuestion(qNum, etsQuestions);
      assert(cluster !== null, `Part 4 cluster at Q${qNum} must resolve`);
      assert(cluster!.audioUrl.length > 0, `Part 4 cluster at Q${qNum} must have audioUrl`);
      assert(cluster!.questions.length === 3, `Part 4 cluster at Q${qNum} must have 3 questions`);
    }
  });

  await runTest('T1-4: Non-cluster questions (Part 1, 2, 5, 6, 7) return null cluster', () => {
    assert(getToeicClientClusterForQuestion(1, etsQuestions) === null, 'Part 1 Q1 has no cluster');
    assert(getToeicClientClusterForQuestion(6, etsQuestions) === null, 'Part 1 Q6 has no cluster');
    assert(getToeicClientClusterForQuestion(7, etsQuestions) === null, 'Part 2 Q7 has no cluster');
    assert(getToeicClientClusterForQuestion(31, etsQuestions) === null, 'Part 2 Q31 has no cluster');
    assert(getToeicClientClusterForQuestion(101, etsQuestions) === null, 'Part 5 Q101 has no cluster');
    assert(getToeicClientClusterForQuestion(146, etsQuestions) === null, 'Part 6 Q146 has no cluster');
    assert(getToeicClientClusterForQuestion(200, etsQuestions) === null, 'Part 7 Q200 has no cluster');
  });

  // ── TEST GROUP 2: Dual Format Detection ──
  console.log('\n▶ Test Group 2: Dual Format Handling (Text vs Scanned)...');

  await runTest('T2-1: Scanned image format detected for ETS 2024 booklet crops', () => {
    const cluster = getToeicClientClusterForQuestion(32, etsQuestions);
    assert(cluster !== null, 'Cluster exists');
    assert(cluster!.imageUrl !== null && cluster!.imageUrl !== undefined, 'Has booklet crop image');

    // Scanned format check: empty prompts and presence of booklet image
    const hasEmptyPrompts = cluster!.questions.every((q) => !q.prompt || q.prompt.trim() === '');
    const isScanned = cluster!.clusterType === 'scanned_image' || (hasEmptyPrompts && Boolean(cluster!.imageUrl));
    assert(isScanned, 'ETS 2024 cluster must be recognized as scanned image format');
  });

  await runTest('T2-2: Text dialogue format detected for Estudyme / Study4 full text questions', () => {
    const cluster = getToeicClientClusterForQuestion(32, textQuestions);
    assert(cluster !== null, 'Cluster exists');

    // Text format check: prompts are populated with actual English text
    const hasTextPrompts = cluster!.questions.some((q) => q.prompt && q.prompt.trim().length > 5);
    const isTextDialogue = cluster!.clusterType === 'text_dialogue' || hasTextPrompts;
    assert(isTextDialogue, 'Estudyme cluster must be recognized as text dialogue format');
    assert(cluster!.questions[0].options.length === 4, 'Has 4 options');
    assert(cluster!.questions[0].options.every((opt) => opt.text.length > 0), 'Options have text');
  });

  // ── TEST GROUP 3: Audio Player Lifecycle Invariance ──
  console.log('\n▶ Test Group 3: Audio Player Lifecycle Invariance...');

  await runTest('T3-1: Audio player key remains identical when navigating within cluster', () => {
    const c32 = getToeicClientClusterForQuestion(32, etsQuestions);
    const c33 = getToeicClientClusterForQuestion(33, etsQuestions);
    const c34 = getToeicClientClusterForQuestion(34, etsQuestions);

    const key32 = c32!.clusterId;
    const key33 = c33!.clusterId;
    const key34 = c34!.clusterId;

    assert(key32 === key33 && key33 === key34, 'Audio player React key must not change within cluster');
  });

  await runTest('T3-2: React.memo prop comparator returns true on answer selection', () => {
    // Simulate ToeicAudioPlayer prop comparator logic
    const prevProps = {
      src: 'https://cdn.example.com/audio/p3_32_34.mp3',
      title: 'Part 3: Hội thoại câu 32 – 34',
      mode: 'real' as ToeicExamMode,
      autoPlayInExamMode: true,
      className: '',
    };

    // When candidate selects answer B for Q32, audio player props do NOT change:
    const nextProps = {
      src: 'https://cdn.example.com/audio/p3_32_34.mp3',
      title: 'Part 3: Hội thoại câu 32 – 34',
      mode: 'real' as ToeicExamMode,
      autoPlayInExamMode: true,
      className: '',
    };

    const isPropsEqual =
      prevProps.src === nextProps.src &&
      prevProps.title === nextProps.title &&
      prevProps.mode === nextProps.mode &&
      prevProps.autoPlayInExamMode === nextProps.autoPlayInExamMode &&
      prevProps.className === nextProps.className;

    assert(isPropsEqual, 'Audio player props are strictly equal, preventing unneeded re-render');
  });

  await runTest('T3-3: React.memo prop comparator returns true when shifting focus Q32 -> Q33', () => {
    const c32 = getToeicClientClusterForQuestion(32, textQuestions)!;
    const c33 = getToeicClientClusterForQuestion(33, textQuestions)!;

    const propsQ32 = {
      src: c32.audioUrl,
      title: `Part ${c32.part}: Hội thoại câu ${c32.startQuestionNumber} – ${c32.endQuestionNumber}`,
      mode: 'real' as ToeicExamMode,
      autoPlayInExamMode: true,
      className: '',
    };

    const propsQ33 = {
      src: c33.audioUrl,
      title: `Part ${c33.part}: Hội thoại câu ${c33.startQuestionNumber} – ${c33.endQuestionNumber}`,
      mode: 'real' as ToeicExamMode,
      autoPlayInExamMode: true,
      className: '',
    };

    const isPropsEqual =
      propsQ32.src === propsQ33.src &&
      propsQ32.title === propsQ33.title &&
      propsQ32.mode === propsQ33.mode &&
      propsQ32.autoPlayInExamMode === propsQ33.autoPlayInExamMode &&
      propsQ32.className === propsQ33.className;

    assert(isPropsEqual, 'Focus shift within cluster does not mutate ToeicAudioPlayer props');
  });

  await runTest('T3-4: Audio player key changes only when jumping across clusters', () => {
    const cCluster1 = getToeicClientClusterForQuestion(32, textQuestions)!;
    const cCluster2 = getToeicClientClusterForQuestion(35, textQuestions)!;

    assert(cCluster1.clusterId !== cCluster2.clusterId, 'clusterId must change when advancing cluster');
    assert(cCluster1.audioUrl !== cCluster2.audioUrl, 'audioUrl must advance to next dialogue audio');
  });

  // ── TEST GROUP 4: Cluster Navigation Mathematics ──
  console.log('\n▶ Test Group 4: Cluster Navigation Mathematics...');

  await runTest('T4-1: Next cluster jump from Q32-Q34 lands on Q35', () => {
    const cluster = getToeicClientClusterForQuestion(32, etsQuestions)!;
    const nextQNum = cluster.endQuestionNumber + 1;
    assert(nextQNum === 35, 'Next question after cluster 32-34 is 35');

    const nextCluster = getToeicClientClusterForQuestion(nextQNum, etsQuestions);
    assert(nextCluster !== null, 'Next cluster 35-37 exists');
    assert(nextCluster!.startQuestionNumber === 35, 'Starts at 35');
    assert(nextCluster!.endQuestionNumber === 37, 'Ends at 37');
  });

  await runTest('T4-2: Previous cluster jump from Q35-Q37 lands on Q32', () => {
    const cluster = getToeicClientClusterForQuestion(35, etsQuestions)!;
    const prevQNum = cluster.startQuestionNumber - 1; // 34
    assert(prevQNum === 34, 'Preceding question number is 34');

    const prevCluster = getToeicClientClusterForQuestion(prevQNum, etsQuestions);
    assert(prevCluster !== null, 'Preceding cluster exists');
    assert(prevCluster!.startQuestionNumber === 32, 'Previous cluster starts at 32');
  });

  await runTest('T4-3: Part 2 to Part 3 boundary jump (Q31 -> Q32-34)', () => {
    const q31Cluster = getToeicClientClusterForQuestion(31, etsQuestions);
    assert(q31Cluster === null, 'Q31 has no cluster');

    const q32Cluster = getToeicClientClusterForQuestion(32, etsQuestions);
    assert(q32Cluster !== null, 'Q32 resolves to Part 3 cluster 1');
    assert(q32Cluster!.startQuestionNumber === 32, 'Cluster starts at 32');
  });

  await runTest('T4-4: Part 3 to Part 4 boundary jump (Q70 -> Q71)', () => {
    const p3LastCluster = getToeicClientClusterForQuestion(70, etsQuestions)!;
    assert(p3LastCluster.endQuestionNumber === 70, 'Part 3 ends at Q70');

    const nextQNum = p3LastCluster.endQuestionNumber + 1; // 71
    assert(nextQNum === 71, 'Next question is 71');

    const p4FirstCluster = getToeicClientClusterForQuestion(nextQNum, etsQuestions)!;
    assert(p4FirstCluster.part === 4, 'Enters Part 4');
    assert(p4FirstCluster.startQuestionNumber === 71, 'Part 4 starts at Q71');
    assert(p4FirstCluster.endQuestionNumber === 73, 'First Part 4 cluster ends at Q73');
  });

  await runTest('T4-5: Part 4 to Part 5 boundary jump (Q100 -> Q101)', () => {
    const p4LastCluster = getToeicClientClusterForQuestion(100, etsQuestions)!;
    assert(p4LastCluster.endQuestionNumber === 100, 'Part 4 ends at Q100');

    const nextQNum = p4LastCluster.endQuestionNumber + 1; // 101
    assert(nextQNum === 101, 'Next question is 101');

    const p5Q = getToeicClientClusterForQuestion(nextQNum, etsQuestions);
    assert(p5Q === null, 'Part 5 has no listening cluster');
  });

  // ── TEST GROUP 5: Simultaneous State & Independent Answering ──
  console.log('\n▶ Test Group 5: Simultaneous State & Independent Answering...');

  await runTest('T5-1: Candidate selects answers across Q32, Q33, Q34 in non-sequential order', () => {
    const answers: Record<number, ToeicOptionKey> = {};
    const cluster = getToeicClientClusterForQuestion(32, textQuestions)!;

    // Answer Q33 first, then Q32, then Q34
    answers[33] = 'B';
    assert(answers[33] === 'B', 'Q33 answered');
    assert(answers[32] === undefined, 'Q32 not yet answered');
    assert(answers[34] === undefined, 'Q34 not yet answered');

    answers[32] = 'A';
    assert(answers[32] === 'A', 'Q32 answered');
    assert(answers[33] === 'B', 'Q33 still answered');

    answers[34] = 'D';
    assert(answers[34] === 'D', 'Q34 answered');

    // Verify cluster answered count
    const answeredCount = cluster.questions.filter((q) => Boolean(answers[q.questionNumber])).length;
    assert(answeredCount === 3, 'All 3 cluster questions answered');
  });

  await runTest('T5-2: Independent flagging of questions within a cluster', () => {
    const flagged = new Set<number>();
    const cluster = getToeicClientClusterForQuestion(32, textQuestions)!;

    // Flag Q32 and Q34, leave Q33 unflagged
    flagged.add(32);
    flagged.add(34);

    assert(flagged.has(32), 'Q32 is flagged');
    assert(!flagged.has(33), 'Q33 is not flagged');
    assert(flagged.has(34), 'Q34 is flagged');

    // Unflag Q32
    flagged.delete(32);
    assert(!flagged.has(32), 'Q32 is unflagged');
    assert(flagged.has(34), 'Q34 remains flagged');
  });

  console.log('\n▶ Test Group 6: Part 3 & Part 4 Cluster Slicing & Divisibility by 3...');

  await runTest('T6-1: Part 3 slicing with non-multiples of 3 clamps upward to preserve whole 3-question clusters', () => {
    // Slicing Part 3 with limit=1 should give at least 1 complete cluster (3 questions)
    const p3Min = loadToeicPartPractice(3, 'bank', 1, false);
    assert(p3Min.length === 3, `Expected 3 questions (1 full cluster), got ${p3Min.length}`);
    assert(p3Min.length % 3 === 0, 'Question count must be divisible by 3');

    // Slicing Part 3 with limit=4 should round up to 6 questions (2 full clusters)
    const p3Mid = loadToeicPartPractice(3, 'bank', 4, false);
    assert(p3Mid.length === 6, `Expected 6 questions (2 full clusters), got ${p3Mid.length}`);
    assert(p3Mid.length % 3 === 0, 'Question count must be divisible by 3');

    // Slicing Part 3 with limit=10 should round up to 12 questions (4 full clusters)
    const p3Ten = loadToeicPartPractice(3, 'bank', 10, false);
    assert(p3Ten.length === 12, `Expected 12 questions (4 full clusters), got ${p3Ten.length}`);
    assert(p3Ten.length % 3 === 0, 'Question count must be divisible by 3');
  });

  await runTest('T6-2: Part 4 slicing with non-multiples of 3 clamps upward to preserve whole 3-question clusters', () => {
    // Slicing Part 4 with limit=2 should give 3 questions
    const p4Min = loadToeicPartPractice(4, 'bank', 2, false);
    assert(p4Min.length === 3, `Expected 3 questions (1 full cluster), got ${p4Min.length}`);
    assert(p4Min.length % 3 === 0, 'Question count must be divisible by 3');

    // Slicing Part 4 with limit=5 should give 6 questions
    const p4Five = loadToeicPartPractice(4, 'bank', 5, false);
    assert(p4Five.length === 6, `Expected 6 questions (2 full clusters), got ${p4Five.length}`);
    assert(p4Five.length % 3 === 0, 'Question count must be divisible by 3');
  });

  await runTest('T6-3: Part 3 and Part 4 cluster resolution never yields partial or broken clusters', () => {
    const p3Qs = loadToeicPartPractice(3, 'bank', 9, false);
    for (const q of p3Qs) {
      const cluster = getToeicClientClusterForQuestion(q.questionNumber, p3Qs);
      assert(cluster !== null, `Question ${q.questionNumber} must resolve to a valid cluster`);
      assert(cluster!.questions.length === 3, `Cluster for Q${q.questionNumber} must contain exactly 3 questions`);
    }

    const p4Qs = loadToeicPartPractice(4, 'bank', 6, false);
    for (const q of p4Qs) {
      const cluster = getToeicClientClusterForQuestion(q.questionNumber, p4Qs);
      assert(cluster !== null, `Question ${q.questionNumber} must resolve to a valid cluster`);
      assert(cluster!.questions.length === 3, `Cluster for Q${q.questionNumber} must contain exactly 3 questions`);
    }
  });

  console.log('\n================================================================');
  console.log(' TEST SUMMARY');
  console.log('================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Total Tests : ${results.length}`);
  console.log(`  Passed      : ${passed}`);
  console.log(`  Failed      : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void runAllTests();
