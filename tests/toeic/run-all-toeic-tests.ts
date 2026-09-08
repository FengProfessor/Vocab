/**
 * Master E2E Test Runner for TOEIC Real Exam Simulation & Minimalist Subsystem.
 * Executes Tiers 1 through 5 plus the new E2E suites:
 * - Catalog & Dataset Integrity (>15,000 Questions)
 * - Estudyme Normalizer & Media Loader
 * - Technical Minimalist UI & Anti-AI Template
 *
 * Aggregates results, prints formatted reports, and exits with code 0 on 100% pass or 1 on failure.
 *
 * Usage:
 *   npx tsx tests/toeic/run-all-toeic-tests.ts
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runTier1Tests } from './tier1-features.test';
import { runTier2Tests } from './tier2-boundary.test';
import { runTier3Tests } from './tier3-combinations.test';
import { runTier4Tests } from './tier4-scenarios.test';
import { runTier5Tests } from './tier5-adversarial.test';
import { runCatalogIntegrityTests } from './catalog-integrity.test';
import { runEstudymeLoaderTests } from './estudyme-loader.test';
import { runUiMinimalistTests } from './ui-minimalist.test';

async function main() {
  console.log('================================================================================');
  console.log('  TOEIC REAL EXAM SIMULATION & MINIMALIST PLATFORM — MASTER TEST SUITE');
  console.log('  Mode: E2E, Boundary, Combinations, Scenarios, Datasets, UI & Adversarial');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats; minRequired: number }[] = [];

  // Tier 1: Feature Coverage (>=5 test cases per feature for F1-F11)
  console.log('▶ Running Tier 1: Feature Coverage (F1 to F11, min 45 required)...');
  const runner1 = new TestRunner();
  await runTier1Tests(runner1);
  const stats1 = runner1.getStats();
  tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1, minRequired: 45 });
  console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

  // Tier 2: Boundary & Corner Cases (Zero score, 990 score, timer boundaries, palette jumps)
  console.log('▶ Running Tier 2: Boundary & Corner Cases (Min/Max, Jumps, Equating, Timer Extremes)...');
  const runner2 = new TestRunner();
  await runTier2Tests(runner2);
  const stats2 = runner2.getStats();
  tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2, minRequired: 20 });
  console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

  // Tier 3: Cross-Feature Combinations (Pairwise & stateful feature interactions)
  console.log('▶ Running Tier 3: Cross-Feature Combinations (Flags, Modals, Audio Groups, Autosave)...');
  const runner3 = new TestRunner();
  await runTier3Tests(runner3);
  const stats3 = runner3.getStats();
  tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3, minRequired: 10 });
  console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

  // Tier 4: Real-World Scenarios (Authentic 200Q test, Part practice, session crash recovery)
  console.log('▶ Running Tier 4: Real-World Scenarios (Full 200Q, Mini practice, Audio run, Recovery)...');
  const runner4 = new TestRunner();
  await runTier4Tests(runner4);
  const stats4 = runner4.getStats();
  tierStats.push({ tierName: 'Tier 4: Real-World Scenarios', stats: stats4, minRequired: 5 });
  console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

  // Tier 5: White-Box Adversarial Coverage Hardening
  console.log('▶ Running Tier 5: White-Box Adversarial Coverage Hardening (min 30 required)...');
  const runner5 = new TestRunner();
  await runTier5Tests(runner5);
  const stats5 = runner5.getStats();
  tierStats.push({ tierName: 'Tier 5: Adversarial Hardening', stats: stats5, minRequired: 30 });
  console.log(`✓ Tier 5 Finished: ${stats5.passed}/${stats5.total} passed (${stats5.durationMs}ms)\n`);

  // Suite: Catalog & Dataset Integrity (>15,000 Questions, 28+ full tests, 231 sets)
  console.log('▶ Running Suite: Catalog & Dataset Integrity (>15,000 Qs, 231 sets, quotas)...');
  const runnerCat = new TestRunner();
  await runCatalogIntegrityTests(runnerCat);
  const statsCat = runnerCat.getStats();
  tierStats.push({ tierName: 'Catalog & Dataset Integrity', stats: statsCat, minRequired: 8 });
  console.log(`✓ Catalog Integrity Finished: ${statsCat.passed}/${statsCat.total} passed (${statsCat.durationMs}ms)\n`);

  // Suite: Estudyme Loader & Card Normalizer
  console.log('▶ Running Suite: Estudyme Loader & Normalizer (unpacking, Part 2 3-opts, CDN URLs)...');
  const runnerEst = new TestRunner();
  await runEstudymeLoaderTests(runnerEst);
  const statsEst = runnerEst.getStats();
  tierStats.push({ tierName: 'Estudyme Loader & Normalizer', stats: statsEst, minRequired: 8 });
  console.log(`✓ Estudyme Loader Finished: ${statsEst.passed}/${statsEst.total} passed (${statsEst.durationMs}ms)\n`);

  // Suite: Technical Minimalist UI & Anti-AI Template
  console.log('▶ Running Suite: Technical Minimalist UI (anti-AI template, 2-tab, monospace)...');
  const runnerUi = new TestRunner();
  await runUiMinimalistTests(runnerUi);
  const statsUi = runnerUi.getStats();
  tierStats.push({ tierName: 'Technical Minimalist UI', stats: statsUi, minRequired: 8 });
  console.log(`✓ UI Minimalist Finished: ${statsUi.passed}/${statsUi.total} passed (${statsUi.durationMs}ms)\n`);

  const totalDuration = Date.now() - startTime;
  const grandTotal = tierStats.reduce((acc, t) => acc + t.stats.total, 0);
  const grandPassed = tierStats.reduce((acc, t) => acc + t.stats.passed, 0);
  const grandFailed = tierStats.reduce((acc, t) => acc + t.stats.failed, 0);
  const grandMinRequired = tierStats.reduce((acc, t) => acc + t.minRequired, 0);

  // Print Summary Table
  console.log('================================================================================');
  console.log('  TOEIC TEST EXECUTION SUMMARY');
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
  console.error('Unhandled fatal error in TOEIC test runner:', err);
  process.exit(1);
});
