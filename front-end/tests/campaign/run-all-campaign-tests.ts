/**
 * Master E2E Test Runner for 05/09 Back-to-School (Khai Giảng) Campaign.
 * Executes Tiers 1 through 4, aggregates results, prints formatted reports,
 * and exits with code 0 on 100% pass or 1 on failure.
 *
 * Usage:
 *   npx tsx tests/campaign/run-all-campaign-tests.ts
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-corner.test';
import { runTier3Tests } from './tier3-cross-feature.test';
import { runTier4Tests } from './tier4-real-world-scenarios.test';

async function main() {
  console.log('================================================================================');
  console.log('  05/09 BACK-TO-SCHOOL (KHAI GIẢNG) CAMPAIGN — AUTOMATED TEST SUITE');
  console.log('  Mode: Opaque-box E2E & Boundary Verification (Tiers 1 - 4)');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats }[] = [];

  // Tier 1: Feature Coverage
  console.log('▶ Running Tier 1: Feature Coverage (>=5 test cases per core feature)...');
  const runner1 = new TestRunner();
  await runTier1Tests(runner1);
  const stats1 = runner1.getStats();
  tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1 });
  console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

  // Tier 2: Boundary & Corner Cases
  console.log('▶ Running Tier 2: Boundary & Corner Cases (>=5 cases per category)...');
  const runner2 = new TestRunner();
  await runTier2Tests(runner2);
  const stats2 = runner2.getStats();
  tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2 });
  console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

  // Tier 3: Cross-Feature Combinations
  console.log('▶ Running Tier 3: Cross-Feature Combinations (>=10 pairwise interactions)...');
  const runner3 = new TestRunner();
  await runTier3Tests(runner3);
  const stats3 = runner3.getStats();
  tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3 });
  console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

  // Tier 4: Real-World Application Scenarios
  console.log('▶ Running Tier 4: Real-World Application Scenarios (5 full-flow user journeys)...');
  const runner4 = new TestRunner();
  await runTier4Tests(runner4);
  const stats4 = runner4.getStats();
  tierStats.push({ tierName: 'Tier 4: Real-World Scenarios', stats: stats4 });
  console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

  const totalDuration = Date.now() - startTime;
  const grandTotal = tierStats.reduce((acc, t) => acc + t.stats.total, 0);
  const grandPassed = tierStats.reduce((acc, t) => acc + t.stats.passed, 0);
  const grandFailed = tierStats.reduce((acc, t) => acc + t.stats.failed, 0);

  // Print Summary Table
  console.log('================================================================================');
  console.log('  TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log('| Tier                                | Total | Passed | Failed | Duration |');
  console.log('|-------------------------------------|:-----:|:------:|:------:|:--------:|');
  for (const { tierName, stats } of tierStats) {
    const padName = tierName.padEnd(35, ' ');
    const padTotal = String(stats.total).padStart(5, ' ');
    const padPassed = String(stats.passed).padStart(6, ' ');
    const padFailed = String(stats.failed).padStart(6, ' ');
    const padDuration = `${stats.durationMs}ms`.padStart(8, ' ');
    console.log(`| ${padName} | ${padTotal} | ${padPassed} | ${padFailed} | ${padDuration} |`);
  }
  console.log('|-------------------------------------|:-----:|:------:|:------:|:--------:|');
  const grandName = 'TOTAL ACROSS ALL TIERS'.padEnd(35, ' ');
  const gTotal = String(grandTotal).padStart(5, ' ');
  const gPassed = String(grandPassed).padStart(6, ' ');
  const gFailed = String(grandFailed).padStart(6, ' ');
  const gDuration = `${totalDuration}ms`.padStart(8, ' ');
  console.log(`| ${grandName} | ${gTotal} | ${gPassed} | ${gFailed} | ${gDuration} |`);
  console.log('================================================================================\n');

  if (grandFailed > 0) {
    console.error(`❌ FAILED: ${grandFailed} tests failed out of ${grandTotal}.`);
    process.exit(1);
  } else {
    console.log(`✅ SUCCESS: All ${grandTotal} tests passed cleanly with 0 defects!`);
    console.log('  Tier 1 Requirement (>=35 cases): ' + (stats1.total >= 35 ? 'PASSED' : 'FAILED'));
    console.log('  Tier 2 Requirement (>=35 cases): ' + (stats2.total >= 35 ? 'PASSED' : 'FAILED'));
    console.log('  Tier 3 Requirement (>=10 cases): ' + (stats3.total >= 10 ? 'PASSED' : 'FAILED'));
    console.log('  Tier 4 Requirement (5 scenarios): ' + (stats4.total >= 5 ? 'PASSED' : 'FAILED'));
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled fatal error in test runner:', err);
  process.exit(1);
});
