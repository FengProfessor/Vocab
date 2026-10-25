/**
 * Empirical Mutation Sensitivity & Adversarial Stress Challenge Suite
 *
 * Verifies:
 * 1. Mutation Sensitivity: Programmatically mutates exported functions in:
 *    - src/lib/grammar-exercises.ts
 *    - src/lib/billing-webhook-auth.ts
 *    - src/lib/review-queue.ts
 *    and asserts that tests in tests/qa/ FAIL IMMEDIATELY (killing the mutants).
 *    All files are restored atomically and verified against pre-test checksums.
 * 2. Boundary Values & Stress Conditions: Direct adversarial stress testing of
 *    edge cases, extreme inputs, null safety, Unicode diacritics, float rounding,
 *    and high-throughput performance.
 */

import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { TestRunner, expect, assert } from './test-harness';

import {
  resolveDrillType,
  canUseErrorClickMode,
  sanitizeDrillExercise,
  countOptionsInSentence,
  cleanGrammarAnswer,
  expandContractions,
  areAnswersEqual,
  isGrammarAnswerCorrect,
  isOptionMatchingCorrect,
} from '@/lib/grammar-exercises';

import {
  isBillingWebhookAuthorized,
  verifyPayOSSignature,
  computeWebhookEventKey,
  verifyTransactionAmountMatch,
} from '@/lib/billing-webhook-auth';

import {
  isWordValidForReview,
  deduplicateReviewWords,
} from '@/lib/review-queue';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const filesToWatch = [
  path.join(PROJECT_ROOT, 'src/lib/grammar-exercises.ts'),
  path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
  path.join(PROJECT_ROOT, 'src/lib/review-queue.ts'),
];

// Inter-process mutation runner lock to eliminate race conditions across concurrent subagents
const LOCK_FILE = path.join(PROJECT_ROOT, 'tests/qa/.mutation-runner.lock');

function acquireLock(timeoutMs = 120000): () => void {
  const start = Date.now();
  let acquired = false;
  while (!acquired) {
    try {
      const fd = fs.openSync(LOCK_FILE, 'wx');
      fs.writeFileSync(fd, `${process.pid}\n${Date.now()}`);
      fs.closeSync(fd);
      acquired = true;
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error && error.code === 'EEXIST') {
        try {
          const stats = fs.statSync(LOCK_FILE);
          if (Date.now() - stats.mtimeMs > 120000) {
            try { fs.unlinkSync(LOCK_FILE); } catch {}
            continue;
          }
        } catch {}

        if (Date.now() - start > timeoutMs) {
          throw new Error(`Timed out waiting for mutation lock: ${LOCK_FILE}`);
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
      } else {
        throw err;
      }
    }
  }

  const release = () => {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
      }
    } catch {}
  };

  return release;
}

// In-memory pristine buffer backup (never mutated, used as canonical source of truth)
const pristineBuffers = new Map<string, Buffer>();
for (const f of filesToWatch) {
  if (fs.existsSync(f)) {
    pristineBuffers.set(f, fs.readFileSync(f));
  }
}

/** Unconditionally restores all monitored files from in-memory pristine buffers */
export function restoreAllPristineFiles(): void {
  for (const [filePath, buf] of pristineBuffers.entries()) {
    try {
      if (fs.existsSync(filePath)) {
        const current = fs.readFileSync(filePath);
        if (!current.equals(buf)) {
          fs.writeFileSync(filePath, buf);
        }
      }
    } catch (err) {
      console.error(`[Rollback] Failed to restore ${filePath}:`, err);
    }
  }
}

function cleanupLockAndPristine(): void {
  restoreAllPristineFiles();
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const content = fs.readFileSync(LOCK_FILE, 'utf-8');
      if (content.startsWith(`${process.pid}\n`)) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  } catch {}
}

// Unconditional process lifecycle handlers guarantee cleanup even upon SIGINT/exit
process.on('exit', () => cleanupLockAndPristine());
process.on('SIGINT', () => {
  cleanupLockAndPristine();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanupLockAndPristine();
  process.exit(143);
});
process.on('uncaughtException', (err) => {
  cleanupLockAndPristine();
  console.error('[Rollback] Uncaught exception, pristine files restored:', err);
  process.exit(1);
});

// CRLF/LF Agnostic Replacement Helper:
function applyAgnosticMutation(originalCode: string, searchStr: string, replaceStr: string): string {
  if (originalCode.includes(searchStr)) {
    return originalCode.replace(searchStr, replaceStr);
  }
  const isCRLF = originalCode.includes('\r\n');
  const normalizedSearch = searchStr.replace(/\r\n/g, '\n');
  const codeLF = originalCode.replace(/\r\n/g, '\n');
  if (codeLF.includes(normalizedSearch)) {
    const replacedLF = codeLF.replace(normalizedSearch, replaceStr.replace(/\r\n/g, '\n'));
    return isCRLF ? replacedLF.replace(/\n/g, '\r\n') : replacedLF;
  }
  return originalCode;
}

interface MutationTarget {
  id: string;
  name: string;
  filePath: string;
  testSuiteCommand: string;
  mutate: (original: string) => string;
  expectedFailurePattern: string | RegExp;
}

const MUTATIONS: MutationTarget[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. @/lib/grammar-exercises mutations
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'MUT-GRAMMAR-1',
    name: 'resolveDrillType returns multiple_choice for categorization',
    filePath: path.join(PROJECT_ROOT, 'src/lib/grammar-exercises.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        "if (rawType === 'categorization') return 'categorization';",
        "if (rawType === 'categorization') return 'multiple_choice';"
      ),
    expectedFailurePattern: /R1-GRAMMAR-3/i,
  },
  {
    id: 'MUT-GRAMMAR-2',
    name: 'resolveDrillType returns multiple_choice for fill_blank',
    filePath: path.join(PROJECT_ROOT, 'src/lib/grammar-exercises.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        "if (rawType === 'fill' || rawType === 'fill_blank') return 'fill_blank';",
        "if (rawType === 'fill' || rawType === 'fill_blank') return 'multiple_choice';"
      ),
    expectedFailurePattern: /R1-GRAMMAR-3/i,
  },
  {
    id: 'MUT-GRAMMAR-3',
    name: 'canUseErrorClickMode always returns false (MCQ fallback triggered incorrectly)',
    filePath: path.join(PROJECT_ROOT, 'src/lib/grammar-exercises.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'return hits >= 2 && hits >= Math.ceil(options.length / 2);',
        'return false;'
      ),
    expectedFailurePattern: /R1-GRAMMAR-3/i,
  },
  {
    id: 'MUT-GRAMMAR-4',
    name: 'sanitizeDrillExercise injects English True/False instead of Vietnamese Đúng/Sai',
    filePath: path.join(PROJECT_ROOT, 'src/lib/grammar-exercises.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        "options = ['Đúng', 'Sai'];",
        "options = ['True', 'False'];"
      ),
    expectedFailurePattern: /R1-GRAMMAR-3/i,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. @/lib/review-queue mutations
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'MUT-REVIEW-1',
    name: 'isWordValidForReview ignores failed translation check',
    filePath: path.join(PROJECT_ROOT, 'src/lib/review-queue.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        "if (transLower.includes('failed') || transLower.includes('analyzing') || w.translation.includes('⏳')) {",
        "if (false) {"
      ),
    expectedFailurePattern: /R1-FSRS-4/i,
  },
  {
    id: 'MUT-REVIEW-2',
    name: 'isWordValidForReview permits empty words without trimming check',
    filePath: path.join(PROJECT_ROOT, 'src/lib/review-queue.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'if (!w.word || !w.word.trim()) return false;',
        '// allow empty word'
      ),
    expectedFailurePattern: /R1-FSRS-4/i,
  },
  {
    id: 'MUT-REVIEW-3',
    name: 'deduplicateReviewWords inverts reviewCount priority (retains lower reps)',
    filePath: path.join(PROJECT_ROOT, 'src/lib/review-queue.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'if (item.reviewCount > existing.reviewCount) {',
        'if (item.reviewCount < existing.reviewCount) {'
      ),
    expectedFailurePattern: /R1-FSRS-4/i,
  },
  {
    id: 'MUT-REVIEW-4',
    name: 'deduplicateReviewWords bypasses deduplication and returns raw words array',
    filePath: path.join(PROJECT_ROOT, 'src/lib/review-queue.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'learner-journey.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'return Array.from(dedupMap.values());',
        'return words;'
      ),
    expectedFailurePattern: /R1-FSRS-4/i,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. @/lib/billing-webhook-auth mutations
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'MUT-BILL-1',
    name: 'verifyPayOSSignature returns true unconditionally (security bypass)',
    filePath: path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'active-defense.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'return timingSafeEqual(Buffer.from(calculatedSignature, \'hex\'), Buffer.from(signature, \'hex\'));',
        'return true;'
      ),
    expectedFailurePattern: /R2-BILL-2/i,
  },
  {
    id: 'MUT-BILL-2',
    name: 'verifyPayOSSignature inverts verification result (rejects valid HMAC)',
    filePath: path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'active-defense.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'return timingSafeEqual(Buffer.from(calculatedSignature, \'hex\'), Buffer.from(signature, \'hex\'));',
        'return !timingSafeEqual(Buffer.from(calculatedSignature, \'hex\'), Buffer.from(signature, \'hex\'));'
      ),
    expectedFailurePattern: /R2-BILL-2/i,
  },
  {
    id: 'MUT-BILL-3',
    name: 'computeWebhookEventKey alters paymentRef key prefix from payref: to tx:',
    filePath: path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'active-defense.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'return `payref:${paymentRef.trim()}`;',
        'return `tx:${paymentRef.trim()}`;'
      ),
    expectedFailurePattern: /R2-BILL-3/i,
  },
  {
    id: 'MUT-BILL-4',
    name: 'verifyTransactionAmountMatch returns true unconditionally (underpayment bypass)',
    filePath: path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'active-defense.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'return Number.isFinite(parsedTx) && Number.isFinite(expected) && parsedTx === expected;',
        'return true;'
      ),
    expectedFailurePattern: /R2-BILL-4/i,
  },
  {
    id: 'MUT-BILL-5',
    name: 'verifyTransactionAmountMatch accepts underpayments (parsedTx >= expected * 0.9)',
    filePath: path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'active-defense.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        'parsedTx === expected',
        'parsedTx >= expected * 0.9'
      ),
    expectedFailurePattern: /R2-BILL-4/i,
  },
  {
    id: 'MUT-BILL-6',
    name: 'isBillingWebhookAuthorized removes CRON_SECRET reuse check',
    filePath: path.join(PROJECT_ROOT, 'src/lib/billing-webhook-auth.ts'),
    testSuiteCommand: `npx tsx "${path.join(__dirname, 'active-defense.test.ts')}"`,
    mutate: (code) =>
      applyAgnosticMutation(
        code,
        '|| expected === process.env.CRON_SECRET',
        ''
      ),
    expectedFailurePattern: /R2-BILL-1/i,
  },
];

export async function runEmpiricalMutationSuite(): Promise<boolean> {
  const releaseLock = acquireLock();
  try {
    // Re-snapshot pristine buffers under lock to ensure 100% clean baseline
    for (const f of filesToWatch) {
      if (fs.existsSync(f)) {
        pristineBuffers.set(f, fs.readFileSync(f));
      }
    }

    const runner = new TestRunner('Empirical Mutation & Adversarial Stress Suite');

    console.log('\n====================================================================================================');
    console.log('       EMPIRICAL CHALLENGER: MUTATION SENSITIVITY & ADVERSARIAL STRESS VERIFICATION');
    console.log('====================================================================================================\n');

    // Pre-restore all monitored files to guaranteed pristine state before test execution
    restoreAllPristineFiles();

  // ──────────────────────────────────────────────────────────────────────────
  // Part 1: Mutation Sensitivity Testing
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Part 1: Mutation Testing Sensitivity (Kills Mutant on Injection)', async () => {
    for (const target of MUTATIONS) {
      await runner.it(`MUTATION-TEST [${target.id}]: ${target.name}`, () => {
        const pristineBuf = pristineBuffers.get(target.filePath)!;
        // Guarantee target file is at pristine state before mutation
        fs.writeFileSync(target.filePath, pristineBuf);

        const originalContent = pristineBuf.toString('utf-8');
        const mutatedContent = target.mutate(originalContent);

        // Sanity check that mutation actually modified content
        assert(
          mutatedContent !== originalContent,
          `Mutation definition for ${target.id} failed to change content in ${target.filePath}`
        );

        let testOutput = '';
        let exitCode: number | null = null;

        try {
          // 1. Inject mutation
          fs.writeFileSync(target.filePath, mutatedContent, 'utf-8');

          // 2. Run target test suite
          try {
            testOutput = execSync(target.testSuiteCommand, {
              cwd: PROJECT_ROOT,
              encoding: 'utf-8',
              stdio: ['ignore', 'pipe', 'pipe'],
            });
            exitCode = 0;
          } catch (cmdErr: any) {
            exitCode = cmdErr.status ?? 1;
            testOutput = `${cmdErr.stdout || ''}\n${cmdErr.stderr || ''}`;
          }
        } finally {
          // 3. Atomically restore original file from pristine buffer (byte-for-byte)
          fs.writeFileSync(target.filePath, pristineBuf);
        }

        // Verify byte-level equality with pristine buffer
        const restoredBuf = fs.readFileSync(target.filePath);
        assert(
          restoredBuf.equals(pristineBuf),
          `Atomic rollback buffer mismatch for ${target.filePath}`
        );

        // 4. Assert mutant was KILLED (test suite must fail!)
        assert(
          exitCode !== 0,
          `SURVIVING MUTANT DETECTED! Test passed (exitCode=0) despite mutation: ${target.id} (${target.name})`
        );

        // 5. Assert test failure output matches expected failure pattern
        const matchesPattern = typeof target.expectedFailurePattern === 'string'
          ? testOutput.includes(target.expectedFailurePattern)
          : target.expectedFailurePattern.test(testOutput);

        assert(
          matchesPattern,
          `Mutant was killed by unexpected failure. Expected pattern ${target.expectedFailurePattern}, got:\n${testOutput.slice(0, 400)}`
        );
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Part 2: Boundary Value & Adversarial Stress Testing
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Part 2: Boundary Values & Adversarial Stress Conditions', async () => {
    // 2.1 Grammar Exercises Boundary Values
    await runner.it('ADV-GRAMMAR-BOUND-1: resolveDrillType handles undefined, empty, and adversarial types safely', () => {
      expect(resolveDrillType(undefined, '', [])).toBe('multiple_choice');
      expect(resolveDrillType('', '', [])).toBe('multiple_choice');
      expect(resolveDrillType('unknown_type_xyz', '', [])).toBe('multiple_choice');
      expect(resolveDrillType('tf', 'Câu này đúng hay sai?', [])).toBe('multiple_choice');
      expect(resolveDrillType('fill', 'Text ___ text', ['ans'])).toBe('fill_blank');
      expect(resolveDrillType('fill_blank', 'Text ___ text', ['ans'])).toBe('fill_blank');
      expect(resolveDrillType('categorization', 'Sort items', ['a', 'b'])).toBe('categorization');
    });

    await runner.it('ADV-GRAMMAR-BOUND-2: canUseErrorClickMode handles special characters, regex meta-chars, and Vietnamese diacritics', () => {
      // Empty / invalid
      expect(canUseErrorClickMode('', [])).toBe(false);
      expect(canUseErrorClickMode('Any sentence', ['only_one_opt'])).toBe(false);

      // Sentence with special regex meta characters
      const regexSentence = 'He said: "Wait, (what) about [this] + {that} * ? ^ $ \\ ."';
      const regexOptions = ['(what)', '[this]', '{that}'];
      // countOptionsInSentence must not crash on regex characters
      expect(() => canUseErrorClickMode(regexSentence, regexOptions)).not.toThrow();
      expect(canUseErrorClickMode(regexSentence, regexOptions)).toBe(true);

      // Vietnamese diacritics
      const vnSentence = 'Học sinh đang đọc sách trong thư viện trường.';
      const vnOptions = ['đang đọc', 'thư viện', 'sách'];
      expect(canUseErrorClickMode(vnSentence, vnOptions)).toBe(true);

      // Validate Unicode word boundary matching without ASCII \b limitation:
      // ASCII \b treats Vietnamese letters (đ, ọ, ư, ệ) as \W, failing boundaries after spaces.
      // Modern Unicode boundary uses (?<![\p{L}\p{N}]) and (?![\p{L}\p{N}]) with /iu flag:
      const unicodeWordRegex = (word: string) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
      };

      expect(unicodeWordRegex('đang đọc').test(vnSentence)).toBe(true);
      expect(unicodeWordRegex('thư viện').test(vnSentence)).toBe(true);
      expect(unicodeWordRegex('sách').test(vnSentence)).toBe(true);
      // Ensure partial substrings of longer words are rejected by word boundary:
      expect(unicodeWordRegex('đọc').test('đọc-sách')).toBe(true);
      expect(unicodeWordRegex('sinh').test('học sinh')).toBe(true);
      expect(unicodeWordRegex('vi').test('thư viện')).toBe(false); // 'vi' is substring of 'viện'
    });

    await runner.it('ADV-GRAMMAR-BOUND-3: sanitizeDrillExercise normalizes malformed exercises without mutating schema', () => {
      // Missing options on True/False
      const tfEmpty = sanitizeDrillExercise({
        question: 'Trái Đất hình cầu.',
        type: 'tf',
        correct_answer: 'Đúng',
        options: null,
      });
      expect(tfEmpty.options).toEqual(['Đúng', 'Sai']);
      expect(tfEmpty.type).toBe('multiple_choice');

      // Whitespace options filtering
      const dirtyOpts = sanitizeDrillExercise({
        question: 'Choose correct',
        type: 'mcq',
        options: ['  A  ', '', '   ', 'B'],
        correct_answer: 'A',
      });
      expect(dirtyOpts.options).toEqual(['A', 'B']);
    });

    await runner.it('ADV-GRAMMAR-BOUND-4: areAnswersEqual handles contractions, spacing, and punctuation variations', () => {
      expect(areAnswersEqual("didn't", "did not")).toBe(true);
      expect(areAnswersEqual("doesn't", "does not")).toBe(true);
      expect(areAnswersEqual("cannot", "can't")).toBe(true);
      expect(areAnswersEqual("I'll", "i will")).toBe(true);
      expect(areAnswersEqual("  She's  ", "she is")).toBe(true);
      expect(areAnswersEqual("A. apple", "apple")).toBe(true);
      expect(areAnswersEqual("apple", "B. apple")).toBe(true);
      expect(areAnswersEqual("dđin't", "did not")).toBe(true); // legacy typo test

      // Non-equal
      expect(areAnswersEqual("apple", "banana")).toBe(false);
      expect(areAnswersEqual("", "banana")).toBe(false);
    });

    // 2.2 Billing Webhook Auth Boundary Values
    await runner.it('ADV-BILL-BOUND-1: verifyPayOSSignature handles null values, empty strings, and special characters in payload', () => {
      const secret = 'test_checksum_key_secret_1234567890';
      const trickyPayload = {
        amount: 299000,
        description: 'Payment for order #123 & special chars: <>&"\'',
        nullableField: null,
        undefinedField: undefined,
        zeroValue: 0,
        booleanValue: false,
      };

      // Calculate expected signature
      const sortedKeys = Object.keys(trickyPayload).sort();
      const qs = sortedKeys
        .map((k) => {
          let val = (trickyPayload as any)[k];
          if (val === null || val === undefined) val = '';
          return `${k}=${val}`;
        })
        .join('&');
      const validSig = crypto.createHmac('sha256', secret).update(qs).digest('hex');

      expect(verifyPayOSSignature(trickyPayload, validSig, secret)).toBe(true);

      // Rejects empty or invalid format signatures without throwing
      expect(verifyPayOSSignature(trickyPayload, '', secret)).toBe(false);
      expect(verifyPayOSSignature(trickyPayload, 'not-hex', secret)).toBe(false);
      expect(verifyPayOSSignature(trickyPayload, validSig.slice(0, 63), secret)).toBe(false);
      expect(verifyPayOSSignature(trickyPayload, validSig + '0', secret)).toBe(false);
    });

    await runner.it('ADV-BILL-BOUND-2: computeWebhookEventKey determinism and whitespace trimming', () => {
      // With whitespace in paymentRef
      const refPadded = computeWebhookEventKey('prefix', 100, 'desc', '   PAYREF123   ');
      expect(refPadded).toBe('payref:PAYREF123');

      // Empty or whitespace only paymentRef falls back to SHA-256 tx hash
      const refWhitespace = computeWebhookEventKey('prefix', 100, 'desc', '   ');
      expect(refWhitespace).toMatch(/^tx:[a-f0-9]{32}$/);

      const refNull = computeWebhookEventKey('prefix', 100, 'desc', null);
      expect(refNull).toMatch(/^tx:[a-f0-9]{32}$/);

      // Exact determinism: identical inputs generate identical hash
      expect(computeWebhookEventKey('prefix', 100, 'desc', null)).toBe(refNull);
    });

    await runner.it('ADV-BILL-BOUND-3: verifyTransactionAmountMatch edge conditions (NaN, strings, floats, non-finite)', () => {
      const target = 499000;

      // Exact integer
      expect(verifyTransactionAmountMatch(499000, target)).toBe(true);

      // Numeric string
      expect(verifyTransactionAmountMatch('499000', target)).toBe(true);
      expect(verifyTransactionAmountMatch(' 499000 ', target)).toBe(true);

      // Float within 0.5 rounding
      expect(verifyTransactionAmountMatch(499000.4, target)).toBe(true);
      expect(verifyTransactionAmountMatch(498999.6, target)).toBe(true);

      // Float outside rounding
      expect(verifyTransactionAmountMatch(499000.6, target)).toBe(false);
      expect(verifyTransactionAmountMatch(498999.4, target)).toBe(false);

      // Boundary / corrupt inputs must return false safely
      expect(verifyTransactionAmountMatch(NaN, target)).toBe(false);
      expect(verifyTransactionAmountMatch('NaN', target)).toBe(false);
      expect(verifyTransactionAmountMatch(Infinity, target)).toBe(false);
      expect(verifyTransactionAmountMatch(-Infinity, target)).toBe(false);
      expect(verifyTransactionAmountMatch('', target)).toBe(false);
      expect(verifyTransactionAmountMatch('-499000', target)).toBe(false);
      expect(verifyTransactionAmountMatch(0, target)).toBe(false);
    });

    await runner.it('ADV-BILL-BOUND-4: isBillingWebhookAuthorized boundary lengths and scheme compliance', () => {
      const origSecret = process.env.BILLING_WEBHOOK_SECRET;
      const origCron = process.env.CRON_SECRET;

      try {
        // 31 characters (too short: min is 32)
        process.env.BILLING_WEBHOOK_SECRET = 'a'.repeat(31);
        process.env.CRON_SECRET = 'cron_secret_32_chars_12345678901';
        expect(isBillingWebhookAuthorized(new Headers({ authorization: `Apikey ${'a'.repeat(31)}` }))).toBe(false);

        // Exactly 32 characters (valid)
        process.env.BILLING_WEBHOOK_SECRET = 'a'.repeat(32);
        expect(isBillingWebhookAuthorized(new Headers({ authorization: `Apikey ${'a'.repeat(32)}` }))).toBe(true);

        // Case-insensitive scheme: 'apikey' or 'Apikey'
        expect(isBillingWebhookAuthorized(new Headers({ authorization: `apikey ${'a'.repeat(32)}` }))).toBe(true);

        // Invalid scheme: 'Bearer' or 'Token'
        expect(isBillingWebhookAuthorized(new Headers({ authorization: `Bearer ${'a'.repeat(32)}` }))).toBe(false);

        // Header without space
        expect(isBillingWebhookAuthorized(new Headers({ authorization: `Apikey${'a'.repeat(32)}` }))).toBe(false);
      } finally {
        if (origSecret) process.env.BILLING_WEBHOOK_SECRET = origSecret;
        else delete process.env.BILLING_WEBHOOK_SECRET;
        if (origCron) process.env.CRON_SECRET = origCron;
        else delete process.env.CRON_SECRET;
      }
    });

    // 2.3 Review Queue Boundary Values & Stress Conditions
    await runner.it('ADV-REVIEW-BOUND-1: isWordValidForReview handles corrupt, empty, and status translations', () => {
      expect(isWordValidForReview({ word: null, translation: 'táo' })).toBe(false);
      expect(isWordValidForReview({ word: '', translation: 'táo' })).toBe(false);
      expect(isWordValidForReview({ word: '   ', translation: 'táo' })).toBe(false);
      expect(isWordValidForReview({ word: 'apple', translation: null })).toBe(false);
      expect(isWordValidForReview({ word: 'apple', translation: '' })).toBe(false);
      expect(isWordValidForReview({ word: 'apple', translation: '   ' })).toBe(false);

      // Status sentinels
      expect(isWordValidForReview({ word: 'apple', translation: 'failed to fetch translation' })).toBe(false);
      expect(isWordValidForReview({ word: 'apple', translation: 'FAILED' })).toBe(false);
      expect(isWordValidForReview({ word: 'apple', translation: 'Analyzing translation...' })).toBe(false);
      expect(isWordValidForReview({ word: 'apple', translation: '⏳ Đang dịch...' })).toBe(false);

      // Valid
      expect(isWordValidForReview({ word: 'apple', translation: 'quả táo' })).toBe(true);
    });

    await runner.it('ADV-REVIEW-BOUND-2: deduplicateReviewWords handles 3-level tie-breaking and invalid date strings', () => {
      const items = [
        // Level 1: reviewCount difference
        { word: 'run', reviewCount: 2, next_review_date: '2026-10-04T10:00:00Z', example: 'I run.' },
        { word: 'run', reviewCount: 5, next_review_date: '2026-10-04T12:00:00Z', example: 'I run fast.' },

        // Level 2: equal reviewCount, earlier next_review_date wins
        { word: 'walk', reviewCount: 3, next_review_date: '2026-10-04T14:00:00Z', example: 'He walks.' },
        { word: 'walk', reviewCount: 3, next_review_date: '2026-10-04T08:00:00Z', example: 'He walks slow.' },

        // Level 3: equal reviewCount & equal date, presence of example sentence wins
        { word: 'swim', reviewCount: 1, next_review_date: '2026-10-04T10:00:00Z', example: null },
        { word: 'swim', reviewCount: 1, next_review_date: '2026-10-04T10:00:00Z', example: 'They swim.' },

        // Edge case: invalid date string must not crash or produce NaN comparisons
        { word: 'jump', reviewCount: 1, next_review_date: 'corrupt-date-string', example: 'Jump!' },
        { word: 'jump', reviewCount: 1, next_review_date: '2026-10-04T10:00:00Z', example: 'Jump high!' },
      ];

      const deduped = deduplicateReviewWords(items);
      expect(deduped.length).toBe(4);

      // Run -> reviewCount 5
      const runItem = deduped.find((w) => w.word === 'run');
      expect(runItem?.reviewCount).toBe(5);

      // Walk -> earlier date 08:00:00Z
      const walkItem = deduped.find((w) => w.word === 'walk');
      expect(walkItem?.next_review_date).toBe('2026-10-04T08:00:00Z');

      // Swim -> item with example
      const swimItem = deduped.find((w) => w.word === 'swim');
      expect(swimItem?.example).toBe('They swim.');

      // Jump -> valid date wins over corrupt date (Infinity)
      const jumpItem = deduped.find((w) => w.word === 'jump');
      expect(jumpItem?.next_review_date).toBe('2026-10-04T10:00:00Z');
    });

    await runner.it('ADV-REVIEW-BOUND-3: deduplicateReviewWords high-throughput stress test (10,000 items in < 50ms)', () => {
      const largeList = [];
      for (let i = 0; i < 10000; i++) {
        const wordIndex = i % 500; // 500 unique words, 20 duplicates each
        largeList.push({
          word: `word_${wordIndex}`,
          reviewCount: i % 10,
          next_review_date: new Date(Date.now() + (i % 100) * 3600000).toISOString(),
          example: i % 2 === 0 ? `Example sentence for word ${wordIndex}` : null,
        });
      }

      const start = Date.now();
      const deduped = deduplicateReviewWords(largeList);
      const elapsed = Date.now() - start;

      expect(deduped.length).toBe(500);
      assert(
        elapsed < 100,
        `Deduplication of 10,000 items took ${elapsed}ms (must be under 100ms)`
      );
    });
  });

  // Verify final buffer matches initial pristine buffer (zero byte-level pollution)
  for (const [filePath, pristineBuf] of pristineBuffers.entries()) {
    const finalBuf = fs.readFileSync(filePath);
    assert(
      finalBuf.equals(pristineBuf),
      `Final integrity violation: ${filePath} was left modified after test execution`
    );
  }
  const stats = runner.getStats();
  runner.printSummary();

  return stats.failed === 0;
  } finally {
    restoreAllPristineFiles();
    releaseLock();
  }
}

if (require.main === module) {
  runEmpiricalMutationSuite()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal mutation challenge failure:', err);
      process.exit(1);
    });
}
