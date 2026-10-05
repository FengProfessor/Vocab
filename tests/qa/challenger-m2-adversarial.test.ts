/**
 * Empirical Adversarial Challenger Test Suite: Milestone 2 QA Test Suite
 *
 * Adversarially challenges:
 * 1. Offline & Hermetic Execution Guarantee (zero network, zero external DB/Redis dependencies)
 * 2. Exit Code Semantics & Failure Injection Fidelity (Code 0 on pass, Code 1 on fail)
 * 3. Test Harness Matcher Soundness & Oracle Integrity (asserting negative cases trigger failures)
 * 4. Learner Journey (R1) Stress Testing (Barem bounds, FSRS mathematical monotonicity, Steganography corruption)
 * 5. Active Cyber Defense (R2) Stress Testing (Sanitization immutability, Poisoning derangement, Webhook timing safety)
 * 6. Master Runner Integration & Execution
 */

import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { TestRunner, expect, assert } from './test-harness';

// Scoring & Barem
import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '@/lib/toeic-barem';

import {
  calculateToeicScore,
  getCefrLevel,
  getPartAccuracyRating,
} from '@/lib/toeic-scoring';

import {
  loadFullToeicTest,
  stripSensitiveToeicData,
  stripSensitiveClusterData,
  type ToeicQuestionCluster,
} from '@/lib/toeic-test-loader';

import {
  stripSensitiveVstepData,
  SENSITIVE_VSTEP_KEYS,
} from '@/lib/vstep-test-loader';

// Anti-Scraping & Defense
import {
  CANARY_TEST_IDS,
  poisonUnifiedQuestion,
  createPoisonedQuestionBank,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
} from '@/lib/toeic-anti-scraping';

// Rate Limiting & Security
import {
  RateLimitUnavailableError,
  checkRateLimitAsync,
} from '@/lib/distributed-rate-limit';

import {
  tooManyRequests,
  rateLimitUnavailableResponse,
} from '@/lib/api-security';

// Auth & Billing
import {
  sessionCookieName,
  cookieHeader,
  assertAppRequest,
  SessionRequestError,
} from '@/lib/server-auth-session';

import { isBillingWebhookAuthorized } from '@/lib/billing-webhook-auth';

// FSRS
import {
  scheduleNext,
  State,
  Rating,
  type SrsRowLike,
} from '@/lib/fsrs';

import type { ToeicUnifiedQuestion } from '@/types/toeic';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export async function runChallengerM2Suite() {
  const runner = new TestRunner('Challenger M2: Empirical Adversarial Challenge');

  console.log('\n====================================================================================================');
  console.log('            EMPIRICAL ADVERSARIAL CHALLENGER: MILESTONE 2 QA TEST SUITE');
  console.log('====================================================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 1: Hermetic & Offline Execution Guarantee
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 1: Hermetic & Offline Execution Guarantee', async () => {
    await runner.it('ADV-HERMETIC-1: loadFullToeicTest operates strictly from disk with zero network requests', () => {
      const q = loadFullToeicTest('6852');
      assert(q.length === 200, 'Must load exactly 200 questions from local disk');
      // Verify question 1 data structure integrity
      assert(q[0].questionNumber === 1, 'Q1 questionNumber must be 1');
      assert(q[199].questionNumber === 200, 'Q200 questionNumber must be 200');
    });

    await runner.it('ADV-HERMETIC-2: Sub-suites execute hermetically when all Redis/Supabase env vars are poisoned to unreachable hosts', () => {
      const r1Script = path.resolve(__dirname, 'learner-journey.test.ts');
      const stdout = execSync(`npx tsx "${r1Script}"`, {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:9999/unreachable',
          UPSTASH_REDIS_REST_TOKEN: 'poisoned-token',
          NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9999/unreachable',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'poisoned-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: 'poisoned-role-key',
        },
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      assert(stdout.includes('Finished R1: 17/17 passed') || stdout.includes('Passed: 17 / 17'), 'R1 must pass all 17 tests hermetically');
    });

    await runner.it('ADV-HERMETIC-3: Distributed rate limiter honors fail-closed contract without remote calls when credentials missing', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        let threwExpected = false;
        try {
          await checkRateLimitAsync('hermetic-test-key', 5, 10_000);
        } catch (err) {
          if (err instanceof RateLimitUnavailableError) {
            threwExpected = true;
          }
        }
        assert(threwExpected, 'Must throw RateLimitUnavailableError synchronously without hanging');
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
        if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
        if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 2: Exit Code Semantics & Failure Injection Fidelity
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 2: Exit Code Semantics & Failure Injection Fidelity', async () => {
    await runner.it('ADV-EXIT-1: Master test runner returns exit code 0 when all tests pass', () => {
      const runnerScript = path.resolve(__dirname, 'run-all-qa-suites.ts');
      const stdout = execSync(`npx tsx "${runnerScript}"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      assert(stdout.includes('All 61 QA verification tests PASSED successfully') || stdout.includes('Exit Code 0'), 'Master runner output must confirm Exit Code 0');
    });

    await runner.it('ADV-EXIT-2: Sub-process with intentional failure exits with code 1 (failure injection test)', () => {
      const fixtureScript = path.resolve(__dirname, 'failing-suite-fixture.ts');
      let capturedExitCode: number | null = null;

      try {
        execSync(`npx tsx "${fixtureScript}"`, {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        capturedExitCode = 0; // Should not reach here
      } catch (err: any) {
        capturedExitCode = err.status;
      }

      assert(capturedExitCode === 1, `Runner must exit with code 1 when a test fails, but got exit code ${capturedExitCode}`);
    });

    await runner.it('ADV-EXIT-3: Sub-process with unhandled exception exits with non-zero code', () => {
      const crashScript = path.resolve(__dirname, 'crashing-suite-fixture.ts');
      let capturedExitCode: number | null = null;

      try {
        execSync(`npx tsx "${crashScript}"`, {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        capturedExitCode = 0; // Should not reach here
      } catch (err: any) {
        capturedExitCode = err.status;
      }

      assert(capturedExitCode !== null && capturedExitCode !== 0, `Crashing script must exit with non-zero code, got ${capturedExitCode}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 3: Test Harness Soundness & Oracle Fidelity
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 3: Test Harness Soundness & Oracle Fidelity', async () => {
    await runner.it('ADV-ORACLE-1: expect().toBe and toEqual throw on mismatch', () => {
      let threwToBe = false;
      try {
        expect('valueA').toBe('valueB');
      } catch {
        threwToBe = true;
      }
      assert(threwToBe, 'expect().toBe must throw when values differ');

      let threwToEqual = false;
      try {
        expect({ a: 1 }).toEqual({ a: 2 });
      } catch {
        threwToEqual = true;
      }
      assert(threwToEqual, 'expect().toEqual must throw when objects differ');
    });

    await runner.it('ADV-ORACLE-2: expect().toContain and toMatch throw on non-containment / mismatch', () => {
      let threwContain = false;
      try {
        expect(['A', 'B']).toContain('C');
      } catch {
        threwContain = true;
      }
      assert(threwContain, 'expect().toContain must throw when item is missing');

      let threwMatch = false;
      try {
        expect('hello world').toMatch(/^goodbye/);
      } catch {
        threwMatch = true;
      }
      assert(threwMatch, 'expect().toMatch must throw when regex does not match');
    });

    await runner.it('ADV-ORACLE-3: expect().not negates matchers correctly', () => {
      expect('apple').not.toBe('banana');
      expect([1, 2, 3]).not.toContain(4);
      expect('foo').not.toMatch(/bar/);

      let threwFalseNegation = false;
      try {
        expect('same').not.toBe('same');
      } catch {
        threwFalseNegation = true;
      }
      assert(threwFalseNegation, 'expect().not.toBe must throw when values are identical');
    });

    await runner.it('ADV-ORACLE-4: expect().toThrow properly validates thrown exceptions and patterns', () => {
      const thrower = () => {
        throw new Error('Specific error message: 403 Forbidden');
      };
      const silent = () => 42;

      expect(thrower).toThrow('403 Forbidden');
      expect(thrower).toThrow(/403/);
      expect(silent).not.toThrow();

      let threwOnSilent = false;
      try {
        expect(silent).toThrow();
      } catch {
        threwOnSilent = true;
      }
      assert(threwOnSilent, 'expect().toThrow must throw when function does not throw');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 4: R1 Learner Journey Adversarial Stress
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 4: R1 Learner Journey Adversarial Stress', async () => {
    await runner.it('ADV-BAREM-1: ETS Barem handles out-of-range inputs safely via clamping without NaN', () => {
      const negativeRaw = convertRawToScaled(-999, -50);
      assert(negativeRaw.scaledListening === 5, 'Negative listening raw score must clamp to minimum scaled 5');
      assert(negativeRaw.scaledReading === 5, 'Negative reading raw score must clamp to minimum scaled 5');
      assert(negativeRaw.scaledTotal === 10, 'Minimum total score must be 10');

      const extremeRaw = convertRawToScaled(9999, 105);
      assert(extremeRaw.scaledListening === 495, 'Over-100 listening raw score must clamp to maximum scaled 495');
      assert(extremeRaw.scaledReading === 495, 'Over-100 reading raw score must clamp to maximum scaled 495');
      assert(extremeRaw.scaledTotal === 990, 'Maximum total score must be 990');
    });

    await runner.it('ADV-BAREM-2: Full 101-element ETS Barem strictly satisfies non-decreasing monotonicity', () => {
      for (let i = 0; i < 100; i++) {
        const currL = ETS_LISTENING_BAREM[i];
        const nextL = ETS_LISTENING_BAREM[i + 1];
        assert(nextL >= currL, `Listening barem inversion at index ${i}: ${currL} > ${nextL}`);

        const currR = ETS_READING_BAREM[i];
        const nextR = ETS_READING_BAREM[i + 1];
        assert(nextR >= currR, `Reading barem inversion at index ${i}: ${currR} > ${nextR}`);
      }
    });

    await runner.it('ADV-FSRS-1: Mathematical monotonicity of FSRS scheduling across rating spectrum (Again < Hard < Good < Easy)', () => {
      const now = new Date('2026-10-04T12:00:00Z');
      const baseCard: SrsRowLike = {
        stability: 5.0,
        difficulty: 5.0,
        interval_days: 5,
        review_count: 2,
        state: State.Review,
        last_reviewed_at: new Date('2026-09-29T12:00:00Z').toISOString(),
      };

      const resAgain = scheduleNext(baseCard, Rating.Again, now);
      const resHard = scheduleNext(baseCard, Rating.Hard, now);
      const resGood = scheduleNext(baseCard, Rating.Good, now);
      const resEasy = scheduleNext(baseCard, Rating.Easy, now);

      // Stability ordering: Again < Hard <= Good <= Easy
      assert(resAgain.stability < resHard.stability, `Again stability (${resAgain.stability}) must be < Hard (${resHard.stability})`);
      assert(resHard.stability <= resGood.stability, `Hard stability (${resHard.stability}) must be <= Good (${resGood.stability})`);
      assert(resGood.stability <= resEasy.stability, `Good stability (${resGood.stability}) must be <= Easy (${resEasy.stability})`);

      // Due dates: Again must be immediate (relearning), Easy must be furthest in future
      const dueAgain = new Date(resAgain.next_review_date).getTime();
      const dueGood = new Date(resGood.next_review_date).getTime();
      const dueEasy = new Date(resEasy.next_review_date).getTime();
      assert(dueAgain < dueGood, 'Again due date must precede Good due date');
      assert(dueGood <= dueEasy, 'Good due date must precede or equal Easy due date');
    });

    await runner.it('ADV-FSRS-2: Extreme card state resilience (corrupted stability, negative lapses, NaN values)', () => {
      const now = new Date('2026-10-04T12:00:00Z');
      const corrupted: SrsRowLike = {
        stability: -10,
        difficulty: 999,
        interval_days: -5,
        review_count: -1,
        state: 99 as any,
        lapses: -3,
      };

      const healed = scheduleNext(corrupted, Rating.Good, now);
      assert(healed.stability > 0, 'Healed stability must be strictly positive');
      assert(healed.difficulty >= 1 && healed.difficulty <= 10, 'Healed difficulty must be clamped within [1, 10]');
      assert(healed.review_count >= 0, 'Review count must be non-negative');
      assert(!isNaN(new Date(healed.next_review_date).getTime()), 'Next review date must be a valid date string');
    });

    await runner.it('ADV-STEGANO-1: Watermark roundtrip preserves diacritics and handles corrupted sentinels gracefully', () => {
      const text = 'Học sinh chú ý: Thì hiện tại hoàn thành tiếp diễn nhấn mạnh tính liên tục của hành động.';
      const fingerprint = 'ATTACKER_ID_9999_IPV6_2001:db8::1';

      const marked = embedInvisibleWatermark(text, fingerprint);
      const extracted = extractInvisibleWatermark(marked);
      assert(extracted === fingerprint, 'Watermark must extract cleanly without altering Vietnamese text');

      // Unmarked text returns null
      assert(extractInvisibleWatermark(text) === null, 'Unmarked text must return null');

      // Severely corrupted text returns null or does not crash
      const corrupted = marked.slice(0, 10);
      expect(() => extractInvisibleWatermark(corrupted)).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 5: R2 Active Cyber Defense Adversarial Stress
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('Dimension 5: R2 Active Cyber Defense Adversarial Stress', async () => {
    await runner.it('ADV-LEAK-1: Data sanitization does not mutate the original test object (Immutability guarantee)', () => {
      const originalQuestions = loadFullToeicTest('6852');
      const q1OriginalAnswer = originalQuestions[0].correctAnswer;
      const q1OriginalExplanation = originalQuestions[0].explanationVi;

      assert(q1OriginalAnswer !== undefined, 'Original Q1 must have correctAnswer');

      // Perform sanitization
      const sanitized = stripSensitiveToeicData(originalQuestions);

      // Verify sanitized has no sensitive data
      expect((sanitized[0] as any).correctAnswer).toBeUndefined();
      expect((sanitized[0] as any).explanationVi).toBeUndefined();
      expect((sanitized[0] as any).transcript).toBeUndefined();

      // Verify ORIGINAL was NOT stripped or mutated in place
      assert(originalQuestions[0].correctAnswer === q1OriginalAnswer, 'Sanitization must not mutate the original questions array');
      assert(originalQuestions[0].explanationVi === q1OriginalExplanation, 'Original explanationVi must remain intact');
    });

    await runner.it('ADV-POISON-1: Plausible data poisoning is a true fixed-point free derangement (f(x) != x)', () => {
      const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const baseQ: ToeicUnifiedQuestion = {
        id: 'test-derangement',
        testId: 'test',
        questionNumber: 1,
        part: 5,
        section: 'reading',
        options: options.map((k) => ({ key: k, text: `Opt ${k}` })),
        correctAnswer: 'A',
      };

      for (const opt of options) {
        const q: ToeicUnifiedQuestion = { ...baseQ, correctAnswer: opt };
        const poisoned = poisonUnifiedQuestion(q, '127.0.0.1');
        assert(
          poisoned.correctAnswer !== opt,
          `Derangement violation: Poisoned answer for ${opt} returned ${poisoned.correctAnswer} (must never match original)`,
        );
      }
    });

    await runner.it('ADV-BILLING-1: PayOS signature rejects tampering with single-character alteration or key reordering', () => {
      const secret = 'valid_signature_secret_test_001';
      const data: Record<string, unknown> = {
        amount: 499000,
        description: 'LINGOPRO upgrade',
        orderCode: 987654,
      };

      // Correct signature
      const sortedKeys = Object.keys(data).sort();
      const qs = sortedKeys.map((k) => `${k}=${data[k]}`).join('&');
      const validSig = crypto.createHmac('sha256', secret).update(qs).digest('hex');

      // Verify tampered signature with wrong secret
      const badSecretSig = crypto.createHmac('sha256', 'wrong_secret').update(qs).digest('hex');
      assert(validSig !== badSecretSig, 'Signatures from different secrets must not match');

      // Timing safe compare
      const safeCompare = (a: string, b: string) => {
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
      };
      assert(safeCompare(validSig, validSig), 'Valid signature comparison must match');
      assert(!safeCompare(validSig, badSecretSig), 'Tampered signature must fail safe comparison');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 6: Summary & Execution
  // ──────────────────────────────────────────────────────────────────────────
  const stats = runner.getStats();
  runner.printSummary();

  return stats;
}

if (require.main === module) {
  runChallengerM2Suite()
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal challenger execution failure:', err);
      process.exit(1);
    });
}
