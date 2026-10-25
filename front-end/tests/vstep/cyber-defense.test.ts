/**
 * Automated Cyber Defense & Zero-Bulk-Leak Test Suite for VSTEP Exam System
 * Location: tests/vstep/cyber-defense.test.ts
 *
 * Verifies 4 cohesive suites:
 * - Suite 1: Cryptographic HMAC Session Token Validation
 * - Suite 2: Zero-Bulk-Leak Multi-Source Sanitization & Cache Immutability
 * - Suite 3: Steganographic Invisible Watermarking & Origin Attribution
 * - Suite 4: Honeypot Canaries, Velocity Limiting & Plausible Data Poisoning
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect, SuiteStats } from './test-harness';
import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  isVstepHoneypot,
  flagClientAsBot,
  isClientFlaggedAsBot,
  checkVstepReadingVelocity,
  poisonVstepQuestion,
  CANARY_VSTEP_IDS,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '@/lib/vstep-anti-scraping';
import {
  loadRawVstepExam,
  loadVstepExamSafe,
  stripSensitiveVstepData,
  SENSITIVE_VSTEP_KEYS,
} from '@/lib/vstep-test-loader';
import { VstepExam, VstepQuestion } from '@/lib/vstep-types';
import { POST as handleExplain } from '@/app/api/vstep/explain/route';
import { POST as handleSubmit } from '@/app/api/vstep/submit/route';
import { GET as handleTest } from '@/app/api/vstep/test/route';

export async function runCyberDefenseTests(existingRunner?: TestRunner): Promise<SuiteStats> {
  const runner = existingRunner || new TestRunner();

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 1: Cryptographic HMAC Session Token Validation
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 1: Cryptographic HMAC Session Token Validation', async () => {
    await runner.it('CD-1.1: Valid token generated with matching clientIp and testId validates successfully', () => {
      const clientIp = '10.0.1.1';
      const testId = 'vstep-mock-01';
      const token = generateVstepSessionToken(clientIp, testId);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
      expect(verifyVstepSessionToken(token, clientIp, testId)).toBe(true);
    });

    await runner.it('CD-1.2: Expired token (expiresInSeconds <= 0 or past timestamp) is strictly rejected', () => {
      const clientIp = '10.0.1.2';
      const testId = 'vstep-mock-01';

      // Negative expiration window
      const expiredTokenNegative = generateVstepSessionToken(clientIp, testId, -60);
      expect(verifyVstepSessionToken(expiredTokenNegative, clientIp, testId)).toBe(false);

      // Expired in past via 0 seconds
      const expiredTokenZero = generateVstepSessionToken(clientIp, testId, -1);
      expect(verifyVstepSessionToken(expiredTokenZero, clientIp, testId)).toBe(false);

      // Manually crafted token with past timestamp (e.g. Unix epoch 1600000000)
      const pastTime = 1600000000;
      const rawPayload = `${clientIp}|${testId}|${pastTime}`;
      const { createHmac } = require('crypto');
      const sig = createHmac('sha256', 'lingopro_vstep_anti_scraping_guard_2026_b1b2c1')
        .update(rawPayload)
        .digest('hex');
      const craftedExpired = Buffer.from(`${rawPayload}|${sig}`).toString('base64url');
      expect(verifyVstepSessionToken(craftedExpired, clientIp, testId)).toBe(false);
    });

    await runner.it('CD-1.3: IP-mismatched token (token issued for IP A presented by IP B) is strictly rejected', () => {
      const ipA = '10.0.1.100';
      const ipB = '10.0.1.101';
      const testId = 'vstep-mock-01';

      const tokenA = generateVstepSessionToken(ipA, testId);
      expect(verifyVstepSessionToken(tokenA, ipB, testId)).toBe(false);
    });

    await runner.it('CD-1.4: TestId-mismatched token (token issued for test A presented for test B) is rejected', () => {
      const clientIp = '10.0.1.3';
      const testA = 'vstep-mock-01';
      const testB = 'vstep-mock-02';

      const tokenTestA = generateVstepSessionToken(clientIp, testA);
      expect(verifyVstepSessionToken(tokenTestA, clientIp, testB)).toBe(false);
    });

    await runner.it('CD-1.5: Malformed tokens (non-base64, truncated strings, invalid delimiter count) return false safely', () => {
      const clientIp = '10.0.1.4';
      const testId = 'vstep-mock-01';

      expect(verifyVstepSessionToken('', clientIp, testId)).toBe(false);
      expect(verifyVstepSessionToken('not-a-valid-token-at-all', clientIp, testId)).toBe(false);
      expect(verifyVstepSessionToken('###$$$%%%', clientIp, testId)).toBe(false);

      // Too few parts (2 parts)
      const twoParts = Buffer.from('10.0.1.4|vstep-mock-01').toString('base64url');
      expect(verifyVstepSessionToken(twoParts, clientIp, testId)).toBe(false);

      // Too many parts (5 parts)
      const fiveParts = Buffer.from('10.0.1.4|vstep-mock-01|9999999999|sig|extra').toString('base64url');
      expect(verifyVstepSessionToken(fiveParts, clientIp, testId)).toBe(false);

      // Non-numeric expiresAt
      const nanExpires = Buffer.from('10.0.1.4|vstep-mock-01|notanumber|sig').toString('base64url');
      expect(verifyVstepSessionToken(nanExpires, clientIp, testId)).toBe(false);
    });

    await runner.it('CD-1.6: Tampered payload or signature tampering (single bit flip in HMAC hex) is rejected', () => {
      const clientIp = '10.0.1.5';
      const testId = 'vstep-mock-01';
      const validToken = generateVstepSessionToken(clientIp, testId);

      const decoded = Buffer.from(validToken, 'base64url').toString('utf8');
      const parts = decoded.split('|');
      expect(parts.length).toBe(4);

      // Tamper signature by changing last char
      const lastChar = parts[3].slice(-1);
      const flippedChar = lastChar === 'a' ? 'b' : 'a';
      const tamperedSig = parts[3].slice(0, -1) + flippedChar;
      const tamperedSigToken = Buffer.from(`${parts[0]}|${parts[1]}|${parts[2]}|${tamperedSig}`).toString('base64url');
      expect(verifyVstepSessionToken(tamperedSigToken, clientIp, testId)).toBe(false);

      // Tamper IP payload
      const tamperedIpToken = Buffer.from(`10.0.1.99|${parts[1]}|${parts[2]}|${parts[3]}`).toString('base64url');
      expect(verifyVstepSessionToken(tamperedIpToken, '10.0.1.99', testId)).toBe(false);
    });

    await runner.it("CD-1.7: Wildcard token handling ('*' for IP or testId) functions correctly for internal callers", () => {
      const wildIpToken = generateVstepSessionToken('*', 'vstep-mock-01');
      expect(verifyVstepSessionToken(wildIpToken, '192.168.1.50', 'vstep-mock-01')).toBe(true);
      expect(verifyVstepSessionToken(wildIpToken, '10.0.0.1', 'vstep-mock-01')).toBe(true);

      const wildTestToken = generateVstepSessionToken('10.0.1.7', '*');
      expect(verifyVstepSessionToken(wildTestToken, '10.0.1.7', 'vstep-mock-01')).toBe(true);
      expect(verifyVstepSessionToken(wildTestToken, '10.0.1.7', 'vstep-exam-vnu-01')).toBe(true);
    });

    await runner.it('CD-1.8: NextRequest Integration: POST /api/vstep/explain without token or invalid token returns HTTP 401', async () => {
      const clientIp = '10.0.1.8';

      // 1. Missing session token
      const reqMissing = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
        body: JSON.stringify({ testId: 'vstep-mock-01', questionId: 'L1Q1' }),
      });
      const resMissing = await handleExplain(reqMissing);
      expect(resMissing.status).toBe(401);
      const dataMissing = await resMissing.json();
      expect(dataMissing.success).toBe(false);

      // 2. Invalid session token
      const reqInvalid = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
        body: JSON.stringify({ testId: 'vstep-mock-01', questionId: 'L1Q1', sessionToken: 'invalid_token_123' }),
      });
      const resInvalid = await handleExplain(reqInvalid);
      expect(resInvalid.status).toBe(401);
      const dataInvalid = await resInvalid.json();
      expect(dataInvalid.success).toBe(false);
    });

    await runner.it('CD-1.9: NextRequest Integration: POST /api/vstep/submit without token or invalid token returns HTTP 401', async () => {
      const clientIp = '10.0.1.9';

      // 1. Missing session token
      const reqMissing = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
        body: JSON.stringify({ testId: 'vstep-mock-01', answers: {} }),
      });
      const resMissing = await handleSubmit(reqMissing);
      expect(resMissing.status).toBe(401);
      const dataMissing = await resMissing.json();
      expect(dataMissing.success).toBe(false);
      expect(dataMissing.error).toBe('Phiên làm bài không hợp lệ hoặc đã hết hạn.');

      // 2. Invalid session token
      const reqInvalid = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
        body: JSON.stringify({ testId: 'vstep-mock-01', answers: {}, sessionToken: 'malicious_tampered_token' }),
      });
      const resInvalid = await handleSubmit(reqInvalid);
      expect(resInvalid.status).toBe(401);
      const dataInvalid = await resInvalid.json();
      expect(dataInvalid.success).toBe(false);

      // 3. Valid token with matching IP -> returns HTTP 200
      const validToken = generateVstepSessionToken(clientIp, 'vstep-mock-01');
      const reqValid = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
        body: JSON.stringify({ testId: 'vstep-mock-01', answers: {}, sessionToken: validToken }),
      });
      const resValid = await handleSubmit(reqValid);
      expect(resValid.status).toBe(200);
      const dataValid = await resValid.json();
      expect(dataValid.success).toBe(true);
      expect(dataValid.scoreResult).toBeDefined();
      expect(dataValid.reviewExam).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 2: Zero-Bulk-Leak Multi-Source Sanitization & Cache Immutability
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 2: Zero-Bulk-Leak Multi-Source Sanitization & Cache Immutability', async () => {
    const multiSourceSampleIds = [
      'vstep-mock-01',
      'vstep-mock-02',
      'vstep-listening-01',
      'vstep-listening-02',
      'vstep-reading-01',
      'vstep-reading-onthi-01',
      'vstep-reading-onthi-20',
      'vstep-reading-ets-01',
      'vstep-listening-ets-01',
      'vstep-exam-vnu-01',
    ];

    await runner.it('CD-2.1: Multi-Source Audit: Iterate sample tests across all 4 sources and verify 0 sensitive leaks', () => {
      for (const testId of multiSourceSampleIds) {
        const rawExam = loadRawVstepExam(testId);
        expect(rawExam).not.toBeNull();

        const safeExam = loadVstepExamSafe(testId);
        expect(safeExam).not.toBeNull();

        // Raw exam must contain questions
        let rawQuestionCount = 0;
        let rawAnswerCount = 0;
        for (const sec of rawExam!.sections) {
          for (const task of sec.tasks) {
            if (task.questions) {
              for (const q of task.questions) {
                rawQuestionCount++;
                if (typeof q.answer === 'number') {
                  rawAnswerCount++;
                }
              }
            }
          }
        }
        expect(rawQuestionCount).toBeGreaterThan(0);
        expect(rawAnswerCount).toBeGreaterThan(0);

        // Safe exam must contain ZERO answers, explanations, tapescripts, suggestions
        for (const sec of safeExam!.sections) {
          expect((sec as any).tapescript).toBeUndefined();
          expect((sec as any).explanationVi).toBeUndefined();
          expect((sec as any).suggestion).toBeUndefined();

          for (const task of sec.tasks) {
            expect(task.tapescript).toBeUndefined();
            expect(task.suggestion).toBeUndefined();
            expect((task as any).explanationVi).toBeUndefined();
            expect((task as any).answer).toBeUndefined();

            if (task.questions) {
              for (const q of task.questions) {
                expect(q.answer).toBeUndefined();
                expect(q.explanationVi).toBeUndefined();
                expect((q as any).suggestion).toBeUndefined();
                expect((q as any).tapescript).toBeUndefined();
                expect((q as any).correctAnswer).toBeUndefined();
                expect((q as any).correctOptionIndex).toBeUndefined();
                expect((q as any).explanation).toBeUndefined();
                expect((q as any).analysis).toBeUndefined();
                expect((q as any).solution).toBeUndefined();
              }
            }
          }
        }
      }
    });

    await runner.it('CD-2.2: Deep Recursive Key Scan: Check all nested keys against comprehensive sensitive regex across all samples', () => {
      const sensitiveKeyRegex =
        /^(answer|correctAnswer|correctOptionIndex|explanation|explanationVi|tapescript|transcript|analysis|solution|suggestion)$/i;

      function findSensitiveKeyViolations(obj: any, currentPath = ''): string[] {
        const violations: string[] = [];
        if (!obj || typeof obj !== 'object') return violations;

        for (const key of Object.keys(obj)) {
          const path = currentPath ? `${currentPath}.${key}` : key;
          if (sensitiveKeyRegex.test(key)) {
            violations.push(`${path}: ${JSON.stringify(obj[key])}`);
          }
          if (obj[key] && typeof obj[key] === 'object') {
            violations.push(...findSensitiveKeyViolations(obj[key], path));
          }
        }
        return violations;
      }

      for (const testId of multiSourceSampleIds) {
        const safeExam = loadVstepExamSafe(testId);
        expect(safeExam).not.toBeNull();

        const violations = findSensitiveKeyViolations(safeExam);
        if (violations.length > 0) {
          throw new Error(`Sensitive key leak found in ${testId}: ${violations.join(', ')}`);
        }
        expect(violations.length).toBe(0);
      }
    });

    await runner.it('CD-2.3: Synthetic Dirty Exam Scrubbing: Feed synthetic object containing all 10 sensitive keys into stripSensitiveVstepData; assert 100% eradication', () => {
      expect(SENSITIVE_VSTEP_KEYS.length).toBe(10);

      // Create a heavily contaminated synthetic VstepExam object
      const dirtyExam: any = {
        id: 'synthetic-dirty-01',
        title: 'Dirty Exam with all 10 sensitive keys',
        duration: 120,
        solution: 'Exam-level solution that must be stripped',
        sections: [
          {
            type: 'reading',
            label: 'Reading Section',
            timeLimit: 60,
            tapescript: 'Contaminated section tapescript',
            explanation: 'Contaminated section explanation',
            tasks: [
              {
                id: 'task-1',
                tapescript: 'Contaminated task tapescript',
                transcript: 'Contaminated task transcript',
                solution: 'Contaminated task solution',
                suggestion: 'Contaminated task suggestion',
                passage: {
                  title: 'Passage Title',
                  text: 'Passage Text',
                  analysis: 'Secret passage analysis',
                  explanationVi: 'Secret Vietnamese explanation',
                },
                questions: [
                  {
                    id: 'sq-1',
                    type: 'mcq',
                    question: 'What is the answer?',
                    options: ['A', 'B', 'C', 'D'],
                    answer: 2,
                    correctAnswer: 'C',
                    correctOptionIndex: 2,
                    explanation: 'Deep pedagogical explanation',
                    explanationVi: 'Lời giải chi tiết tiếng Việt',
                    analysis: 'Phân tích ngữ cảnh',
                    solution: 'Đáp án chi tiết',
                    suggestion: 'Gợi ý làm bài',
                    tapescript: 'Nested tapescript',
                    transcript: 'Nested transcript',
                  },
                ],
              },
            ],
          },
        ],
      };

      const cleanedExam = stripSensitiveVstepData(dirtyExam as VstepExam);

      // Verify each of the 10 keys is completely purged
      for (const key of SENSITIVE_VSTEP_KEYS) {
        expect((cleanedExam as any)[key]).toBeUndefined();
        expect((cleanedExam.sections[0] as any)[key]).toBeUndefined();
        expect((cleanedExam.sections[0].tasks[0] as any)[key]).toBeUndefined();
        expect((cleanedExam.sections[0].tasks[0].passage as any)[key]).toBeUndefined();
        expect((cleanedExam.sections[0].tasks[0].questions![0] as any)[key]).toBeUndefined();
      }

      // Verify legitimate fields are preserved
      expect(cleanedExam.id).toBe('synthetic-dirty-01');
      expect(cleanedExam.sections[0].tasks[0].questions![0].question).toBe('What is the answer?');
      expect(cleanedExam.sections[0].tasks[0].questions![0].options.length).toBe(4);
    });

    await runner.it('CD-2.4: In-Memory Cache Immutability: Mutate stripped exam object (add fake answers), re-read via loadRawVstepExam; assert master cache was NOT corrupted', () => {
      const testId = 'vstep-mock-01';

      // 1. Get raw exam to establish baseline
      const rawBefore = loadRawVstepExam(testId);
      expect(rawBefore).not.toBeNull();
      const originalAnswer = rawBefore!.sections[0].tasks[0].questions![0].answer;
      expect(typeof originalAnswer).toBe('number');

      // 2. Get safe exam and aggressively mutate it
      const safeExam = loadVstepExamSafe(testId);
      expect(safeExam).not.toBeNull();

      // Mutate question
      (safeExam!.sections[0].tasks[0].questions![0] as any).answer = 999;
      (safeExam!.sections[0].tasks[0].questions![0] as any).injectedSecret = 'hacker_payload';

      // Mutate root
      (safeExam as any).tamperedRoot = true;

      // 3. Re-read raw exam from cache
      const rawAfter = loadRawVstepExam(testId);
      expect(rawAfter).not.toBeNull();

      // Assert master cache is intact and uncorrupted
      expect(rawAfter!.sections[0].tasks[0].questions![0].answer).toBe(originalAnswer);
      expect((rawAfter!.sections[0].tasks[0].questions![0] as any).injectedSecret).toBeUndefined();
      expect((rawAfter as any).tamperedRoot).toBeUndefined();

      // 4. Re-read safe exam from cache
      const safeExamAfter = loadVstepExamSafe(testId);
      expect((safeExamAfter!.sections[0].tasks[0].questions![0] as any).answer).toBeUndefined();
      expect((safeExamAfter as any).tamperedRoot).toBeUndefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 3: Steganographic Invisible Watermarking & Origin Attribution
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 3: Steganographic Invisible Watermarking & Origin Attribution', async () => {
    await runner.it('CD-3.1: Watermark embedding injects zero-width characters (ZW_SENTINEL, ZW_ZERO, ZW_ONE)', () => {
      const text = 'Đáp án C chính xác vì bài nghe đã đề cập chi tiết.';
      const payload = 'IP:192.168.1.50|T:1700000000';
      const watermarked = embedInvisibleWatermark(text, payload);

      expect(watermarked).not.toBe(text);
      expect(watermarked.length).toBeGreaterThan(text.length);
      expect(watermarked.includes(ZW_SENTINEL)).toBe(true);
      expect(watermarked.includes(ZW_ZERO)).toBe(true);
      expect(watermarked.includes(ZW_ONE)).toBe(true);
    });

    await runner.it('CD-3.2: Visual invariance: text with stripped zero-width characters is 100% identical to original', () => {
      const originalText = 'Dựa theo ngữ cảnh bài thi, phương án A là lựa chọn tối ưu nhất.';
      const payload = 'USER:student_123|IP:10.0.0.9';
      const watermarked = embedInvisibleWatermark(originalText, payload);

      // Strip all zero-width characters
      const stripped = watermarked.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
      expect(stripped).toBe(originalText);
    });

    await runner.it('CD-3.3: Lossless extraction: extractInvisibleWatermark recovers exact embedded payload', () => {
      const text = 'Theo cấu trúc mệnh đề quan hệ rút gọn, phương án B là chính xác.';
      const payload = 'FORENSIC_AUDIT_MARK_2026_LINGOPRO';
      const watermarked = embedInvisibleWatermark(text, payload);

      const recovered = extractInvisibleWatermark(watermarked);
      expect(recovered).toBe(payload);
    });

    await runner.it('CD-3.4: Format resilience: handles ASCII, Vietnamese diacritics, long paragraphs, and single words', () => {
      const payload = 'IP:203.0.113.1|ATTRIBUTION_HASH';

      // 1. Plain ASCII
      const asciiText = 'According to paragraph 2, the primary mechanism of heat transfer is conduction.';
      const wm1 = embedInvisibleWatermark(asciiText, payload);
      expect(extractInvisibleWatermark(wm1)).toBe(payload);

      // 2. Vietnamese with complex diacritics
      const vnText = 'Căn cứ vào câu số 4 trong đoạn đối thoại, người phụ nữ đã khẳng định sẽ chuyển tiền vào thứ Sáu tuần tới.';
      const wm2 = embedInvisibleWatermark(vnText, payload);
      expect(extractInvisibleWatermark(wm2)).toBe(payload);

      // 3. Long paragraph (> 500 characters)
      const longText =
        'Hệ thống khảo thí chuẩn hóa VSTEP (Vietnamese Standardized Test of English Proficiency) được thiết kế nhằm đánh giá năng lực tiếng Anh từ bậc 3 đến bậc 5 theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam. Bài thi bao gồm bốn kỹ năng: Nghe hiểu, Đọc hiểu, Viết và Nói. Mỗi kỹ năng được chấm trên thang điểm 10.0 và được quy đổi ra điểm tổng thể theo quy chế của Bộ Giáo dục và Đào tạo.';
      const wm3 = embedInvisibleWatermark(longText, payload);
      expect(extractInvisibleWatermark(wm3)).toBe(payload);

      // 4. Single word with no spaces
      const singleWord = 'Infallible';
      const wm4 = embedInvisibleWatermark(singleWord, payload);
      expect(extractInvisibleWatermark(wm4)).toBe(payload);
    });

    await runner.it('CD-3.5: Negative extraction: unwatermarked plain text returns null', () => {
      expect(extractInvisibleWatermark('Plain text without any watermark characters')).toBeNull();
      expect(extractInvisibleWatermark('')).toBeNull();
      expect(extractInvisibleWatermark('Simple English sentence.')).toBeNull();
    });

    await runner.it('CD-3.6: Corrupted watermark resilience: truncated bitstream or missing end sentinel returns null safely', () => {
      const text = 'Văn bản mẫu để kiểm thử độ bền bỉ của thuật toán thủy vân số.';
      const payload = 'INTEGRITY_TOKEN';
      const watermarked = embedInvisibleWatermark(text, payload);

      // Corrupt 1: missing closing sentinel
      const missingEndSentinel = watermarked.slice(0, watermarked.lastIndexOf(ZW_SENTINEL));
      expect(extractInvisibleWatermark(missingEndSentinel)).toBeNull();

      // Corrupt 2: truncated bitstream (not multiple of 8)
      const startIdx = watermarked.indexOf(ZW_SENTINEL);
      const endIdx = watermarked.lastIndexOf(ZW_SENTINEL);
      const bitstream = watermarked.slice(startIdx + 1, endIdx);
      const truncatedBitstream =
        watermarked.slice(0, startIdx + 1) + bitstream.slice(0, 7) + watermarked.slice(endIdx);
      expect(extractInvisibleWatermark(truncatedBitstream)).toBeNull();
    });

    await runner.it('CD-3.7: On-demand explain API integration: explanation returned by POST /api/vstep/explain contains watermark with client IP', async () => {
      const clientIp = '10.0.3.7';
      const testId = 'vstep-exam-vnu-01';
      const questionId = 'vnu-l-q1'; // Has genuine explanationVi

      const sessionToken = generateVstepSessionToken(clientIp, testId);
      const req = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp, 'content-type': 'application/json' },
        body: JSON.stringify({ testId, questionId, sessionToken }),
      });

      const res = await handleExplain(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.explanationVi).toBeDefined();

      const extractedPayload = extractInvisibleWatermark(data.explanationVi);
      expect(extractedPayload).not.toBeNull();
      expect(extractedPayload!).toContain(`IP:${clientIp}`);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // SUITE 4: Honeypot Canaries, Velocity Limiting & Plausible Data Poisoning
  // ═════════════════════════════════════════════════════════════════════════════
  await runner.describe('Suite 4: Honeypot Canaries, Velocity Limiting & Plausible Data Poisoning', async () => {
    await runner.it('CD-4.1: Canary test IDs (vstep-canary-honeypot, vstep-dump-all, etc.) identified by isVstepHoneypot', () => {
      expect(CANARY_VSTEP_IDS.size).toBeGreaterThanOrEqual(6);

      const expectedCanaries = [
        'vstep-canary-honeypot',
        'vstep-dump-all',
        'vstep-test-0',
        'vstep-exam-0',
        'vstep-owl-canary',
        'test-vstep-999',
      ];

      for (const canary of expectedCanaries) {
        expect(isVstepHoneypot(canary)).toBe(true);
      }
    });

    await runner.it('CD-4.2: Case-insensitivity check: upper/mixed-case canary IDs trigger honeypot', () => {
      expect(isVstepHoneypot('VSTEP-CANARY-HONEYPOT')).toBe(true);
      expect(isVstepHoneypot('vStep-Dump-All')).toBe(true);
      expect(isVstepHoneypot('VSTEP-OWL-CANARY')).toBe(true);
      expect(isVstepHoneypot('TEST-VSTEP-999')).toBe(true);
    });

    await runner.it('CD-4.3: Legitimate test IDs return false', () => {
      const legitimateIds = [
        'vstep-mock-01',
        'vstep-mock-23',
        'vstep-listening-01',
        'vstep-reading-01',
        'vstep-reading-onthi-01',
        'vstep-reading-ets-01',
        'vstep-exam-vnu-01',
      ];

      for (const legitimateId of legitimateIds) {
        expect(isVstepHoneypot(legitimateId)).toBe(false);
      }
    });

    await runner.it('CD-4.4: Canary GET /api/vstep/test query (?dump=true or canary ID) returns HTTP 200 OK with poisoned exam', async () => {
      const clientIp = '10.0.4.4';

      // 1. Canary ID query
      const reqCanary = new NextRequest('http://localhost:3000/api/vstep/test?testId=vstep-canary-honeypot', {
        headers: { 'x-forwarded-for': clientIp },
      });
      const resCanary = await handleTest(reqCanary);
      expect(resCanary.status).toBe(200);
      const dataCanary = await resCanary.json();
      expect(dataCanary.success).toBe(true);
      expect(dataCanary.exam).toBeDefined();

      // 2. Dump query parameter on legitimate testId
      const reqDump = new NextRequest('http://localhost:3000/api/vstep/test?testId=vstep-mock-01&dump=true', {
        headers: { 'x-forwarded-for': clientIp },
      });
      const resDump = await handleTest(reqDump);
      expect(resDump.status).toBe(200);
      const dataDump = await resDump.json();
      expect(dataDump.success).toBe(true);
    });

    await runner.it('CD-4.5: Plausible Data Poisoning: answers shifted by (ans + 2) % 4, pedagogical explanations replaced', () => {
      const testCases: { original: number; expected: number }[] = [
        { original: 0, expected: 2 },
        { original: 1, expected: 3 },
        { original: 2, expected: 0 },
        { original: 3, expected: 1 },
      ];

      for (const { original, expected } of testCases) {
        const sampleQ: VstepQuestion = {
          id: `sample-q-${original}`,
          type: 'mcq',
          question: `Sample question with original answer ${original}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          answer: original,
          explanationVi: 'Lời giải thật ban đầu',
        };

        const poisoned = poisonVstepQuestion(sampleQ);
        expect(poisoned.answer).toBe(expected);
        expect(poisoned.explanationVi).not.toBe('Lời giải thật ban đầu');
        expect(poisoned.explanationVi!.length).toBeGreaterThan(20);
      }
    });

    await runner.it('CD-4.6: Honeypot form canary (_hp_trap): POST /api/vstep/submit with _hp_trap flags bot and returns poisoned review', async () => {
      const botIp = '198.51.100.1';

      const reqHoneypot = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'x-forwarded-for': botIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'vstep-mock-01',
          answers: { L1Q1: 0 },
          _hp_trap: 'autofill_hidden_honeypot_value',
        }),
      });

      const res = await handleSubmit(reqHoneypot);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.scoreResult).toBeDefined();
      expect(data.scoreResult.overallScore).toBe(6.5);
      expect(data.reviewExam).toBeDefined();

      // Verify that the client is flagged as bot
      expect(isClientFlaggedAsBot(botIp)).toBe(true);
    });

    await runner.it('CD-4.7: Honeypot explain canary (_hp_trap): POST /api/vstep/explain with _hp_trap returns decoy answer', async () => {
      const botIp = '198.51.100.2';

      const reqHoneypot = new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'x-forwarded-for': botIp, 'content-type': 'application/json' },
        body: JSON.stringify({
          testId: 'vstep-mock-01',
          questionId: 'L1Q1',
          _hp_trap: 'crawler_bot_trap_fill',
        }),
      });

      const res = await handleExplain(reqHoneypot);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.answer).toBe(2); // Decoy answer
      expect(data.explanationVi).toBeDefined();
      expect(isClientFlaggedAsBot(botIp)).toBe(true);
    });

    await runner.it('CD-4.8: Reading velocity defense: rapid queries (<1s x3) trigger bot detection for non-whitelisted IPs', () => {
      const velocityBotIp = '203.0.113.99';

      // Call 1: initial request (record created) -> allowed
      const r1 = checkVstepReadingVelocity(velocityBotIp);
      expect(r1).toBe(true);

      // Call 2: rapid request 1 (< 1s) -> allowed
      const r2 = checkVstepReadingVelocity(velocityBotIp);
      expect(r2).toBe(true);

      // Call 3: rapid request 2 (< 1s) -> allowed
      const r3 = checkVstepReadingVelocity(velocityBotIp);
      expect(r3).toBe(true);

      // Call 4: rapid request 3 (< 1s, count >= 3) -> flagged as bot, rejected
      const r4 = checkVstepReadingVelocity(velocityBotIp);
      expect(r4).toBe(false);

      expect(isClientFlaggedAsBot(velocityBotIp)).toBe(true);
    });
  });

  return runner.getStats();
}

// Standalone execution entrypoint
if (require.main === module) {
  runCyberDefenseTests()
    .then((stats) => {
      console.log('\n======================================================');
      console.log(`🏁 VSTEP CYBER DEFENSE SUITE: ${stats.passed}/${stats.total} PASSED | ${stats.failed} FAILED`);
      console.log('======================================================');
      if (stats.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error in VSTEP cyber defense test suite:', err);
      process.exit(1);
    });
}
