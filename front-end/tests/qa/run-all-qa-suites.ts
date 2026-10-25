/**
 * Master QA Test Runner: Orchestrates and executes all LingoPro QA suites.
 *
 * Suites:
 * - R1: End-to-End Learner Journey (TOEIC 200Q, ETS Barem, Grammar 308, Word Library, FSRS 92%)
 * - R2: Active Cyber Defense (Zero bulk leaks, Honeypot Canaries, Plausible Poisoning, Rate Limiting, BFF Auth, VietQR)
 * - R3: Cross-Device UI (Single sticky header invariant, Apple HIG >= 44px, Viewport containment)
 * - M1: Cross-Device UI Remediation Baseline Invariants
 *
 * Exits with code 0 if all tests pass, code 1 if any failure occurs.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { TestRunner } from './test-harness';
import { runLearnerJourneyTests } from './learner-journey.test';
import { runActiveDefenseTests } from './active-defense.test';
import { runCrossDeviceUiTests } from './cross-device-ui.test';

interface SuiteSummaryRow {
  name: string;
  scope: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  status: 'PASS' | 'FAIL';
}

async function runMasterTestSuite() {
  const masterStart = Date.now();
  console.log('\n====================================================================================================');
  console.log('                 LINGOPRO FULL-SPECTRUM QA AUTOMATED TEST SUITE (R1, R2, R3, R4)');
  console.log('====================================================================================================\n');

  const summaryRows: SuiteSummaryRow[] = [];

  // 1. Suite R1: Learner Journey
  console.log('>>> [1/4] Executing Suite R1: End-to-End Learner Journey Testing...');
  const r1Runner = new TestRunner('R1: Learner Journey');
  await runLearnerJourneyTests(r1Runner);
  const r1Stats = r1Runner.getStats();
  summaryRows.push({
    name: 'R1: Learner Journey',
    scope: 'TOEIC / Grammar / Library / FSRS',
    total: r1Stats.total,
    passed: r1Stats.passed,
    failed: r1Stats.failed,
    durationMs: r1Stats.durationMs,
    status: r1Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished R1: ${r1Stats.passed}/${r1Stats.total} passed in ${r1Stats.durationMs}ms\n`);

  // 2. Suite R2: Active Cyber Defense
  console.log('>>> [2/4] Executing Suite R2: Active Cyber Defense & Security Testing...');
  const r2Runner = new TestRunner('R2: Active Cyber Defense');
  await runActiveDefenseTests(r2Runner);
  const r2Stats = r2Runner.getStats();
  summaryRows.push({
    name: 'R2: Active Cyber Defense',
    scope: 'Anti-Scrape / Poison / Rate / BFF / Pay',
    total: r2Stats.total,
    passed: r2Stats.passed,
    failed: r2Stats.failed,
    durationMs: r2Stats.durationMs,
    status: r2Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished R2: ${r2Stats.passed}/${r2Stats.total} passed in ${r2Stats.durationMs}ms\n`);

  // 3. Suite R3: Cross-Device UI
  console.log('>>> [3/4] Executing Suite R3: Cross-Device UI & Visual Polish Testing...');
  const r3Runner = new TestRunner('R3: Cross-Device UI');
  await runCrossDeviceUiTests(r3Runner);
  const r3Stats = r3Runner.getStats();
  summaryRows.push({
    name: 'R3: Cross-Device UI',
    scope: 'HIG >= 44px / Sticky / Viewport',
    total: r3Stats.total,
    passed: r3Stats.passed,
    failed: r3Stats.failed,
    durationMs: r3Stats.durationMs,
    status: r3Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished R3: ${r3Stats.passed}/${r3Stats.total} passed in ${r3Stats.durationMs}ms\n`);

  // 4. Suite M1: Cross-Device UI Remediation Baseline
  console.log('>>> [4/4] Executing Suite M1: Cross-Device UI Remediation Baseline Invariants...');
  const m1Start = Date.now();
  let m1Total = 8;
  let m1Passed = 0;
  let m1Failed = 0;
  try {
    const m1Script = path.resolve(__dirname, 'm1-cross-device-ui.test.ts');
    const stdout = execSync(`npx tsx "${m1Script}"`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Check results output strictly without silent pass fallback
    const match = stdout.match(/Milestone 1 Test Results: (\d+)\/(\d+) passed/);
    if (!match) {
      throw new Error(`Master runner failed to parse M1 test execution output from stdout:\n${stdout.slice(0, 300)}`);
    }
    m1Passed = parseInt(match[1], 10);
    m1Total = parseInt(match[2], 10);
    m1Failed = m1Total - m1Passed;
    if (m1Failed > 0) {
      throw new Error(`M1 test suite reported ${m1Failed} test failure(s).`);
    }
  } catch (err: unknown) {
    console.error('M1 execution error:', err instanceof Error ? err.message : String(err));
    m1Failed = m1Total;
    m1Passed = 0;
  }
  const m1Duration = Date.now() - m1Start;
  summaryRows.push({
    name: 'M1: Remediation Invariants',
    scope: 'Admin Sticky & Touch Target Baseline',
    total: m1Total,
    passed: m1Passed,
    failed: m1Failed,
    durationMs: m1Duration,
    status: m1Failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished M1: ${m1Passed}/${m1Total} passed in ${m1Duration}ms\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Summary Table & Statistics
  // ──────────────────────────────────────────────────────────────────────────

  const grandTotal = summaryRows.reduce((acc, row) => acc + row.total, 0);
  const grandPassed = summaryRows.reduce((acc, row) => acc + row.passed, 0);
  const grandFailed = summaryRows.reduce((acc, row) => acc + row.failed, 0);
  const totalDuration = Date.now() - masterStart;

  console.log('\n====================================================================================================');
  console.log('                             MASTER QA TEST EXECUTION SUMMARY TABLE');
  console.log('====================================================================================================');
  console.log(
    'Suite Name'.padEnd(30) +
    'Scope'.padEnd(40) +
    'Total'.padStart(7) +
    'Passed'.padStart(8) +
    'Failed'.padStart(8) +
    'Pass Rate'.padStart(11) +
    'Duration'.padStart(10) +
    '   Status'
  );
  console.log('-'.repeat(120));

  for (const row of summaryRows) {
    const passRate = `${((row.passed / row.total) * 100).toFixed(1)}%`;
    console.log(
      row.name.padEnd(30) +
      row.scope.padEnd(40) +
      String(row.total).padStart(7) +
      String(row.passed).padStart(8) +
      String(row.failed).padStart(8) +
      passRate.padStart(11) +
      `${row.durationMs}ms`.padStart(10) +
      `   [${row.status}]`
    );
  }

  console.log('-'.repeat(120));
  const grandPassRate = `${((grandPassed / grandTotal) * 100).toFixed(1)}%`;
  console.log(
    'TOTAL SUMMARY'.padEnd(30) +
    'All Verified Subsystems'.padEnd(40) +
    String(grandTotal).padStart(7) +
    String(grandPassed).padStart(8) +
    String(grandFailed).padStart(8) +
    grandPassRate.padStart(11) +
    `${totalDuration}ms`.padStart(10) +
    `   [${grandFailed === 0 ? 'PASS' : 'FAIL'}]`
  );
  console.log('====================================================================================================\n');

  if (grandFailed > 0) {
    console.error(`QA Verification FAILED with ${grandFailed} test failure(s).`);
    process.exit(1);
  } else {
    console.log(`All ${grandTotal} QA verification tests PASSED successfully (100% PASS, Exit Code 0).`);
    process.exit(0);
  }
}

runMasterTestSuite().catch((err) => {
  console.error('Fatal master QA test suite runner failure:', err);
  process.exit(1);
});
