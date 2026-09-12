/**
 * Challenger M1 2: Adversarial Security & Performance Test Suite
 *
 * Empirical verification of:
 * 1. Deep Recursive Zero-Bulk-Leak Sanitization across all 99 VSTEP catalog exams (23 Mocks, 56 Listening, 20 Reading)
 * 2. In-Memory Cache Immutability & Mutation Resistance
 * 3. High-Throughput Performance Stress Test (200 consecutive loads, latency < 2ms)
 * 4. Fallback, Boundary & Injection Resilience (path traversal, null bytes, non-existent IDs)
 * 5. On-Demand Explanation & Skill Practice Corner Cases
 */

import { performance } from 'node:perf_hooks';
import {
  TestRunner,
  expect,
} from './test-harness';

import {
  loadRawVstepExam,
  loadVstepExamSafe,
  loadVstepExamForClient,
  stripSensitiveVstepData,
  clearVstepExamCache,
  resolveExamFilePath,
  getVstepQuestionExplanation,
  loadVstepSkillPractice,
  getVstepCatalog,
} from '../../src/lib/vstep-test-loader';

import { VstepExam, VstepSkillType } from '../../src/lib/vstep-types';

/**
 * Recursively scans any object or array to find any keys that match sensitive fields.
 * Returns an array of paths where sensitive keys were found.
 */
function findSensitiveKeys(obj: unknown, currentPath = ''): string[] {
  const SENSITIVE_KEY_REGEX = /^(answer|explanationvi|tapescript|suggestion)$/i;
  const findings: string[] = [];

  if (obj === null || typeof obj !== 'object') {
    return findings;
  }

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

/**
 * Recursively counts all properties in an object tree.
 */
function countTotalKeys(obj: unknown): number {
  if (obj === null || typeof obj !== 'object') return 0;
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countTotalKeys(item), 0);
  }
  let count = Object.keys(obj).length;
  for (const val of Object.values(obj)) {
    count += countTotalKeys(val);
  }
  return count;
}

export async function runChallengerSuite(): Promise<boolean> {
  const runner = new TestRunner();

  console.log('\n================================================================');
  console.log('⚔️  CHALLENGER M1 2: ADVERSARIAL SECURITY & PERFORMANCE SUITE');
  console.log('================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: Deep Recursive Zero-Bulk-Leak Sanitization Audit
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('1. Zero-Bulk-Leak Sanitization: Deep Recursive Audit across Catalog', async () => {
    runner.it('should strip 100% of sensitive fields across all 23 Full Mock exams with 0 leaks', async () => {
      let totalRawSensitive = 0;
      let totalStrippedSensitive = 0;
      let totalFieldsScanned = 0;

      for (let i = 1; i <= 23; i++) {
        const testId = `vstep-exam-${String(i).padStart(2, '0')}`;
        const raw = loadRawVstepExam(testId);
        expect(raw).toBeDefined();
        expect(raw).not.toBeNull();

        const rawLeaks = findSensitiveKeys(raw);
        expect(rawLeaks.length).toBeGreaterThan(0); // Raw MUST contain answers/explanations
        totalRawSensitive += rawLeaks.length;

        const stripped = stripSensitiveVstepData(raw!);
        const strippedLeaks = findSensitiveKeys(stripped);
        totalStrippedSensitive += strippedLeaks.length;
        totalFieldsScanned += countTotalKeys(stripped);

        expect(strippedLeaks.length).toBe(0);

        // Also verify via loadVstepExamSafe
        const safe = loadVstepExamSafe(testId);
        expect(safe).not.toBeNull();
        const safeLeaks = findSensitiveKeys(safe);
        expect(safeLeaks.length).toBe(0);

        // Also verify via loadVstepExamForClient
        const clientPkg = loadVstepExamForClient(testId);
        expect(clientPkg).not.toBeNull();
        expect(clientPkg!.sessionToken).toBeDefined();
        expect(typeof clientPkg!.sessionToken).toBe('string');
        expect(clientPkg!.sessionToken.length).toBeGreaterThan(10);
        const clientLeaks = findSensitiveKeys(clientPkg!.exam);
        expect(clientLeaks.length).toBe(0);
      }

      console.log(`     -> Full Mocks (23 exams): Scanned ~${totalFieldsScanned} fields.`);
      console.log(`     -> Raw sensitive occurrences found: ${totalRawSensitive}`);
      console.log(`     -> Stripped sensitive leaks detected: ${totalStrippedSensitive} (TARGET: 0)`);
      expect(totalStrippedSensitive).toBe(0);
      expect(totalRawSensitive).toBeGreaterThan(1000);
    });

    runner.it('should strip 100% of sensitive fields across all 56 Listening practice tests with 0 leaks', async () => {
      let totalRawSensitive = 0;
      let totalStrippedSensitive = 0;
      let totalFieldsScanned = 0;

      for (let i = 1; i <= 56; i++) {
        const testId = `vstep-listening-${String(i).padStart(2, '0')}`;
        const raw = loadRawVstepExam(testId);
        expect(raw).not.toBeNull();

        const rawLeaks = findSensitiveKeys(raw);
        expect(rawLeaks.length).toBeGreaterThan(0); // Raw listening MUST contain tapescripts & answers
        totalRawSensitive += rawLeaks.length;

        const stripped = stripSensitiveVstepData(raw!);
        const strippedLeaks = findSensitiveKeys(stripped);
        totalStrippedSensitive += strippedLeaks.length;
        totalFieldsScanned += countTotalKeys(stripped);

        expect(strippedLeaks.length).toBe(0);

        const safe = loadVstepExamSafe(testId);
        expect(safe).not.toBeNull();
        expect(findSensitiveKeys(safe).length).toBe(0);
      }

      console.log(`     -> Listening Tests (56 tests): Scanned ~${totalFieldsScanned} fields.`);
      console.log(`     -> Raw sensitive occurrences found: ${totalRawSensitive}`);
      console.log(`     -> Stripped sensitive leaks detected: ${totalStrippedSensitive} (TARGET: 0)`);
      expect(totalStrippedSensitive).toBe(0);
      expect(totalRawSensitive).toBeGreaterThan(2000);
    });

    runner.it('should strip 100% of sensitive fields across all 20 Reading practice tests with 0 leaks', async () => {
      let totalRawSensitive = 0;
      let totalStrippedSensitive = 0;

      for (let i = 1; i <= 20; i++) {
        const testId = `vstep-reading-${String(i).padStart(2, '0')}`;
        const raw = loadRawVstepExam(testId);
        expect(raw).not.toBeNull();

        const rawLeaks = findSensitiveKeys(raw);
        expect(rawLeaks.length).toBeGreaterThan(0);
        totalRawSensitive += rawLeaks.length;

        const stripped = stripSensitiveVstepData(raw!);
        const strippedLeaks = findSensitiveKeys(stripped);
        totalStrippedSensitive += strippedLeaks.length;
        expect(strippedLeaks.length).toBe(0);
      }

      console.log(`     -> Reading Tests (20 tests): Raw sensitive: ${totalRawSensitive}, Leaks: ${totalStrippedSensitive}`);
      expect(totalStrippedSensitive).toBe(0);
    });

    runner.it('should verify alias resolution zero-leak parity (vstep-mock-XX vs vstep-exam-XX)', async () => {
      for (let i = 1; i <= 5; i++) {
        const num = String(i).padStart(2, '0');
        const examMock = loadVstepExamSafe(`vstep-mock-${num}`);
        const examStd = loadVstepExamSafe(`vstep-exam-${num}`);

        expect(examMock).not.toBeNull();
        expect(examStd).not.toBeNull();
        expect(examMock!.id).toBe(examStd!.id);
        expect(findSensitiveKeys(examMock).length).toBe(0);
        expect(findSensitiveKeys(examStd).length).toBe(0);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: Cache Immutability & Mutation Defense
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('2. In-Memory Cache Immutability & Mutation Defense', async () => {
    runner.it('should guarantee that calling stripSensitiveVstepData does NOT mutate the cached raw exam', async () => {
      clearVstepExamCache();

      // Step 1: Load raw exam
      const raw1 = loadRawVstepExam('vstep-mock-01');
      expect(raw1).not.toBeNull();
      const raw1Leaks = findSensitiveKeys(raw1);
      expect(raw1Leaks.length).toBeGreaterThan(0);

      // Step 2: Strip it
      const stripped = stripSensitiveVstepData(raw1!);
      expect(findSensitiveKeys(stripped).length).toBe(0);

      // Step 3: Load raw exam again from cache
      const raw2 = loadRawVstepExam('vstep-mock-01');
      expect(raw2).not.toBeNull();
      const raw2Leaks = findSensitiveKeys(raw2);

      // The second raw load MUST STILL HAVE all sensitive answers intact
      expect(raw2Leaks.length).toBe(raw1Leaks.length);
      expect(raw2!.sections[0].tasks[0].questions![0].answer).toBeDefined();
    });

    runner.it('should protect cached raw exam from direct external property mutation', async () => {
      clearVstepExamCache();

      // Load raw
      const raw = loadRawVstepExam('vstep-mock-02');
      expect(raw).not.toBeNull();
      const originalTitle = raw!.title;

      // Malicious external mutation
      raw!.title = 'CORRUPTED_TITLE_BY_ATTACKER';
      (raw!.sections[0] as any).tasks = [];

      // Reload raw from cache
      const rawReloaded = loadRawVstepExam('vstep-mock-02');
      expect(rawReloaded).not.toBeNull();
      expect(rawReloaded!.title).toBe(originalTitle);
      expect(rawReloaded!.sections[0].tasks.length).toBeGreaterThan(0);
    });

    runner.it('should protect cached stripped exam from external mutation', async () => {
      const safe1 = loadVstepExamSafe('vstep-mock-03');
      expect(safe1).not.toBeNull();
      const originalTitle = safe1!.title;

      // Tamper with returned object
      safe1!.title = 'TAMPERED_SAFE_TITLE';

      const safe2 = loadVstepExamSafe('vstep-mock-03');
      expect(safe2).not.toBeNull();
      expect(safe2!.title).toBe(originalTitle);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: High-Throughput Performance Stress Test on examMemoryCache
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('3. examMemoryCache Performance Stress Test (200 Iterations)', async () => {
    runner.it('should benchmark cold load vs warm cached load times', async () => {
      clearVstepExamCache();

      const testIds = [
        'vstep-exam-01', 'vstep-exam-02', 'vstep-exam-03', 'vstep-exam-04', 'vstep-exam-05',
        'vstep-listening-01', 'vstep-listening-02', 'vstep-listening-03', 'vstep-listening-04', 'vstep-listening-05',
      ];

      // Cold loads: from disk
      const coldTimes: number[] = [];
      for (const id of testIds) {
        const t0 = performance.now();
        const exam = loadRawVstepExam(id);
        const t1 = performance.now();
        expect(exam).not.toBeNull();
        coldTimes.push(t1 - t0);
      }
      const avgCold = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length;
      console.log(`     -> Cold disk load average: ${avgCold.toFixed(3)} ms per exam`);

      // Warm loads: consecutive 200 iterations
      const iterations = 200;
      const warmLatencies: number[] = [];
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Random selection from pre-warmed IDs
        const selectedId = testIds[i % testIds.length];
        const t0 = performance.now();
        const exam = loadRawVstepExam(selectedId);
        const t1 = performance.now();

        expect(exam).not.toBeNull();
        expect(exam!.sections.length).toBeGreaterThan(0);
        warmLatencies.push(t1 - t0);
      }

      const totalWarmTime = performance.now() - startTime;
      warmLatencies.sort((a, b) => a - b);

      const avgWarm = warmLatencies.reduce((a, b) => a + b, 0) / warmLatencies.length;
      const minWarm = warmLatencies[0];
      const maxWarm = warmLatencies[warmLatencies.length - 1];
      const p50Warm = warmLatencies[Math.floor(iterations * 0.50)];
      const p95Warm = warmLatencies[Math.floor(iterations * 0.95)];
      const p99Warm = warmLatencies[Math.floor(iterations * 0.99)];

      console.log(`     -> Total 200 Warm Loads: ${totalWarmTime.toFixed(2)} ms`);
      console.log(`     -> Warm Latency Stats:`);
      console.log(`        - Average: ${avgWarm.toFixed(3)} ms`);
      console.log(`        - Min:     ${minWarm.toFixed(3)} ms`);
      console.log(`        - Median:  ${p50Warm.toFixed(3)} ms`);
      console.log(`        - P95:     ${p95Warm.toFixed(3)} ms`);
      console.log(`        - P99:     ${p99Warm.toFixed(3)} ms`);
      console.log(`        - Max:     ${maxWarm.toFixed(3)} ms`);

      // Rigorous assertion: Average warm load MUST be < 2.0ms (dispatch requirement)
      expect(avgWarm).toBeLessThan(2.0);
      // Even P95 should be fast
      expect(p95Warm).toBeLessThan(3.0);
    });

    runner.it('should measure high throughput on loadVstepExamSafe across 100 iterations', async () => {
      const latencies: number[] = [];
      for (let i = 0; i < 100; i++) {
        const id = `vstep-mock-${String((i % 10) + 1).padStart(2, '0')}`;
        const t0 = performance.now();
        const safe = loadVstepExamSafe(id);
        const t1 = performance.now();
        expect(safe).not.toBeNull();
        latencies.push(t1 - t0);
      }
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log(`     -> loadVstepExamSafe average: ${avg.toFixed(3)} ms (deep clone + sanitization)`);
      expect(avg).toBeLessThan(3.0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: Adversarial Fallback, Boundary & Injection Resilience
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('4. Adversarial Fallbacks & Boundary Handling', async () => {
    // 4A: Standard boundaries & non-existent IDs
    runner.it('should return null gracefully for all boundary and non-existent IDs', async () => {
      const boundaryIds = [
        'vstep-exam-00',
        'vstep-exam-24',
        'vstep-exam-99',
        'vstep-mock-00',
        'vstep-mock-24',
        'vstep-mock-999',
        'vstep-listening-00',
        'vstep-listening-57',
        'vstep-listening-999',
        'vstep-reading-00',
        'vstep-reading-21',
        'vstep-reading-999',
        'non-existent-exam-id-abc-123',
        'toeic-full-test-01',
        'vstep-writing-01',
        'vstep-speaking-01',
        '   ',
        '',
        'null',
        'undefined',
        '[object Object]',
        '__proto__',
        'constructor',
        'prototype',
        'A'.repeat(5000),
      ];

      for (const badId of boundaryIds) {
        expect(resolveExamFilePath(badId)).toBeNull();
        expect(loadRawVstepExam(badId)).toBeNull();
        expect(loadVstepExamSafe(badId)).toBeNull();
        expect(loadVstepExamForClient(badId)).toBeNull();
      }
    });

    // 4B: Adversarial Path Traversal Challenge
    runner.it('ADVERSARIAL CHALLENGE: should strictly prevent path traversal and arbitrary JSON file reads', async () => {
      const traversalAttempts = [
        '../../../../package',
        '..\\..\\..\\..\\package',
        '../../../../etc/passwd',
        '..\\..\\windows\\system32',
        '../../../package.json',
        'vstep-exam/../../',
      ];

      const breaches: Array<{ id: string; resolved: string | null }> = [];
      for (const id of traversalAttempts) {
        const resolved = resolveExamFilePath(id);
        if (resolved !== null) {
          breaches.push({ id, resolved });
        }
      }

      if (breaches.length > 0) {
        console.log('\n     🚨 CRITICAL VULNERABILITY DETECTED: Path Traversal in resolveExamFilePath:');
        for (const b of breaches) {
          console.log(`        Exploit payload: "${b.id}" -> Escaped to: "${b.resolved}"`);
        }
      }

      // Assert zero path traversal escapes
      expect(breaches.length).toBe(0);
    });

    // 4C: Adversarial Loose Regex & Honeypot Canary Evasion Challenge
    runner.it('ADVERSARIAL CHALLENGE: should reject IDs with query strings, null bytes, or malformed suffixes', async () => {
      const malformedIds = [
        'vstep-mock-01?dump=true',
        'vstep-mock-01/../vstep-mock-02',
        'vstep-exam-01\0nullbyte',
        '<script>alert(1)</script>',
        '${7*7}',
      ];

      const unexpectedResolutions: Array<{ id: string; resolved: string | null }> = [];
      for (const id of malformedIds) {
        const resolved = resolveExamFilePath(id);
        if (resolved !== null) {
          unexpectedResolutions.push({ id, resolved });
        }
      }

      if (unexpectedResolutions.length > 0) {
        console.log('\n     ⚠️ DEFECT DETECTED: Loose regex / substring match accepts malformed IDs:');
        for (const u of unexpectedResolutions) {
          console.log(`        Malformed ID: "${u.id}" -> Unexpectedly resolved: "${u.resolved}"`);
        }
      }

      expect(unexpectedResolutions.length).toBe(0);
    });

    runner.it('should handle On-Demand Explain edge cases gracefully', async () => {
      // 1. Non-existent test ID
      const res1 = getVstepQuestionExplanation('vstep-mock-999', 'Q1');
      expect(res1).toBeNull();

      // 2. Valid test ID, non-existent question ID
      const res2 = getVstepQuestionExplanation('vstep-mock-01', 'NON_EXISTENT_Q_XYZ');
      expect(res2).toBeNull();

      // 3. Valid test ID, empty string question ID
      const res3 = getVstepQuestionExplanation('vstep-mock-01', '');
      expect(res3).toBeNull();

      // 4. Prototype pollution attempt on question ID
      const res4 = getVstepQuestionExplanation('vstep-mock-01', '__proto__');
      expect(res4).toBeNull();

      // 5. Valid test ID and valid question ID: must return answer and explanation
      const raw = loadRawVstepExam('vstep-mock-01');
      const validQ = raw?.sections[0]?.tasks[0]?.questions?.[0];
      expect(validQ).toBeDefined();

      const explain = getVstepQuestionExplanation('vstep-mock-01', validQ!.id);
      expect(explain).not.toBeNull();
      expect(explain!.answer).toBe(validQ!.answer);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: Skill Practice & Catalog Anti-Duplication Corner Cases
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('5. Skill Practice & Anti-Duplication Corner Cases', async () => {
    runner.it('should load skill practice for listening and reading without crashes', async () => {
      const listeningPractice = loadVstepSkillPractice('listening', 'unseen', []);
      expect(listeningPractice).not.toBeNull();
      expect(listeningPractice!.sections.length).toBe(1);
      expect(listeningPractice!.sections[0].type).toBe('listening');

      const readingPractice = loadVstepSkillPractice('reading', 'unseen', []);
      expect(readingPractice).not.toBeNull();
      expect(readingPractice!.sections.length).toBe(1);
      expect(readingPractice!.sections[0].type).toBe('reading');
    });

    runner.it('should filter excluded IDs cleanly and preserve non-excluded questions', async () => {
      const rawReading = loadRawVstepExam('vstep-reading-01');
      const allQIds: string[] = [];
      rawReading?.sections.forEach((s) => s.tasks.forEach((t) => t.questions?.forEach((q) => allQIds.push(q.id))));
      expect(allQIds.length).toBeGreaterThan(10);

      // Exclude first 5
      const excludeSlice = allQIds.slice(0, 5);
      const filtered = loadVstepSkillPractice('reading', 'unseen', excludeSlice);
      expect(filtered).not.toBeNull();

      const remainingQIds: string[] = [];
      filtered?.sections.forEach((s) => s.tasks.forEach((t) => t.questions?.forEach((q) => remainingQIds.push(q.id))));

      for (const excluded of excludeSlice) {
        expect(remainingQIds.includes(excluded)).toBeFalsy();
      }
    });

    runner.it('should gracefully handle 100% question exclusion without breaking structure', async () => {
      const rawListening = loadRawVstepExam('vstep-listening-01');
      const allQIds: string[] = [];
      rawListening?.sections.forEach((s) => s.tasks.forEach((t) => t.questions?.forEach((q) => allQIds.push(q.id))));

      // Exclude ALL question IDs
      const filtered = loadVstepSkillPractice('listening', 'unseen', allQIds);
      expect(filtered).not.toBeNull();
      expect(filtered!.sections.length).toBe(1);
    });

    runner.it('should verify catalog index has all tests without duplicate IDs', async () => {
      const catalog = getVstepCatalog();
      expect(catalog.items.length).toBeGreaterThanOrEqual(99);

      const seenIds = new Set<string>();
      for (const item of catalog.items) {
        expect(seenIds.has(item.id)).toBeFalsy(); // No duplicate IDs
        seenIds.add(item.id);
      }
      expect(seenIds.size).toBe(catalog.items.length);
    });
  });

  const stats = runner.getStats();
  console.log('\n================================================================');
  console.log(`🏁 CHALLENGER SUITE COMPLETE: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
  console.log(`⏱️  Total Duration: ${stats.durationMs} ms`);
  console.log('================================================================\n');

  return stats.failed === 0;
}

// Auto-run if executed directly
if (require.main === module) {
  runChallengerSuite()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error in challenger suite:', err);
      process.exit(1);
    });
}
