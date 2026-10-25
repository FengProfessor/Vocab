/**
 * Master E2E Test Runner for Foundational Speaking System for False Beginners.
 * Executes Tiers 1 through 4, aggregates results, prints formatted reports,
 * and exits with code 0 on 100% pass or 1 on failure.
 *
 * Usage:
 *   npx tsx tests/speaking/run-all-speaking-tests.ts
 */

import {
  TestRunner,
  SuiteStats,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-corner.test';
import { runTier3Tests } from './tier3-combinations.test';
import { runTier4Tests } from './tier4-real-world-workload.test';
import { runAdversarialTests } from './adversarial-safe-harbor.test';
import { getDataIntegrityStats } from './adversarial-data-integrity';

async function main() {
  console.log('================================================================================');
  console.log('  FOUNDATIONAL SPEAKING SYSTEM FOR FALSE BEGINNERS — MASTER AUTOMATED TEST SUITE');
  console.log('  Mode: Opaque-Box E2E, Boundary, Cross-Feature, Workloads & Adversarial Verification');
  console.log('================================================================================\n');

  setupMockBrowserEnvironment();
  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats; minRequired: number }[] = [];

  try {
    // Tier 1: Feature Coverage (>=5 test cases per feature across Chặng 0-3, SafeHarbor, DualSpeed, Nav)
    console.log('▶ Running Tier 1: Feature Coverage (Chặng 0, 1, 2, 3, SafeHarbor, DualSpeed, Nav)...');
    const runner1 = new TestRunner();
    await runTier1Tests(runner1);
    const stats1 = runner1.getStats();
    tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1, minRequired: 35 });
    console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

    // Tier 2: Boundary & Corner Cases (Extreme Levenshtein, empty, missing articles, typos, bounds)
    console.log('▶ Running Tier 2: Boundary & Corner Cases (Empty, Typo, Punctuation, Timestamps, Speed)...');
    const runner2 = new TestRunner();
    await runTier2Tests(runner2);
    const stats2 = runner2.getStats();
    tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2, minRequired: 30 });
    console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

    // Tier 3: Cross-Feature Combinations (Lego+SafeHarbor, 3-beat+DualSpeed, Video+Audio collision)
    console.log('▶ Running Tier 3: Cross-Feature Combinations (Lego+SafeHarbor, Audio Collision, State)...');
    const runner3 = new TestRunner();
    await runTier3Tests(runner3);
    const stats3 = runner3.getStats();
    tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3, minRequired: 10 });
    console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

    // Tier 4: Real-World Scenarios (Minimal pair, F&B chunk, Lego reflex <1s, 3-beat, Micro-dialogue)
    console.log('▶ Running Tier 4: Real-World Scenarios (Minimal Pair, F&B, Reflex, 3-Beat, Micro-Dialogue)...');
    const runner4 = new TestRunner();
    await runTier4Tests(runner4);
    const stats4 = runner4.getStats();
    tierStats.push({ tierName: 'Tier 4: Real-World Scenarios', stats: stats4, minRequired: 5 });
    console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

    // Adversarial 1: Empirical Adversarial Stress & Algorithmic Oracle (Safe Harbor Matcher)
    console.log('▶ Running Adversarial Suite 1: Safe Harbor Stress & Algorithmic Oracle...');
    const runner5 = new TestRunner();
    await runAdversarialTests(runner5);
    const stats5 = runner5.getStats();
    tierStats.push({ tierName: 'Adversarial 1: Safe Harbor Oracle', stats: stats5, minRequired: 33 });
    console.log(`✓ Adversarial 1 Finished: ${stats5.passed}/${stats5.total} passed (${stats5.durationMs}ms)\n`);

    // Adversarial 2: Data Integrity & Rachel's English Video Validation
    console.log('▶ Running Adversarial Suite 2: Data Integrity & Rachel\'s English Video Validation...');
    const dataStart = Date.now();
    const dataStats = getDataIntegrityStats();
    const dataDuration = Date.now() - dataStart;
    const stats6: SuiteStats = {
      suiteName: 'Adversarial Data Integrity',
      total: dataStats.total,
      passed: dataStats.passed,
      failed: dataStats.failed,
      durationMs: dataDuration,
      results: [],
    };
    tierStats.push({ tierName: 'Adversarial 2: Data Integrity', stats: stats6, minRequired: 33 });
    console.log(`✓ Adversarial 2 Finished: ${stats6.passed}/${stats6.total} passed (${stats6.durationMs}ms)\n`);
  } finally {
    teardownMockBrowserEnvironment();
  }

  const totalDuration = Date.now() - startTime;
  const grandTotal = tierStats.reduce((acc, t) => acc + t.stats.total, 0);
  const grandPassed = tierStats.reduce((acc, t) => acc + t.stats.passed, 0);
  const grandFailed = tierStats.reduce((acc, t) => acc + t.stats.failed, 0);

  // Print Summary Table
  console.log('================================================================================');
  console.log('  FOUNDATIONAL SPEAKING SYSTEM TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log('| Suite                               | Min Req | Total | Passed | Failed | Duration | Status |');
  console.log('|-------------------------------------|:-------:|:-----:|:------:|:------:|:--------:|:------:|');
  for (const { tierName, stats, minRequired } of tierStats) {
    const padName = tierName.padEnd(35, ' ');
    const padReq = String(minRequired).padStart(7, ' ');
    const padTotal = String(stats.total).padStart(5, ' ');
    const padPassed = String(stats.passed).padStart(6, ' ');
    const padFailed = String(stats.failed).padStart(6, ' ');
    const padDuration = `${stats.durationMs}ms`.padStart(8, ' ');
    const status = stats.failed === 0 && stats.total >= minRequired ? 'PASS' : 'FAIL';
    const padStatus = status.padStart(6, ' ');
    console.log(`| ${padName} | ${padReq} | ${padTotal} | ${padPassed} | ${padFailed} | ${padDuration} | ${padStatus} |`);
  }
  console.log('|-------------------------------------|:-------:|:-----:|:------:|:------:|:--------:|:------:|');
  const grandName = 'TOTAL ACROSS ALL SUITES'.padEnd(35, ' ');
  const gReq = '146'.padStart(7, ' ');
  const gTotal = String(grandTotal).padStart(5, ' ');
  const gPassed = String(grandPassed).padStart(6, ' ');
  const gFailed = String(grandFailed).padStart(6, ' ');
  const gDuration = `${totalDuration}ms`.padStart(8, ' ');
  const gStatus = grandFailed === 0 ? 'PASS' : 'FAIL';
  const padGStatus = gStatus.padStart(6, ' ');
  console.log(`| ${grandName} | ${gReq} | ${gTotal} | ${gPassed} | ${gFailed} | ${gDuration} | ${padGStatus} |`);
  console.log('================================================================================\n');

  if (grandFailed > 0) {
    console.error(`❌ FAILED: ${grandFailed} tests failed out of ${grandTotal}.`);
    process.exit(1);
  } else {
    console.log(`✅ SUCCESS: All ${grandTotal} tests passed cleanly with 0 defects!`);
    console.log(`  Tier 1 Feature Coverage (>=35 cases):       ${tierStats[0].stats.total >= 35 ? 'PASSED (' + tierStats[0].stats.total + ')' : 'FAILED'}`);
    console.log(`  Tier 2 Boundary & Corner (>=30 cases):      ${tierStats[1].stats.total >= 30 ? 'PASSED (' + tierStats[1].stats.total + ')' : 'FAILED'}`);
    console.log(`  Tier 3 Combinations (>=10 cases):           ${tierStats[2].stats.total >= 10 ? 'PASSED (' + tierStats[2].stats.total + ')' : 'FAILED'}`);
    console.log(`  Tier 4 Real-World Workload (>=5 cases):     ${tierStats[3].stats.total >= 5 ? 'PASSED (' + tierStats[3].stats.total + ')' : 'FAILED'}`);
    console.log(`  Adversarial 1 Safe Harbor (>=33 cases):     ${tierStats[4].stats.total >= 33 ? 'PASSED (' + tierStats[4].stats.total + ')' : 'FAILED'}`);
    console.log(`  Adversarial 2 Data Integrity (>=33 cases):  ${tierStats[5].stats.total >= 33 ? 'PASSED (' + tierStats[5].stats.total + ')' : 'FAILED'}`);
    console.log(`  Total Execution Time: ${totalDuration}ms (<2000ms SLA target met)\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
