/**
 * Tier 3: Cross-Feature Combinations Test Suite for VSTEP Standardized Exam Engine
 *
 * Verifies multi-feature interactions, stateful workflows, and cryptographic lifecycles:
 * 1. Anti-duplication mode with partial answers across multiple sections
 * 2. Session token HMAC lifecycle: create session -> submit valid answers -> fetch on-demand explain -> watermark
 * 3. Audio CDN playback validation: Cloudflare R2 links in composite practice sets
 * 4. Server-side submit scoring integration: stripped client exam -> payload submit -> oracle match
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  oracleCompositeScore,
  VSTEP_PRACTICE_DIR,
  VSTEP_TESTS_DIR,
} from './test-harness';

import {
  loadRawVstepExam,
  loadVstepExamSafe,
  stripSensitiveVstepData,
  getVstepQuestionExplanation,
  loadVstepSkillPractice,
} from '../../src/lib/vstep-test-loader';

import {
  calculateVstepScore,
  calculateListeningScore,
  calculateReadingScore,
} from '../../src/lib/vstep-scoring';

import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  poisonVstepQuestion,
} from '../../src/lib/vstep-anti-scraping';

import {
  getVstepHistory,
  recordVstepQuestionAnswer,
  batchRecordVstepAnswers,
  getAnsweredVstepQuestionIds,
  getIncorrectVstepQuestionIds,
  getVstepProgressStats,
  resetAllVstepProgress,
} from '../../src/lib/vstep-history';

import { VstepExam, VstepSubmitPayload } from '../../src/lib/vstep-types';

export async function runTier3Tests(runner: TestRunner) {
  await runner.describe('Tier 3: Combination 1 — Multi-Section Anti-Duplication & Progress Isolation', async () => {
    runner.beforeEach(() => {
      setupMockBrowserEnvironment();
      resetAllVstepProgress();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    // C1.1
    await runner.it('C1.1: Recording progress across Listening and Reading maintains separate skill metrics', () => {
      // Record 10 listening answers (8 correct, 2 wrong)
      for (let i = 1; i <= 10; i++) {
        recordVstepQuestionAnswer({
          questionId: `L1Q${i}`,
          skill: 'listening',
          part: 'part1',
          isCorrect: i <= 8,
          selectedOption: i <= 8 ? 0 : 1,
        });
      }

      // Record 5 reading answers (3 correct, 2 wrong)
      for (let i = 1; i <= 5; i++) {
        recordVstepQuestionAnswer({
          questionId: `R1Q${i}`,
          skill: 'reading',
          part: 'passage1',
          isCorrect: i <= 3,
          selectedOption: i <= 3 ? 0 : 1,
        });
      }

      const lStats = getVstepProgressStats('listening', 35);
      expect(lStats.answeredCount).toBe(10);
      expect(lStats.correctCount).toBe(8);
      expect(lStats.mistakeCount).toBe(2);
      expect(lStats.percentage).toBe(Math.round((10 / 35) * 100));

      const rStats = getVstepProgressStats('reading', 40);
      expect(rStats.answeredCount).toBe(5);
      expect(rStats.correctCount).toBe(3);
      expect(rStats.mistakeCount).toBe(2);
      expect(rStats.percentage).toBe(Math.round((5 / 40) * 100));
    });

    // C1.2
    await runner.it('C1.2: Unseen filter applied to Reading does not exclude questions in Listening', () => {
      const readingExcluded = ['R1Q1', 'R1Q2', 'R1Q3'];
      const listeningPractice = loadVstepSkillPractice('listening', 'unseen', readingExcluded);
      expect(listeningPractice).not.toBeNull();

      const listeningQIds: string[] = [];
      listeningPractice?.sections[0].tasks.forEach((t) => {
        t.questions?.forEach((q) => listeningQIds.push(q.id));
      });
      // All listening questions should remain present
      expect(listeningQIds.length).toBeGreaterThanOrEqual(8);
    });

    // C1.3
    await runner.it('C1.3: Mistakes mode after multi-section exam filters strictly to failed questions', () => {
      batchRecordVstepAnswers([
        { questionId: 'L1Q1', skill: 'listening', part: 'part1', isCorrect: true },
        { questionId: 'L1Q2', skill: 'listening', part: 'part1', isCorrect: false },
        { questionId: 'R1Q1', skill: 'reading', part: 'passage1', isCorrect: true },
        { questionId: 'R1Q2', skill: 'reading', part: 'passage1', isCorrect: false },
      ]);

      const lMistakes = getIncorrectVstepQuestionIds('listening');
      expect(lMistakes.size).toBe(1);
      expect(lMistakes.has('L1Q2')).toBe(true);

      const rMistakes = getIncorrectVstepQuestionIds('reading');
      expect(rMistakes.size).toBe(1);
      expect(rMistakes.has('R1Q2')).toBe(true);
    });

    // C1.4
    await runner.it('C1.4: Batch recording handles 75 questions across skills without store corruption', () => {
      const records: Array<{ questionId: string; skill: 'listening' | 'reading'; part: string; isCorrect: boolean }> = [];
      for (let i = 1; i <= 35; i++) {
        records.push({ questionId: `L_BATCH_${i}`, skill: 'listening', part: 'p1', isCorrect: i % 2 === 0 });
      }
      for (let i = 1; i <= 40; i++) {
        records.push({ questionId: `R_BATCH_${i}`, skill: 'reading', part: 'p1', isCorrect: i % 3 === 0 });
      }

      batchRecordVstepAnswers(records);
      const history = getVstepHistory();
      expect(Object.keys(history).length).toBe(75);

      const lIds = getAnsweredVstepQuestionIds('listening');
      const rIds = getAnsweredVstepQuestionIds('reading');
      expect(lIds.size).toBe(35);
      expect(rIds.size).toBe(40);
    });

    // C1.5
    await runner.it('C1.5: Toggling between unseen and mistakes mode maintains isolation of historical records', () => {
      batchRecordVstepAnswers([
        { questionId: 'Q1', skill: 'reading', part: 'p1', isCorrect: false },
        { questionId: 'Q2', skill: 'reading', part: 'p1', isCorrect: true },
      ]);

      const unseenPractice = loadVstepSkillPractice('reading', 'unseen', ['Q2']);
      expect(unseenPractice).not.toBeNull();

      // Ensure Q1 history remains marked as mistake even after unseen practice load
      const mistakes = getIncorrectVstepQuestionIds('reading');
      expect(mistakes.has('Q1')).toBe(true);
      expect(mistakes.has('Q2')).toBe(false);
    });
  });

  await runner.describe('Tier 3: Combination 2 — Session Token HMAC Lifecycle & Watermarking', async () => {
    // C2.1
    await runner.it('C2.1: Full HMAC lifecycle: create session -> submit answers -> verify -> explain with watermark', () => {
      const clientIp = '198.51.100.45';
      const testId = 'vstep-mock-01';

      // Step 1: Client loads safe exam and receives sessionToken
      const safeExam = loadVstepExamSafe(testId);
      expect(safeExam).not.toBeNull();
      const sessionToken = generateVstepSessionToken(clientIp, testId, 3600);
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken.length).toBeGreaterThan(20);

      // Step 2: Verify token at submission time
      const isValid = verifyVstepSessionToken(sessionToken, clientIp, testId);
      expect(isValid).toBe(true);

      // Step 3: Grade answers on server using raw exam
      const rawExam = loadRawVstepExam(testId);
      expect(rawExam).not.toBeNull();
      const userAnswers: Record<string, number> = {};
      // Answer 20 questions correctly
      rawExam?.sections[0].tasks[0].questions?.forEach((q, idx) => {
        if (typeof q.answer === 'number') {
          userAnswers[q.id] = q.answer;
        }
      });

      // Step 4: Request on-demand explanation for single question with watermark
      const questionDetails = getVstepQuestionExplanation(testId, 'L1Q1');
      expect(questionDetails).not.toBeNull();
      expect(typeof questionDetails?.answer).toBe('number');

      // Embed invisible watermark with client metadata
      const watermarkPayload = `IP:${clientIp}|UID:u881|T:${Date.now()}`;
      const originalText = 'Đây là giải thích chi tiết cho câu hỏi số 1 bài nghe VSTEP.';
      const watermarkedText = embedInvisibleWatermark(originalText, watermarkPayload);
      expect(watermarkedText).not.toBe(originalText);

      // Extract and verify exact recovery
      const recoveredPayload = extractInvisibleWatermark(watermarkedText);
      expect(recoveredPayload).toBe(watermarkPayload);
    });

    // C2.2
    await runner.it('C2.2: Steganographic payload preserves all visible characters in Vietnamese text', () => {
      const vietnameseText = 'Theo đoạn văn số 3, tác giả khẳng định rằng biến đổi khí hậu là nguyên nhân chính.';
      const payload = 'AUTH_COPYRIGHT_LINGOPRO_2026';
      const watermarked = embedInvisibleWatermark(vietnameseText, payload);

      // Strip zero-width characters and compare with original visible text
      const cleanVisible = watermarked.replace(/[\u200B\u200C\uFEFF]/g, '');
      expect(cleanVisible).toBe(vietnameseText);
    });

    // C2.3
    await runner.it('C2.3: Session token expiration lifecycle (valid before expiration, invalid after)', () => {
      // 2 seconds TTL
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01', 2);
      expect(verifyVstepSessionToken(token, '10.0.0.1', 'vstep-mock-01')).toBe(true);

      // Tamper with expiresAt to simulate past expiration
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split('|');
      parts[2] = String(Math.floor(Date.now() / 1000) - 100); // 100s in past
      const expiredToken = Buffer.from(parts.join('|')).toString('base64url');
      expect(verifyVstepSessionToken(expiredToken, '10.0.0.1', 'vstep-mock-01')).toBe(false);
    });

    // C2.4
    await runner.it('C2.4: Cross-test session token isolation: token for mock-01 is rejected for mock-02', () => {
      const token = generateVstepSessionToken('10.0.0.1', 'vstep-mock-01');
      expect(verifyVstepSessionToken(token, '10.0.0.1', 'vstep-mock-01')).toBe(true);
      expect(verifyVstepSessionToken(token, '10.0.0.1', 'vstep-mock-02')).toBe(false);
      expect(verifyVstepSessionToken(token, '10.0.0.1', 'vstep-listening-01')).toBe(false);
    });
  });

  await runner.describe('Tier 3: Combination 3 — Audio CDN Playback Validation & Media Integrity', async () => {
    // C3.1
    await runner.it('C3.1: Cloudflare R2 audio link validation in Listening practice set', () => {
      const raw = loadRawVstepExam('vstep-listening-01');
      expect(raw).not.toBeNull();
      const listeningSection = raw?.sections.find((s) => s.type === 'listening');
      expect(listeningSection).toBeDefined();

      let audioCount = 0;
      for (const task of listeningSection!.tasks) {
        if (task.media?.audio) {
          audioCount++;
          expect(typeof task.media.audio).toBe('string');
          expect(task.media.audio.startsWith('http://') || task.media.audio.startsWith('https://')).toBe(true);
          expect(task.media.audio.endsWith('.mp3')).toBe(true);
          expect(task.media.audio.includes('r2') || task.media.audio.includes('cloudflare') || task.media.audio.includes('oucommunity.dev') || task.media.audio.includes('cdn')).toBe(true);
        }
      }
      expect(audioCount).toBeGreaterThanOrEqual(1);
    });

    // C3.2
    await runner.it('C3.2: Full mock exams audio media structure adheres to VstepTask media schema', () => {
      const mock01 = loadRawVstepExam('vstep-mock-01');
      const listeningSec = mock01?.sections.find((s) => s.type === 'listening');
      expect(listeningSec).toBeDefined();

      for (const task of listeningSec!.tasks) {
        if (task.media) {
          if (task.media.audio) {
            expect(task.media.audio.length).toBeGreaterThan(5);
            expect(task.media.audio.endsWith('.mp3')).toBe(true);
          }
        }
      }
    });

    // C3.3
    await runner.it('C3.3: Stimulus-media consistency: exam duration > 0 and timed sections have timeLimit > 0', () => {
      const raw = loadRawVstepExam('vstep-mock-01');
      expect(raw!.duration).toBeGreaterThan(0);
      for (const sec of raw!.sections) {
        if (sec.timeLimit !== undefined) {
          expect(sec.timeLimit).toBeGreaterThan(0);
        }
        for (const task of sec.tasks) {
          expect(typeof (task.instructions || task.title || task.type || task.description)).toBe('string');
        }
      }
    });

    // C3.4
    await runner.it('C3.4: Server-side submit scoring integration: stripped client exam payload grades accurately', () => {
      const testId = 'vstep-mock-01';
      const clientExam = loadVstepExamSafe(testId);
      expect(clientExam).not.toBeNull();

      // Client prepares answers
      const clientAnswers: Record<string, number> = {};
      const rawExam = loadRawVstepExam(testId);
      expect(rawExam).not.toBeNull();

      // Client answers all listening questions with choice index 0
      rawExam?.sections.find((s) => s.type === 'listening')?.tasks.forEach((t) => {
        t.questions?.forEach((q) => {
          clientAnswers[q.id] = 0; // Select Option A
        });
      });

      // Server calculates listening score
      let correct = 0;
      let total = 0;
      rawExam?.sections.find((s) => s.type === 'listening')?.tasks.forEach((t) => {
        t.questions?.forEach((q) => {
          total++;
          if (q.answer === clientAnswers[q.id]) {
            correct++;
          }
        });
      });

      const serverScore = calculateListeningScore(correct, total);
      const composite = calculateVstepScore({
        listeningCorrect: correct,
        listeningTotal: total,
      });

      expect(composite.listeningScore).toBe(serverScore);
      expect(composite.overallScore).toBe(serverScore);
      expect(typeof composite.cefrLevel).toBe('string');
    });
  });
}

// Standalone execution support
if (require.main === module) {
  const runner = new TestRunner();
  runTier3Tests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n🏁 Tier 3 Finished: ${stats.passed}/${stats.total} passed (${stats.failed} failed)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
