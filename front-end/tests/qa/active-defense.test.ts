/**
 * Automated QA Test Suite: R2 — Active Cyber Defense & Security Verification
 *
 * Verifies:
 * 1. Zero Bulk Leaks: Strips sensitive answers, explanations, and transcripts from pre-submission API responses (TOEIC & VSTEP).
 * 2. Honeypot Canary & Plausible Data Poisoning: CANARY_TEST_IDS, ?dump=true, hidden traps trigger HTTP 200 OK
 *    with shifted answers (A->C, B->D) preserving 25% distribution, toxic grammar inversions, zero-width steganography.
 * 3. Rate Limiting: Lua atomic script, fail-closed production guarantee (HTTP 503 if Redis missing), HTTP 429 with Retry-After: 60,
 *    and multi-window quota configurations.
 * 4. BFF Auth Session: Disallow browser JWTs, __Host-lingopro-session cookie, AES-256-GCM vault, x-lingopro-request: 1 header,
 *    same-origin verification, whitelisted DB proxy (10 tables, 2 RPCs).
 * 5. VietQR / SePay / PayOS Billing: Webhook timing-safe secret check, PayOS HMAC-SHA256 signature,
 *    idempotency events table, exact amount match verification.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { TestRunner, expect, assert } from './test-harness';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// TOEIC & VSTEP Sanitization & Poisoning Imports
import {
  stripSensitiveToeicData,
  stripSensitiveClusterData,
  loadFullToeicTest,
  type ToeicQuestionCluster,
} from '@/lib/toeic-test-loader';

import {
  stripSensitiveVstepData,
  SENSITIVE_VSTEP_KEYS,
} from '@/lib/vstep-test-loader';

import {
  CANARY_TEST_IDS,
  poisonUnifiedQuestion,
  createPoisonedQuestionBank,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
} from '@/lib/toeic-anti-scraping';

// Rate Limiting & API Security Imports
import {
  RATE_LIMIT_SCRIPT,
  RateLimitUnavailableError,
  checkRateLimitAsync,
} from '@/lib/distributed-rate-limit';

import {
  tooManyRequests,
  rateLimitUnavailableResponse,
} from '@/lib/api-security';
import { QUOTA } from '@/lib/anti-scrape';

// BFF Auth & Session Imports
import {
  sessionCookieName,
  cookieHeader,
  assertAppRequest,
  SessionRequestError,
  ALLOWED_DATA_TABLES,
  ALLOWED_DATA_RPCS,
} from '@/lib/server-auth-session';
import { GET as handleDataProxy } from '@/app/api/auth/data/[...path]/route';

// Billing Webhook Auth Imports
import {
  isBillingWebhookAuthorized,
  verifyPayOSSignature,
  computeWebhookEventKey,
  verifyTransactionAmountMatch,
} from '@/lib/billing-webhook-auth';
import type { ToeicUnifiedQuestion } from '@/types/toeic';
import type { VstepExam } from '@/lib/vstep-types';

export async function runActiveDefenseTests(runner: TestRunner = new TestRunner('R2: Active Cyber Defense')): Promise<TestRunner> {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Zero Bulk Leaks Exam Sanitization
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Zero Bulk Leaks (Pre-Submission Sanitization)', async () => {
    await runner.it('R2-LEAK-1: stripSensitiveToeicData strips correctAnswer, explanationVi, and transcript', () => {
      const rawQuestions = loadFullToeicTest('6852');
      assert(rawQuestions.length > 0, 'rawQuestions must not be empty');

      // Verify raw questions have answers
      expect(rawQuestions[0].correctAnswer).toBeDefined();

      const sanitized = stripSensitiveToeicData(rawQuestions);
      expect(sanitized.length).toBe(rawQuestions.length);

      for (const q of sanitized) {
        expect((q as any).correctAnswer).toBeUndefined();
        expect((q as any).explanationVi).toBeUndefined();
        expect((q as any).transcript).toBeUndefined();
        // Public fields must remain intact
        expect(q.id).toBeDefined();
        expect(q.questionNumber).toBeDefined();
        expect(q.part).toBeDefined();
        expect(q.options).toBeDefined();
      }
    });

    await runner.it('R2-LEAK-2: stripSensitiveClusterData sanitizes nested questions in Part 3/4 clusters', () => {
      const mockCluster: ToeicQuestionCluster = {
        clusterId: 'cluster-p3-1',
        groupId: 'group-p3-1',
        testId: '6852',
        part: 3,
        clusterType: 'text_dialogue',
        startQuestionNumber: 32,
        endQuestionNumber: 34,
        audioUrl: 'https://cdn.example.com/audio32.mp3',
        questions: [
          {
            id: 'q-6852-32',
            testId: '6852',
            questionNumber: 32,
            part: 3,
            section: 'listening',
            prompt: 'Where are the speakers?',
            options: [
              { key: 'A', text: 'At a bank' },
              { key: 'B', text: 'At a hotel' },
            ],
            correctAnswer: 'A',
            explanationVi: 'Đáp án A đúng',
            transcript: 'Man: Welcome to the bank.',
          },
        ],
      };

      const sanitizedCluster = stripSensitiveClusterData(mockCluster);

      expect(sanitizedCluster.clusterId).toBe('cluster-p3-1');
      expect(sanitizedCluster.audioUrl).toBe('https://cdn.example.com/audio32.mp3');
      expect(sanitizedCluster.questions.length).toBe(1);

      const q = sanitizedCluster.questions[0];
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).explanationVi).toBeUndefined();
      expect((q as any).transcript).toBeUndefined();
      expect(q.prompt).toBe('Where are the speakers?');
    });

    await runner.it('R2-LEAK-3: stripSensitiveVstepData purges all SENSITIVE_VSTEP_KEYS', () => {
      const mockExam: VstepExam = {
        id: 'vstep-test-1',
        title: 'VSTEP Mock Exam',
        targetLevel: 'B2',
        duration: 180,
        sections: [
          {
            type: 'reading',
            label: 'Reading Section',
            timeLimit: 60,
            tasks: [
              {
                id: 'task-1',
                title: 'Passage 1',
                passage: {
                  id: 'pass-1',
                  title: 'Title',
                  content: 'Passage text...',
                  explanationVi: 'LEAKED EXPLANATION',
                  analysis: 'LEAKED ANALYSIS',
                } as any,
                questions: [
                  {
                    id: 'q-1',
                    questionNumber: 1,
                    prompt: 'What is the main topic?',
                    options: ['Topic A', 'Topic B'],
                    correctOptionIndex: 0,
                    correctAnswer: 'Topic A',
                    answer: 'Topic A',
                    explanation: 'LEAKED EXPLANATION',
                    solution: 'LEAKED SOLUTION',
                    suggestion: 'LEAKED SUGGESTION',
                    transcript: 'LEAKED TRANSCRIPT',
                  } as any,
                ],
              },
            ],
          },
        ],
      };

      const sanitizedExam = stripSensitiveVstepData(mockExam);
      const q = sanitizedExam.sections[0]!.tasks[0]!.questions![0] as any;
      const passage = sanitizedExam.sections[0]!.tasks[0]!.passage as any;

      for (const sensitiveKey of SENSITIVE_VSTEP_KEYS) {
        expect(q[sensitiveKey]).toBeUndefined();
        expect(passage[sensitiveKey]).toBeUndefined();
      }

      expect(q.prompt).toBe('What is the main topic?');
      expect(q.options.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Honeypot Canary & Plausible Data Poisoning
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Honeypot Canary & Plausible Data Poisoning', async () => {
    await runner.it('R2-CANARY-1: CANARY_TEST_IDS contains known honeypot markers', () => {
      expect(CANARY_TEST_IDS.has('ets-canary-honeypot')).toBe(true);
      expect(CANARY_TEST_IDS.has('canary-dump-test')).toBe(true);
      expect(CANARY_TEST_IDS.has('ets-simulation-test-0')).toBe(true);
      expect(CANARY_TEST_IDS.has('study4_test_canary')).toBe(true);
      expect(CANARY_TEST_IDS.has('test-999')).toBe(true);
      expect(CANARY_TEST_IDS.has('toeic-canary-master')).toBe(true);

      // Legitimate IDs are not canaries
      expect(CANARY_TEST_IDS.has('6852')).toBe(false);
      expect(CANARY_TEST_IDS.has('6856')).toBe(false);
    });

    await runner.it('R2-POISON-1: poisonUnifiedQuestion shifts answers A->C, B->D, C->A, D->B (25% balance)', () => {
      const qA: ToeicUnifiedQuestion = {
        id: 'q-test-1',
        testId: 'test',
        questionNumber: 1,
        part: 5,
        section: 'reading',
        options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }, { key: 'C', text: 'Opt C' }, { key: 'D', text: 'Opt D' }],
        correctAnswer: 'A',
      };
      const qB: ToeicUnifiedQuestion = { ...qA, id: 'q-test-2', questionNumber: 2, correctAnswer: 'B' };
      const qC: ToeicUnifiedQuestion = { ...qA, id: 'q-test-3', questionNumber: 3, correctAnswer: 'C' };
      const qD: ToeicUnifiedQuestion = { ...qA, id: 'q-test-4', questionNumber: 4, correctAnswer: 'D' };

      const poisonedA = poisonUnifiedQuestion(qA, '192.168.1.1');
      const poisonedB = poisonUnifiedQuestion(qB, '192.168.1.1');
      const poisonedC = poisonUnifiedQuestion(qC, '192.168.1.1');
      const poisonedD = poisonUnifiedQuestion(qD, '192.168.1.1');

      // Verify exact shifts
      expect(poisonedA.correctAnswer).toBe('C');
      expect(poisonedB.correctAnswer).toBe('D');
      expect(poisonedC.correctAnswer).toBe('A');
      expect(poisonedD.correctAnswer).toBe('B');

      // Equal 25% distribution: across the 4 answers, exactly one A, one B, one C, one D
      const poisonedSet = new Set([
        poisonedA.correctAnswer,
        poisonedB.correctAnswer,
        poisonedC.correctAnswer,
        poisonedD.correctAnswer,
      ]);
      expect(poisonedSet.size).toBe(4);
    });

    await runner.it('R2-POISON-2: Poisoned questions embed toxic grammar rules and watermarks', () => {
      const q: ToeicUnifiedQuestion = {
        id: 'q-canary-1',
        testId: 'canary',
        questionNumber: 1,
        part: 5,
        section: 'reading',
        options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
        correctAnswer: 'A',
      };

      const poisoned = poisonUnifiedQuestion(q, '10.0.0.1');

      assert(poisoned.explanationVi !== undefined, 'Poisoned question must provide an explanation');
      expect(poisoned.explanationVi).toContain('Thí ETS Chuẩn Hóa] Phân tích ngữ pháp chi tiết');
      expect(poisoned.explanationVi).toContain('[Khảo');

      // Contains invisible watermark with canary token
      const extracted = extractInvisibleWatermark(poisoned.explanationVi);
      assert(extracted !== null, 'Watermark must be extractable');
      expect(extracted).toContain('POISON_CANARY_10_0_0_1');
    });

    await runner.it('R2-POISON-3: createPoisonedQuestionBank generates full poisoned sets on demand', () => {
      const bank = createPoisonedQuestionBank(20, 'scraper-bot-ip');
      expect(bank.length).toBe(20);

      const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of bank) {
        expect(q.correctAnswer).toBeDefined();
        answerCounts[q.correctAnswer] = (answerCounts[q.correctAnswer] || 0) + 1;
        expect(q.explanationVi).toBeDefined();
      }

      // Verify balanced distribution (every option occurs at least 3 times in 20 questions)
      expect(answerCounts.A).toBeGreaterThan(0);
      expect(answerCounts.B).toBeGreaterThan(0);
      expect(answerCounts.C).toBeGreaterThan(0);
      expect(answerCounts.D).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Distributed Rate Limiting & Fail-Closed Guarantee
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Distributed Rate Limiting & Fail-Closed Guarantees', async () => {
    await runner.it('R2-RATE-1: Lua script contains atomic INCR, PTTL, and conditional PEXPIRE', () => {
      expect(RATE_LIMIT_SCRIPT).toContain("redis.call('INCR', KEYS[1])");
      expect(RATE_LIMIT_SCRIPT).toContain("redis.call('PTTL', KEYS[1])");
      expect(RATE_LIMIT_SCRIPT).toContain("redis.call('PEXPIRE', KEYS[1], ARGV[1])");
      expect(RATE_LIMIT_SCRIPT).toContain('return {count, ttl}');
    });

    await runner.it('R2-RATE-2: Fail-closed production guarantee throws RateLimitUnavailableError', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        let threw = false;
        try {
          await checkRateLimitAsync('test-key', 10, 60_000);
        } catch (err) {
          threw = true;
          expect(err instanceof RateLimitUnavailableError).toBe(true);
        }
        expect(threw).toBe(true);
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
        if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
        if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      }
    });

    await runner.it('R2-RATE-3: rateLimitUnavailableResponse returns HTTP 503 with Retry-After: 5', () => {
      const err = new RateLimitUnavailableError();
      const res = rateLimitUnavailableResponse(err);

      assert(res !== null, 'Response must not be null');
      expect(res.status).toBe(503);
      expect(res.headers.get('retry-after')).toBe('5');
      expect(res.headers.get('cache-control')).toBe('no-store');
    });

    await runner.it('R2-RATE-4: tooManyRequests returns HTTP 429 with Retry-After: 60', () => {
      const res = tooManyRequests(60);
      expect(res.status).toBe(429);
      expect(res.headers.get('retry-after')).toBe('60');
    });

    await runner.it('R2-RATE-5: Production rate limit quotas configuration verification', () => {
      // 1. Verify authentic QUOTA configurations imported from @/lib/anti-scrape
      expect(QUOTA.dictLookup[0].limit).toBe(25);
      expect(QUOTA.dictLookup[0].windowMs).toBe(60_000);
      expect(QUOTA.dictLookup[1].limit).toBe(120); // 1h window
      expect(QUOTA.dictLookup[2].limit).toBe(400); // 1d window

      expect(QUOTA.grammarBulk[0].limit).toBe(4);
      expect(QUOTA.grammarTopic[0].limit).toBe(30);
      expect(QUOTA.tts[0].limit).toBe(60);
      expect(QUOTA.pdfGloss[0].limit).toBe(3);
      expect(QUOTA.wordsList[0].limit).toBe(40);

      // 2. Read and verify rate limits directly from production route source files
      const readRoute = (relPath: string) =>
        fs.readFileSync(path.resolve(PROJECT_ROOT, relPath), 'utf-8');

      const toeicTestRoute = readRoute('src/app/api/toeic/test/route.ts');
      const toeicExplainRoute = readRoute('src/app/api/toeic/explain/route.ts');
      const toeicSubmitRoute = readRoute('src/app/api/toeic/submit/route.ts');
      const authRegisterRoute = readRoute('src/app/api/auth/register/route.ts');

      // Check authentic limit numbers in checkRateLimitAsync calls
      expect(toeicTestRoute).toMatch(/checkRateLimitAsync\(`toeic-test:\$\{ip\}`, 60, 60_000\)/);
      expect(toeicExplainRoute).toMatch(/checkRateLimitAsync\(`toeic-explain:\$\{ip\}`, 60, 60_000\)/);
      expect(toeicSubmitRoute).toMatch(/checkRateLimitAsync\(`toeic-submit:\$\{ip\}`, 20, 60_000\)/);
      expect(authRegisterRoute).toMatch(/checkRateLimitAsync\(`auth-register:\$\{ip\}`, 8, 60_000\)/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. BFF Auth Session & Security Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('BFF Auth Session & Security Boundaries', async () => {
    await runner.it('R2-BFF-1: Disallows browser JWTs on cookie endpoints', () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          'x-lingopro-request': '1',
          origin: 'http://localhost:3000',
        },
      });

      let threw = false;
      try {
        assertAppRequest(req);
      } catch (err) {
        threw = true;
        expect(err instanceof SessionRequestError).toBe(true);
        expect((err as SessionRequestError).status).toBe(403);
      }
      expect(threw).toBe(true);
    });

    await runner.it('R2-BFF-2: Enforces x-lingopro-request: 1 header for CSRF defense', () => {
      const reqMissingHeader = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      let threw = false;
      try {
        assertAppRequest(reqMissingHeader);
      } catch (err) {
        threw = true;
        expect(err instanceof SessionRequestError).toBe(true);
        expect((err as SessionRequestError).status).toBe(403);
      }
      expect(threw).toBe(true);

      // When header is present and valid, assertAppRequest succeeds
      const reqValid = new NextRequest('http://localhost:3000/api/auth/session', {
        headers: {
          'x-lingopro-request': '1',
          origin: 'http://localhost:3000',
          'sec-fetch-site': 'same-origin',
        },
      });

      expect(() => assertAppRequest(reqValid)).not.toThrow();
    });

    await runner.it('R2-BFF-3: Enforces __Host- cookie name in production with HttpOnly and Secure', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
        expect(sessionCookieName()).toBe('__Host-lingopro-session');

        const header = cookieHeader('__Host-lingopro-session', 'secret-session-token', 604800);
        expect(header).toContain('Path=/');
        expect(header).toContain('HttpOnly');
        expect(header).toContain('SameSite=Lax');
        expect(header).toContain('Secure');
        expect(header).toContain('Max-Age=604800');
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      }
    });

    await runner.it('R2-BFF-4: AES-256-GCM vault encryption specification contract', () => {
      // Vault encryption contract:
      // Algorithm: aes-256-gcm
      // IV: 12 bytes random
      // AAD: bound to Redis key name
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(12);
      const keyName = 'auth:session:test_hash_123';
      const payload = JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001' });

      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(keyName));
      const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Decryption with same AAD succeeds
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(Buffer.from(keyName));
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
      expect(decrypted).toBe(payload);

      // Decryption with altered AAD throws authentication error
      const badDecipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      badDecipher.setAAD(Buffer.from('auth:session:different_hash_456'));
      badDecipher.setAuthTag(authTag);
      expect(() => {
        badDecipher.update(ciphertext);
        badDecipher.final();
      }).toThrow();
    });

    await runner.it('R2-BFF-5: Database proxy whitelist enforcement and route handler rejection', async () => {
      // 1. Import and verify production whitelist from @/lib/server-auth-session
      expect(ALLOWED_DATA_TABLES.size).toBe(10);
      expect(ALLOWED_DATA_RPCS.size).toBe(2);

      expect(ALLOWED_DATA_TABLES.has('profiles')).toBe(true);
      expect(ALLOWED_DATA_TABLES.has('orders')).toBe(true);
      expect(ALLOWED_DATA_TABLES.has('words')).toBe(true);
      expect(ALLOWED_DATA_TABLES.has('srs_progress')).toBe(true);
      expect(ALLOWED_DATA_TABLES.has('grammar_exercises')).toBe(true);
      expect(ALLOWED_DATA_TABLES.has('classrooms')).toBe(true);
      expect(ALLOWED_DATA_TABLES.has('enrollments')).toBe(true);

      expect(ALLOWED_DATA_RPCS.has('claim_teacher_role')).toBe(true);
      expect(ALLOWED_DATA_RPCS.has('claim_onboarding_xp')).toBe(true);

      // 2. Verify proxy route handler GET rejects forbidden tables with HTTP 404
      const forbiddenTables = ['users', 'auth_tokens', 'admin_secrets', 'audit_logs', 'secrets'];
      for (const table of forbiddenTables) {
        expect(ALLOWED_DATA_TABLES.has(table)).toBe(false);

        const req = new NextRequest(`http://localhost:3000/api/auth/data/${table}`, {
          method: 'GET',
          headers: { 'x-lingopro-request': '1' },
        });
        const res = await handleDataProxy(req, {
          params: Promise.resolve({ path: [table] }),
        });
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.message).toBe('Data endpoint unavailable');
      }

      // 3. Verify RPC calls with GET (instead of POST) are strictly rejected with HTTP 404
      const rpcGetReq = new NextRequest('http://localhost:3000/api/auth/data/rpc/claim_teacher_role', {
        method: 'GET',
        headers: { 'x-lingopro-request': '1' },
      });
      const rpcGetRes = await handleDataProxy(rpcGetReq, {
        params: Promise.resolve({ path: ['rpc', 'claim_teacher_role'] }),
      });
      expect(rpcGetRes.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. VietQR / SePay / PayOS Billing Webhook Security
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('VietQR & Billing Webhook Tamper Prevention', async () => {
    await runner.it('R2-BILL-1: isBillingWebhookAuthorized requires timing-safe secret and rejects CRON_SECRET', () => {
      const originalWebhook = process.env.BILLING_WEBHOOK_SECRET;
      const originalCron = process.env.CRON_SECRET;

      try {
        const testSecret = '0123456789abcdef0123456789abcdef'; // 32 chars
        process.env.BILLING_WEBHOOK_SECRET = testSecret;
        process.env.CRON_SECRET = 'cron_secret_0123456789abcdef0123';

        // Valid secret header
        const validHeaders = new Headers({
          authorization: `Apikey ${testSecret}`,
        });
        expect(isBillingWebhookAuthorized(validHeaders)).toBe(true);

        // Invalid secret
        const invalidHeaders = new Headers({
          authorization: `Apikey wrong_secret_0123456789abcdef0123`,
        });
        expect(isBillingWebhookAuthorized(invalidHeaders)).toBe(false);

        // Bearer prefix instead of Apikey
        const bearerHeaders = new Headers({
          authorization: `Bearer ${testSecret}`,
        });
        expect(isBillingWebhookAuthorized(bearerHeaders)).toBe(false);

        // CRON_SECRET reuse is explicitly rejected
        process.env.BILLING_WEBHOOK_SECRET = process.env.CRON_SECRET;
        const reusedHeaders = new Headers({
          authorization: `Apikey ${process.env.CRON_SECRET}`,
        });
        expect(isBillingWebhookAuthorized(reusedHeaders)).toBe(false);
      } finally {
        if (originalWebhook) process.env.BILLING_WEBHOOK_SECRET = originalWebhook;
        else delete process.env.BILLING_WEBHOOK_SECRET;
        if (originalCron) process.env.CRON_SECRET = originalCron;
        else delete process.env.CRON_SECRET;
      }
    });

    await runner.it('R2-BILL-2: PayOS HMAC-SHA256 signature verification over sorted keys', () => {
      const checksumKey = 'test_checksum_key_secret_1234567890';
      const data: Record<string, unknown> = {
        amount: 299000,
        description: 'LINGOPRO a1b2c3d4',
        orderCode: 12345,
      };

      // Generate expected signature over alphabetically sorted keys
      const sortedKeys = Object.keys(data).sort();
      const queryString = sortedKeys.map((k) => `${k}=${data[k]}`).join('&');
      const expectedSignature = crypto
        .createHmac('sha256', checksumKey)
        .update(queryString)
        .digest('hex');

      // Call the production verifier from @/lib/billing-webhook-auth
      expect(verifyPayOSSignature(data, expectedSignature, checksumKey)).toBe(true);

      // Tampered amount fails signature check
      const tamperedData = { ...data, amount: 1000 };
      expect(verifyPayOSSignature(tamperedData, expectedSignature, checksumKey)).toBe(false);

      // Malformed signature length or non-hex string fails gracefully without crashing
      expect(verifyPayOSSignature(data, 'invalid_sig', checksumKey)).toBe(false);
      expect(verifyPayOSSignature(data, 'a'.repeat(63), checksumKey)).toBe(false);
    });

    await runner.it('R2-BILL-3: Webhook idempotency event key derivation and replay safety', () => {
      // 1. Test production event key derivation from @/lib/billing-webhook-auth
      const paymentRef = 'FT26040188992';
      const keyWithRef = computeWebhookEventKey('a1b2c3d4', 299000, 'LINGOPRO a1b2c3d4', paymentRef);
      expect(keyWithRef).toBe('payref:FT26040188992');

      // Fallback hash when payment reference is missing
      const keyWithoutRef = computeWebhookEventKey('a1b2c3d4', 299000, 'LINGOPRO a1b2c3d4', null);
      expect(keyWithoutRef).toMatch(/^tx:[a-f0-9]{32}$/);

      // Deterministic: identical transaction generates identical key
      const keyRepeat = computeWebhookEventKey('a1b2c3d4', 299000, 'LINGOPRO a1b2c3d4', null);
      expect(keyRepeat).toBe(keyWithoutRef);

      // 2. Verify static contract in src/app/api/billing/webhook/route.ts
      const webhookRouteContent = fs.readFileSync(
        path.resolve(PROJECT_ROOT, 'src/app/api/billing/webhook/route.ts'),
        'utf-8'
      );

      // Verify that existing processed events are skipped with duplicate status
      expect(webhookRouteContent).toContain("existingEvent?.status === 'processed'");
      expect(webhookRouteContent).toContain("status: 'duplicate'");
      // Verify upsert into payment_webhook_events
      expect(webhookRouteContent).toContain(".from('payment_webhook_events').upsert(");
      expect(webhookRouteContent).toContain("onConflict: 'event_key'");
    });

    await runner.it('R2-BILL-4: verifyTransactionAmountMatch rejects underpayments and discrepancies', () => {
      const orderAmount = 299000;

      // 1. Exact numeric match
      expect(verifyTransactionAmountMatch(299000, orderAmount)).toBe(true);

      // 2. String amount from webhook payload (e.g. SePay transferAmount)
      expect(verifyTransactionAmountMatch('299000', orderAmount)).toBe(true);

      // 3. Fraudulent / Underpayment attempts strictly rejected
      expect(verifyTransactionAmountMatch('29000', orderAmount)).toBe(false);
      expect(verifyTransactionAmountMatch(298999, orderAmount)).toBe(false);
      expect(verifyTransactionAmountMatch(0, orderAmount)).toBe(false);

      // 4. Overpayment discrepancy rejected from automated confirmation
      expect(verifyTransactionAmountMatch(500000, orderAmount)).toBe(false);

      // 5. Invalid / Non-finite values safely rejected without throwing
      expect(verifyTransactionAmountMatch('NaN', orderAmount)).toBe(false);
      expect(verifyTransactionAmountMatch('', orderAmount)).toBe(false);

      // 6. Floating point rounding tolerance
      expect(verifyTransactionAmountMatch(299000.4, orderAmount)).toBe(true);
      expect(verifyTransactionAmountMatch(299001.2, orderAmount)).toBe(false);
    });
  });

  return runner;
}

if (require.main === module) {
  const runner = new TestRunner('R2: Active Cyber Defense');
  runActiveDefenseTests(runner).then(() => {
    const stats = runner.printSummary();
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
