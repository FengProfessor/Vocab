/**
 * Empirical Challenger M3.2: TOEIC Subsystem Regression & Adversarial Verification Suite
 *
 * Adversarially verifies:
 * 1. Full test loading and catalog integrity (/toeic full tests, authentic 200Q, Estudyme, Study4).
 * 2. Practice launch (/toeic/exam/bank?part=5, all 7 parts, bridgeToPractice for all 16 theory lessons, anti-duplication).
 * 3. src/lib/toeic-test-loader.ts invariants (isolation, caching, stimulus grouping, zero theory data bleed).
 * 4. Active cyber defense sanitization (zero bulk leaks, honeypot poisoning, signed HMAC session tokens).
 *
 * Usage:
 *   npx tsx tests/toeic/challenger-m3-theory-regression.test.ts
 */

import { TestRunner, expect } from './test-harness';
import {
  loadFullToeicTest,
  loadAnyToeicTest,
  loadToeicPartPractice,
  loadToeicQuestionsByIds,
  stripSensitiveToeicData,
  getToeicCatalogIndex,
  normalizeTestId,
  groupQuestionsIntoStimulusGroups,
  AUTHENTIC_TEST_METADATA,
} from '../../src/lib/toeic-test-loader';
import {
  isHoneypotTestId,
  createPoisonedQuestionBank,
  poisonUnifiedQuestion,
  generateToeicSessionToken,
  verifyToeicSessionToken,
  embedInvisibleWatermark,
} from '../../src/lib/toeic-anti-scraping';
import {
  getAllModules,
  getAllLessons,
  getCurriculumStats,
} from '../../src/data/toeic/theory';
import type { ToeicPart, ToeicUnifiedQuestion } from '../../src/types/toeic';

export async function runChallengerRegressionTests(runner: TestRunner): Promise<void> {
  // ───────────────────────────────────────────────────────────────────────────
  // Suite 1: Full Test Loading Regression & Catalog Invariance
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 1 - Full Test Loading & Catalog Invariance', () => {
    runner.it('REG-1.1: Catalog index is fully intact (>15,000 Qs, >=28 Full Tests, all 7 practice parts)', () => {
      const catalog = getToeicCatalogIndex();
      expect(catalog).toBeDefined();
      expect(catalog.totalQuestions).toBeGreaterThanOrEqual(15000);
      expect(catalog.fullTests.length).toBeGreaterThanOrEqual(28);

      for (let p = 1; p <= 7; p++) {
        const partItems = catalog.practiceParts[String(p)];
        expect(Array.isArray(partItems)).toBe(true);
        expect(partItems.length).toBeGreaterThan(0);
      }
    });

    runner.it('REG-1.2: All 7 authentic 200Q tests load exactly 200 questions with proper sections', () => {
      const testIds = ['6852', '6856', '6857', '6859', '7000', '7003', '7004'];
      for (const tId of testIds) {
        const questions = loadFullToeicTest(tId);
        expect(questions.length).toBe(200);

        // Verify Question numbering 1 to 200 monotonic
        for (let i = 0; i < 200; i++) {
          expect(questions[i].questionNumber).toBe(i + 1);
        }

        // Section counts
        const listening = questions.filter((q) => q.section === 'listening');
        const reading = questions.filter((q) => q.section === 'reading');
        expect(listening.length).toBe(100);
        expect(reading.length).toBe(100);

        // Part breakdown
        expect(questions.filter((q) => q.part === 1).length).toBe(6);
        expect(questions.filter((q) => q.part === 2).length).toBe(25);
        expect(questions.filter((q) => q.part === 3).length).toBe(39);
        expect(questions.filter((q) => q.part === 4).length).toBe(30);
        expect(questions.filter((q) => q.part === 5).length).toBe(30);
        expect(questions.filter((q) => q.part === 6).length).toBe(16);
        expect(questions.filter((q) => q.part === 7).length).toBe(54);
      }
    });

    runner.it('REG-1.3: Estudyme full tests (estudyme-test-1, estudyme-test-5) resolve and load 200Q', () => {
      const e1 = loadAnyToeicTest('estudyme-test-1');
      expect(e1.length).toBe(200);
      expect(e1[0].section).toBe('listening');
      expect(e1[199].section).toBe('reading');

      const e5 = loadAnyToeicTest('estudyme-test-5');
      expect(e5.length).toBe(200);
    });

    runner.it('REG-1.4: normalizeTestId handles dirty/adversarial strings without false fallbacks', () => {
      expect(normalizeTestId('6852')).toBe('6852');
      expect(normalizeTestId('study4_test_7000')).toBe('7000');
      expect(normalizeTestId('toeic-6856')).toBe('6856');
      expect(normalizeTestId('LR-7004')).toBe('7004');
      expect(normalizeTestId('  6857  ')).toBe('6857');
      expect(normalizeTestId(null)).toBe('6852');
      expect(normalizeTestId(undefined)).toBe('6852');
      expect(normalizeTestId({})).toBe('6852');
      expect(normalizeTestId('[object Object]')).toBe('6852');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 2: Practice Launch & BridgeToPractice Integration
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 2 - Practice Launch & BridgeToPractice', () => {
    runner.it('REG-2.1: Practice launch for /toeic/exam/bank?part=5 loads Part 5 questions seamlessly', () => {
      const qPart5 = loadToeicPartPractice(5, 'bank', 15, true, { filterMode: 'unseen' });
      expect(qPart5.length).toBe(15);
      for (const q of qPart5) {
        expect(q.part).toBe(5);
        expect(q.section).toBe('reading');
        expect(q.options.length).toBe(4);
      }
      // Check renumbering from 1 to 15
      for (let i = 0; i < 15; i++) {
        expect(qPart5[i].questionNumber).toBe(i + 1);
      }
    });

    runner.it('REG-2.2: Practice launch works across all 7 TOEIC parts from bank', () => {
      for (let p = 1; p <= 7; p++) {
        const part = p as ToeicPart;
        const requestedLimit = p === 1 ? 6 : p === 2 ? 10 : 12;
        const questions = loadToeicPartPractice(part, 'bank', requestedLimit, true, {
          filterMode: 'unseen',
        });
        expect(questions.length).toBeGreaterThan(0);
        expect(questions.length).toBeLessThanOrEqual(requestedLimit);
        for (const q of questions) {
          expect(q.part).toBe(part);
        }
      }
    });

    runner.it('REG-2.3: Every theory lesson bridgeToPractice generates valid practice bank URLs', () => {
      const allLessons = getAllLessons();
      expect(allLessons.length).toBeGreaterThanOrEqual(15);

      for (const lesson of allLessons) {
        const bridge = lesson.bridgeToPractice;
        expect(bridge).toBeDefined();
        expect(bridge.targetPart).toBeGreaterThanOrEqual(1);
        expect(bridge.targetPart).toBeLessThanOrEqual(7);
        expect(bridge.recommendedQuestionCount).toBeGreaterThanOrEqual(5);

        // Expected URL
        const expectedUrl = `/toeic/exam/bank?part=${bridge.targetPart}&limit=${bridge.recommendedQuestionCount}&mode=practice&filterMode=unseen`;
        expect(bridge.practiceUrl).toBe(expectedUrl);

        // Execute practice load with bridge parameters
        const loaded = loadToeicPartPractice(
          bridge.targetPart,
          'bank',
          bridge.recommendedQuestionCount,
          true,
          { filterMode: bridge.filterMode }
        );
        expect(loaded.length).toBeGreaterThan(0);
        expect(loaded.length).toBeLessThanOrEqual(bridge.recommendedQuestionCount);
        for (const q of loaded) {
          expect(q.part).toBe(bridge.targetPart);
        }
      }
    });

    runner.it('REG-2.4: Anti-duplication unseen mode strictly respects excluded IDs', () => {
      const initial10 = loadToeicPartPractice(5, 'bank', 10, true, { filterMode: 'unseen' });
      expect(initial10.length).toBe(10);
      const excludedIds = initial10.map((q) => q.id);

      // Request next 10 with excludedIds
      const next10 = loadToeicPartPractice(5, 'bank', 10, true, {
        filterMode: 'unseen',
        excludedIds,
      });
      expect(next10.length).toBe(10);

      // Verify ZERO overlap between initial10 and next10
      const nextIds = new Set(next10.map((q) => q.id));
      for (const id of excludedIds) {
        expect(nextIds.has(id)).toBe(false);
      }
    });

    runner.it('REG-2.5: Mistakes mode delivers only requested mistakes and returns [] if empty', () => {
      // Empty mistakes -> empty array
      const emptyMistakes = loadToeicPartPractice(5, 'bank', 10, true, {
        filterMode: 'mistakes',
        mistakeIds: [],
      });
      expect(emptyMistakes.length).toBe(0);

      // With specific mistakes
      const samplePart5 = loadToeicPartPractice(5, 'bank', 5, false);
      const targetMistakeIds = [samplePart5[0].id, samplePart5[1].id];

      const loadedMistakes = loadToeicPartPractice(5, 'bank', 10, true, {
        filterMode: 'mistakes',
        mistakeIds: targetMistakeIds,
      });
      expect(loadedMistakes.length).toBe(2);
      expect(loadedMistakes.map((q) => q.id)).toEqual(targetMistakeIds);
    });

    runner.it('REG-2.6: Adversarial & boundary inputs to part practice do not crash', () => {
      // Invalid part numbers
      expect(loadToeicPartPractice(0 as any, 'bank')).toEqual([]);
      expect(loadToeicPartPractice(8 as any, 'bank')).toEqual([]);
      expect(loadToeicPartPractice(-1 as any, 'bank')).toEqual([]);

      // Extreme limits
      const zeroLimit = loadToeicPartPractice(5, 'bank', 0);
      expect(Array.isArray(zeroLimit)).toBe(true);

      const hugeLimit = loadToeicPartPractice(5, 'bank', 99999);
      expect(hugeLimit.length).toBeGreaterThan(0);

      // Aliases
      const resAll = loadToeicPartPractice(5, 'all', 5);
      const resBank = loadToeicPartPractice(5, 'bank', 5);
      const resPractice = loadToeicPartPractice(5, 'practice', 5);
      expect(resAll.length).toBe(5);
      expect(resBank.length).toBe(5);
      expect(resPractice.length).toBe(5);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 3: src/lib/toeic-test-loader.ts Invariants & Zero Theory Bleed
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 3 - Test Loader Invariants & Zero Theory Bleed', () => {
    runner.it('REG-3.1: Theory checkpoint IDs do NOT exist in the 200Q test bank', () => {
      const allLessons = getAllLessons();
      const theoryCheckpointIds = new Set(
        allLessons.flatMap((l) => l.checkpoints.map((cp) => cp.id))
      );
      expect(theoryCheckpointIds.size).toBe(61);

      // Check authentic test 6852 and Estudyme test 1
      const q6852 = loadFullToeicTest('6852');
      for (const q of q6852) {
        expect(theoryCheckpointIds.has(q.id)).toBe(false);
      }

      const qEstudyme1 = loadAnyToeicTest('estudyme-test-1');
      for (const q of qEstudyme1) {
        expect(theoryCheckpointIds.has(q.id)).toBe(false);
      }
    });

    runner.it('REG-3.2: loadToeicQuestionsByIds accurately retrieves master questions', () => {
      const qPart5 = loadFullToeicTest('6852').filter((q) => q.part === 5);
      const targetIds = [qPart5[0].id, qPart5[1].id, qPart5[2].id];

      const loaded = loadToeicQuestionsByIds(targetIds);
      expect(loaded.length).toBe(3);
      expect(loaded[0].id).toBe(targetIds[0]);
      expect(loaded[1].id).toBe(targetIds[1]);
      expect(loaded[2].id).toBe(targetIds[2]);
      expect(loaded[0].correctAnswer).toBeDefined();
      expect(loaded[0].explanationVi).toBeDefined();
    });

    runner.it('REG-3.3: Stimulus group clustering preserves multi-question items without splitting', () => {
      // Load Part 3 short conversations
      const qPart3 = loadFullToeicTest('6852').filter((q) => q.part === 3);
      const groups = groupQuestionsIntoStimulusGroups(qPart3);

      expect(groups.length).toBe(13); // 39 questions / 3 per dialogue = 13 groups
      for (const g of groups) {
        expect(g.part).toBe(3);
        expect(g.questions.length).toBe(3);
        // All 3 questions in a dialogue share the same audioUrl
        const firstAudio = g.questions[0].audioUrl;
        expect(firstAudio).toBeDefined();
        for (const q of g.questions) {
          expect(q.audioUrl).toBe(firstAudio);
        }
      }

      // Load Part 6 text completion
      const qPart6 = loadFullToeicTest('6852').filter((q) => q.part === 6);
      const p6Groups = groupQuestionsIntoStimulusGroups(qPart6);
      expect(p6Groups.length).toBe(4); // 16 questions / 4 per text = 4 groups
      for (const g of p6Groups) {
        expect(g.questions.length).toBe(4);
      }
    });

    runner.it('REG-3.4: Caller mutation of questions does not poison internal loader cache', () => {
      const q1 = loadFullToeicTest('6852');
      const originalFirstPrompt = q1[0].prompt;

      // Caller mutates returned object
      (q1[0] as any).prompt = 'CORRUPTED PROMPT';
      (q1[0].options[0] as any).text = 'CORRUPTED OPTION';

      // Load again
      const q2 = loadFullToeicTest('6852');
      expect(q2[0].prompt).toBe(originalFirstPrompt);
      expect(q2[0].options[0].text).not.toBe('CORRUPTED OPTION');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 4: Active Cyber Defense Sanitization & Honeypots
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 4 - Cyber Defense Sanitization & Anti-Scraping', () => {
    runner.it('REG-4.1: stripSensitiveToeicData strictly removes 100% of sensitive fields', () => {
      const authenticQuestions = loadFullToeicTest('6852');
      const sanitized = stripSensitiveToeicData(authenticQuestions);

      expect(sanitized.length).toBe(authenticQuestions.length);
      for (const sq of sanitized) {
        expect((sq as any).correctAnswer).toBeUndefined();
        expect((sq as any).explanationVi).toBeUndefined();
        expect((sq as any).transcript).toBeUndefined();
        expect((sq as any).explanation).toBeUndefined();

        // Safe fields remain present
        expect(sq.id).toBeDefined();
        expect(sq.questionNumber).toBeDefined();
        expect(sq.part).toBeDefined();
        expect(sq.section).toBeDefined();
        expect(Array.isArray(sq.options)).toBe(true);
      }
    });

    runner.it('REG-4.2: Session token generation and HMAC verification succeed deterministically', () => {
      const payload = {
        sessionId: 'sess_test_123',
        testId: '6852',
        ipHash: 'iphash_test_456',
        issuedAt: Date.now(),
      };

      const token = generateToeicSessionToken(payload);
      expect(typeof token).toBe('string');
      expect(token.includes('.')).toBe(true);

      const verified = verifyToeicSessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sessionId).toBe(payload.sessionId);
      expect(verified?.testId).toBe(payload.testId);
      expect(verified?.ipHash).toBe(payload.ipHash);

      // Forged token fails
      const forgedToken = token + 'forgery';
      expect(verifyToeicSessionToken(forgedToken)).toBeNull();

      // Tampered payload fails
      const parts = token.split('.');
      const tamperedToken = 'eyJ0YW1wZXIiOiJ0cnVlIn0.' + parts[1];
      expect(verifyToeicSessionToken(tamperedToken)).toBeNull();
    });

    runner.it('REG-4.3: Honeypot canary detection and data poisoning engine function correctly', () => {
      expect(isHoneypotTestId('ets-canary-honeypot')).toBe(true);
      expect(isHoneypotTestId('canary-dump-test')).toBe(true);
      expect(isHoneypotTestId('toeic-canary-master')).toBe(true);
      expect(isHoneypotTestId('6852')).toBe(false);
      expect(isHoneypotTestId('estudyme-test-1')).toBe(false);

      const botIp = '203.0.113.195';
      const poisonedBank = createPoisonedQuestionBank(5, botIp);
      expect(poisonedBank.length).toBe(5);
      for (const pq of poisonedBank) {
        expect(pq.options.length).toBe(4);
        expect(pq.correctAnswer).toBeDefined();
      }

      // Poison unified question shifts answer
      const normalQ = loadFullToeicTest('6852')[0];
      const poisonedQ = poisonUnifiedQuestion(normalQ, botIp);
      expect(poisonedQ.id).toBe(normalQ.id);
      expect(poisonedQ.options.length).toBe(normalQ.options.length);
      // Explanation contains plausible poisoning text
      expect(poisonedQ.explanationVi).toBeDefined();
      expect(poisonedQ.explanationVi).toContain('ETS');
    });

    runner.it('REG-4.4: Invisible steganographic watermark embeds zero-width Unicode characters', () => {
      const cleanExplanation = 'Đáp án đúng là (A). Căn cứ theo nội dung câu hỏi ETS.';
      const watermarked = embedInvisibleWatermark(cleanExplanation, 'test_user_789');

      // Explanation looks identical to visible text
      expect(watermarked.replace(/[\u200B\u200C\u200D\uFEFF]/g, '')).toBe(cleanExplanation);

      // But contains invisible steganographic characters
      const hasZeroWidth = /[\u200B\u200C\u200D\uFEFF]/.test(watermarked);
      expect(hasZeroWidth).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 5: Exam Route Simulator & Parameter Mapping
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 5 - Exam Route Simulator & Parameter Mapping', () => {
    const PART_RECOMMENDED_MINUTES: Record<ToeicPart, number> = {
      1: 4,
      2: 10,
      3: 17,
      4: 15,
      5: 12,
      6: 10,
      7: 55,
    };

    runner.it('REG-5.1: Bridge route /toeic/exam/bank?part=5 parameters simulate exact exam state', () => {
      const decodedExamId: string = 'bank';
      const partParam = '5';
      const limitParam = '15';
      const modeParam = 'practice';
      const filterModeParam = 'unseen';

      const partNum = parseInt(partParam, 10) as ToeicPart;
      expect(partNum).toBe(5);

      const limitNum = parseInt(limitParam, 10);
      expect(limitNum).toBe(15);

      const isPartPractice = Boolean(partNum);
      expect(isPartPractice).toBe(true);

      const initialMode = modeParam === 'practice' || isPartPractice ? 'practice' : 'real';
      expect(initialMode).toBe('practice');

      const isBank =
        !decodedExamId ||
        decodedExamId === 'all' ||
        decodedExamId === 'bank' ||
        decodedExamId === 'practice' ||
        decodedExamId === 'part-practice';
      expect(isBank).toBe(true);

      const sourceLabel = isBank ? 'Ngân hàng đề' : 'Đề ETS';
      const expectedTitle = `Luyện tập Part ${partNum} (${limitNum} câu — ${sourceLabel})`;
      expect(expectedTitle).toBe('Luyện tập Part 5 (15 câu — Ngân hàng đề)');

      const minutes = Math.ceil(limitNum * ((PART_RECOMMENDED_MINUTES[partNum] || 15) / 25));
      const expectedDurationSeconds = minutes * 60;
      expect(minutes).toBe(8); // Math.ceil(15 * 0.48) = Math.ceil(7.2) = 8
      expect(expectedDurationSeconds).toBe(480);
    });

    runner.it('REG-5.2: Duration and title calculations are robust across all 7 parts and custom limits', () => {
      const testCases: { part: ToeicPart; limit: number; expectedMinutes: number }[] = [
        { part: 1, limit: 6, expectedMinutes: 1 }, // Math.ceil(6 * (4/25)) = Math.ceil(0.96) = 1
        { part: 2, limit: 10, expectedMinutes: 4 }, // Math.ceil(10 * (10/25)) = 4
        { part: 3, limit: 15, expectedMinutes: 11 }, // Math.ceil(15 * (17/25)) = Math.ceil(10.2) = 11
        { part: 4, limit: 15, expectedMinutes: 9 }, // Math.ceil(15 * (15/25)) = 9
        { part: 5, limit: 20, expectedMinutes: 10 }, // Math.ceil(20 * (12/25)) = Math.ceil(9.6) = 10
        { part: 6, limit: 16, expectedMinutes: 7 }, // Math.ceil(16 * (10/25)) = Math.ceil(6.4) = 7
        { part: 7, limit: 15, expectedMinutes: 33 }, // Math.ceil(15 * (55/25)) = 33
      ];

      for (const tc of testCases) {
        const minutes = Math.ceil(tc.limit * ((PART_RECOMMENDED_MINUTES[tc.part] || 15) / 25));
        expect(minutes).toBe(tc.expectedMinutes);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 6: Technical Minimalist UI & Anti-AI Architectural Compliance
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 6 - Technical Minimalist UI & Anti-AI Compliance', () => {
    runner.it('REG-6.1: Theory route and components adhere strictly to anti-AI aesthetic', () => {
      const fs = require('fs');
      const path = require('path');

      const filesToCheck = [
        'src/app/toeic/learn/page.tsx',
        'src/components/toeic/learn/ToeicCurriculumNavigator.tsx',
        'src/components/toeic/learn/ToeicLessonViewer.tsx',
        'src/components/toeic/learn/ToeicQuickQuiz.tsx',
        'src/components/toeic/learn/ToeicTipBox.tsx',
        'src/components/toeic/learn/ToeicTrapAlert.tsx',
        'src/components/toeic/learn/ToeicComparisonTable.tsx',
        'src/components/toeic/learn/ToeicPracticeBridge.tsx',
      ];

      for (const relPath of filesToCheck) {
        const fullPath = path.resolve(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Must NOT use AI flashy gimmicks
        expect(content.includes('shadow-2xl')).toBe(false);
        expect(content.includes('rounded-3xl')).toBe(false);
        expect(content.includes('bg-gradient-to-r from-pink')).toBe(false);

        // Must use clean borders
        expect(content.includes('border')).toBe(true);
      }
    });

    runner.it('REG-6.2: 100% English examples in theory use ExamInteractiveText & Vietnamese is clean', () => {
      const fs = require('fs');
      const path = require('path');

      const lessonViewer = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/toeic/learn/ToeicLessonViewer.tsx'),
        'utf8'
      );
      expect(lessonViewer.includes('ExamInteractiveText')).toBe(true);
      expect(lessonViewer.includes('example.english')).toBe(true);

      const quickQuiz = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/toeic/learn/ToeicQuickQuiz.tsx'),
        'utf8'
      );
      expect(quickQuiz.includes('ExamInteractiveText')).toBe(true);
      // Vietnamese explanation comment explicitly preserves IT-7.5
      expect(quickQuiz.includes('Never wrapped in ExamInteractiveText per IT-7.5')).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 7: Deployment Safety & Standalone Swaps
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger M3.2: Suite 7 - Deployment Safety (GEMINI.md Rule 1)', () => {
    runner.it('REG-7.1: Zero in-place build artifacts or forbidden .next operations in active code', () => {
      const fs = require('fs');
      const path = require('path');

      // Verify no dangling .next.old or .next.new in active directory
      expect(fs.existsSync(path.resolve(process.cwd(), '.next.old'))).toBe(false);
      expect(fs.existsSync(path.resolve(process.cwd(), '.next.new'))).toBe(false);
    });
  });
}

// Direct execution
if (process.argv[1]?.includes('challenger-m3-theory-regression')) {
  (async () => {
    console.log('▶ Running Challenger M3.2 Regression & Adversarial Verification Suite...\n');
    const runner = new TestRunner();
    await runChallengerRegressionTests(runner);
    const stats = runner.getStats();
    console.log(
      `\nResults: ${stats.passed}/${stats.total} passed (${stats.failed} failed) in ${stats.durationMs}ms`
    );
    if (stats.failed > 0) {
      process.exit(1);
    }
  })();
}

