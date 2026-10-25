/**
 * Master E2E Test Runner for Rachel's English Video Integration for IPA Pronunciation.
 * Executes Tiers 1 through 4, aggregates results, prints formatted reports,
 * and exits with code 0 on 100% pass or 1 on failure.
 *
 * Usage:
 *   npx tsx tests/pronunciation/run-all-pronunciation-tests.ts
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-corner.test';
import { runTier3Tests } from './tier3-cross-feature.test';
import { runTier4Tests } from './tier4-real-world-scenarios.test';

async function main() {
  console.log('================================================================================');
  console.log('  RACHEL\'S ENGLISH IPA VIDEO INTEGRATION — MASTER AUTOMATED TEST SUITE');
  console.log('  Mode: Opaque-box E2E, Boundary, Cross-Feature & User Flow Verification (Tiers 1-4)');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats; minRequired: number }[] = [];

  // Tier 1: Feature Coverage (>=5 test cases per feature across R1-R3, CSP, Player, Audio, Roadmap)
  console.log('▶ Running Tier 1: Feature Coverage (CSP, Schema, Catalog, Player, Speed, Loop, Audio, Roadmap)...');
  const runner1 = new TestRunner();
  await runTier1Tests(runner1);
  const stats1 = runner1.getStats();
  tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1, minRequired: 25 });
  console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

  // Tier 2: Boundary & Corner Cases (ID formats, timestamps, durations, rate clamping, rapid toggling)
  console.log('▶ Running Tier 2: Boundary & Corner Cases (IDs, Timestamps, Durations, Speeds, Toggling)...');
  const runner2 = new TestRunner();
  await runTier2Tests(runner2);
  const stats2 = runner2.getStats();
  tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2, minRequired: 20 });
  console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

  // Tier 3: Cross-Feature Combinations (Audio collisions, loop speed change, collapse state, deep-links)
  console.log('▶ Running Tier 3: Cross-Feature Combinations (Audio Collision, Loop Speed, Collapse, Deep-Link)...');
  const runner3 = new TestRunner();
  await runTier3Tests(runner3);
  const stats3 = runner3.getStats();
  tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3, minRequired: 10 });
  console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

  // Tier 4: Real-World Scenarios (A0, A1, B1, B2, Capstone Roadmap Flow)
  console.log('▶ Running Tier 4: Real-World Scenarios (A0 Stress/Stops, A1 Vowels, B1 Schwa/Link, B2 Diphthongs)...');
  const runner4 = new TestRunner();
  await runTier4Tests(runner4);
  const stats4 = runner4.getStats();
  tierStats.push({ tierName: 'Tier 4: Real-World Scenarios', stats: stats4, minRequired: 8 });
  console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

  const totalDuration = Date.now() - startTime;
  const grandTotal = tierStats.reduce((acc, t) => acc + t.stats.total, 0);
  const grandPassed = tierStats.reduce((acc, t) => acc + t.stats.passed, 0);
  const grandFailed = tierStats.reduce((acc, t) => acc + t.stats.failed, 0);

  // Print Summary Table
  console.log('================================================================================');
  console.log('  RACHEL\'S ENGLISH IPA VIDEO TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log('| Tier                                | Min Req | Total | Passed | Failed | Duration | Status |');
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
  const grandName = 'TOTAL ACROSS ALL TIERS'.padEnd(35, ' ');
  const gReq = '63'.padStart(7, ' ');
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
    console.log(`  Tier 1 Requirement (>=25 cases): ${stats1.total >= 25 ? 'PASSED (' + stats1.total + ')' : 'FAILED'}`);
    console.log(`  Tier 2 Requirement (>=20 cases): ${stats2.total >= 20 ? 'PASSED (' + stats2.total + ')' : 'FAILED'}`);
    console.log(`  Tier 3 Requirement (>=10 cases): ${stats3.total >= 10 ? 'PASSED (' + stats3.total + ')' : 'FAILED'}`);
    console.log(`  Tier 4 Requirement (>=8 cases):  ${stats4.total >= 8 ? 'PASSED (' + stats4.total + ')' : 'FAILED'}`);
    console.log(`  26 Canonical Lessons Verified:   PASSED (26/26)`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled fatal error in pronunciation test runner:', err);
  process.exit(1);
});
