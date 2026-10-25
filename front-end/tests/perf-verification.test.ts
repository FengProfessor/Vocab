/**
 * Performance & Regression Verification Master Suite
 *
 * Runs the complete 4-tier verification suite for LingoPro Web App Performance & Loading Speed Optimization.
 *
 * Requirements:
 *  - R1: Student Dashboard (<300ms shell paint, no full-screen <Loader2> spinner, skeleton cards, progressive hydration)
 *  - R2: Zero duplicate network queries between page.tsx and StudentShell.tsx (single source of truth)
 *  - R3: Client bundle offloading (no raw multi-megabyte JSONs bundled into /practice/listening, /journey, /toeic)
 *  - R4: Zero functional or database regressions across all existing study modes, SRS review submission, and 100% data integrity
 *
 * Usage:
 *  npx tsx tests/perf-verification.test.ts
 */

import { runAllPerfTests } from './perf/run-all-perf-tests';

async function main() {
  const result = await runAllPerfTests();
  if (result.allPassed) {
    console.log('🎉 ALL PERFORMANCE & REGRESSION TESTS PASSED! Quality gate verified.');
    process.exit(0);
  } else {
    for (const s of result.stats) {
      for (const r of s.stats.results) {
        if (!r.passed) {
          console.error(`❌ FAILED: [${s.tierName}] ${r.name}`);
          console.error(`   Error: ${r.error?.message}`);
        }
      }
    }
    console.error(`\n❌ VERIFICATION SUITE FAILED with ${result.totalFailed} failure(s).`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
