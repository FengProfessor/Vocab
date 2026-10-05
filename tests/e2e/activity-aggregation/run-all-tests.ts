/**
 * Master E2E Test Suite Runner for Universal Student Activity Aggregation
 * across Teacher Dashboard and Admin CRM.
 *
 * Execution:
 *   npx tsx tests/e2e/activity-aggregation/run-all-tests.ts
 *
 * Exits with code 0 if 100% of tests pass, code 1 if any test fails.
 */

import { TestRunner, SuiteStats } from './harness';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-cases.test';
import { runTier3Tests } from './tier3-pairwise-combinations.test';
import { runTier4Tests } from './tier4-real-world-scenarios.test';

interface TierSummary {
  tierName: string;
  focus: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  status: 'PASS' | 'FAIL';
}

async function runAllSuites() {
  const masterStart = Date.now();
  console.log('\n====================================================================================================');
  console.log('       UNIVERSAL STUDENT ACTIVITY AGGREGATION - AUTOMATED 4-TIER E2E TEST SUITE');
  console.log('       Teacher Dashboard & Admin CRM Overhaul (M1, M2, M3, M4)');
  console.log('====================================================================================================\n');

  const summaries: TierSummary[] = [];

  // 1. Tier 1: Feature Coverage
  console.log('>>> [1/4] Executing Tier 1: Feature Coverage (Core Functional Contracts)...');
  const t1Runner = new TestRunner('Tier 1: Feature Coverage');
  await runTier1Tests(t1Runner);
  const t1Stats = t1Runner.getStats();
  summaries.push({
    tierName: 'Tier 1: Feature Coverage',
    focus: '9 Activity Sources / Teacher Stats / Pedagogical Status / Timeline / CRM',
    total: t1Stats.total,
    passed: t1Stats.passed,
    failed: t1Stats.failed,
    durationMs: t1Stats.durationMs,
    status: t1Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished Tier 1: ${t1Stats.passed}/${t1Stats.total} passed in ${t1Stats.durationMs}ms\n`);

  // 2. Tier 2: Boundary & Corner Cases
  console.log('>>> [2/4] Executing Tier 2: Boundary & Corner Cases (Resilience & Edge Conditions)...');
  const t2Runner = new TestRunner('Tier 2: Boundary Cases');
  await runTier2Tests(t2Runner);
  const t2Stats = t2Runner.getStats();
  summaries.push({
    tierName: 'Tier 2: Boundary Cases',
    focus: 'Empty History / Single Module / Exact Thresholds (3d, 7d, 30d) / Timezone',
    total: t2Stats.total,
    passed: t2Stats.passed,
    failed: t2Stats.failed,
    durationMs: t2Stats.durationMs,
    status: t2Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished Tier 2: ${t2Stats.passed}/${t2Stats.total} passed in ${t2Stats.durationMs}ms\n`);

  // 3. Tier 3: Pairwise Combinations
  console.log('>>> [3/4] Executing Tier 3: Cross-Feature Combinations (Pairwise Coverage)...');
  const t3Runner = new TestRunner('Tier 3: Pairwise Combinations');
  await runTier3Tests(t3Runner);
  const t3Stats = t3Runner.getStats();
  summaries.push({
    tierName: 'Tier 3: Pairwise Combinations',
    focus: 'Multi-Module Sequences / Cross-Classroom IDOR / Concurrency & SWR / Matrix',
    total: t3Stats.total,
    passed: t3Stats.passed,
    failed: t3Stats.failed,
    durationMs: t3Stats.durationMs,
    status: t3Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished Tier 3: ${t3Stats.passed}/${t3Stats.total} passed in ${t3Stats.durationMs}ms\n`);

  // 4. Tier 4: Real-World Scenarios
  console.log('>>> [4/4] Executing Tier 4: Real-World Application Scenarios (End-to-End Journeys)...');
  const t4Runner = new TestRunner('Tier 4: Real-World Scenarios');
  await runTier4Tests(t4Runner);
  const t4Stats = t4Runner.getStats();
  summaries.push({
    tierName: 'Tier 4: Real-World Scenarios',
    focus: 'Hoàng Nam False Dormant / Thu Trang Reading CRM / 20-Student Class / Drawer',
    total: t4Stats.total,
    passed: t4Stats.passed,
    failed: t4Stats.failed,
    durationMs: t4Stats.durationMs,
    status: t4Stats.failed === 0 ? 'PASS' : 'FAIL',
  });
  console.log(`--- Finished Tier 4: ${t4Stats.passed}/${t4Stats.total} passed in ${t4Stats.durationMs}ms\n`);

  const masterDuration = Date.now() - masterStart;
  const grandTotal = summaries.reduce((acc, s) => acc + s.total, 0);
  const grandPassed = summaries.reduce((acc, s) => acc + s.passed, 0);
  const grandFailed = summaries.reduce((acc, s) => acc + s.failed, 0);
  const allPassed = grandFailed === 0;

  // Print Summary Table
  console.log('====================================================================================================');
  console.log('                                  MASTER E2E EXECUTION SUMMARY TABLE');
  console.log('====================================================================================================');
  console.log('| Tier Name                  | Scope & Focus                           | Total | Passed | Failed | Status | Time(ms) |');
  console.log('|----------------------------|-----------------------------------------|-------|--------|--------|--------|----------|');
  for (const s of summaries) {
    const padName = s.tierName.padEnd(26);
    const padFocus = (s.focus.length > 39 ? s.focus.slice(0, 36) + '...' : s.focus).padEnd(39);
    const padTotal = String(s.total).padStart(5);
    const padPassed = String(s.passed).padStart(6);
    const padFailed = String(s.failed).padStart(6);
    const padStatus = s.status.padStart(6);
    const padTime = String(s.durationMs).padStart(8);
    console.log(`| ${padName} | ${padFocus} | ${padTotal} | ${padPassed} | ${padFailed} | ${padStatus} | ${padTime} |`);
  }
  console.log('|----------------------------|-----------------------------------------|-------|--------|--------|--------|----------|');
  console.log(
    `| TOTAL                      | All 4 Tiers Combined                    | ${String(grandTotal).padStart(5)} | ${String(
      grandPassed,
    ).padStart(6)} | ${String(grandFailed).padStart(6)} | ${(allPassed ? 'PASS' : 'FAIL').padStart(6)} | ${String(
      masterDuration,
    ).padStart(8)} |`,
  );
  console.log('====================================================================================================\n');

  if (!allPassed) {
    console.error(`❌ EXECUTION FAILED: ${grandFailed} test(s) failed out of ${grandTotal}.\n`);
    process.exit(1);
  } else {
    console.log(`✅ ALL TESTS PASSED: ${grandPassed}/${grandTotal} tests completed successfully in ${masterDuration}ms.\n`);
    process.exit(0);
  }
}

runAllSuites().catch((err) => {
  console.error('Fatal unhandled error in master test runner:', err);
  process.exit(1);
});
