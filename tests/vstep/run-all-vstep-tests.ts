/**
 * Master Test Runner for VSTEP Standardized Exam Engine
 * Executes Tiers 1 through 4 plus the Baseline Engine Suite:
 * - Tier 1: Feature Coverage (min 25 required)
 * - Tier 2: Boundary & Corner Cases (min 20 required)
 * - Tier 3: Cross-Feature Combinations (min 10 required)
 * - Tier 4: Real-World Scenarios (min 5 required)
 * - Baseline Suite: Engine, Cyber Defense & Barem Verification (36 assertions)
 *
 * Aggregates results, outputs formatted Markdown-like summary table,
 * and exits with code 0 on 100% pass or code 1 on failure.
 *
 * Usage:
 *   npx tsx tests/vstep/run-all-vstep-tests.ts
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runTier1Tests } from './tier1-features.test';
import { runTier2Tests } from './tier2-boundary.test';
import { runTier3Tests } from './tier3-combinations.test';
import { runTier4Tests } from './tier4-scenarios.test';
import { runVstepAntiDuplicationTests } from './anti-duplication.test';

async function main() {
  console.log('================================================================================');
  console.log('  VSTEP STANDARDIZED EXAM ENGINE — MASTER AUTOMATED TEST SUITE');
  console.log('  Mode: E2E, Feature Coverage, Boundary, Combinations & Real Scenarios');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats; minRequired: number }[] = [];

  // Tier 1: Feature Coverage (>=5 per feature across 5 features, min 25 required)
  console.log('▶ Running Tier 1: Feature Coverage (F1 to F5, min 25 required)...');
  const runner1 = new TestRunner();
  await runTier1Tests(runner1);
  const stats1 = runner1.getStats();
  tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1, minRequired: 25 });
  console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

  // Tier 2: Boundary & Corner Cases (Min/Max, rounding edges, malformed tokens, honeypots)
  console.log('▶ Running Tier 2: Boundary & Corner Cases (Rounding, Extremes, Tokens, Traps)...');
  const runner2 = new TestRunner();
  await runTier2Tests(runner2);
  const stats2 = runner2.getStats();
  tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2, minRequired: 20 });
  console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

  // Tier 3: Cross-Feature Combinations (Multi-section, HMAC lifecycle, CDN audio, server grading)
  console.log('▶ Running Tier 3: Cross-Feature Combinations (Multi-section, HMAC, Watermarking, CDN)...');
  const runner3 = new TestRunner();
  await runTier3Tests(runner3);
  const stats3 = runner3.getStats();
  tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3, minRequired: 10 });
  console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

  // Tier 4: Real-World Scenarios (Candidate exam simulation, 3-round 0% duplicate, spaced repetition)
  console.log('▶ Running Tier 4: Real-World Scenarios (Full Simulation, 3-Round Practice, Reset)...');
  const runner4 = new TestRunner();
  await runTier4Tests(runner4);
  const stats4 = runner4.getStats();
  tierStats.push({ tierName: 'Tier 4: Real-World Scenarios', stats: stats4, minRequired: 5 });
  console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

  // Automated Anti-Duplication Test Suite (R4: 4 tiers, min 35 required)
  console.log('▶ Running Suite: Anti-Duplication & Practice Progress (Tiers 1-4, min 35 required)...');
  const runnerAntiDup = new TestRunner();
  await runVstepAntiDuplicationTests(runnerAntiDup);
  const statsAntiDup = runnerAntiDup.getStats();
  tierStats.push({ tierName: 'Anti-Duplication & Practice Progress', stats: statsAntiDup, minRequired: 35 });
  console.log(`✓ Anti-Duplication Finished: ${statsAntiDup.passed}/${statsAntiDup.total} passed (${statsAntiDup.durationMs}ms)\n`);

  const totalDuration = Date.now() - startTime;
  const grandTotal = tierStats.reduce((acc, t) => acc + t.stats.total, 0);
  const grandPassed = tierStats.reduce((acc, t) => acc + t.stats.passed, 0);
  const grandFailed = tierStats.reduce((acc, t) => acc + t.stats.failed, 0);
  const grandMinRequired = tierStats.reduce((acc, t) => acc + t.minRequired, 0);

  // Print Summary Table
  console.log('================================================================================');
  console.log('  VSTEP TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log('| Suite / Tier                        | Min Req | Total | Passed | Failed | Duration | Status |');
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
  const gReq = String(grandMinRequired).padStart(7, ' ');
  const gTotal = String(grandTotal).padStart(5, ' ');
  const gPassed = String(grandPassed).padStart(6, ' ');
  const gFailed = String(grandFailed).padStart(6, ' ');
  const gDuration = `${totalDuration}ms`.padStart(8, ' ');
  const gStatus = grandFailed === 0 && grandTotal >= grandMinRequired ? 'PASS' : 'FAIL';
  const padGStatus = gStatus.padStart(6, ' ');
  console.log(`| ${grandName} | ${gReq} | ${gTotal} | ${gPassed} | ${gFailed} | ${gDuration} | ${padGStatus} |`);
  console.log('================================================================================\n');

  if (grandFailed > 0) {
    console.error(`❌ FAILED: ${grandFailed} tests failed out of ${grandTotal}.`);
    process.exit(1);
  } else {
    console.log(`✅ SUCCESS: All ${grandTotal} tests passed cleanly with 0 defects!`);
    for (const { tierName, stats, minRequired } of tierStats) {
      const ok = stats.total >= minRequired && stats.failed === 0;
      console.log(`  - ${tierName} (>=${minRequired} req): ${ok ? 'PASSED (' + stats.total + ')' : 'FAILED'}`);
    }
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error in VSTEP master test runner:', err);
  process.exit(1);
});
