/**
 * CHALLENGER M4.1 EMPIRICAL ADVERSARIAL SECURITY TEST HARNESS
 * Location: tests/vstep/challenger-m4-security.test.ts
 *
 * Adversarial Verification & Stress Harness:
 * 1. Cryptographic Session Token Tampering Attacks:
 *    - Altered IPs, Past Timestamps, Mismatched testIds, Flipped Signature Bits,
 *      Truncated Base64, Delimiter Injections, Route Guarding (401 verification).
 * 2. Comprehensive Zero-Bulk-Leak Sweep across ALL 190 Catalog Items:
 *    - Recursive scan for all 10 sensitive keys on safe objects vs raw integrity across all 4 sources.
 * 3. Cache Immutability Stress Testing:
 *    - Multi-pass mutation isolation, rogue property injection, concurrent interleaved mutation defense.
 *
 * Run standalone:
 *   npx tsx tests/vstep/challenger-m4-security.test.ts
 */

import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { TestRunner, expect, SuiteStats } from './test-harness';
import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
} from '@/lib/vstep-anti-scraping';
import {
  loadRawVstepExam,
  loadVstepExamSafe,
  getVstepCatalog,
  stripSensitiveVstepData,
  SENSITIVE_VSTEP_KEYS,
  clearVstepExamCache,
} from '@/lib/vstep-test-loader';
import { VstepExam } from '@/lib/vstep-types';
import { POST as handleSubmit } from '@/app/api/vstep/submit/route';
import { POST as handleExplain } from '@/app/api/vstep/explain/route';

const HMAC_SECRET =
  process.env.VSTEP_SECURITY_SECRET ||
  'lingopro_vstep_anti_scraping_guard_2026_b1b2c1';

const SENSITIVE_REGEX =
  /^(answer|correctAnswer|correctOptionIndex|explanation|explanationVi|tapescript|transcript|analysis|solution|suggestion)$/i;

function countSensitiveKeysDeep(obj: any): { count: number; violations: string[] } {
  const violations: string[] = [];
  let count = 0;

  function traverse(node: any, path: string) {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], `${path}[${i}]`);
      }
      return;
    }

    for (const key of Object.keys(node)) {
      if (SENSITIVE_REGEX.test(key)) {
        count++;
        violations.push(`${path}.${key}`);
      }
      traverse(node[key], `${path}.${key}`);
    }
  }

  traverse(obj, 'root');
  return { count, violations };
}

export async function runChallengerSecurityTests(
  existingRunner?: TestRunner
): Promise<SuiteStats> {
  const runner = existingRunner || new TestRunner();

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 1: Cryptographic Token Tampering & Route Defense Attacks
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Challenger M4.1 - Suite 1: Cryptographic Token Tampering', async () => {
    await runner.it('SEC-1.1: Legitimate token baseline verifies successfully at unit and route level', async () => {
      const clientIp = '10.99.1.1';
      const testId = 'vstep-mock-01';
      const questionId = 'L1Q1';
      const token = generateVstepSessionToken(clientIp, testId);

      expect(verifyVstepSessionToken(token, clientIp, testId)).toBe(true);

      // Verify legitimate token passes POST /api/vstep/submit
      const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIp,
        },
        body: JSON.stringify({
          testId,
          sessionToken: token,
          answers: { [questionId]: 0 },
        }),
      });
      const submitRes = await handleSubmit(submitReq);
      expect(submitRes.status).toBe(200);
      const submitData = await submitRes.json();
      expect(submitData.success).toBe(true);
      expect(submitData.reviewExam).toBeDefined();

      // Verify legitimate token passes POST /api/vstep/explain
      const explainReq = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIp,
        },
        body: JSON.stringify({
          testId,
          questionId,
          sessionToken: token,
        }),
      });
      const explainRes = await handleExplain(explainReq);
      expect(explainRes.status).toBe(200);
      const explainData = await explainRes.json();
      expect(explainData.success).toBe(true);
      expect(explainData.answer).toBeDefined();
    });

    await runner.it('SEC-1.2: Altered IP address attacks are 100% rejected at unit and route levels', async () => {
      const issuedIp = '10.99.2.1';
      const attackerIps = [
        '10.99.2.2',
        '192.168.1.1',
        '127.0.0.1',
        '::1',
        '203.0.113.195',
        '8.8.8.8',
      ];
      const testId = 'vstep-mock-01';
      const token = generateVstepSessionToken(issuedIp, testId);

      for (const attackerIp of attackerIps) {
        // Unit check
        expect(verifyVstepSessionToken(token, attackerIp, testId)).toBe(false);

        // Submit route check -> 401
        const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': attackerIp,
          },
          body: JSON.stringify({
            testId,
            sessionToken: token,
            answers: {},
          }),
        });
        const submitRes = await handleSubmit(submitReq);
        expect(submitRes.status).toBe(401);
        const submitData = await submitRes.json();
        expect(submitData.success).toBe(false);

        // Explain route check -> 401
        const explainReq = new NextRequest('http://localhost:3000/api/vstep/explain', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': attackerIp,
          },
          body: JSON.stringify({
            testId,
            questionId: 'L1Q1',
            sessionToken: token,
          }),
        });
        const explainRes = await handleExplain(explainReq);
        expect(explainRes.status).toBe(401);
      }
    });

    await runner.it('SEC-1.3: Past and expired timestamps attacks are 100% rejected', async () => {
      const clientIp = '10.99.3.1';
      const testId = 'vstep-mock-01';

      // Negative offsets
      const expiredTokens = [
        generateVstepSessionToken(clientIp, testId, -1),
        generateVstepSessionToken(clientIp, testId, -60),
        generateVstepSessionToken(clientIp, testId, -3600),
        generateVstepSessionToken(clientIp, testId, -86400),
      ];

      // Unix Epoch 0 forged token
      const epochPayload = `${clientIp}|${testId}|0`;
      const epochSig = createHmac('sha256', HMAC_SECRET).update(epochPayload).digest('hex');
      expiredTokens.push(Buffer.from(`${epochPayload}|${epochSig}`).toString('base64url'));

      // 2 seconds in the past
      const pastNow = Math.floor(Date.now() / 1000) - 2;
      const pastPayload = `${clientIp}|${testId}|${pastNow}`;
      const pastSig = createHmac('sha256', HMAC_SECRET).update(pastPayload).digest('hex');
      expiredTokens.push(Buffer.from(`${pastPayload}|${pastSig}`).toString('base64url'));

      for (const tok of expiredTokens) {
        expect(verifyVstepSessionToken(tok, clientIp, testId)).toBe(false);

        // Submit route test
        const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': clientIp,
          },
          body: JSON.stringify({
            testId,
            sessionToken: tok,
            answers: {},
          }),
        });
        const submitRes = await handleSubmit(submitReq);
        expect(submitRes.status).toBe(401);
      }
    });

    await runner.it('SEC-1.4: Mismatched testId tokens are 100% rejected', async () => {
      const clientIp = '10.99.4.1';
      const issuedTestId = 'vstep-mock-01';
      const token = generateVstepSessionToken(clientIp, issuedTestId);

      const foreignTestIds = [
        'vstep-mock-02',
        'vstep-mock-03',
        'vstep-listening-01',
        'vstep-reading-01',
        'vstep-reading-onthi-01',
        'vstep-reading-ets-01',
        'vstep-exam-vnu-01',
        'VSTEP-MOCK-01', // case mismatch
        'vstep-mock-01-extra',
        'vstep-fake-test',
      ];

      for (const targetTestId of foreignTestIds) {
        expect(verifyVstepSessionToken(token, clientIp, targetTestId)).toBe(false);

        const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': clientIp,
          },
          body: JSON.stringify({
            testId: targetTestId,
            sessionToken: token,
            answers: {},
          }),
        });
        const submitRes = await handleSubmit(submitReq);
        expect(submitRes.status).toBe(401);
      }
    });

    await runner.it('SEC-1.5: Flipped signature bits and cryptographic tampering are 100% rejected', async () => {
      const clientIp = '10.99.5.1';
      const testId = 'vstep-mock-01';
      const validToken = generateVstepSessionToken(clientIp, testId);
      const decoded = Buffer.from(validToken, 'base64url').toString('utf8');
      const parts = decoded.split('|');
      const [ip, id, expires, sig] = parts;

      // 1. Flip single char in signature
      const flippedSig1 =
        (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
      const tamperedToken1 = Buffer.from(`${ip}|${id}|${expires}|${flippedSig1}`).toString('base64url');
      expect(verifyVstepSessionToken(tamperedToken1, clientIp, testId)).toBe(false);

      // 2. Flip middle char in signature
      const mid = Math.floor(sig.length / 2);
      const flippedSig2 =
        sig.slice(0, mid) + (sig[mid] === '0' ? '1' : '0') + sig.slice(mid + 1);
      const tamperedToken2 = Buffer.from(`${ip}|${id}|${expires}|${flippedSig2}`).toString('base64url');
      expect(verifyVstepSessionToken(tamperedToken2, clientIp, testId)).toBe(false);

      // 3. Truncate signature
      const truncatedSig = sig.slice(0, 32);
      const tamperedToken3 = Buffer.from(`${ip}|${id}|${expires}|${truncatedSig}`).toString('base64url');
      expect(verifyVstepSessionToken(tamperedToken3, clientIp, testId)).toBe(false);

      // 4. All-zero signature
      const zeroSig = '0'.repeat(64);
      const tamperedToken4 = Buffer.from(`${ip}|${id}|${expires}|${zeroSig}`).toString('base64url');
      expect(verifyVstepSessionToken(tamperedToken4, clientIp, testId)).toBe(false);

      // 5. Signature transplant from another token
      const otherToken = generateVstepSessionToken('1.2.3.4', 'vstep-mock-02');
      const otherSig = Buffer.from(otherToken, 'base64url').toString('utf8').split('|')[3];
      const transplantedToken = Buffer.from(`${ip}|${id}|${expires}|${otherSig}`).toString('base64url');
      expect(verifyVstepSessionToken(transplantedToken, clientIp, testId)).toBe(false);

      // Test route rejection for tampered signatures
      for (const t of [tamperedToken1, tamperedToken2, tamperedToken3, tamperedToken4, transplantedToken]) {
        const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': clientIp,
          },
          body: JSON.stringify({
            testId,
            sessionToken: t,
            answers: {},
          }),
        });
        const submitRes = await handleSubmit(submitReq);
        expect(submitRes.status).toBe(401);
      }
    });

    await runner.it('SEC-1.6: Truncated base64 strings and malformed formatting return false safely', async () => {
      const clientIp = '10.99.6.1';
      const testId = 'vstep-mock-01';
      const validToken = generateVstepSessionToken(clientIp, testId);

      const malformedCases = [
        '',
        '   ',
        'not_base64!@#$%',
        validToken.slice(0, 1),
        validToken.slice(0, 5),
        validToken.slice(0, 10),
        validToken.slice(0, Math.floor(validToken.length / 2)),
        validToken.slice(0, -2),
        validToken.slice(1),
        Buffer.from('part1|part2').toString('base64url'),
        Buffer.from('part1|part2|part3').toString('base64url'),
        Buffer.from('part1|part2|part3|part4|extra_part').toString('base64url'),
        Buffer.from(`${clientIp}|${testId}|NaN|0000`).toString('base64url'),
        Buffer.from(`${clientIp}|${testId}|Infinity|0000`).toString('base64url'),
        Buffer.from(`${clientIp}|${testId}|-999999|0000`).toString('base64url'),
      ];

      for (const malformed of malformedCases) {
        expect(verifyVstepSessionToken(malformed, clientIp, testId)).toBe(false);

        const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': clientIp,
          },
          body: JSON.stringify({
            testId,
            sessionToken: malformed,
            answers: {},
          }),
        });
        const submitRes = await handleSubmit(submitReq);
        expect(submitRes.status).toBe(401);
      }
    });

    await runner.it('SEC-1.7: Missing or undefined session tokens are rejected with 401 on submit and explain', async () => {
      const clientIp = '10.99.7.1';
      const testId = 'vstep-mock-01';

      // 1. Submit without token
      const noTokenSubmitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIp,
        },
        body: JSON.stringify({
          testId,
          answers: {},
        }),
      });
      const noTokenRes = await handleSubmit(noTokenSubmitReq);
      expect(noTokenRes.status).toBe(401);
      const noTokenData = await noTokenRes.json();
      expect(noTokenData.success).toBe(false);

      // 2. Submit with null token
      const nullTokenReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIp,
        },
        body: JSON.stringify({
          testId,
          sessionToken: null,
          answers: {},
        }),
      });
      const nullTokenRes = await handleSubmit(nullTokenReq);
      expect(nullTokenRes.status).toBe(401);

      // 3. Explain without token
      const noTokenExplainReq = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': clientIp,
        },
        body: JSON.stringify({
          testId,
          questionId: 'L1Q1',
        }),
      });
      const explainRes = await handleExplain(noTokenExplainReq);
      expect(explainRes.status).toBe(401);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 2: Comprehensive Zero-Bulk-Leak Sweep across ALL 190 Catalog Items
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Challenger M4.1 - Suite 2: 190 Catalog Items Zero-Bulk-Leak Sweep', async () => {
    await runner.it('SEC-2.1: Catalog index integrity verifies precisely 190 items', () => {
      const catalog = getVstepCatalog();
      expect(catalog).toBeDefined();
      expect(catalog.items).toBeDefined();
      expect(catalog.items.length).toBe(190);
      expect(catalog.totalExams + catalog.totalPracticeSets).toBe(190);
    });

    await runner.it('SEC-2.2: Deep recursive audit on ALL 190 catalog items proves EXACTLY 0 sensitive keys in safe mode', () => {
      const catalog = getVstepCatalog();
      let auditedExams = 0;
      let auditedSections = 0;
      let auditedTasks = 0;
      let auditedQuestions = 0;
      let totalViolations = 0;
      const violationDetails: string[] = [];

      const sourceCounts: Record<string, number> = {};

      for (const item of catalog.items) {
        const source = item.source || 'unknown';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;

        const safeExam = loadVstepExamSafe(item.id);
        expect(safeExam).toBeDefined();
        if (!safeExam) {
          throw new Error(`Failed to load safe exam for catalog item: ${item.id}`);
        }

        auditedExams++;
        if (Array.isArray(safeExam.sections)) {
          auditedSections += safeExam.sections.length;
          for (const section of safeExam.sections) {
            if (Array.isArray(section.tasks)) {
              auditedTasks += section.tasks.length;
              for (const task of section.tasks) {
                if (Array.isArray(task.questions)) {
                  auditedQuestions += task.questions.length;
                }
              }
            }
          }
        }

        // Deep recursive key scan across all nested properties
        const check = countSensitiveKeysDeep(safeExam);
        if (check.count > 0) {
          totalViolations += check.count;
          violationDetails.push(
            `Item ${item.id}: found ${check.count} violations -> ${check.violations.join(', ')}`
          );
        }
      }

      console.log(`    [Audited Sources] ${JSON.stringify(sourceCounts)}`);
      console.log(`    [Audited Metrics] Exams: ${auditedExams}/190 | Sections: ${auditedSections} | Tasks: ${auditedTasks} | Questions: ${auditedQuestions}`);

      if (totalViolations > 0) {
        console.error('    [LEAK DETECTED]:', violationDetails.slice(0, 5));
      }

      expect(auditedExams).toBe(190);
      expect(auditedQuestions).toBeGreaterThan(3000);
      expect(totalViolations).toBe(0);
    });

    await runner.it('SEC-2.3: Empirical contrast proof: Raw exams contain sensitive keys that safe exams eradicate', () => {
      const sampleIds = [
        'vstep-mock-01',
        'vstep-mock-10',
        'vstep-listening-01',
        'vstep-reading-01',
        'vstep-reading-onthi-01',
        'vstep-reading-ets-01',
        'vstep-exam-vnu-01',
      ];

      for (const id of sampleIds) {
        const rawExam = loadRawVstepExam(id);
        const safeExam = loadVstepExamSafe(id);

        expect(rawExam).toBeDefined();
        expect(safeExam).toBeDefined();

        const rawScan = countSensitiveKeysDeep(rawExam);
        const safeScan = countSensitiveKeysDeep(safeExam);

        // The raw exam MUST contain answers/explanations
        expect(rawScan.count).toBeGreaterThan(0);
        // The safe exam MUST contain 0
        expect(safeScan.count).toBe(0);

        // Spot-check questions
        const rawFirstQ = rawExam?.sections[0]?.tasks[0]?.questions?.[0];
        const safeFirstQ = safeExam?.sections[0]?.tasks[0]?.questions?.[0];

        if (rawFirstQ) {
          expect(typeof rawFirstQ.answer).toBe('number');
        }
        if (safeFirstQ) {
          expect(safeFirstQ.answer).toBeUndefined();
          expect((safeFirstQ as any).explanationVi).toBeUndefined();
          expect((safeFirstQ as any).correctAnswer).toBeUndefined();
        }
      }
    });

    await runner.it('SEC-2.4: Synthetic dirty exam scrubbing eliminates all 10 sensitive keys from arbitrary nesting', () => {
      const dirtyExam: any = {
        id: 'synthetic-dirty-01',
        title: 'Dirty Exam with all 10 sensitive keys',
        answer: 99,
        correctAnswer: 'B',
        correctOptionIndex: 2,
        explanation: 'Top level explanation',
        explanationVi: 'Top level Vietnamese explanation',
        tapescript: 'Top level audio transcript',
        transcript: 'Top level transcript',
        analysis: 'Top level grammatical analysis',
        solution: 'Top level solution step',
        suggestion: 'Top level writing suggestion',
        sections: [
          {
            id: 'sec-1',
            type: 'reading',
            answer: 'nested-sec-answer',
            explanation: 'nested-sec-explanation',
            tasks: [
              {
                id: 'task-1',
                tapescript: 'nested-task-tapescript',
                transcript: 'nested-task-transcript',
                solution: 'nested-task-solution',
                passage: {
                  text: 'Passage text',
                  analysis: 'passage-analysis',
                  explanationVi: 'passage-explanation',
                },
                questions: [
                  {
                    id: 'q1',
                    prompt: 'What is X?',
                    answer: 3,
                    correctAnswer: 3,
                    correctOptionIndex: 3,
                    explanation: 'Deep question explanation',
                    explanationVi: 'Deep question Vietnamese explanation',
                    analysis: 'Deep question analysis',
                    solution: 'Deep question solution',
                    suggestion: 'Deep question suggestion',
                    metadata: {
                      deepAnswer: 1,
                      answer: 2,
                      explanation: 'ultra-deep',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const cleaned = stripSensitiveVstepData(dirtyExam as VstepExam);
      const check = countSensitiveKeysDeep(cleaned);

      expect(check.count).toBe(0);
      for (const key of SENSITIVE_VSTEP_KEYS) {
        expect((cleaned as any)[key]).toBeUndefined();
        expect((cleaned.sections[0] as any)[key]).toBeUndefined();
        expect((cleaned.sections[0].tasks[0] as any)[key]).toBeUndefined();
        expect((cleaned.sections[0].tasks[0].passage as any)[key]).toBeUndefined();
        expect((cleaned.sections[0].tasks[0].questions![0] as any)[key]).toBeUndefined();
        expect(((cleaned.sections[0].tasks[0].questions![0] as any).metadata as any)[key]).toBeUndefined();
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 3: Cache Immutability Stress & Multi-Pass Mutation Testing
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Challenger M4.1 - Suite 3: Cache Immutability Stress', async () => {
    await runner.it('SEC-3.1: Hostile mutation on safe exam object does not corrupt subsequent loads or raw master cache', () => {
      clearVstepExamCache();

      // Step 1: Load safe exam
      const safeExam1 = loadVstepExamSafe('vstep-mock-01');
      expect(safeExam1).toBeDefined();

      // Step 2: Ruthlessly mutate safeExam1
      (safeExam1 as any).HOSTILE_INJECTION = 'ATTACKER_DATA';
      safeExam1!.title = 'MUTATED_TITLE_HACKED';
      if (safeExam1!.sections[0]?.tasks[0]) {
        (safeExam1!.sections[0].tasks[0] as any).tapescript = 'HACKED_TAPESCRIPT';
        if (safeExam1!.sections[0].tasks[0].questions?.[0]) {
          (safeExam1!.sections[0].tasks[0].questions[0] as any).answer = 999;
          (safeExam1!.sections[0].tasks[0].questions[0] as any).explanationVi = 'HACKED_EXPLANATION';
        }
      }
      safeExam1!.sections.pop(); // delete section

      // Step 3: Load fresh safe exam
      const safeExam2 = loadVstepExamSafe('vstep-mock-01');
      expect(safeExam2).toBeDefined();
      expect((safeExam2 as any).HOSTILE_INJECTION).toBeUndefined();
      expect(safeExam2!.title).not.toBe('MUTATED_TITLE_HACKED');
      expect(safeExam2!.sections.length).toBeGreaterThan(1);
      const safe2Task = safeExam2!.sections[0]?.tasks[0];
      expect((safe2Task as any)?.tapescript).toBeUndefined();
      const safe2Q = safe2Task?.questions?.[0];
      expect(safe2Q?.answer).toBeUndefined();
      expect((safe2Q as any)?.explanationVi).toBeUndefined();

      // Step 4: Load raw exam and assert master pristine state
      const rawExam = loadRawVstepExam('vstep-mock-01');
      expect(rawExam).toBeDefined();
      expect((rawExam as any).HOSTILE_INJECTION).toBeUndefined();
      expect(rawExam!.title).not.toBe('MUTATED_TITLE_HACKED');
      const rawTask = rawExam!.sections[0]?.tasks[0];
      expect(typeof rawTask?.tapescript).toBe('string');
      expect(rawTask?.tapescript).not.toBe('HACKED_TAPESCRIPT');
      const rawQ = rawTask?.questions?.[0];
      expect(typeof rawQ?.answer).toBe('number');
      expect(rawQ?.answer).not.toBe(999);
      expect(rawQ?.answer).toBe(0);
    });

    await runner.it('SEC-3.2: 100-Pass Rapid Mutation Stress across 10 diverse exams guarantees 0 contamination', () => {
      const examPool = [
        'vstep-mock-01',
        'vstep-mock-02',
        'vstep-mock-15',
        'vstep-listening-05',
        'vstep-listening-20',
        'vstep-reading-02',
        'vstep-reading-10',
        'vstep-reading-onthi-05',
        'vstep-reading-ets-02',
        'vstep-exam-vnu-01',
      ];

      // Execute 100 rounds of hostile modifications
      for (let round = 0; round < 100; round++) {
        const testId = examPool[round % examPool.length];
        const safe = loadVstepExamSafe(testId);
        expect(safe).toBeDefined();

        // Mutate arbitrarily
        (safe as any)[`ROUNDS_${round}`] = true;
        if (safe!.sections[0]) {
          safe!.sections[0].label = `POISONED_ROUND_${round}`;
          if (safe!.sections[0].tasks[0]?.questions?.[0]) {
            (safe!.sections[0].tasks[0].questions[0] as any).answer = round;
            (safe!.sections[0].tasks[0].questions[0] as any).correctOptionIndex = round;
          }
        }
      }

      // After 100 hostile passes, re-audit every single exam in pool
      for (const testId of examPool) {
        const freshSafe = loadVstepExamSafe(testId);
        expect(freshSafe).toBeDefined();

        // Must have 0 sensitive keys
        const safeScan = countSensitiveKeysDeep(freshSafe);
        expect(safeScan.count).toBe(0);

        // Must not contain any ROUNDS_* properties
        for (let r = 0; r < 100; r++) {
          expect((freshSafe as any)[`ROUNDS_${r}`]).toBeUndefined();
        }

        // Must not contain POISONED label
        expect(freshSafe!.sections[0].label.includes('POISONED')).toBe(false);

        // Raw master must have genuine answers intact
        const freshRaw = loadRawVstepExam(testId);
        expect(freshRaw).toBeDefined();
        const rawQ = freshRaw!.sections[0]?.tasks[0]?.questions?.[0];
        if (rawQ) {
          expect(typeof rawQ.answer).toBe('number');
          expect(rawQ.answer).toBeGreaterThanOrEqual(0);
          expect(rawQ.answer).toBeLessThanOrEqual(3);
        }
      }
    });

    await runner.it('SEC-3.3: Interleaved parallel mutation stress across concurrent workers', async () => {
      const concurrency = 40;
      const tasks = Array.from({ length: concurrency }, async (_, idx) => {
        const testId = idx % 2 === 0 ? 'vstep-mock-01' : 'vstep-listening-01';

        if (idx % 3 === 0) {
          // Mutating attacker worker
          const safe = loadVstepExamSafe(testId);
          if (safe) {
            (safe as any).WORKER_POISON = idx;
            if (safe.sections[0]?.tasks[0]?.questions?.[0]) {
              (safe.sections[0].tasks[0].questions[0] as any).answer = 8888;
            }
          }
        } else {
          // Legitimate candidate worker
          const safe = loadVstepExamSafe(testId);
          expect(safe).toBeDefined();
          expect((safe as any).WORKER_POISON).toBeUndefined();

          const scan = countSensitiveKeysDeep(safe);
          expect(scan.count).toBe(0);

          if (safe!.sections[0]?.tasks[0]?.questions?.[0]) {
            expect(safe!.sections[0].tasks[0].questions[0].answer).toBeUndefined();
          }
        }
      });

      await Promise.all(tasks);

      // Final post-concurrency verification
      const finalSafeMock = loadVstepExamSafe('vstep-mock-01');
      expect((finalSafeMock as any).WORKER_POISON).toBeUndefined();
      expect(countSensitiveKeysDeep(finalSafeMock).count).toBe(0);

      const finalRawMock = loadRawVstepExam('vstep-mock-01');
      expect((finalRawMock as any).WORKER_POISON).toBeUndefined();
      const rawQ = finalRawMock!.sections[0]?.tasks[0]?.questions?.[0];
      expect(typeof rawQ?.answer).toBe('number');
    });
  });

  return runner.getStats();
}

if (require.main === module) {
  const runner = new TestRunner();
  runChallengerSecurityTests(runner).then((stats) => {
    console.log('\n═════════════════════════════════════════════════════════════════════════════');
    console.log(`  CHALLENGER M4.1 ADVERSARIAL SECURITY VERIFICATION RESULTS`);
    console.log(`  Total Tests: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
    console.log(`  Execution Time: ${stats.durationMs}ms`);
    console.log('═════════════════════════════════════════════════════════════════════════════\n');
    if (stats.failed > 0) {
      process.exit(1);
    }
  });
}
