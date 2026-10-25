/**
 * Tier 2: Boundary & Corner Cases Test Suite for VSTEP Standardized Exam Engine
 *
 * Verifies edge cases, extreme inputs, boundary transitions, and defensive resilience:
 * 1. Score & Response Extremes (10.0/C1, 0.0/A2, empty submissions, clamping)
 * 2. Fractional Rounding & CEFR Boundary Transitions (3.75 -> 4.0 B1, 5.75 -> 6.0 B2, 8.25 -> 8.5 C1)
 * 3. Cryptographic Session Token & Tampering Boundaries (tampered payload, sig, IP, expired)
 * 4. Honeypot Canary & Malicious Scraper Traps (canary IDs, ?dump=true, _hp_trap, poisoning)
 * 5. Storage Corruptions & Anti-Duplication Corner Cases (corrupt JSON, exhausted unseen, zero bank)
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  oracleMoetRound,
  oracleCefrLevel,
  oracleListeningScore,
  oracleReadingScore,
} from './test-harness';

import {
  roundVstepScore,
  calculateListeningScore,
  calculateReadingScore,
  getCefrLevel,
  calculateVstepScore,
} from '../../src/lib/vstep-scoring';

import {
  loadRawVstepExam,
  loadVstepExamSafe,
  getVstepQuestionExplanation,
  loadVstepSkillPractice,
} from '../../src/lib/vstep-test-loader';

import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
  isVstepHoneypot,
  flagClientAsBot,
  isClientFlaggedAsBot,
  poisonVstepQuestion,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  CANARY_VSTEP_IDS,
} from '../../src/lib/vstep-anti-scraping';

import {
  VSTEP_HISTORY_STORAGE_KEY,
  getVstepHistory,
  recordVstepQuestionAnswer,
  batchRecordVstepAnswers,
  getVstepProgressStats,
  resetAllVstepProgress,
} from '../../src/lib/vstep-history';

import { VstepQuestion } from '../../src/lib/vstep-types';

export async function runTier2Tests(runner: TestRunner) {
  await runner.describe('Tier 2: Boundary 1 — Score & Response Extremes', async () => {
    // B1.1
    await runner.it('B1.1: All correct answers yield perfect 10.0 score and C1 CEFR classification', () => {
      const lScore = calculateListeningScore(35, 35);
      const rScore = calculateReadingScore(40, 40);
      expect(lScore).toBe(10.0);
      expect(rScore).toBe(10.0);

      const composite = calculateVstepScore({
        listeningCorrect: 35,
        listeningTotal: 35,
        readingCorrect: 40,
        readingTotal: 40,
        writingScore: 10.0,
        speakingScore: 10.0,
      });
      expect(composite.overallScore).toBe(10.0);
      expect(composite.cefrLevel).toBe('C1');
    });

    // B1.2
    await runner.it('B1.2: All wrong answers yield 0.0 score and A2 (Dưới B1) CEFR classification', () => {
      const lScore = calculateListeningScore(0, 35);
      const rScore = calculateReadingScore(0, 40);
      expect(lScore).toBe(0);
      expect(rScore).toBe(0);

      const composite = calculateVstepScore({
        listeningCorrect: 0,
        listeningTotal: 35,
        readingCorrect: 0,
        readingTotal: 40,
        writingScore: 0.0,
        speakingScore: 0.0,
      });
      expect(composite.overallScore).toBe(0);
      expect(composite.cefrLevel).toBe('A2');
    });

    // B1.3
    await runner.it('B1.3: Empty submissions with 0 answered questions yield 0.0 overall and A2', () => {
      const composite = calculateVstepScore({
        partBreakdown: {},
      });
      expect(composite.overallScore).toBe(0);
      expect(composite.cefrLevel).toBe('A2');
    });

    // B1.4
    await runner.it('B1.4: Extreme clamping: negative correct count clamped to 0, excess clamped to 10.0', () => {
      expect(calculateListeningScore(-10, 35)).toBe(0);
      expect(calculateReadingScore(-5, 40)).toBe(0);
      expect(calculateListeningScore(100, 35)).toBe(10.0);
      expect(calculateReadingScore(999, 40)).toBe(10.0);
      expect(roundVstepScore(-3.5)).toBe(0);
      expect(roundVstepScore(15.5)).toBe(10);
    });

    // B1.5
    await runner.it('B1.5: Single correct answer out of 40 yields raw 0.25 -> rounded to 0.5 (A2)', () => {
      // 1 / 40 * 10 = 0.25 -> rounded to 0.5
      const score = calculateReadingScore(1, 40);
      expect(score).toBe(0.5);
      expect(getCefrLevel(score)).toBe('A2');
    });

    // B1.6
    await runner.it('B1.6: Exact passing threshold: 16/40 in Reading yields exactly 4.0 (B1 entry)', () => {
      // 16 / 40 * 10 = 4.0
      const score = calculateReadingScore(16, 40);
      expect(score).toBe(4.0);
      expect(getCefrLevel(score)).toBe('B1');
    });
  });

  await runner.describe('Tier 2: Boundary 2 — Fractional Rounding & CEFR Boundary Transitions', async () => {
    // B2.1
    await runner.it('B2.1: MOET boundary at 3.75: 3.74 -> 3.5 (A2) vs 3.75 -> 4.0 (B1 pass)', () => {
      const below = roundVstepScore(3.74);
      expect(below).toBe(3.5);
      expect(getCefrLevel(below)).toBe('A2');

      const pass = roundVstepScore(3.75);
      expect(pass).toBe(4.0);
      expect(getCefrLevel(pass)).toBe('B1');
    });

    // B2.2
    await runner.it('B2.2: MOET boundary at 5.75: 5.74 -> 5.5 (B1) vs 5.75 -> 6.0 (B2)', () => {
      const b1 = roundVstepScore(5.74);
      expect(b1).toBe(5.5);
      expect(getCefrLevel(b1)).toBe('B1');

      const b2 = roundVstepScore(5.75);
      expect(b2).toBe(6.0);
      expect(getCefrLevel(b2)).toBe('B2');
    });

    // B2.3
    await runner.it('B2.3: MOET boundary at 8.25: 8.24 -> 8.0 (B2) vs 8.25 -> 8.5 (C1)', () => {
      const b2 = roundVstepScore(8.24);
      expect(b2).toBe(8.0);
      expect(getCefrLevel(b2)).toBe('B2');

      const c1 = roundVstepScore(8.25);
      expect(c1).toBe(8.5);
      expect(getCefrLevel(c1)).toBe('C1');
    });

    // B2.4
    await runner.it('B2.4: Lower rounding edge: 6.24 -> 6.0 vs 6.25 -> 6.5', () => {
      expect(roundVstepScore(6.24)).toBe(6.0);
      expect(roundVstepScore(6.25)).toBe(6.5);
    });

    // B2.5
    await runner.it('B2.5: Zero boundary: 0.24 -> 0.0 vs 0.25 -> 0.5', () => {
      expect(roundVstepScore(0.24)).toBe(0);
      expect(roundVstepScore(0.25)).toBe(0.5);
    });

    // B2.6
    await runner.it('B2.6: Upper boundary: 9.74 -> 9.5 vs 9.75 -> 10.0', () => {
      expect(roundVstepScore(9.74)).toBe(9.5);
      expect(roundVstepScore(9.75)).toBe(10.0);
      expect(getCefrLevel(9.74)).toBe('C1');
      expect(getCefrLevel(9.75)).toBe('C1');
    });
  });

  await runner.describe('Tier 2: Boundary 3 — Cryptographic Session Token & Tampering Boundaries', async () => {
    // B3.1
    await runner.it('B3.1: Valid session token verifies cleanly with matching IP and testId', () => {
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01');
      expect(verifyVstepSessionToken(token, '10.0.0.1', 'vstep-mock-01')).toBe(true);
    });

    // B3.2
    await runner.it('B3.2: Tampered payload: altering testId in decoded token fails validation', () => {
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01');
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const tampered = decoded.replace('vstep-mock-01', 'vstep-mock-02');
      const tamperedToken = Buffer.from(tampered).toString('base64url');

      expect(verifyVstepSessionToken(tamperedToken, '10.0.0.1', 'vstep-mock-02')).toBe(false);
    });

    // B3.3
    await runner.it('B3.3: Tampered signature bits cause verification rejection', () => {
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01');
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split('|');
      // Flip last hex char of signature
      const lastChar = parts[3].slice(-1);
      const flipped = lastChar === 'a' ? 'b' : 'a';
      parts[3] = parts[3].slice(0, -1) + flipped;

      const tamperedToken = Buffer.from(parts.join('|')).toString('base64url');
      expect(verifyVstepSessionToken(tamperedToken, '10.0.0.1', 'vstep-mock-01')).toBe(false);
    });

    // B3.4
    await runner.it('B3.4: Expired token (expiresAt in the past) fails validation', () => {
      // Generate token expired 60 seconds ago (-60)
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01', -60);
      expect(verifyVstepSessionToken(token, '10.0.0.1', 'vstep-mock-01')).toBe(false);
    });

    // B3.5
    await runner.it('B3.5: IP mismatch: token created for 10.0.0.1 is rejected when presented by 10.0.0.2', () => {
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01');
      expect(verifyVstepSessionToken(token, '10.0.0.2', 'vstep-mock-01')).toBe(false);
    });

    // B3.6
    await runner.it('B3.6: Malformed tokens (empty, non-base64, wrong segment count) return false without throwing', () => {
      expect(verifyVstepSessionToken('', '127.0.0.1', 'vstep-mock-01')).toBe(false);
      expect(verifyVstepSessionToken('NOT_A_VALID_TOKEN', '127.0.0.1', 'vstep-mock-01')).toBe(false);
      expect(verifyVstepSessionToken('a|b|c', '127.0.0.1', 'vstep-mock-01')).toBe(false);
      expect(verifyVstepSessionToken('????', '127.0.0.1', 'vstep-mock-01')).toBe(false);
    });
  });

  await runner.describe('Tier 2: Boundary 4 — Honeypot Canary & Scraper Traps', async () => {
    // B4.1
    await runner.it('B4.1: All CANARY_VSTEP_IDS are caught by isVstepHoneypot', () => {
      for (const canary of CANARY_VSTEP_IDS) {
        expect(isVstepHoneypot(canary)).toBe(true);
      }
    });

    // B4.2
    await runner.it('B4.2: Case-insensitivity: uppercase/mixed-case canary IDs trigger honeypot', () => {
      expect(isVstepHoneypot('VSTEP-CANARY-HONEYPOT')).toBe(true);
      expect(isVstepHoneypot('Vstep-Dump-All')).toBe(true);
      expect(isVstepHoneypot('TEST-VSTEP-999')).toBe(true);
    });

    // B4.3
    await runner.it('B4.3: Bot flagging state machine correctly flags and detects bot IPs', () => {
      const testIp = '203.0.113.199';
      expect(isClientFlaggedAsBot(testIp)).toBe(false);
      flagClientAsBot(testIp, 'Testing honeypot flag');
      expect(isClientFlaggedAsBot(testIp)).toBe(true);
    });

    // B4.4
    await runner.it('B4.4: Plausible data poisoning handles question without answer or undefined explanation', () => {
      const qNoAnswer: VstepQuestion = {
        id: 'Q_NO_ANS',
        type: 'mcq',
        question: 'Prompt without answer',
        options: ['A', 'B', 'C', 'D'],
      };
      const poisoned = poisonVstepQuestion(qNoAnswer);
      expect(typeof poisoned.answer).toBe('number');
      expect(typeof poisoned.explanationVi).toBe('string');
      expect(poisoned.explanationVi?.length).toBeGreaterThan(10);
    });

    // B4.5
    await runner.it('B4.5: Steganographic watermark handles edge strings (short, no spaces, empty)', () => {
      // Empty text returns as is
      expect(embedInvisibleWatermark('', 'payload')).toBe('');
      // Text shorter than 5 chars returns as is
      expect(embedInvisibleWatermark('abc', 'payload')).toBe('abc');
      // Empty payload returns text unchanged
      expect(embedInvisibleWatermark('Long enough text', '')).toBe('Long enough text');
      // Extract from unwatermarked text returns null
      expect(extractInvisibleWatermark('Plain text without watermark')).toBeNull();
    });
  });

  await runner.describe('Tier 2: Boundary 5 — Storage Corruptions & Anti-Duplication Corner Cases', async () => {
    runner.beforeEach(() => {
      setupMockBrowserEnvironment();
      resetAllVstepProgress();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    // B5.1
    await runner.it('B5.1: Corrupted JSON in localStorage returns empty store safely without crashing', () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, 'INVALID_JSON_{{[{');
      }
      const history = getVstepHistory();
      expect(history).toEqual({});
    });

    // B5.2
    await runner.it('B5.2: Unseen mode with exhausted questions (all excluded) gracefully preserves available tasks', () => {
      // Reading practice has 40 questions; exclude all 40 questions from Passage 1
      const p1Excluded = ['R1Q1', 'R1Q2', 'R1Q3', 'R1Q4', 'R1Q5', 'R1Q6', 'R1Q7', 'R1Q8', 'R1Q9', 'R1Q10'];
      const practice = loadVstepSkillPractice('reading', 'unseen', p1Excluded);
      expect(practice).not.toBeNull();
      // Tasks from passages 2, 3, 4 should still be available
      const remainingQs: string[] = [];
      practice?.sections.forEach((sec) => {
        sec.tasks.forEach((t) => {
          t.questions?.forEach((q) => remainingQs.push(q.id));
        });
      });
      expect(remainingQs.length).toBeGreaterThan(0);
      for (const exId of p1Excluded) {
        expect(remainingQs.includes(exId)).toBe(false);
      }
    });

    // B5.3
    await runner.it('B5.3: Empty excluded IDs list in unseen mode returns complete section tasks', () => {
      const practice = loadVstepSkillPractice('reading', 'unseen', []);
      expect(practice).not.toBeNull();
      const taskCount = practice?.sections[0].tasks.length || 0;
      expect(taskCount).toBeGreaterThanOrEqual(1);
    });

    // B5.4
    await runner.it('B5.4: Part progress calculation with 0 totalInBank returns 0% without NaN', () => {
      const stats = getVstepProgressStats('writing', 0);
      expect(stats.percentage).toBe(0);
      expect(Number.isNaN(stats.percentage)).toBe(false);
      expect(stats.answeredCount).toBe(0);
    });

    // B5.5
    await runner.it('B5.5: Non-existent questionId in getVstepQuestionExplanation returns null safely', () => {
      expect(getVstepQuestionExplanation('vstep-mock-01', 'UNKNOWN_Q_12345')).toBeNull();
      expect(getVstepQuestionExplanation('vstep-mock-01', '')).toBeNull();
      expect(getVstepQuestionExplanation('invalid-test-id', 'L1Q1')).toBeNull();
    });
  });
}

// Standalone execution support
if (require.main === module) {
  const runner = new TestRunner();
  runTier2Tests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n🏁 Tier 2 Finished: ${stats.passed}/${stats.total} passed (${stats.failed} failed)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
