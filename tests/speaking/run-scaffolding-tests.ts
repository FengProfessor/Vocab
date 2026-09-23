/**
 * Master Test Runner for LingoPro Speaking Scaffolding E2E Test Suite
 *
 * Runs all 4 Tiers:
 * - Tier 1: Feature Coverage (30 tests)
 * - Tier 2: Boundary & Corner Cases (30 tests)
 * - Tier 3: Cross-Feature Combinations (12 tests)
 * - Tier 4: Real-World Application Scenarios (6 tests)
 *
 * Aggregates results, outputs formatted Markdown-like summary table,
 * and exits with code 0 on 100% pass or code 1 on failure.
 *
 * Usage:
 *   npx tsx tests/speaking/run-scaffolding-tests.ts
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runTier1Tests } from './speaking-scaffolding-tier1.test';
import { runTier2Tests } from './speaking-scaffolding-tier2.test';
import { runTier3Tests } from './speaking-scaffolding-tier3.test';
import { runTier4Tests } from './speaking-scaffolding-tier4.test';

async function main() {
  console.log('================================================================================');
  console.log('  LINGOPRO SPEAKING SCAFFOLDING — MASTER E2E AUTOMATED TEST SUITE');
  console.log('  Mode: Opaque-Box, Requirement-Driven, Tiers 1-4 Verification');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats; minRequired: number }[] = [];

  // Tier 1: Feature Coverage
  console.log('▶ Running Tier 1: Feature Coverage (F1 to F5, min 25 required)...');
  const runner1 = new TestRunner();
  await runTier1Tests(runner1);
  const stats1 = runner1.getStats();
  tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1, minRequired: 25 });
  console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

  // Tier 2: Boundary & Corner Cases
  console.log('▶ Running Tier 2: Boundary & Corner Cases (Empty, Missing, Fallback, 10MB, Errors)...');
  const runner2 = new TestRunner();
  await runTier2Tests(runner2);
  const stats2 = runner2.getStats();
  tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2, minRequired: 20 });
  console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

  // Tier 3: Cross-Feature Combinations
  console.log('▶ Running Tier 3: Cross-Feature Combinations (Provider Swap, State Sync, Correlation)...');
  const runner3 = new TestRunner();
  await runTier3Tests(runner3);
  const stats3 = runner3.getStats();
  tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3, minRequired: 10 });
  console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

  // Tier 4: Real-World Scenarios
  console.log('▶ Running Tier 4: Real-World Scenarios (Stage 1-3 Drills, Mobile, Webview, Loops)...');
  const runner4 = new TestRunner();
  await runTier4Tests(runner4);
  const stats4 = runner4.getStats();
  tierStats.push({ tierName: 'Tier 4: Real-World Scenarios', stats: stats4, minRequired: 5 });
  console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

  const totalDuration = Date.now() - startTime;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const t of tierStats) {
    totalTests += t.stats.total;
    totalPassed += t.stats.passed;
    totalFailed += t.stats.failed;
  }

  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

  console.log('================================================================================');
  console.log('  LINGOPRO SPEAKING SCAFFOLDING — SUMMARY REPORT');
  console.log('================================================================================\n');

  console.log('| Tier / Suite Name                  | Total | Pass | Fail | Min Req | Status | Duration |');
  console.log('|:-----------------------------------|:-----:|:----:|:----:|:-------:|:------:|:--------:|');

  for (const t of tierStats) {
    const status = t.stats.failed === 0 && t.stats.total >= t.minRequired ? 'PASS' : 'FAIL';
    const name = t.tierName.padEnd(34, ' ');
    const total = String(t.stats.total).padStart(5, ' ');
    const pass = String(t.stats.passed).padStart(4, ' ');
    const fail = String(t.stats.failed).padStart(4, ' ');
    const minReq = String(t.minRequired).padStart(7, ' ');
    const dur = `${t.stats.durationMs}ms`.padStart(8, ' ');
    console.log(`| ${name} | ${total} | ${pass} | ${fail} | ${minReq} |  ${status}  | ${dur} |`);
  }

  console.log('|:-----------------------------------|:-----:|:----:|:----:|:-------:|:------:|:--------:|');
  console.log(`| TOTALS                             | ${String(totalTests).padStart(5, ' ')} | ${String(totalPassed).padStart(4, ' ')} | ${String(totalFailed).padStart(4, ' ')} |       - |  ${totalFailed === 0 ? 'PASS' : 'FAIL'}  | ${`${totalDuration}ms`.padStart(8, ' ')} |`);
  console.log(`\nOverall Pass Rate: ${passRate}% (${totalPassed}/${totalTests})`);
  console.log(`Total Execution Time: ${totalDuration}ms`);

  if (totalFailed > 0) {
    console.error('\n❌ TEST RUN FAILED: Some tests did not pass.');
    process.exit(1);
  }

  console.log('\n✅ ALL TESTS PASSED: Speaking Scaffolding E2E test suite verified 100% successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
