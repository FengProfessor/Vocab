/**
 * Independent Empirical Verification Script for Challenger M1 Iteration 2
 *
 * Checks:
 * 1. resolveExamFilePath('../../../../package') === null
 * 2. resolveExamFilePath('vstep-mock-01?dump=true') === null
 * 3. Path traversal attack matrix
 * 4. All 23 mock exams (vstep-exam-01..23, vstep-mock-01..23) resolve and load
 * 5. All 56 listening tests (vstep-listening-01..56) resolve and load
 * 6. All 20 reading tests (vstep-reading-01..20) resolve and load
 * 7. Out-of-bounds rejection
 * 8. Zero Bulk Leaks verification on safe exams
 */

import path from 'path';
import fs from 'fs';
import {
  resolveExamFilePath,
  loadRawVstepExam,
  loadVstepExamSafe,
  loadVstepExamForClient,
  getVstepQuestionExplanation,
  clearVstepExamCache,
} from '../../src/lib/vstep-test-loader';

interface VerificationResult {
  step: string;
  passed: boolean;
  details: string;
}

const results: VerificationResult[] = [];

function check(step: string, condition: boolean, details: string) {
  results.push({ step, passed: condition, details });
  const icon = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: [${step}] - ${details}`);
}

function findSensitiveKeys(obj: unknown, currentPath = ''): string[] {
  const SENSITIVE_KEY_REGEX = /^(answer|explanationvi|tapescript|suggestion)$/i;
  const findings: string[] = [];
  if (obj === null || typeof obj !== 'object') return findings;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      findings.push(...findSensitiveKeys(obj[i], `${currentPath}[${i}]`));
    }
    return findings;
  }
  for (const [key, val] of Object.entries(obj)) {
    const keyPath = currentPath ? `${currentPath}.${key}` : key;
    if (SENSITIVE_KEY_REGEX.test(key) && val !== undefined) {
      findings.push(`${keyPath}=${JSON.stringify(val).slice(0, 40)}`);
    }
    findings.push(...findSensitiveKeys(val, keyPath));
  }
  return findings;
}

async function runIndependentVerification() {
  console.log('================================================================');
  console.log('🔬 INDEPENDENT EMPIRICAL VERIFICATION - CHALLENGER M1 ITERATION 2');
  console.log('================================================================\n');

  clearVstepExamCache();

  // Test 1: Mandatory prompt assertion 1
  const traversalTarget = '../../../../package';
  const resolvedTraversal = resolveExamFilePath(traversalTarget);
  check(
    'R2.1 Mandatory Traversal Check',
    resolvedTraversal === null,
    `resolveExamFilePath('${traversalTarget}') === ${resolvedTraversal} (expected null)`
  );

  // Test 2: Mandatory prompt assertion 2
  const malformedTarget = 'vstep-mock-01?dump=true';
  const resolvedMalformed = resolveExamFilePath(malformedTarget);
  check(
    'R2.2 Mandatory Malformed Check',
    resolvedMalformed === null,
    `resolveExamFilePath('${malformedTarget}') === ${resolvedMalformed} (expected null)`
  );

  // Test 3: Path Traversal Attack Payload Matrix
  const traversalPayloads = [
    '../../../../package',
    '..\\..\\..\\..\\package',
    '../../../../package.json',
    '..\\..\\..\\..\\package.json',
    '../../../../etc/passwd',
    '..\\..\\windows\\system32',
    'vstep-exam/../../',
    '....//....//package',
    '%2e%2e%2fpackage',
    '..%2f..%2fpackage',
    'vstep-mock-01/../vstep-mock-02',
    'vstep-mock-01/../../vstep-mock-02',
    'vstep-exam-01\\..\\vstep-exam-02',
    'vstep-exam-01\0nullbyte',
    'vstep-mock-01\0.json',
    'vstep-mock-01#hash',
    'vstep-mock-01&debug=1',
    'vstep-mock-01%20',
    'vstep-mock-01;ls',
    'vstep-mock-01|whoami',
    '<script>alert(1)</script>',
    '${7*7}',
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    '   ',
    '',
    'A'.repeat(500),
  ];

  let traversalBreaches = 0;
  for (const payload of traversalPayloads) {
    const res = resolveExamFilePath(payload);
    if (res !== null) {
      traversalBreaches++;
      console.log(`   🚨 BREACH on payload "${payload}" -> resolved: "${res}"`);
    }
  }
  check(
    'R2.3 Traversal Matrix (29 payloads)',
    traversalBreaches === 0,
    `Breaches: ${traversalBreaches}/29 (expected 0)`
  );

  // Test 4: Valid 23 Full Mock exams resolution and loading
  const root = process.cwd();
  const testsDir = path.resolve(root, 'src', 'data', 'vstep', 'tests');
  let validMockResolvedCount = 0;
  let validMockLoadedCount = 0;
  let validMockZeroLeakCount = 0;
  let totalMockQuestions = 0;

  for (let i = 1; i <= 23; i++) {
    const numStr = String(i).padStart(2, '0');
    const idExam = `vstep-exam-${numStr}`;
    const idMock = `vstep-mock-${numStr}`;

    const pathExam = resolveExamFilePath(idExam);
    const pathMock = resolveExamFilePath(idMock);

    if (
      pathExam &&
      pathMock &&
      pathExam === pathMock &&
      pathExam.startsWith(testsDir) &&
      fs.existsSync(pathExam)
    ) {
      validMockResolvedCount++;
    }

    const raw = loadRawVstepExam(idExam);
    if (raw && raw.id && Array.isArray(raw.sections) && raw.sections.length > 0) {
      validMockLoadedCount++;
      let qCount = 0;
      for (const sec of raw.sections) {
        for (const task of sec.tasks) {
          if (task.questions) qCount += task.questions.length;
        }
      }
      totalMockQuestions += qCount;
    }

    const safe = loadVstepExamSafe(idExam);
    if (safe && findSensitiveKeys(safe).length === 0) {
      validMockZeroLeakCount++;
    }
  }

  check(
    'R3.1 23 Full Mock Exams Resolution',
    validMockResolvedCount === 23,
    `Resolved: ${validMockResolvedCount}/23 exams (both vstep-exam-XX and vstep-mock-XX aliases)`
  );
  check(
    'R3.2 23 Full Mock Exams Raw Loading',
    validMockLoadedCount === 23,
    `Loaded: ${validMockLoadedCount}/23 exams, total questions: ${totalMockQuestions}`
  );
  check(
    'R3.3 23 Full Mock Exams Zero Bulk Leaks',
    validMockZeroLeakCount === 23,
    `Sanitized: ${validMockZeroLeakCount}/23 exams with 0 sensitive leaks`
  );

  // Test 5: Valid 56 Listening Practice Tests
  const practiceDir = path.resolve(root, 'src', 'data', 'vstep', 'practice');
  let validListeningResolved = 0;
  let validListeningLoaded = 0;
  let validListeningZeroLeak = 0;
  let totalListeningQuestions = 0;

  for (let i = 1; i <= 56; i++) {
    const numStr = String(i).padStart(2, '0');
    const id = `vstep-listening-${numStr}`;
    const p = resolveExamFilePath(id);

    if (p && p.startsWith(practiceDir) && fs.existsSync(p)) {
      validListeningResolved++;
    }

    const raw = loadRawVstepExam(id);
    if (raw && raw.id && Array.isArray(raw.sections) && raw.sections.length > 0) {
      validListeningLoaded++;
      for (const sec of raw.sections) {
        for (const task of sec.tasks) {
          if (task.questions) totalListeningQuestions += task.questions.length;
        }
      }
    }

    const safe = loadVstepExamSafe(id);
    if (safe && findSensitiveKeys(safe).length === 0) {
      validListeningZeroLeak++;
    }
  }

  check(
    'R3.4 56 Listening Practice Tests Resolution',
    validListeningResolved === 56,
    `Resolved: ${validListeningResolved}/56 tests inside ${practiceDir}`
  );
  check(
    'R3.5 56 Listening Practice Tests Raw Loading',
    validListeningLoaded === 56,
    `Loaded: ${validListeningLoaded}/56 tests, total questions: ${totalListeningQuestions}`
  );
  check(
    'R3.6 56 Listening Practice Tests Zero Bulk Leaks',
    validListeningZeroLeak === 56,
    `Sanitized: ${validListeningZeroLeak}/56 tests with 0 sensitive leaks`
  );

  // Test 6: Valid 20 Reading Practice Tests
  let validReadingResolved = 0;
  let validReadingLoaded = 0;
  let validReadingZeroLeak = 0;
  let totalReadingQuestions = 0;

  for (let i = 1; i <= 20; i++) {
    const numStr = String(i).padStart(2, '0');
    const id = `vstep-reading-${numStr}`;
    const p = resolveExamFilePath(id);

    if (p && p.startsWith(practiceDir) && fs.existsSync(p)) {
      validReadingResolved++;
    }

    const raw = loadRawVstepExam(id);
    if (raw && raw.id && Array.isArray(raw.sections) && raw.sections.length > 0) {
      validReadingLoaded++;
      for (const sec of raw.sections) {
        for (const task of sec.tasks) {
          if (task.questions) totalReadingQuestions += task.questions.length;
        }
      }
    }

    const safe = loadVstepExamSafe(id);
    if (safe && findSensitiveKeys(safe).length === 0) {
      validReadingZeroLeak++;
    }
  }

  check(
    'R3.7 20 Reading Practice Tests Resolution',
    validReadingResolved === 20,
    `Resolved: ${validReadingResolved}/20 tests`
  );
  check(
    'R3.8 20 Reading Practice Tests Raw Loading',
    validReadingLoaded === 20,
    `Loaded: ${validReadingLoaded}/20 tests, total questions: ${totalReadingQuestions}`
  );
  check(
    'R3.9 20 Reading Practice Tests Zero Bulk Leaks',
    validReadingZeroLeak === 20,
    `Sanitized: ${validReadingZeroLeak}/20 tests with 0 sensitive leaks`
  );

  // Test 7: Out-of-bounds rejection
  const outOfBounds = [
    'vstep-mock-00',
    'vstep-mock-0',
    'vstep-mock-24',
    'vstep-mock-25',
    'vstep-mock-100',
    'vstep-exam-00',
    'vstep-exam-24',
    'vstep-listening-00',
    'vstep-listening-57',
    'vstep-listening-100',
    'vstep-reading-00',
    'vstep-reading-21',
    'vstep-reading-100',
  ];

  let outOfBoundFailures = 0;
  for (const oob of outOfBounds) {
    if (resolveExamFilePath(oob) !== null) {
      outOfBoundFailures++;
      console.log(`   🚨 OOB Accepted: "${oob}"`);
    }
  }
  check(
    'R3.10 Range Clamping Out-of-Bounds Rejection',
    outOfBoundFailures === 0,
    `Rejections: ${outOfBounds.length - outOfBoundFailures}/${outOfBounds.length} (expected 0 leaks)`
  );

  // Test 8: Client token and session integrity
  const clientRes = loadVstepExamForClient('vstep-mock-01', '192.168.1.100');
  check(
    'R4.1 Client Session Token Generation',
    clientRes !== null && typeof clientRes.sessionToken === 'string' && clientRes.sessionToken.length > 20,
    `Session token generated: ${clientRes?.sessionToken?.slice(0, 25)}...`
  );

  // Test 9: On-Demand explanation lookup security
  const rawSample = loadRawVstepExam('vstep-mock-01');
  const validQId = rawSample?.sections[0]?.tasks[0]?.questions?.[0]?.id || 'L1Q1';
  const expValid = getVstepQuestionExplanation('vstep-mock-01', validQId);
  const expPollution = getVstepQuestionExplanation('vstep-mock-01', '__proto__');
  const expBadExam = getVstepQuestionExplanation('vstep-mock-999', validQId);
  const expEmpty = getVstepQuestionExplanation('vstep-mock-01', '');

  check(
    'R4.2 On-Demand Explain Security',
    expValid !== null && expPollution === null && expBadExam === null && expEmpty === null,
    `Valid Q (${validQId}): ${Boolean(expValid)}, Prototype pollution: ${expPollution}, Bad exam: ${expBadExam}, Empty Q: ${expEmpty}`
  );

  // Summary
  const allPassed = results.every((r) => r.passed);
  console.log('\n================================================================');
  console.log(`📊 FINAL VERIFICATION: ${results.filter((r) => r.passed).length}/${results.length} CHECKS PASSED`);
  console.log(`EMPIRICAL VERDICT: ${allPassed ? 'APPROVE' : 'REQUEST_CHANGES'}`);
  console.log('================================================================\n');

  return allPassed;
}

runIndependentVerification()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((e) => {
    console.error('Execution error:', e);
    process.exit(1);
  });
