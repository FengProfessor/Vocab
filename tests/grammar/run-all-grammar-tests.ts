/**
 * Master E2E Test Runner for English Grammar Learning Experience.
 * Executes Tiers 1 through 4, aggregates results, prints formatted reports,
 * catalogs escalated implementation defects, and provides exit status.
 *
 * Usage:
 *   npx tsx tests/grammar/run-all-grammar-tests.ts
 *   npx tsx tests/grammar/run-all-grammar-tests.ts --allow-db-escalation
 */

import { TestRunner, SuiteStats } from './test-harness';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-corner.test';
import { runTier3Tests } from './tier3-cross-feature.test';
import { runTier4Tests, curriculumAuditReport } from './tier4-curriculum-scenarios.test';

async function main() {
  const allowDbEscalation =
    process.argv.includes('--allow-db-escalation') ||
    process.env.ALLOW_DB_ESCALATION === 'true';

  console.log('================================================================================');
  console.log('  ENGLISH GRAMMAR LEARNING EXPERIENCE — MASTER AUTOMATED TEST SUITE');
  console.log('  Mode: Opaque-box E2E, Boundary, Cross-Feature & Curriculum Verification');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const tierStats: { tierName: string; stats: SuiteStats; minRequired: number }[] = [];

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 1: Feature Coverage (>=5 test cases per feature)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Running Tier 1: Feature Coverage (Parser, Formula, Exercise Engine, Layout)...');
  const runner1 = new TestRunner();
  await runTier1Tests(runner1);
  const stats1 = await runner1.run();
  tierStats.push({ tierName: 'Tier 1: Feature Coverage', stats: stats1, minRequired: 20 });
  console.log(`✓ Tier 1 Finished: ${stats1.passed}/${stats1.total} passed (${stats1.durationMs}ms)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 2: Boundary & Corner Cases (>=5 test cases per feature)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Running Tier 2: Boundary & Corner Cases (Idempotence, Tables, Formulas, Stems)...');
  const runner2 = new TestRunner();
  await runTier2Tests(runner2);
  const stats2 = await runner2.run();
  tierStats.push({ tierName: 'Tier 2: Boundary & Corner Cases', stats: stats2, minRequired: 20 });
  console.log(`✓ Tier 2 Finished: ${stats2.passed}/${stats2.total} passed (${stats2.durationMs}ms)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 3: Cross-Feature Combinations
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Running Tier 3: Cross-Feature Combinations (Tables+Formulas, Mixed Quizzes, Split-View)...');
  const runner3 = new TestRunner();
  await runTier3Tests(runner3);
  const stats3 = await runner3.run();
  tierStats.push({ tierName: 'Tier 3: Cross-Feature Combinations', stats: stats3, minRequired: 10 });
  console.log(`✓ Tier 3 Finished: ${stats3.passed}/${stats3.total} passed (${stats3.durationMs}ms)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 4: Real-World Curriculum Scenarios (25 Supabase Lessons)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Running Tier 4: Real-World Curriculum Scenarios (25 Supabase Lessons Audit)...');
  const runner4 = new TestRunner();
  await runTier4Tests(runner4);
  const stats4 = await runner4.run();
  tierStats.push({ tierName: 'Tier 4: Curriculum Real-World', stats: stats4, minRequired: 7 });
  console.log(`✓ Tier 4 Finished: ${stats4.passed}/${stats4.total} passed (${stats4.durationMs}ms)\n`);

  const totalDuration = Date.now() - startTime;
  const grandTotal = tierStats.reduce((acc, t) => acc + t.stats.total, 0);
  const grandPassed = tierStats.reduce((acc, t) => acc + t.stats.passed, 0);
  const grandFailed = tierStats.reduce((acc, t) => acc + t.stats.failed, 0);
  const grandMinRequired = tierStats.reduce((acc, t) => acc + t.minRequired, 0);

  // ──────────────────────────────────────────────────────────────────────────
  // Print Execution Summary Table
  // ──────────────────────────────────────────────────────────────────────────
  console.log('================================================================================');
  console.log('  GRAMMAR TEST SUITE EXECUTION SUMMARY');
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
  const gReq = String(grandMinRequired).padStart(7, ' ');
  const gTotal = String(grandTotal).padStart(5, ' ');
  const gPassed = String(grandPassed).padStart(6, ' ');
  const gFailed = String(grandFailed).padStart(6, ' ');
  const gDuration = `${totalDuration}ms`.padStart(8, ' ');
  const gStatus = grandFailed === 0 ? 'PASS' : 'FAIL';
  const padGStatus = gStatus.padStart(6, ' ');
  console.log(`| ${grandName} | ${gReq} | ${gTotal} | ${gPassed} | ${gFailed} | ${gDuration} | ${padGStatus} |`);
  console.log('================================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Defect Escalation Report (for Milestone 2 Database Remediation)
  // ──────────────────────────────────────────────────────────────────────────
  const totalDbDefects =
    curriculumAuditReport.leakedStems.length +
    curriculumAuditReport.latexDefects.length +
    curriculumAuditReport.unwinnableMcqs.length +
    curriculumAuditReport.tableDefects.length;

  if (totalDbDefects > 0) {
    console.log('⚠️  ============================================================================');
    console.log('  DISCOVERED IMPLEMENTATION DEFECTS TO ESCALATE (MILESTONE 2 SCOPE)');
    console.log('================================================================================');

    if (curriculumAuditReport.latexDefects.length > 0) {
      console.log(`\n📌 1. Raw LaTeX Symbols in Theory (${curriculumAuditReport.latexDefects.length} lessons):`);
      for (const d of curriculumAuditReport.latexDefects) {
        console.log(`   - Buổi ${d.lessonIndex} (${d.lessonTitle}): ${d.matches.join(', ')}`);
      }
    }

    if (curriculumAuditReport.leakedStems.length > 0) {
      console.log(`\n📌 2. Leaked Answer Stems (${curriculumAuditReport.leakedStems.length} exercises):`);
      for (const s of curriculumAuditReport.leakedStems) {
        console.log(`   - Buổi ${s.lessonIndex} (${s.lessonTitle}) [Q#${s.qIndex}]: ${s.stem}`);
      }
    }

    if (curriculumAuditReport.unwinnableMcqs.length > 0) {
      console.log(`\n📌 3. Unwinnable MCQs (${curriculumAuditReport.unwinnableMcqs.length} exercises):`);
      for (const m of curriculumAuditReport.unwinnableMcqs.slice(0, 15)) {
        console.log(`   - Buổi ${m.lessonIndex} [Q#${m.qIndex}]: ans="${m.answer}" | opts=[${m.options.join(', ')}]`);
      }
      if (curriculumAuditReport.unwinnableMcqs.length > 15) {
        console.log(`   ... and ${curriculumAuditReport.unwinnableMcqs.length - 15} more`);
      }
    }

    if (curriculumAuditReport.tableDefects.length > 0) {
      console.log(`\n📌 4. Markdown Table Glitches (${curriculumAuditReport.tableDefects.length} lessons):`);
      for (const t of curriculumAuditReport.tableDefects) {
        console.log(`   - Buổi ${t.lessonIndex}: ${t.reason}`);
      }
    }
    console.log('\n================================================================================\n');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Exit Code Logic
  // ──────────────────────────────────────────────────────────────────────────
  if (grandFailed === 0) {
    console.log(`✅ SUCCESS: All ${grandTotal} tests passed cleanly with 0 defects!`);
    process.exit(0);
  } else if (allowDbEscalation && stats1.failed === 0 && stats2.failed === 0 && stats3.failed === 0) {
    console.log(`ℹ️  AUDIT NOTICE: Code implementation tests (Tiers 1-3) passed 100%.`);
    console.log(`   Tier 4 recorded ${stats4.failed} pre-remediation database defect alerts for Milestone 2.`);
    console.log(`   Allow-db-escalation mode enabled: exiting code 0 for pipeline continuity.`);
    process.exit(0);
  } else {
    console.error(`❌ FAILED: ${grandFailed} tests failed out of ${grandTotal}.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled fatal error in test runner:', err);
  process.exit(1);
});
