/**
 * Master E2E Test Runner for TOEIC Real Exam Simulation & Minimalist Subsystem.
 * Executes Tiers 1 through 5 plus the new E2E suites:
 * - Catalog & Dataset Integrity (>15,000 Questions)
 * - Estudyme Normalizer & Media Loader
 * - Technical Minimalist UI & Anti-AI Template
 * - TOEIC Theory Curriculum & Checkpoint Verification (Suite 18)
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
import { runUserFeedbackV4Tests } from './user-feedback-v4.test';
import { runCopyrightWhitelabelTests } from './copyright-whitelabel.test';
import { runAntiScrapingTests } from './test-anti-scraping-poison';
import { runAntiDuplicationTests } from './anti-duplication.test';
import { runMobileUxEnhancementTests } from './mobile-ux-enhancements.test';
import { runExplainRegressionTests } from './explain-regression.test';
import { runInteractiveTextTests } from '../exam/interactive-text.test';
import { runFuzzyDictTests } from '../exam/fuzzy-dict.test';
import { runPart7ReadingStimulusTests } from './part7-reading-stimulus.test';
import { runTheoryCurriculumTests } from './theory-curriculum.test';

(process.env as any).NODE_ENV = 'test';
process.env.TSX_TEST = '1';

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

  // Suite: User Feedback V4 (Bank Practice, Palette UI, Part Score Report)
  console.log('▶ Running Suite: User Feedback V4 (Bank Practice, Palette UI, Part Score Report)...');
  const runnerV4 = new TestRunner();
  await runUserFeedbackV4Tests(runnerV4);
  const statsV4 = runnerV4.getStats();
  tierStats.push({ tierName: 'User Feedback V4 Enhancements', stats: statsV4, minRequired: 10 });
  console.log(`✓ User Feedback V4 Finished: ${statsV4.passed}/${statsV4.total} passed (${statsV4.durationMs}ms)\n`);

  // Suite: Copyright & White-Labeling Compliance
  console.log('▶ Running Suite: Copyright & White-Labeling Compliance (Zero Third-Party Traces)...');
  const runnerCW = new TestRunner();
  await runCopyrightWhitelabelTests(runnerCW);
  const statsCW = runnerCW.getStats();
  tierStats.push({ tierName: 'Copyright & White-Labeling', stats: statsCW, minRequired: 8 });
  console.log(`✓ Copyright & White-Labeling Finished: ${statsCW.passed}/${statsCW.total} passed (${statsCW.durationMs}ms)\n`);

  // Suite: Anti-Scraping, Honeypot & Data Poisoning Defense
  console.log('▶ Running Suite: Anti-Scraping, Honeypot & Data Poisoning Defense (Active Cyber Defense)...');
  const runnerAS = new TestRunner();
  await runAntiScrapingTests(runnerAS);
  const statsAS = runnerAS.getStats();
  tierStats.push({ tierName: 'Anti-Scraping & Data Poisoning', stats: statsAS, minRequired: 9 });
  console.log(`✓ Anti-Scraping & Data Poisoning Finished: ${statsAS.passed}/${statsAS.total} passed (${statsAS.durationMs}ms)\n`);

  // Suite: Smart Question Anti-Duplication & Practice Progress (Tiers 1-4)
  console.log('▶ Running Suite: Anti-Duplication & Practice Progress (Tiers 1-4, min 35 required)...');
  const runnerAD = new TestRunner();
  await runAntiDuplicationTests(runnerAD);
  const statsAD = runnerAD.getStats();
  tierStats.push({ tierName: 'Anti-Duplication & Practice Progress', stats: statsAD, minRequired: 35 });
  console.log(`✓ Anti-Duplication Finished: ${statsAD.passed}/${statsAD.total} passed (${statsAD.durationMs}ms)\n`);

  // Suite: Mobile UX & Dynamic Statistics Enhancements
  console.log('▶ Running Suite: Mobile UX & Dynamic Statistics Enhancements...');
  const runnerMUX = new TestRunner();
  await runMobileUxEnhancementTests(runnerMUX);
  const statsMUX = runnerMUX.getStats();
  tierStats.push({ tierName: 'Mobile UX & Dynamic Statistics', stats: statsMUX, minRequired: 10 });
  console.log(`✓ Mobile UX Enhancements Finished: ${statsMUX.passed}/${statsMUX.total} passed (${statsMUX.durationMs}ms)\n`);

  // Suite: Explain Endpoint Part Alignment & Regression Defense
  console.log('▶ Running Suite: Explain Endpoint Part Alignment & Regression Defense...');
  const runnerExp = new TestRunner();
  await runExplainRegressionTests(runnerExp);
  const statsExp = runnerExp.getStats();
  tierStats.push({ tierName: 'Explain Part Alignment & Regression', stats: statsExp, minRequired: 7 });
  console.log(`✓ Explain Part Alignment Finished: ${statsExp.passed}/${statsExp.total} passed (${statsExp.durationMs}ms)\n`);

  // Suite: RAM Fuzzy Search & Spell Correction
  console.log('▶ Running Suite: RAM Fuzzy Search & Spell Correction...');
  const runnerFZ = new TestRunner();
  await runFuzzyDictTests(runnerFZ);
  const statsFZ = runnerFZ.getStats();
  tierStats.push({ tierName: 'RAM Fuzzy Search & Spell Correction', stats: statsFZ, minRequired: 7 });
  console.log(`✓ RAM Fuzzy Search Finished: ${statsFZ.passed}/${statsFZ.total} passed (${statsFZ.durationMs}ms)\n`);

  // Suite: Exam Interactive Text & Phrase Lookup Engine
  console.log('▶ Running Suite: Exam Interactive Text & Smart Phrase Engine...');
  const runnerIT = new TestRunner();
  await runInteractiveTextTests(runnerIT);
  const statsIT = runnerIT.getStats();
  tierStats.push({ tierName: 'Exam Interactive Text & Phrases', stats: statsIT, minRequired: 35 });
  console.log(`✓ Exam Interactive Text Finished: ${statsIT.passed}/${statsIT.total} passed (${statsIT.durationMs}ms)\n`);

  // Suite: Part 7 & Part 6 Reading Stimulus (ETS Images & Passages)
  console.log('▶ Running Suite: Part 7 & Part 6 Reading Stimulus (ETS Images & Passages)...');
  const runnerP7 = new TestRunner();
  await runPart7ReadingStimulusTests(runnerP7);
  const statsP7 = runnerP7.getStats();
  tierStats.push({ tierName: 'Part 7 & 6 Reading Stimulus', stats: statsP7, minRequired: 9 });
  console.log(`✓ Part 7 & 6 Reading Stimulus Finished: ${statsP7.passed}/${statsP7.total} passed (${statsP7.durationMs}ms)\n`);

  // Suite 18: TOEIC Theory Curriculum & Checkpoint Verification
  console.log('▶ Running Suite 18: TOEIC Theory Curriculum & Checkpoint Verification (all 16 lessons, 61 quizzes, 5 tiers)...');
  const runnerTC = new TestRunner();
  await runTheoryCurriculumTests(runnerTC);
  const statsTC = runnerTC.getStats();
  tierStats.push({ tierName: 'Theory Curriculum & Checkpoints', stats: statsTC, minRequired: 25 });
  console.log(`✓ Theory Curriculum Finished: ${statsTC.passed}/${statsTC.total} passed (${statsTC.durationMs}ms)\n`);

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
