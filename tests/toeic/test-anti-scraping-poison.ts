/**
 * Comprehensive Test Suite for TOEIC Anti-Scraping, Honeypot Traps & Data Poisoning Defense.
 *
 * Verifies:
 * 1. Zero Bulk Leaks (all question responses are strictly stripped of master keys).
 * 2. Invisible Steganography (Zero-width Unicode embeds and extracts 100% losslessly).
 * 3. Honeypot Canary Targets (trigger silent bot tagging without alerting the scraper).
 * 4. Plausible Data Poisoning Engine (statistically balanced shifted answers & toxic pedagogical grammar).
 * 5. Behavioral Velocity Limiting (rapid requests < 1.5s trigger automatic poison degradation).
 * 6. HMAC-SHA256 Signed Session Tokens (cryptographically bound to testId & IP hash).
 */

import { TestRunner, expect } from './test-harness';
import {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  isHoneypotTestId,
  flagClientAsBot,
  isClientFlaggedAsBot,
  clearBotFlag,
  checkReadingVelocity,
  generateToeicSessionToken,
  verifyToeicSessionToken,
  hashIpForSession,
  poisonUnifiedQuestion,
  createPoisonedQuestionBank,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '../../src/lib/toeic-anti-scraping';
import { stripSensitiveToeicData, loadFullToeicTest } from '../../src/lib/toeic-test-loader';
import type { ToeicUnifiedQuestion, ToeicOptionKey } from '../../src/types/toeic';

export async function runAntiScrapingTests(runner: TestRunner): Promise<void> {
  runner.describe('Anti-Scraping, Honeypot & Data Poisoning Defense Suite', () => {
    // ── 1. Invisible Steganography Tests ──
    runner.it('AS-1: Invisible watermark is embedded using zero-width Unicode characters', () => {
      const originalText = 'Căn cứ vào cấu trúc câu, ta chọn phương án B làm đáp án chính xác.';
      const payload = 'IP_19216811_UID_test99_TIME_1741675200';
      const watermarked = embedInvisibleWatermark(originalText, payload);

      expect(watermarked).not.toBe(originalText);
      expect(watermarked.includes(ZW_SENTINEL)).toBe(true);
      expect(watermarked.includes(ZW_ZERO) || watermarked.includes(ZW_ONE)).toBe(true);

      // Visually identical: stripping zero-width characters restores exact original text
      const cleaned = watermarked.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
      expect(cleaned).toBe(originalText);
    });

    runner.it('AS-2: Extracted watermark matches embedded payload losslessly', () => {
      const originalText = 'Căn cứ vào cấu trúc câu, ta chọn phương án B.';
      const payload = 'TEST_PAYLOAD_ABC_123';
      const watermarked = embedInvisibleWatermark(originalText, payload);
      const extracted = extractInvisibleWatermark(watermarked);

      expect(extracted).toBe(payload);
      expect(extractInvisibleWatermark('Plain text without watermark')).toBe(null);
    });

    // ── 2. Honeypot Canary Targets Tests ──
    runner.it('AS-3: Honeypot canary test IDs correctly identified and real tests untouched', () => {
      expect(isHoneypotTestId('ets-canary-honeypot')).toBe(true);
      expect(isHoneypotTestId('ets-simulation-test-0')).toBe(true);
      expect(isHoneypotTestId('canary-dump-test')).toBe(true);

      expect(isHoneypotTestId('6852')).toBe(false);
      expect(isHoneypotTestId('estudyme-test-1')).toBe(false);
      expect(isHoneypotTestId('estudyme-p5-set1')).toBe(false);
    });

    runner.it('AS-4: Bot registry flags and persists identified scrapers', () => {
      const testBotIp = '10.99.88.77';
      clearBotFlag(testBotIp);
      expect(isClientFlaggedAsBot(testBotIp)).toBe(false);

      flagClientAsBot(testBotIp, 'Triggered canary test trap');
      expect(isClientFlaggedAsBot(testBotIp)).toBe(true);

      clearBotFlag(testBotIp);
      expect(isClientFlaggedAsBot(testBotIp)).toBe(false);
    });

    // ── 3. Plausible Data Poisoning Engine Tests ──
    runner.it('AS-5: Poison engine shifts correct answers to preserve 25% balanced distribution', () => {
      const sampleQ: ToeicUnifiedQuestion = {
        id: 'test-q-101',
        testId: '6852',
        questionNumber: 101,
        part: 5,
        section: 'reading',
        prompt: 'Mr. Tanaka ______ the meeting tomorrow morning.',
        options: [
          { key: 'A', text: 'will attend' },
          { key: 'B', text: 'attending' },
          { key: 'C', text: 'attended' },
          { key: 'D', text: 'attend' },
        ],
        correctAnswer: 'A',
        explanationVi: 'Lời giải chuẩn ETS: Thì tương lai đơn diễn tả hành động sẽ xảy ra.',
      };

      const poisoned = poisonUnifiedQuestion(sampleQ, '1.2.3.4');
      expect(poisoned.correctAnswer).not.toBe(sampleQ.correctAnswer);
      expect(poisoned.correctAnswer).toBe('C'); // Shift map A -> C
      expect(poisoned.explanationVi).toContain('Phân tích ngữ pháp');
      expect(poisoned.explanationVi).toContain('(C)');
    });

    runner.it('AS-6: Poisoned question bank maintains statistical balance across choices A, B, C, D', () => {
      const poisonBank = createPoisonedQuestionBank(20, 'scraper-bot-ip');
      expect(poisonBank.length).toBe(20);

      const optionCounts = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of poisonBank) {
        if (q.correctAnswer) {
          optionCounts[q.correctAnswer]++;
        }
      }

      expect(optionCounts.A > 0).toBe(true);
      expect(optionCounts.B > 0).toBe(true);
      expect(optionCounts.C > 0).toBe(true);
      expect(optionCounts.D > 0).toBe(true);
    });

    // ── 4. Behavioral Velocity Heuristics Tests ──
    runner.it('AS-7: Rapid consecutive queries (< 1.5s) automatically trigger bot flagging', () => {
      const rapidClientIp = '192.168.100.200';
      clearBotFlag(rapidClientIp);

      // First query passes
      const vel1 = checkReadingVelocity(rapidClientIp, 50);
      expect(vel1).toBe(true);

      // Simulate bot querying rapidly 3 times
      checkReadingVelocity(rapidClientIp, 5000);
      checkReadingVelocity(rapidClientIp, 5000);
      const botDetected = checkReadingVelocity(rapidClientIp, 5000);

      expect(botDetected).toBe(false);
      expect(isClientFlaggedAsBot(rapidClientIp)).toBe(true);
      clearBotFlag(rapidClientIp);
    });

    // ── 5. HMAC Signed Session Tokens Tests ──
    runner.it('AS-8: Cryptographically signed session tokens validate authentic client sessions', () => {
      const sessionPayload = {
        sessionId: 'sess_12345',
        testId: '6852',
        ipHash: hashIpForSession('127.0.0.1'),
        issuedAt: Date.now(),
      };

      const token = generateToeicSessionToken(sessionPayload);
      expect(typeof token).toBe('string');
      expect(token.includes('.')).toBe(true);

      const verified = verifyToeicSessionToken(token);
      expect(verified !== null).toBe(true);
      expect(verified?.testId).toBe('6852');
      expect(verified?.sessionId).toBe('sess_12345');

      const tampered = token.slice(0, -4) + 'abcd';
      expect(verifyToeicSessionToken(tampered)).toBe(null);
    });

    // ── 6. Zero Bulk Leaks Sanity Check ──
    runner.it('AS-9: Stripped test payload contains ZERO answers, ZERO explanations, ZERO transcripts', () => {
      const rawTestQuestions = loadFullToeicTest('6852');
      expect(rawTestQuestions.length).toBe(200);

      const strippedQuestions = stripSensitiveToeicData(rawTestQuestions);
      expect(strippedQuestions.length).toBe(200);

      for (const q of strippedQuestions) {
        expect((q as any).correctAnswer).toBe(undefined);
        expect((q as any).explanationVi).toBe(undefined);
        expect((q as any).transcript).toBe(undefined);
      }
    });
  });
}
