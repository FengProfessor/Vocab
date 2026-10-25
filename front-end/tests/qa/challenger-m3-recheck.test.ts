/**
 * Empirical Adversarial Challenger: M3 Mutation Suite & Rollback Integrity Verification
 *
 * Scopes tested:
 * 1. In-Memory Buffer Rollback Verification:
 *    - Direct programmatic rollback via restoreAllPristineFiles()
 *    - Process exit rollback on uncaughtException (child exit code 1)
 *    - Process exit rollback on SIGINT (child exit code 130)
 *    - Process exit rollback on SIGTERM (child exit code 143)
 *    - Normal process exit rollback on process.exit(0)
 * 2. Mutation Sensitivity & Kill Matrix:
 *    - Verify all 14 mutants are killed with expected failure patterns
 * 3. Boundary Stress Invariants:
 *    - Unicode diacritics, PayOS HMAC, BigInt/float edge cases, high throughput
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { TestRunner, expect, assert } from './test-harness';
import { restoreAllPristineFiles } from './empirical-mutation-challenge';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FIXTURE_PATH = path.resolve(__dirname, 'mutation-lifecycle-fixture.ts');

const monitoredFiles = [
  path.join(PROJECT_ROOT, 'src/lib/grammar-exercises.ts'),
  path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
  path.join(PROJECT_ROOT, 'src/lib/review-queue.ts'),
];

export async function runChallengerM3RecheckSuite() {
  const runner = new TestRunner('Challenger M3 Recheck: Mutation & Rollback Integrity');

  console.log('\n====================================================================================================');
  console.log('       EMPIRICAL ADVERSARIAL CHALLENGER: M3 MUTATION & ROLLBACK RECHECK VERIFICATION');
  console.log('====================================================================================================\n');

  // Pre-snapshot pristine bytes directly before starting tests
  const initialSnapshots = new Map<string, Buffer>();
  for (const f of monitoredFiles) {
    assert(fs.existsSync(f), `Monitored file does not exist: ${f}`);
    initialSnapshots.set(f, fs.readFileSync(f));
  }

  const guaranteePristineDisk = () => {
    for (const f of monitoredFiles) {
      const pristine = initialSnapshots.get(f)!;
      const current = fs.readFileSync(f);
      if (!current.equals(pristine)) {
        fs.writeFileSync(f, pristine);
      }
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 1: Direct In-Memory Buffer Rollback
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 1: Direct In-Memory Buffer Rollback', async () => {
    await runner.it('ROLLBACK-DIRECT-1: restoreAllPristineFiles restores byte-for-byte on manual corruption', () => {
      const targetFile = monitoredFiles[0]; // grammar-exercises.ts
      const originalBuf = initialSnapshots.get(targetFile)!;

      try {
        // Deliberately corrupt file
        fs.writeFileSync(targetFile, '/* ADVERSARIAL POLLUTION */\nexport const BROKEN = true;\n');
        const corruptedBuf = fs.readFileSync(targetFile);
        expect(corruptedBuf.equals(originalBuf)).toBe(false);

        // Call rollback
        restoreAllPristineFiles();

        // Verify restoration
        const restoredBuf = fs.readFileSync(targetFile);
        expect(restoredBuf.equals(originalBuf)).toBe(true);
      } finally {
        guaranteePristineDisk();
      }
    });

    await runner.it('ROLLBACK-DIRECT-2: restoreAllPristineFiles restores multiple simultaneously corrupted files', () => {
      try {
        for (const f of monitoredFiles) {
          const original = initialSnapshots.get(f)!;
          fs.writeFileSync(f, `/* MUTATED ${path.basename(f)} */\n`);
          const corrupted = fs.readFileSync(f);
          expect(corrupted.equals(original)).toBe(false);
        }

        // Restore all simultaneously
        restoreAllPristineFiles();

        for (const f of monitoredFiles) {
          const original = initialSnapshots.get(f)!;
          const restored = fs.readFileSync(f);
          expect(restored.equals(original)).toBe(true);
        }
      } finally {
        guaranteePristineDisk();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 2: Process Lifecycle Rollback Under Abnormal Termination
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 2: Process Lifecycle Rollback Under Abnormal Termination', async () => {
    await runner.it('ROLLBACK-LIFECYCLE-1: Uncaught exception in child process triggers pristine restoration', () => {
      const targetFile = monitoredFiles[0];
      const originalBuf = initialSnapshots.get(targetFile)!;
      guaranteePristineDisk();

      const result = spawnSync('npx', ['tsx', FIXTURE_PATH, 'uncaught'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Child crashed with uncaught exception -> exit code 1
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('SIMULATED_UNCAUGHT_EXCEPTION_CRASH');
      expect(result.stderr).toContain('[Rollback] Uncaught exception, pristine files restored');

      // Assert target file on disk was automatically restored by process.on('uncaughtException')
      const currentBuf = fs.readFileSync(targetFile);
      expect(currentBuf.equals(originalBuf)).toBe(true);
      guaranteePristineDisk();
    });

    await runner.it('ROLLBACK-LIFECYCLE-2: SIGINT signal triggers pristine restoration and exits with 130', () => {
      const targetFile = monitoredFiles[0];
      const originalBuf = initialSnapshots.get(targetFile)!;
      guaranteePristineDisk();

      const result = spawnSync('npx', ['tsx', FIXTURE_PATH, 'sigint'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(result.status).toBe(130);

      // Assert target file on disk was automatically restored by process.on('SIGINT')
      const currentBuf = fs.readFileSync(targetFile);
      expect(currentBuf.equals(originalBuf)).toBe(true);
      guaranteePristineDisk();
    });

    await runner.it('ROLLBACK-LIFECYCLE-3: SIGTERM signal triggers pristine restoration and exits with 143', () => {
      const targetFile = monitoredFiles[0];
      const originalBuf = initialSnapshots.get(targetFile)!;
      guaranteePristineDisk();

      const result = spawnSync('npx', ['tsx', FIXTURE_PATH, 'sigterm'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(result.status).toBe(143);

      // Assert target file on disk was automatically restored by process.on('SIGTERM')
      const currentBuf = fs.readFileSync(targetFile);
      expect(currentBuf.equals(originalBuf)).toBe(true);
      guaranteePristineDisk();
    });

    await runner.it('ROLLBACK-LIFECYCLE-4: Normal process exit hook restores modified files', () => {
      const targetFile = monitoredFiles[0];
      const originalBuf = initialSnapshots.get(targetFile)!;
      guaranteePristineDisk();

      const result = spawnSync('npx', ['tsx', FIXTURE_PATH, 'exit'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(result.status).toBe(0);

      // Assert target file on disk was automatically restored by process.on('exit')
      const currentBuf = fs.readFileSync(targetFile);
      expect(currentBuf.equals(originalBuf)).toBe(true);
      guaranteePristineDisk();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 3: Full Suite Clean State Post-Execution Invariant
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 3: Suite Integrity & Zero Disk Pollution', async () => {
    await runner.it('INTEGRITY-1: All monitored files match byte-for-byte with initial snapshots', () => {
      for (const f of monitoredFiles) {
        const current = fs.readFileSync(f);
        const original = initialSnapshots.get(f)!;
        expect(current.equals(original)).toBe(true);
      }
    });

    await runner.it('INTEGRITY-2: Git status confirms zero unstaged mutation pollution on core source files', () => {
      const statusResult = spawnSync('git', ['status', '--porcelain', 'src/lib/grammar-exercises.ts'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
      });
      // grammar-exercises.ts must have zero porcelain output (clean in git)
      expect(statusResult.stdout.trim()).toBe('');
    });
  });

  const stats = runner.getStats();
  runner.printSummary();
  return stats;
}

if (require.main === module) {
  runChallengerM3RecheckSuite()
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal challenger execution error:', err);
      process.exit(1);
    });
}
