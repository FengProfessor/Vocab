/**
 * Empirical Adversarial Test Suite — Milestone M2: VSTEP Dynamic Loader & Security Audit
 * Challenger: Challenger M2 1 (critic, specialist)
 * Target: EXAM_ROUTE_RULES, resolveExamFilePath, loadRawVstepExam, loadVstepExamSafe,
 *         loadVstepExamForClient, getVstepQuestionExplanation.
 *
 * Requirements Verified:
 * 1. Boundary numbers attack across all routes (00, 101, 61, 11, etc. -> null)
 * 2. Path traversal, null bytes, query/fragment markers, prototype pollution -> null
 * 3. Deep recursive zero-bulk-leak scan across all 75 OnThi, 15 ETS, and 1 VNU file (91 files total)
 * 4. 200 consecutive loads throughput and cache latency benchmark
 *
 * Execution:
 *   npx tsx tests/vstep/challenger-m2-adversarial.test.ts
 */

import {
  resolveExamFilePath,
  loadRawVstepExam,
  loadVstepExamSafe,
  loadVstepExamForClient,
  getVstepQuestionExplanation,
  clearVstepExamCache,
  EXAM_ROUTE_RULES,
} from '../../src/lib/vstep-test-loader';
import { VstepExam } from '../../src/lib/vstep-types';

interface SuiteStats {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  errors: string[];
}

const allStats: SuiteStats[] = [];
let currentSuite: SuiteStats = {
  suite: 'Default',
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function beginSuite(name: string) {
  currentSuite = {
    suite: name,
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
  };
  allStats.push(currentSuite);
  console.log('\n' + '='.repeat(80));
  console.log(`▶ SUITE: ${name}`);
  console.log('='.repeat(80));
}

function assert(condition: boolean, message: string, detail?: unknown) {
  currentSuite.total++;
  if (condition) {
    currentSuite.passed++;
  } else {
    currentSuite.failed++;
    const err = `[FAIL] ${message}${detail !== undefined ? ' -> ' + JSON.stringify(detail) : ''}`;
    currentSuite.errors.push(err);
    console.error(`  ❌ ${err}`);
  }
}

/**
 * Deep recursive scanner to search for sensitive keys at any level in an object graph.
 */
const SENSITIVE_KEY_REGEX = /^(answer|explanationvi|tapescript|suggestion)$/i;

function findSensitiveKeys(obj: unknown, path = '$'): string[] {
  const leaks: string[] = [];
  if (obj === null || typeof obj !== 'object') {
    return leaks;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      leaks.push(...findSensitiveKeys(obj[i], `${path}[${i}]`));
    }
  } else {
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const currentPath = `${path}.${key}`;
      if (SENSITIVE_KEY_REGEX.test(key)) {
        leaks.push(`${currentPath} (value: ${JSON.stringify(record[key])})`);
      }
      leaks.push(...findSensitiveKeys(record[key], currentPath));
    }
  }
  return leaks;
}

/**
 * Helper to check whether raw exam actually contains at least one sensitive key.
 */
function rawHasSensitiveKeys(exam: VstepExam): boolean {
  for (const section of exam.sections) {
    if ((section as any).tapescript || (section as any).explanationVi) return true;
    for (const task of section.tasks) {
      if (task.tapescript || task.suggestion || (task as any).explanationVi || (task as any).answer !== undefined) {
        return true;
      }
      if (task.questions) {
        for (const q of task.questions) {
          if (typeof q === 'object' && q !== null) {
            if ((q as any).answer !== undefined || (q as any).explanationVi) return true;
          }
        }
      }
    }
  }
  return false;
}

async function runAdversarialAudit() {
  const globalStart = Date.now();
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ CHALLENGER M2: ADVERSARIAL SECURITY, BOUNDARY & ZERO-LEAK AUDIT FOR VSTEP   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // ==========================================================================
  // SUITE 1: Route Boundary Attacks Across All Multi-Source Routes
  // ==========================================================================
  beginSuite('Route Boundary & Range Clamping Attacks');

  const boundaryTestCases: Array<{ route: string; description: string }> = [
    // OnThi Reading boundary targets (Rule: min: 1, max: 100)
    { route: 'vstep-reading-onthi-00', description: 'OnThi Reading: zero prefix (00)' },
    { route: 'vstep-reading-onthi-0', description: 'OnThi Reading: single zero (0)' },
    { route: 'vstep-reading-onthi-101', description: 'OnThi Reading: upper bound overflow (101)' },
    { route: 'vstep-reading-onthi-999', description: 'OnThi Reading: 3-digit extreme (999)' },
    { route: 'vstep-reading-onthi-1000', description: 'OnThi Reading: 4-digit overflow (1000)' },
    { route: 'vstep-reading-onthi--1', description: 'OnThi Reading: negative number (-1)' },
    { route: 'vstep-reading-onthi-76', description: 'OnThi Reading: within range (1-100) but non-existent file' },

    // ETS Reading boundary targets (Rule: min: 1, max: 60)
    { route: 'vstep-reading-ets-00', description: 'ETS Reading: zero prefix (00)' },
    { route: 'vstep-reading-ets-0', description: 'ETS Reading: single zero (0)' },
    { route: 'vstep-reading-ets-61', description: 'ETS Reading: upper bound overflow (61)' },
    { route: 'vstep-reading-ets-999', description: 'ETS Reading: 3-digit extreme (999)' },
    { route: 'vstep-reading-ets-11', description: 'ETS Reading: within range (1-60) but non-existent file' },

    // ETS Listening boundary targets (Rule: min: 1, max: 60)
    { route: 'vstep-listening-ets-00', description: 'ETS Listening: zero prefix (00)' },
    { route: 'vstep-listening-ets-0', description: 'ETS Listening: single zero (0)' },
    { route: 'vstep-listening-ets-61', description: 'ETS Listening: upper bound overflow (61)' },
    { route: 'vstep-listening-ets-999', description: 'ETS Listening: 3-digit extreme (999)' },
    { route: 'vstep-listening-ets-06', description: 'ETS Listening: within range (1-60) but non-existent file' },

    // VNU Mock boundary targets (Rule: min: 1, max: 10)
    { route: 'vstep-exam-vnu-00', description: 'VNU Mock: zero prefix (00)' },
    { route: 'vstep-exam-vnu-0', description: 'VNU Mock: single zero (0)' },
    { route: 'vstep-exam-vnu-11', description: 'VNU Mock: upper bound overflow (11)' },
    { route: 'vstep-exam-vnu-999', description: 'VNU Mock: 3-digit extreme (999)' },
    { route: 'vstep-mock-vnu-00', description: 'VNU Mock alias: zero prefix (00)' },
    { route: 'vstep-mock-vnu-11', description: 'VNU Mock alias: upper bound overflow (11)' },
    { route: 'vstep-exam-vnu-02', description: 'VNU Mock: within range (1-10) but non-existent file' },

    // OnThi Listening boundary targets (Rule: min: 1, max: 30)
    { route: 'vstep-listening-onthi-00', description: 'OnThi Listening: zero prefix (00)' },
    { route: 'vstep-listening-onthi-31', description: 'OnThi Listening: upper bound overflow (31)' },

    // OnThi Mock boundary targets (Rule: min: 1, max: 20)
    { route: 'vstep-mock-onthi-00', description: 'OnThi Mock: zero prefix (00)' },
    { route: 'vstep-mock-onthi-21', description: 'OnThi Mock: upper bound overflow (21)' },
    { route: 'vstep-exam-onthi-00', description: 'OnThi Exam: zero prefix (00)' },
    { route: 'vstep-exam-onthi-21', description: 'OnThi Exam: upper bound overflow (21)' },

    // ETS Mock boundary targets (Rule: min: 1, max: 60)
    { route: 'vstep-mock-ets-00', description: 'ETS Mock: zero prefix (00)' },
    { route: 'vstep-mock-ets-61', description: 'ETS Mock: upper bound overflow (61)' },
    { route: 'vstep-exam-ets-00', description: 'ETS Exam: zero prefix (00)' },
    { route: 'vstep-exam-ets-61', description: 'ETS Exam: upper bound overflow (61)' },

    // VSTEP Owl Regression Boundaries (M1)
    { route: 'vstep-mock-00', description: 'Owl Mock: zero prefix (00)' },
    { route: 'vstep-mock-24', description: 'Owl Mock: upper bound overflow (24)' },
    { route: 'vstep-listening-00', description: 'Owl Listening: zero prefix (00)' },
    { route: 'vstep-listening-57', description: 'Owl Listening: upper bound overflow (57)' },
    { route: 'vstep-reading-00', description: 'Owl Reading: zero prefix (00)' },
    { route: 'vstep-reading-21', description: 'Owl Reading: upper bound overflow (21)' },
  ];

  for (const tc of boundaryTestCases) {
    const resolved = resolveExamFilePath(tc.route);
    assert(resolved === null, `resolveExamFilePath("${tc.route}") must return null (${tc.description})`, resolved);

    const raw = loadRawVstepExam(tc.route);
    assert(raw === null, `loadRawVstepExam("${tc.route}") must return null (${tc.description})`, raw);

    const safe = loadVstepExamSafe(tc.route);
    assert(safe === null, `loadVstepExamSafe("${tc.route}") must return null (${tc.description})`, safe);
  }

  // ==========================================================================
  // SUITE 2: Path Traversal, Null Byte & Injection Attacks
  // ==========================================================================
  beginSuite('Path Traversal, Injection & Malformed Input Attacks');

  const adversarialPayloads: Array<{ payload: any; description: string }> = [
    // Mandatory dispatch payloads
    { payload: 'vstep-reading-onthi-01/../../package', description: 'Dispatch payload: nested forward slash traversal' },
    { payload: 'vstep-reading-ets-01/..\\..\\package', description: 'Dispatch payload: mixed slash traversal' },
    { payload: 'vstep-reading-onthi-01\0.json', description: 'Dispatch payload: null byte before extension' },
    { payload: 'vstep-reading-onthi-01?dump=true', description: 'Dispatch payload: query parameter marker' },
    { payload: 'vstep-reading-onthi-01#payload', description: 'Dispatch payload: hash fragment marker' },

    // Traversal variants
    { payload: '../package.json', description: 'Relative parent traversal' },
    { payload: '..\\package.json', description: 'Windows parent traversal' },
    { payload: '../../src/lib/vstep-test-loader.ts', description: 'Deep traversal to source code' },
    { payload: '..\\..\\src\\lib\\vstep-test-loader.ts', description: 'Windows deep traversal to source code' },
    { payload: '....//....//package.json', description: 'Double slash evasion traversal' },
    { payload: '/etc/passwd', description: 'Absolute Unix root file' },
    { payload: 'C:\\Windows\\win.ini', description: 'Windows system file path' },
    { payload: 'vstep-reading-onthi-01/', description: 'Trailing slash directory indicator' },
    { payload: '/vstep-reading-onthi-01', description: 'Leading slash indicator' },
    { payload: 'vstep-reading-onthi-01\\', description: 'Trailing backslash indicator' },
    { payload: '.\\vstep-reading-onthi-01', description: 'Relative current dir prefix' },
    { payload: 'vstep-reading-onthi-01/../vstep-reading-onthi-02', description: 'In-route sibling traversal' },

    // Null byte & control character injection
    { payload: 'vstep-reading-onthi-01\0', description: 'Trailing null byte' },
    { payload: 'vstep-exam-vnu-01\x00.json', description: 'Hex null byte' },
    { payload: 'vstep-listening-ets-01\u0000', description: 'Unicode null character' },
    { payload: 'vstep\r\nreading-onthi-01', description: 'CRLF injection in middle of route' },
    { payload: 'vstep\treading-onthi-01', description: 'Tab character in middle of route' },
    { payload: 'vstep reading onthi 01', description: 'Space in middle of route' },

    // URI encoding & symbols
    { payload: 'vstep-reading-onthi-01%2e%2e%2f', description: 'URL encoded traversal (%2e%2e%2f)' },
    { payload: 'vstep-reading-onthi-01%00', description: 'URL encoded null byte (%00)' },
    { payload: 'vstep-reading-onthi-01&param=1', description: 'Ampersand parameter' },
    { payload: 'vstep-reading-onthi-01<script>', description: 'HTML tag injection' },
    { payload: 'vstep-reading-onthi-01>out.txt', description: 'Shell redirection symbol' },
    { payload: 'vstep-reading-onthi-01$HOME', description: 'Environment variable expansion ($)' },
    { payload: 'vstep-reading-onthi-01${test}', description: 'Template literal interpolation (${})' },
    { payload: 'vstep-reading-onthi-01{id}', description: 'Brace expansion' },
    { payload: 'vstep-reading-onthi-01; rm -rf /', description: 'Command injection semicolon' },
    { payload: 'vstep-reading-onthi-01 | dir', description: 'Command pipeline pipe' },

    // Prototype pollution tokens
    { payload: '__proto__', description: 'Prototype pollution (__proto__)' },
    { payload: 'constructor', description: 'Constructor property' },
    { payload: 'prototype', description: 'Prototype property' },
    { payload: 'toString', description: 'toString method' },
    { payload: 'valueOf', description: 'valueOf method' },

    // Type, length & whitespace boundaries
    { payload: '', description: 'Empty string' },
    { payload: '   ', description: 'Whitespace-only string' },
    { payload: '\t\r\n', description: 'Control whitespace-only string' },
    { payload: 'a'.repeat(65), description: 'Length overflow (> 64 chars)' },
    { payload: 'a'.repeat(1000), description: 'Massive length overflow (1000 chars)' },
    { payload: null, description: 'Null primitive' },
    { payload: undefined, description: 'Undefined primitive' },
    { payload: 12345, description: 'Number type' },
    { payload: {}, description: 'Object literal' },
    { payload: [], description: 'Array literal' },
    { payload: true, description: 'Boolean true' },
  ];

  for (const tc of adversarialPayloads) {
    const resolved = resolveExamFilePath(tc.payload);
    assert(resolved === null, `resolveExamFilePath must reject payload: ${tc.description}`, resolved);

    const raw = loadRawVstepExam(tc.payload);
    assert(raw === null, `loadRawVstepExam must reject payload: ${tc.description}`, raw);

    const safe = loadVstepExamSafe(tc.payload);
    assert(safe === null, `loadVstepExamSafe must reject payload: ${tc.description}`, safe);

    const client = loadVstepExamForClient(tc.payload);
    assert(client === null, `loadVstepExamForClient must reject payload: ${tc.description}`, client);
  }

  // ==========================================================================
  // SUITE 3: Deep Recursive Zero-Leak Scan Across All 91 Multi-Source Files
  // ==========================================================================
  beginSuite('Deep Recursive Zero-Leak Scan Across All 91 Crawler Files');

  // Build complete roster of 91 crawler files:
  // - 75 OnThi Reading practice sets
  // - 10 ETS Reading practice sets
  // - 5 ETS Listening practice sets
  // - 1 VNU Official Mock exam
  const testIdsToAudit: string[] = [];

  for (let i = 1; i <= 75; i++) {
    testIdsToAudit.push(`vstep-reading-onthi-${String(i).padStart(2, '0')}`);
  }
  for (let i = 1; i <= 10; i++) {
    testIdsToAudit.push(`vstep-reading-ets-${String(i).padStart(2, '0')}`);
  }
  for (let i = 1; i <= 5; i++) {
    testIdsToAudit.push(`vstep-listening-ets-${String(i).padStart(2, '0')}`);
  }
  testIdsToAudit.push('vstep-exam-vnu-01');

  assert(testIdsToAudit.length === 91, `Expected exactly 91 files to audit, got ${testIdsToAudit.length}`);

  let totalQuestionsAudited = 0;
  let totalSensitiveKeysScrubbed = 0;
  let rawFilesWithSensitiveKeys = 0;

  for (const testId of testIdsToAudit) {
    // 1. Verify raw exam loads and has valid schema
    const raw = loadRawVstepExam(testId);
    assert(raw !== null, `loadRawVstepExam("${testId}") must return valid exam`, raw);
    if (!raw) continue;

    assert(typeof raw.id === 'string' && raw.id.length > 0, `${testId}: raw.id must be non-empty string`);
    assert(typeof raw.title === 'string' && raw.title.length > 0, `${testId}: raw.title must be non-empty string`);
    assert(Array.isArray(raw.sections) && raw.sections.length > 0, `${testId}: raw.sections must be non-empty array`);

    // Verify raw file ACTUALLY contains sensitive keys (proving defense is vital)
    const hasSensitive = rawHasSensitiveKeys(raw);
    if (hasSensitive) {
      rawFilesWithSensitiveKeys++;
    }
    const rawLeaks = findSensitiveKeys(raw);
    totalSensitiveKeysScrubbed += rawLeaks.length;

    // Count questions
    let examQCount = 0;
    for (const sec of raw.sections) {
      for (const task of sec.tasks) {
        if (task.questions) {
          examQCount += task.questions.length;
        }
      }
    }
    totalQuestionsAudited += examQCount;
    assert(examQCount > 0, `${testId}: must contain at least 1 question (found ${examQCount})`);

    // 2. Verify loadVstepExamSafe completely strips 100% of sensitive keys
    const safe = loadVstepExamSafe(testId);
    assert(safe !== null, `loadVstepExamSafe("${testId}") must return non-null`);
    if (!safe) continue;

    const safeLeaks = findSensitiveKeys(safe);
    assert(
      safeLeaks.length === 0,
      `loadVstepExamSafe("${testId}") must have 0 sensitive keys (found ${safeLeaks.length})`,
      safeLeaks.slice(0, 3)
    );

    // Verify structural integrity of safe exam
    assert(
      safe.sections.length === raw.sections.length,
      `${testId}: safe.sections count (${safe.sections.length}) matches raw (${raw.sections.length})`
    );

    let safeQCount = 0;
    for (let sIdx = 0; sIdx < safe.sections.length; sIdx++) {
      const sSec = safe.sections[sIdx];
      const rSec = raw.sections[sIdx];
      assert(sSec.type === rSec.type, `${testId}: section ${sIdx} type matches`);

      for (let tIdx = 0; tIdx < sSec.tasks.length; tIdx++) {
        const sTask = sSec.tasks[tIdx];
        const rTask = rSec.tasks[tIdx];
        assert(sTask.id === rTask.id, `${testId}: task ${tIdx} id matches`);

        if (sTask.questions) {
          safeQCount += sTask.questions.length;
          for (let qIdx = 0; qIdx < sTask.questions.length; qIdx++) {
            const sQ = sTask.questions[qIdx];
            const rQ = rTask.questions![qIdx];
            if (typeof sQ === 'string') {
              assert(typeof rQ === 'string', `${testId}: speaking question prompt type matches`);
              assert(sQ === rQ, `${testId}: speaking prompt text preserved`);
            } else {
              assert(sQ.id === rQ.id, `${testId}: question ${qIdx} id matches`);
              assert(typeof sQ.question === 'string' && sQ.question.length > 0, `${testId}: question text preserved`);
              assert((sQ as any).answer === undefined, `${testId}: question answer must be undefined`);
              assert((sQ as any).explanationVi === undefined, `${testId}: question explanationVi must be undefined`);
            }
          }
        }
      }
    }
    assert(
      safeQCount === examQCount,
      `${testId}: safe question count (${safeQCount}) matches raw question count (${examQCount})`
    );

    // 3. Verify loadVstepExamForClient generates safe exam + valid session token
    const clientData = loadVstepExamForClient(testId);
    assert(clientData !== null, `loadVstepExamForClient("${testId}") must return client payload`);
    if (clientData) {
      assert(
        typeof clientData.sessionToken === 'string' && clientData.sessionToken.length > 20,
        `${testId}: sessionToken must be non-empty string`
      );
      const clientLeaks = findSensitiveKeys(clientData.exam);
      assert(
        clientLeaks.length === 0,
        `${testId}: loadVstepExamForClient exam must have ZERO leaks (found ${clientLeaks.length})`
      );
    }
  }

  assert(
    rawFilesWithSensitiveKeys === 91,
    `All 91 raw files must contain sensitive keys to be stripped (found ${rawFilesWithSensitiveKeys}/91)`
  );
  console.log(`  ℹ Total questions audited across 91 files: ${totalQuestionsAudited}`);
  console.log(`  ℹ Total sensitive key instances verified sanitized: ${totalSensitiveKeysScrubbed}`);

  // Also verify VNU alias 'vstep-mock-vnu-01' maps to the same test
  const vnuMockSafe = loadVstepExamSafe('vstep-mock-vnu-01');
  assert(vnuMockSafe !== null, 'loadVstepExamSafe("vstep-mock-vnu-01") alias must resolve');
  if (vnuMockSafe) {
    const aliasLeaks = findSensitiveKeys(vnuMockSafe);
    assert(aliasLeaks.length === 0, 'VNU mock alias must have ZERO sensitive leaks');
  }

  // ==========================================================================
  // SUITE 4: On-Demand Explanation Security & Precision
  // ==========================================================================
  beginSuite('On-Demand Explanation Precision & Parameter Tampering');

  // Test authentic question retrieval across sources
  const sampleExplanationTargets = [
    { testId: 'vstep-reading-onthi-01', questionId: 'otv-r01-q1', expectedAnswer: 3 },
    { testId: 'vstep-reading-ets-01', questionId: 'ets-r01-q01', expectedAnswer: 1 },
    { testId: 'vstep-listening-ets-01', questionId: 'ets-l01-q01', expectedAnswer: 1 },
    { testId: 'vstep-exam-vnu-01', questionId: 'vnu-l-q1', expectedAnswer: 1 },
  ];

  for (const target of sampleExplanationTargets) {
    const expl = getVstepQuestionExplanation(target.testId, target.questionId);
    assert(expl !== null, `getVstepQuestionExplanation("${target.testId}", "${target.questionId}") must return record`);
    if (expl) {
      assert(expl.answer === target.expectedAnswer, `${target.questionId}: answer matches expected ${target.expectedAnswer}`);
      assert(
        typeof expl.explanationVi === 'string' && expl.explanationVi.length > 5,
        `${target.questionId}: explanationVi must be non-empty string`
      );
    }
  }

  // Adversarial questionId parameters
  const tamperedQuestionIds = [
    '__proto__',
    'constructor',
    'prototype',
    'non-existent-q-999',
    '',
    '   ',
    '../vnu-l-q1',
    'vnu-l-q1\0',
  ];

  for (const tamperedId of tamperedQuestionIds) {
    const result = getVstepQuestionExplanation('vstep-exam-vnu-01', tamperedId);
    assert(
      result === null,
      `getVstepQuestionExplanation with malicious questionId "${tamperedId}" must return null`,
      result
    );
  }

  // ==========================================================================
  // SUITE 5: Throughput & Cache Latency Benchmark (200 Consecutive Loads)
  // ==========================================================================
  beginSuite('Throughput & In-Memory Cache Benchmark (200 Loads)');

  // 1. Cold cache benchmark
  clearVstepExamCache();
  const coldTestIds = [
    'vstep-reading-onthi-01',
    'vstep-reading-onthi-20',
    'vstep-reading-onthi-50',
    'vstep-reading-onthi-75',
    'vstep-reading-ets-01',
    'vstep-reading-ets-05',
    'vstep-reading-ets-10',
    'vstep-listening-ets-01',
    'vstep-listening-ets-05',
    'vstep-exam-vnu-01',
  ];

  const coldStart = Date.now();
  for (const id of coldTestIds) {
    const raw = loadRawVstepExam(id);
    assert(raw !== null, `Cold load of ${id} must succeed`);
  }
  const coldDuration = Date.now() - coldStart;
  const coldAvg = coldDuration / coldTestIds.length;
  console.log(`  ℹ Cold read of ${coldTestIds.length} distinct multi-source exams: ${coldDuration}ms (avg: ${coldAvg.toFixed(2)}ms/load)`);

  // 2. 200 consecutive loads benchmark across multi-source tests
  // We alternate across OnThi, ETS Reading, ETS Listening, VNU Mock, and Owl
  const benchmarkCatalogPool: string[] = [
    ...testIdsToAudit.slice(0, 40),
    'vstep-mock-01',
    'vstep-listening-01',
    'vstep-reading-01',
  ];

  const BENCHMARK_ITERATIONS = 200;
  const latencies: number[] = [];
  let successfulLoads = 0;

  const benchmarkStart = performance.now();
  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const targetId = benchmarkCatalogPool[i % benchmarkCatalogPool.length];
    const iterStart = performance.now();

    // Alternate between loadRawVstepExam and loadVstepExamSafe
    const result = i % 2 === 0 ? loadRawVstepExam(targetId) : loadVstepExamSafe(targetId);
    const iterDuration = performance.now() - iterStart;
    latencies.push(iterDuration);

    if (result !== null) {
      successfulLoads++;
    }
  }
  const benchmarkTotalDuration = performance.now() - benchmarkStart;
  const avgLatency = benchmarkTotalDuration / BENCHMARK_ITERATIONS;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const throughputOpsPerSec = (BENCHMARK_ITERATIONS / (benchmarkTotalDuration / 1000)).toFixed(0);

  console.log(`  ℹ Benchmark iterations: ${BENCHMARK_ITERATIONS}`);
  console.log(`  ℹ Total benchmark time: ${benchmarkTotalDuration.toFixed(2)}ms`);
  console.log(`  ℹ Average latency: ${avgLatency.toFixed(3)}ms/op`);
  console.log(`  ℹ Min / Max latency: ${minLatency.toFixed(3)}ms / ${maxLatency.toFixed(3)}ms`);
  console.log(`  ℹ Throughput: ${throughputOpsPerSec} ops/sec`);

  assert(successfulLoads === BENCHMARK_ITERATIONS, `All ${BENCHMARK_ITERATIONS} loads must succeed (got ${successfulLoads})`);
  assert(avgLatency < 5.0, `Average load latency must be under 5.0ms (got ${avgLatency.toFixed(3)}ms)`);

  // ==========================================================================
  // FINAL SUMMARY & VERDICT
  // ==========================================================================
  const totalGlobalDuration = Date.now() - globalStart;
  const grandTotal = allStats.reduce((acc, s) => acc + s.total, 0);
  const grandPassed = allStats.reduce((acc, s) => acc + s.passed, 0);
  const grandFailed = allStats.reduce((acc, s) => acc + s.failed, 0);

  console.log('\n' + '='.repeat(80));
  console.log('  CHALLENGER M2: AUDIT & BENCHMARK SUMMARY TABLE');
  console.log('='.repeat(80));
  console.log('| Suite                                  | Total | Passed | Failed | Status |');
  console.log('|----------------------------------------|:-----:|:------:|:------:|:------:|');
  for (const s of allStats) {
    const padName = s.suite.padEnd(38, ' ');
    const padTotal = String(s.total).padStart(5, ' ');
    const padPassed = String(s.passed).padStart(6, ' ');
    const padFailed = String(s.failed).padStart(6, ' ');
    const status = s.failed === 0 ? 'PASS' : 'FAIL';
    const padStatus = status.padStart(6, ' ');
    console.log(`| ${padName} | ${padTotal} | ${padPassed} | ${padFailed} | ${padStatus} |`);
  }
  console.log('|----------------------------------------|:-----:|:------:|:------:|:------:|');
  const gName = 'TOTAL ACROSS ALL AUDITS'.padEnd(38, ' ');
  const gTot = String(grandTotal).padStart(5, ' ');
  const gPass = String(grandPassed).padStart(6, ' ');
  const gFail = String(grandFailed).padStart(6, ' ');
  const gStatus = grandFailed === 0 ? 'PASS' : 'FAIL';
  console.log(`| ${gName} | ${gTot} | ${gPass} | ${gFail} | ${gStatus.padStart(6, ' ')} |`);
  console.log('='.repeat(80));
  console.log(`Total duration: ${totalGlobalDuration}ms\n`);

  if (grandFailed > 0) {
    console.error(`❌ EMPIRICAL VERDICT: REQUEST_CHANGES (${grandFailed} assertions failed)`);
    process.exit(1);
  } else {
    console.log(`✅ EMPIRICAL VERDICT: APPROVE (${grandPassed}/${grandTotal} assertions passed cleanly)`);
    process.exit(0);
  }
}

runAdversarialAudit().catch((err) => {
  console.error('Fatal crash during adversarial audit execution:', err);
  process.exit(1);
});
