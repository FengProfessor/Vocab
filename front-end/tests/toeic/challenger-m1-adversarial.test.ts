/**
 * tests/toeic/challenger-m1-adversarial.test.ts
 *
 * Challenger 2 Adversarial Test Suite for Milestone 1:
 * Audio & Graphic Data Alignment & Crawlers
 *
 * Evaluates:
 * 1. Test 7005 loader response & data completeness (39 P3 questions, audio, options, explanations).
 * 2. loadFullToeicTest audio alignment & phase shift audit across authentic tests (6852, 7000).
 * 3. Sibling inheritance against corrupted payloads (missing audio/image on siblings).
 * 4. Cluster grouping integrity in stimulus groups.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadAnyToeicTest,
  loadFullToeicTest,
  adaptStudy4ToUnified,
  groupQuestionsIntoStimulusGroups,
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
// SUITE 1: Test 7005 Invariants via loadAnyToeicTest
// ──────────────────────────────────────────────────────────────────────────
function test7005Invariants() {
  console.log('\n================================================================');
  console.log('SUITE 1: Test 7005 Invariants via loadAnyToeicTest');
  console.log('================================================================');

  const questions = loadAnyToeicTest('7005');
  assert(questions.length === 200, 'Suite 1', 'Test 7005 contains exactly 200 questions', `Found ${questions.length} questions`);

  const p3 = questions.filter((q) => q.part === 3);
  assert(p3.length === 39, 'Suite 1', 'Test 7005 Part 3 has exactly 39 questions (Q32-Q70)', `Found ${p3.length} questions`);

  // Verify continuous numbering 32 to 70
  const qnums = p3.map((q) => q.questionNumber);
  const expectedQnums = Array.from({ length: 39 }, (_, i) => 32 + i);
  const qnumsMatch = JSON.stringify(qnums) === JSON.stringify(expectedQnums);
  assert(qnumsMatch, 'Suite 1', 'Test 7005 Part 3 has continuous numbering Q32 to Q70');

  // Verify 100% audio coverage
  const p3WithAudio = p3.filter((q) => Boolean(q.audioUrl && q.audioUrl.trim()));
  assert(p3WithAudio.length === 39, 'Suite 1', 'Test 7005 Part 3 has 100% audio coverage (39/39 questions with audio)', `Only ${p3WithAudio.length}/39 have audio`);

  // Verify Google Cloud Storage audio source
  const allGcs = p3.every((q) => q.audioUrl?.includes('storage.googleapis.com/estudyme'));
  assert(allGcs, 'Suite 1', 'Test 7005 Part 3 audios are sourced from authentic Estudyme GCS storage');

  // Verify cluster consistency (all 3 questions in each cluster share identical audio)
  let clusterConsistency = true;
  const clusterAudios: string[] = [];
  for (let cIdx = 0; cIdx < 13; cIdx++) {
    const q1 = p3[cIdx * 3];
    const q2 = p3[cIdx * 3 + 1];
    const q3 = p3[cIdx * 3 + 2];
    if (!q1.audioUrl || q1.audioUrl !== q2.audioUrl || q2.audioUrl !== q3.audioUrl) {
      clusterConsistency = false;
    }
    clusterAudios.push(q1.audioUrl || '');
  }
  assert(clusterConsistency, 'Suite 1', 'Test 7005 Part 3: All 13 clusters have identical audio for all 3 sibling questions');

  // Verify exactly 13 unique audios
  const uniqueAudios = new Set(clusterAudios);
  assert(uniqueAudios.size === 13, 'Suite 1', 'Test 7005 Part 3: Exactly 13 unique audios for 13 dialogue clusters', `Found ${uniqueAudios.size} unique audios`);

  // Verify options structure: 4 options with non-empty text
  let optionsValid = true;
  for (const q of p3) {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      optionsValid = false;
      break;
    }
    const keys = q.options.map((o) => o.key).join('');
    if (keys !== 'ABCD') {
      optionsValid = false;
      break;
    }
    if (q.options.some((o) => !o.text || o.text.trim().length === 0)) {
      optionsValid = false;
      break;
    }
  }
  assert(optionsValid, 'Suite 1', 'Test 7005 Part 3: All 39 questions have 4 valid options (A, B, C, D) with non-empty text');

  // Verify correctAnswer
  const validAnswers = p3.every((q) => ['A', 'B', 'C', 'D'].includes(q.correctAnswer));
  assert(validAnswers, 'Suite 1', 'Test 7005 Part 3: All 39 questions have valid correctAnswer in [A, B, C, D]');

  // Verify explanationVi
  const validExplanations = p3.every((q) => Boolean(q.explanationVi && q.explanationVi.trim().length > 0));
  assert(validExplanations, 'Suite 1', 'Test 7005 Part 3: All 39 questions have non-empty explanationVi');

  // Verify Part 4 completeness
  const p4 = questions.filter((q) => q.part === 4);
  assert(p4.length === 30, 'Suite 1', 'Test 7005 Part 4 has exactly 30 questions (Q71-Q100)');
  const p4WithAudio = p4.filter((q) => Boolean(q.audioUrl && q.audioUrl.trim()));
  assert(p4WithAudio.length === 30, 'Suite 1', 'Test 7005 Part 4 has 100% audio coverage (30/30 questions with audio)');

  // Verify stimulus grouping
  const groups = groupQuestionsIntoStimulusGroups(questions);
  const p3Groups = groups.filter((g) => g.part === 3);
  const p4Groups = groups.filter((g) => g.part === 4);
  assert(p3Groups.length === 13, 'Suite 1', 'Test 7005 Part 3 groups into exactly 13 stimulus clusters', `Got ${p3Groups.length} groups`);
  assert(p4Groups.length === 10, 'Suite 1', 'Test 7005 Part 4 groups into exactly 10 stimulus clusters', `Got ${p4Groups.length} groups`);
  assert(p3Groups.every((g) => g.questions.length === 3), 'Suite 1', 'Test 7005 Part 3: All 13 groups contain exactly 3 questions');
  assert(p4Groups.every((g) => g.questions.length === 3), 'Suite 1', 'Test 7005 Part 4: All 10 groups contain exactly 3 questions');
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 2: Adversarial Audit of loadFullToeicTest Audio Collapsing Bug
// ──────────────────────────────────────────────────────────────────────────
function testLoadFullToeicTestAudioCollapsingBug() {
  console.log('\n================================================================');
  console.log('SUITE 2: Adversarial Audit of loadFullToeicTest Audio Alignment');
  console.log('================================================================');

  const testIds = ['6852', '7000'];
  for (const tid of testIds) {
    const questions = loadFullToeicTest(tid);
    const p3 = questions.filter((q) => q.part === 3);
    const p4 = questions.filter((q) => q.part === 4);

    // Audit Part 3 unique audios
    const p3Audios = new Set(p3.map((q) => q.audioUrl));
    console.log(`  [Inspect] Test ${tid} Part 3 unique audios count in loadFullToeicTest: ${p3Audios.size}`);

    // Standard TOEIC spec requires exactly 13 distinct dialogue audios for 13 clusters
    const has13P3Audios = p3Audios.size === 13;
    assert(
      has13P3Audios,
      'Suite 2',
      `[CRITICAL AUDIT] Test ${tid} Part 3 must have 13 unique audios (TOEIC Standard Invariant)`,
      `DETECTED COLLAPSE: Found only ${p3Audios.size} unique audios instead of 13! Clusters 0, 1, 2 share identical audio!`
    );

    // Audit Part 4 unique audios
    const p4Audios = new Set(p4.map((q) => q.audioUrl));
    console.log(`  [Inspect] Test ${tid} Part 4 unique audios count in loadFullToeicTest: ${p4Audios.size}`);
    const has10P4Audios = p4Audios.size === 10;
    assert(
      has10P4Audios,
      'Suite 2',
      `[CRITICAL AUDIT] Test ${tid} Part 4 must have 10 unique audios (TOEIC Standard Invariant)`,
      `DETECTED COLLAPSE: Found only ${p4Audios.size} unique audios instead of 10! Clusters 0, 1, 2 share identical audio!`
    );

    // Check specific cluster phase shift: Cluster 1 (Q35-37) vs Cluster 0 (Q32-34)
    const q32Audio = p3.find((q) => q.questionNumber === 32)?.audioUrl;
    const q35Audio = p3.find((q) => q.questionNumber === 35)?.audioUrl;
    const cluster1DistinctFromCluster0 = q32Audio !== q35Audio;
    assert(
      cluster1DistinctFromCluster0,
      'Suite 2',
      `[CRITICAL AUDIT] Test ${tid} Cluster 1 (Q35-37) audio must be distinct from Cluster 0 (Q32-34)`,
      `PHASE SHIFT DETECTED: Q35 received Cluster 0 audio (${q32Audio}) instead of its own audio!`
    );

    // Check Part 4 phase shift: Cluster 1 (Q74-76) vs Cluster 0 (Q71-73)
    const q71Audio = p4.find((q) => q.questionNumber === 71)?.audioUrl;
    const q74Audio = p4.find((q) => q.questionNumber === 74)?.audioUrl;
    const p4Cluster1DistinctFromCluster0 = q71Audio !== q74Audio;
    assert(
      p4Cluster1DistinctFromCluster0,
      'Suite 2',
      `[CRITICAL AUDIT] Test ${tid} Part 4 Cluster 1 (Q74-76) audio must be distinct from Cluster 0 (Q71-73)`,
      `PHASE SHIFT DETECTED: Q74 received Cluster 0 audio (${q71Audio}) instead of its own audio!`
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 3: Sibling Inheritance Under Corrupted Payloads (Loader Level)
// ──────────────────────────────────────────────────────────────────────────
function testSiblingInheritanceCorruptedDatasets() {
  console.log('\n================================================================');
  console.log('SUITE 3: Sibling Inheritance Under Corrupted Payloads');
  console.log('================================================================');

  // Construct a mock corrupted Study4 payload for Part 3
  const mockStudy4Payload: any = {
    testId: 'mock-corrupt-01',
    parts: {
      part_3: {
        questions: [],
        groups: [],
      },
    },
  };

  // Generate 39 questions across 13 clusters
  for (let c = 0; c < 13; c++) {
    const audioUrl = `https://study4.com/audio/cluster_${c}.mp3`;
    for (let s = 0; s < 3; s++) {
      const qnum = 32 + c * 3 + s;
      mockStudy4Payload.parts.part_3.questions.push({
        qid: `q_${qnum}`,
        qnum: String(qnum),
        text: `Question ${qnum} text`,
        options: ['(A) Option 1', '(B) Option 2', '(C) Option 3', '(D) Option 4'],
        audio_url: audioUrl,
        correct_answer: 'A',
      });
    }
  }

  // Inject intentional corruptions:
  // Corruption 1: Cluster 0, middle question (Q33) missing audio_url
  mockStudy4Payload.parts.part_3.questions[1].audio_url = '';

  // Corruption 2: Cluster 1, first question (Q35) missing audio_url
  mockStudy4Payload.parts.part_3.questions[3].audio_url = '';

  // Corruption 3: Cluster 2, last question (Q40) missing audio_url
  mockStudy4Payload.parts.part_3.questions[8].audio_url = '';

  // Corruption 4: Cluster 3, two questions (Q41 & Q42) missing audio_url
  mockStudy4Payload.parts.part_3.questions[9].audio_url = '';
  mockStudy4Payload.parts.part_3.questions[10].audio_url = '';

  // Run through adaptStudy4ToUnified
  const adapted = adaptStudy4ToUnified(mockStudy4Payload, 'mock-corrupt-01');
  const p3 = adapted.filter((q) => q.part === 3);

  // Check 1: Q33 should inherit audio from cluster 0
  const q33 = p3.find((q) => q.questionNumber === 33);
  assert(
    q33?.audioUrl === 'https://study4.com/audio/cluster_0.mp3',
    'Suite 3',
    'adaptStudy4ToUnified: Q33 (middle sibling) automatically inherits cluster 0 audio',
    `Q33 audioUrl: ${q33?.audioUrl}`
  );

  // Check 2: Q35 should inherit audio from cluster 1
  const q35 = p3.find((q) => q.questionNumber === 35);
  assert(
    q35?.audioUrl === 'https://study4.com/audio/cluster_1.mp3',
    'Suite 3',
    'adaptStudy4ToUnified: Q35 (first sibling) automatically inherits cluster 1 audio',
    `Q35 audioUrl: ${q35?.audioUrl}`
  );

  // Check 3: Q40 should inherit audio from cluster 2
  const q40 = p3.find((q) => q.questionNumber === 40);
  assert(
    q40?.audioUrl === 'https://study4.com/audio/cluster_2.mp3',
    'Suite 3',
    'adaptStudy4ToUnified: Q40 (last sibling) automatically inherits cluster 2 audio',
    `Q40 audioUrl: ${q40?.audioUrl}`
  );

  // Check 4: Q41 & Q42 should inherit audio from cluster 3
  const q41 = p3.find((q) => q.questionNumber === 41);
  const q42 = p3.find((q) => q.questionNumber === 42);
  assert(
    q41?.audioUrl === 'https://study4.com/audio/cluster_3.mp3' &&
    q42?.audioUrl === 'https://study4.com/audio/cluster_3.mp3',
    'Suite 3',
    'adaptStudy4ToUnified: Q41 & Q42 (two missing siblings) inherit audio from surviving sibling Q43',
    `Q41: ${q41?.audioUrl}, Q42: ${q42?.audioUrl}`
  );

  // Check 5: Grouping integrity after inheritance
  const groups = groupQuestionsIntoStimulusGroups(p3);
  assert(
    groups.length === 13,
    'Suite 3',
    'groupQuestionsIntoStimulusGroups: Part 3 forms exactly 13 groups of 3 despite corruptions',
    `Formed ${groups.length} groups`
  );
  assert(
    groups.every((g) => g.questions.length === 3),
    'Suite 3',
    'groupQuestionsIntoStimulusGroups: Every group contains exactly 3 questions after inheritance'
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SUITE 4: Raw Listening V1 Dataset Invariants
// ──────────────────────────────────────────────────────────────────────────
function testRawListeningV1Invariants() {
  console.log('\n================================================================');
  console.log('SUITE 4: Raw content-toeic-listening-v1.json Direct Inspection');
  console.log('================================================================');

  const filePath = path.resolve(__dirname, '../../src/data/toeic/content-toeic-listening-v1.json');
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Test 7005 raw entry
  const t7005_p3 = raw.part3.find((t: any) => t.testId === '7005');
  assert(Boolean(t7005_p3), 'Suite 4', 'Test 7005 exists in raw part3');
  assert(t7005_p3?.questions?.length === 39, 'Suite 4', 'Test 7005 in raw part3 has exactly 39 questions');
  assert(t7005_p3?.groups?.length === 13, 'Suite 4', 'Test 7005 in raw part3 has exactly 13 groups');

  const t7005_p4 = raw.part4.find((t: any) => t.testId === '7005');
  assert(Boolean(t7005_p4), 'Suite 4', 'Test 7005 exists in raw part4');
  assert(t7005_p4?.questions?.length === 30, 'Suite 4', 'Test 7005 in raw part4 has exactly 30 questions');
  assert(t7005_p4?.groups?.length === 10, 'Suite 4', 'Test 7005 in raw part4 has exactly 10 groups');

  // Verify all 20 tests have 13 unique audios in raw JSON
  let all20P3Unique = true;
  for (const t of raw.part3) {
    const audios = new Set(t.questions.map((q: any) => q.audio_url).filter(Boolean));
    if (audios.size !== 13) {
      all20P3Unique = false;
      console.error(`  [Raw Check] Test ${t.testId} Part 3 has ${audios.size} unique audios instead of 13`);
    }
  }
  assert(all20P3Unique, 'Suite 4', 'Raw JSON: All 20 tests have exactly 13 unique audios in Part 3');

  let all20P4Unique = true;
  for (const t of raw.part4) {
    const audios = new Set(t.questions.map((q: any) => q.audio_url).filter(Boolean));
    if (audios.size !== 10) {
      all20P4Unique = false;
      console.error(`  [Raw Check] Test ${t.testId} Part 4 has ${audios.size} unique audios instead of 10`);
    }
  }
  assert(all20P4Unique, 'Suite 4', 'Raw JSON: All 20 tests have exactly 10 unique audios in Part 4');
}

// ──────────────────────────────────────────────────────────────────────────
// EXECUTE SUITES
// ──────────────────────────────────────────────────────────────────────────
async function main() {
  test7005Invariants();
  testLoadFullToeicTestAudioCollapsingBug();
  testSiblingInheritanceCorruptedDatasets();
  testRawListeningV1Invariants();

  console.log('\n================================================================');
  console.log('ADVERSARIAL CHALLENGER VERIFICATION SUMMARY:');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Assertions: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\n🚨 CRITICAL FAILURES FOUND (${failedCount}):`);
    for (const f of results.filter((r) => !r.passed)) {
      console.error(`  - [${f.suite}] ${f.name}`);
      if (f.message) console.error(`      Detail: ${f.message}`);
    }
  }
}

main().catch(console.error);
