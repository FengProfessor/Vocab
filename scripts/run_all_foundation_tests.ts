import { execSync } from 'child_process';

const suites = [
  'gap-model.test.ts',
  'api-routes.test.ts',
  'p3-visual-pipeline.test.ts',
  'p4-pilot-simulation.test.ts',
  'p4r-gs-lesson1-simulation.test.ts',
];

console.log('=== RUNNING ALL FOUNDATION CURRICULUM TEST SUITES ===\n');

let totalPassed = 0;

for (const suite of suites) {
  console.log(`>>> Executing ${suite}...`);
  try {
    const out = execSync(`npx tsx tests/foundation-curriculum/${suite}`, {
      encoding: 'utf-8',
    });
    console.log(out.trim());
    console.log(`[PASS] ${suite}\n`);
    totalPassed++;
  } catch (err: any) {
    console.error(`[FAIL] ${suite}:`, err.stdout || err.message);
    process.exit(1);
  }
}

console.log(`=== ALL ${totalPassed}/${suites.length} TEST SUITES PASSED SUCCESSFULLY (100%) ===`);
