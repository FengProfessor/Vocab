/**
 * Tier 1: Feature Coverage Test Suite for VSTEP Standardized Exam Engine
 *
 * Verifies >=5 test cases for each of the 5 core features:
 * 1. Catalog metadata & index integrity (all 23 Full Mocks, 56 Listening sets)
 * 2. Universal Loader functions (loadRawVstepExam, loadVstepExamSafe, stripSensitiveVstepData)
 * 3. Standardized Barem Scoring engine (MOET 10.0 scale, CEFR classification, composite score)
 * 4. Zero Bulk Leaks & Active Cyber Defense (sanitization, honeypots, data poisoning)
 * 5. Smart Anti-Duplication algorithms (unseen, mistakes, all_random)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  oracleMoetRound,
  oracleCefrLevel,
  oracleListeningScore,
  oracleReadingScore,
  oracleCompositeScore,
  PROJECT_ROOT,
  VSTEP_CATALOG_INDEX_PATH,
  VSTEP_TESTS_DIR,
  VSTEP_PRACTICE_DIR,
  VSTEP_EXPLORER_MOCK_MANIFEST,
  VSTEP_EXPLORER_LISTENING_MANIFEST,
} from './test-harness';

import {
  roundVstepScore,
  calculateListeningScore,
  calculateReadingScore,
  getCefrLevel,
  getCefrDescription,
  calculateVstepScore,
} from '../../src/lib/vstep-scoring';

import {
  getVstepCatalog,
  loadRawVstepExam,
  loadVstepExamSafe,
  stripSensitiveVstepData,
  getVstepQuestionExplanation,
  loadVstepSkillPractice,
} from '../../src/lib/vstep-test-loader';

import {
  isVstepHoneypot,
  poisonVstepQuestion,
  generateVstepSessionToken,
  verifyVstepSessionToken,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
} from '../../src/lib/vstep-anti-scraping';

import {
  getVstepHistory,
  recordVstepQuestionAnswer,
  batchRecordVstepAnswers,
  getAnsweredVstepQuestionIds,
  getIncorrectVstepQuestionIds,
  getVstepProgressStats,
  resetVstepSkillProgress,
  resetAllVstepProgress,
} from '../../src/lib/vstep-history';

import { VstepExam, VstepQuestion } from '../../src/lib/vstep-types';

export async function runTier1Tests(runner: TestRunner) {
  await runner.describe('Tier 1: Feature 1 — Catalog Metadata & Ingestion Integrity', async () => {
    // F1.1
    await runner.it('F1.1: Catalog index file exists, parses cleanly, has version and required fields', () => {
      expect(fs.existsSync(VSTEP_CATALOG_INDEX_PATH)).toBe(true);
      const raw = fs.readFileSync(VSTEP_CATALOG_INDEX_PATH, 'utf-8');
      const catalog = JSON.parse(raw);
      expect(catalog.version).toBeDefined();
      expect(typeof catalog.totalExams).toBe('number');
      expect(typeof catalog.totalPracticeSets).toBe('number');
      expect(Array.isArray(catalog.categories)).toBe(true);
      expect(Array.isArray(catalog.items)).toBe(true);
      expect(catalog.items.length).toBeGreaterThanOrEqual(2);
    });

    // F1.2
    await runner.it('F1.2: Catalog categories contain 5 standard VSTEP exam types with valid titles and badges', () => {
      const catalog = getVstepCatalog();
      const categoryIds = catalog.categories.map((c) => c.id);
      expect(categoryIds).toContain('full_mock');
      expect(categoryIds).toContain('listening');
      expect(categoryIds).toContain('reading');
      expect(categoryIds).toContain('writing');
      expect(categoryIds).toContain('speaking');

      for (const cat of catalog.categories) {
        expect(cat.titleVi.length).toBeGreaterThan(3);
        expect(cat.descriptionVi.length).toBeGreaterThan(5);
        expect(cat.badge.length).toBeGreaterThan(1);
      }
    });

    // F1.3
    await runner.it('F1.3: Catalog items contain valid metadata conforming to VstepExamCatalogItem', () => {
      const catalog = getVstepCatalog();
      for (const item of catalog.items) {
        expect(typeof item.id).toBe('string');
        expect(item.id.length).toBeGreaterThan(3);
        expect(typeof item.title).toBe('string');
        expect(typeof item.duration).toBe('number');
        expect(item.duration).toBeGreaterThan(0);
        expect(Array.isArray(item.skills)).toBe(true);
        expect(item.skills.length).toBeGreaterThanOrEqual(1);
        expect(['A2', 'B1', 'B2', 'C1'].includes(item.targetLevel)).toBe(true);
        expect(typeof item.totalQuestions).toBe('number');
        expect(typeof item.totalTasks).toBe('number');
        expect(typeof item.badge).toBe('string');
        expect(typeof item.category).toBe('string');
      }
    });

    // F1.4
    await runner.it('F1.4: Authentic VSTEP Owl manifests map 23 Full Mocks and 56 Listening tests', () => {
      // Verify explorer survey manifests that define the full archive scope
      if (fs.existsSync(VSTEP_EXPLORER_MOCK_MANIFEST)) {
        const mockManifest = JSON.parse(fs.readFileSync(VSTEP_EXPLORER_MOCK_MANIFEST, 'utf-8'));
        expect(Array.isArray(mockManifest)).toBe(true);
        expect(mockManifest.length).toBeGreaterThanOrEqual(23);
        for (let i = 0; i < Math.min(mockManifest.length, 23); i++) {
          const item = mockManifest[i];
          expect(item.file).toBeDefined();
          expect(item.chunkId).toBeDefined();
          expect(item.assetPath).toBeDefined();
        }
      }

      if (fs.existsSync(VSTEP_EXPLORER_LISTENING_MANIFEST)) {
        const listManifest = JSON.parse(fs.readFileSync(VSTEP_EXPLORER_LISTENING_MANIFEST, 'utf-8'));
        expect(Array.isArray(listManifest)).toBe(true);
        expect(listManifest.length).toBe(56);
        for (let i = 0; i < listManifest.length; i++) {
          const item = listManifest[i];
          expect(item.file).toBeDefined();
          expect(item.chunkId).toBeDefined();
          expect(item.assetPath).toBeDefined();
        }
      }
    });

    // F1.5
    await runner.it('F1.5: Ingested test files on disk parse cleanly with valid VstepExam schema', () => {
      const fullMockFiles = fs.existsSync(VSTEP_TESTS_DIR)
        ? fs.readdirSync(VSTEP_TESTS_DIR).filter((f) => f.endsWith('.json'))
        : [];
      expect(fullMockFiles.length).toBeGreaterThanOrEqual(1);

      for (const fileName of fullMockFiles) {
        const filePath = path.join(VSTEP_TESTS_DIR, fileName);
        const parsed: VstepExam = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        expect(parsed.id).toBeDefined();
        expect(parsed.title).toBeDefined();
        expect(parsed.duration).toBeGreaterThan(0);
        expect(Array.isArray(parsed.sections)).toBe(true);
        expect(parsed.sections.length).toBeGreaterThanOrEqual(2);

        // Sections must have tasks with questions
        const totalQ = parsed.sections.reduce(
          (sum, sec) => sum + sec.tasks.reduce((tSum, t) => tSum + (t.questions?.length || 0), 0),
          0,
        );
        expect(totalQ).toBeGreaterThan(0);
      }
    });

    // F1.6
    await runner.it('F1.6: Zero duplicate exam IDs across catalog items', () => {
      const catalog = getVstepCatalog();
      const seen = new Set<string>();
      for (const item of catalog.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    });
  });

  await runner.describe('Tier 1: Feature 2 — Universal Test Loader Functions', async () => {
    // F2.1
    await runner.it('F2.1: loadRawVstepExam returns complete exam with sections, tasks, questions, and answers', () => {
      const exam = loadRawVstepExam('vstep-mock-01');
      expect(exam).not.toBeNull();
      expect(exam?.id).toBe('vstep-mock-01');
      expect(exam?.sections.length).toBe(4);

      // Listening has 35 questions, Reading has 40 questions
      const listeningSec = exam?.sections.find((s) => s.type === 'listening');
      const readingSec = exam?.sections.find((s) => s.type === 'reading');
      expect(listeningSec).toBeDefined();
      expect(readingSec).toBeDefined();

      const lCount = listeningSec?.tasks.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
      const rCount = readingSec?.tasks.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
      expect(lCount).toBe(35);
      expect(rCount).toBe(40);

      // Server raw exam must have answers
      const firstQ = listeningSec?.tasks[0]?.questions?.[0];
      expect(typeof firstQ?.answer).toBe('number');
      if (firstQ?.explanationVi) {
        expect(typeof firstQ.explanationVi).toBe('string');
      }
    });

    // F2.2
    await runner.it('F2.2: loadRawVstepExam returns null for non-existent test IDs without throwing', () => {
      expect(loadRawVstepExam('non-existent-vstep-id-9999')).toBeNull();
      expect(loadRawVstepExam('')).toBeNull();
    });

    // F2.3
    await runner.it('F2.3: stripSensitiveVstepData recursively eliminates answers, explanations, tapescripts', () => {
      const raw = loadRawVstepExam('vstep-mock-01');
      expect(raw).not.toBeNull();
      const stripped = stripSensitiveVstepData(raw!);

      for (const sec of stripped.sections) {
        for (const task of sec.tasks) {
          expect(task.tapescript).toBeUndefined();
          expect(task.suggestion).toBeUndefined();
          if (task.questions) {
            for (const q of task.questions) {
              expect(q.answer).toBeUndefined();
              expect(q.explanationVi).toBeUndefined();
            }
          }
        }
      }
    });

    // F2.4
    await runner.it('F2.4: loadVstepExamSafe delivers safe exam while preserving question prompts and options', () => {
      const safeExam = loadVstepExamSafe('vstep-mock-01');
      expect(safeExam).not.toBeNull();
      expect(safeExam?.id).toBe('vstep-mock-01');
      expect(safeExam?.duration).toBe(172);

      const firstTask = safeExam?.sections[0].tasks[0];
      expect(firstTask?.questions).toBeDefined();
      expect(firstTask!.questions!.length).toBeGreaterThan(0);

      const q0 = firstTask!.questions![0];
      expect(typeof q0.question).toBe('string');
      expect(q0.question.length).toBeGreaterThan(0);
      expect(Array.isArray(q0.options)).toBe(true);
      expect(q0.options.length).toBe(4);
      expect(q0.answer).toBeUndefined();
    });

    // F2.5
    await runner.it('F2.5: loadVstepSkillPractice correctly loads skill-specific practice sets', () => {
      const readingPractice = loadVstepSkillPractice('reading');
      expect(readingPractice).not.toBeNull();
      expect(readingPractice?.sections.length).toBe(1);
      expect(readingPractice?.sections[0].type).toBe('reading');

      const listeningPractice = loadVstepSkillPractice('listening');
      expect(listeningPractice).not.toBeNull();
      expect(listeningPractice?.sections.length).toBe(1);
      expect(listeningPractice?.sections[0].type).toBe('listening');
    });

    // F2.6
    await runner.it('F2.6: Deep cloning invariant: mutations to loaded exam payload do not corrupt registry', () => {
      const copy1 = loadRawVstepExam('vstep-mock-01');
      expect(copy1).not.toBeNull();
      // Mutate copy1
      copy1!.title = 'MUTATED TITLE';
      copy1!.sections[0].tasks[0].instructions = 'MUTATED INSTRUCTIONS';

      const copy2 = loadRawVstepExam('vstep-mock-01');
      expect(copy2!.title).not.toBe('MUTATED TITLE');
      expect(copy2!.sections[0].tasks[0].instructions).not.toBe('MUTATED INSTRUCTIONS');
    });
  });

  await runner.describe('Tier 1: Feature 3 — Standardized Barem Scoring Engine', async () => {
    // F3.1
    await runner.it('F3.1: Listening raw-to-scaled score conversion maps 0..35 to 0.0..10.0 scale', () => {
      expect(calculateListeningScore(0, 35)).toBe(0);
      expect(calculateListeningScore(35, 35)).toBe(10.0);
      // 21 / 35 * 10 = 6.0
      expect(calculateListeningScore(21, 35)).toBe(6.0);
      // 14 / 35 * 10 = 4.0
      expect(calculateListeningScore(14, 35)).toBe(4.0);
      // 28 / 35 * 10 = 8.0
      expect(calculateListeningScore(28, 35)).toBe(8.0);
      // 30 / 35 * 10 = 8.571 -> 8.5
      expect(calculateListeningScore(30, 35)).toBe(oracleListeningScore(30, 35));
    });

    // F3.2
    await runner.it('F3.2: Reading raw-to-scaled score conversion maps 0..40 to 0.0..10.0 scale', () => {
      expect(calculateReadingScore(0, 40)).toBe(0);
      expect(calculateReadingScore(40, 40)).toBe(10.0);
      // 20 / 40 * 10 = 5.0
      expect(calculateReadingScore(20, 40)).toBe(5.0);
      // 26 / 40 * 10 = 6.5
      expect(calculateReadingScore(26, 40)).toBe(6.5);
      // 34 / 40 * 10 = 8.5
      expect(calculateReadingScore(34, 40)).toBe(8.5);
      // 16 / 40 * 10 = 4.0
      expect(calculateReadingScore(16, 40)).toBe(4.0);
    });

    // F3.3
    await runner.it('F3.3: MOET quarter-point rounding rules (.00-.24 -> .0, .25-.74 -> .5, .75-.99 -> 1.0)', () => {
      expect(roundVstepScore(5.0)).toBe(5.0);
      expect(roundVstepScore(5.1)).toBe(5.0);
      expect(roundVstepScore(5.24)).toBe(5.0);
      expect(roundVstepScore(5.25)).toBe(5.5);
      expect(roundVstepScore(5.5)).toBe(5.5);
      expect(roundVstepScore(5.74)).toBe(5.5);
      expect(roundVstepScore(5.75)).toBe(6.0);
      expect(roundVstepScore(5.99)).toBe(6.0);
      expect(roundVstepScore(7.2)).toBe(7.0);
      expect(roundVstepScore(7.3)).toBe(7.5);
      expect(roundVstepScore(7.7)).toBe(7.5);
      expect(roundVstepScore(7.8)).toBe(8.0);
    });

    // F3.4
    await runner.it('F3.4: CEFR level mapping strictly reflects MOET thresholds (B1: 4.0-5.5, B2: 6.0-8.0, C1: 8.5-10.0)', () => {
      expect(getCefrLevel(0.0)).toBe('A2');
      expect(getCefrLevel(3.5)).toBe('A2');
      expect(getCefrLevel(3.9)).toBe('A2');
      expect(getCefrLevel(4.0)).toBe('B1');
      expect(getCefrLevel(5.0)).toBe('B1');
      expect(getCefrLevel(5.5)).toBe('B1');
      expect(getCefrLevel(6.0)).toBe('B2');
      expect(getCefrLevel(7.5)).toBe('B2');
      expect(getCefrLevel(8.0)).toBe('B2');
      expect(getCefrLevel(8.5)).toBe('C1');
      expect(getCefrLevel(9.5)).toBe('C1');
      expect(getCefrLevel(10.0)).toBe('C1');
    });

    // F3.5
    await runner.it('F3.5: Multi-skill composite score calculation calculates mean of completed skills with MOET rounding', () => {
      // 4 skills: 6.0, 6.5, 6.5, 6.0 -> avg = 6.25 -> 6.5 (B2)
      const res4 = calculateVstepScore({
        listeningCorrect: 21, // 6.0
        readingCorrect: 26,   // 6.5
        writingScore: 6.5,
        speakingScore: 6.0,
      });
      expect(res4.overallScore).toBe(6.5);
      expect(res4.cefrLevel).toBe('B2');

      // 2 skills: Reading (40/40 = 10.0) + Listening (35/35 = 10.0) -> avg = 10.0 (C1)
      const res2 = calculateVstepScore({
        listeningCorrect: 35,
        readingCorrect: 40,
      });
      expect(res2.overallScore).toBe(10.0);
      expect(res2.cefrLevel).toBe('C1');

      // 1 skill: Reading only (26/40 = 6.5) -> overall = 6.5 (B2)
      const res1 = calculateVstepScore({
        readingCorrect: 26,
      });
      expect(res1.overallScore).toBe(6.5);
      expect(res1.cefrLevel).toBe('B2');
    });

    // F3.6
    await runner.it('F3.6: CEFR badge descriptions and Vietnamese localized titles are accurately resolved', () => {
      const c1Desc = getCefrDescription('C1');
      expect(c1Desc.titleVi).toContain('C1');
      expect(c1Desc.badgeVi).toContain('8.5 - 10.0');

      const b2Desc = getCefrDescription('B2');
      expect(b2Desc.titleVi).toContain('B2');
      expect(b2Desc.badgeVi).toContain('6.0 - 8.0');

      const b1Desc = getCefrDescription('B1');
      expect(b1Desc.titleVi).toContain('B1');
      expect(b1Desc.badgeVi).toContain('4.0 - 5.5');

      const a2Desc = getCefrDescription('A2');
      expect(a2Desc.titleVi).toContain('Dưới B1');
      expect(a2Desc.badgeVi).toContain('< 4.0');
    });
  });

  await runner.describe('Tier 1: Feature 4 — Zero Bulk Leaks & Cyber Defense', async () => {
    // F4.1
    await runner.it('F4.1: Public safe exam contains ZERO answer fields across all tasks and questions', () => {
      const exam = loadVstepExamSafe('vstep-mock-01');
      expect(exam).not.toBeNull();
      let answerCount = 0;
      exam?.sections.forEach((sec) => {
        sec.tasks.forEach((tsk) => {
          tsk.questions?.forEach((q) => {
            if (typeof q.answer === 'number') answerCount++;
          });
        });
      });
      expect(answerCount).toBe(0);
    });

    // F4.2
    await runner.it('F4.2: Public safe exam contains ZERO explanationVi fields across all questions', () => {
      const exam = loadVstepExamSafe('vstep-mock-01');
      let explainCount = 0;
      exam?.sections.forEach((sec) => {
        sec.tasks.forEach((tsk) => {
          tsk.questions?.forEach((q) => {
            if (q.explanationVi) explainCount++;
          });
        });
      });
      expect(explainCount).toBe(0);
    });

    // F4.3
    await runner.it('F4.3: Public safe exam contains ZERO tapescripts across all listening tasks', () => {
      const exam = loadVstepExamSafe('vstep-mock-01');
      let tapescriptCount = 0;
      exam?.sections.forEach((sec) => {
        sec.tasks.forEach((tsk) => {
          if (tsk.tapescript) tapescriptCount++;
        });
      });
      expect(tapescriptCount).toBe(0);
    });

    // F4.4
    await runner.it('F4.4: On-demand question explanation retrieves single question answer and explanation/tapescript', () => {
      const explanation = getVstepQuestionExplanation('vstep-mock-01', 'L1Q1');
      expect(explanation).not.toBeNull();
      expect(typeof explanation?.answer).toBe('number');

      // Check practice test with tapescript
      const listExpl = getVstepQuestionExplanation('vstep-listening-01', 'L1Q1');
      expect(listExpl).not.toBeNull();
      expect(typeof listExpl?.answer).toBe('number');
      expect(typeof listExpl?.tapescript).toBe('string');
      expect(listExpl!.tapescript!.length).toBeGreaterThan(5);

      // Non-existent question returns null
      expect(getVstepQuestionExplanation('vstep-mock-01', 'NON_EXISTENT_Q')).toBeNull();
    });

    // F4.5
    await runner.it('F4.5: Canary honeypot IDs are detected by isVstepHoneypot', () => {
      expect(isVstepHoneypot('vstep-canary-honeypot')).toBe(true);
      expect(isVstepHoneypot('vstep-dump-all')).toBe(true);
      expect(isVstepHoneypot('test-vstep-999')).toBe(true);
      expect(isVstepHoneypot('vstep-owl-canary')).toBe(true);
      // Legitimate IDs must not be flagged
      expect(isVstepHoneypot('vstep-mock-01')).toBe(false);
      expect(isVstepHoneypot('vstep-mock-02')).toBe(false);
      expect(isVstepHoneypot('vstep-listening-01')).toBe(false);
    });

    // F4.6
    await runner.it('F4.6: Plausible data poisoning shifts correct answers and produces deceptive explanations', () => {
      const sampleQ: VstepQuestion = {
        id: 'TEST_Q',
        type: 'mcq',
        question: 'Sample VSTEP Question',
        options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
        answer: 0,
        explanationVi: 'Authentic explanation',
      };

      const poisoned = poisonVstepQuestion(sampleQ);
      expect(poisoned.answer).not.toBe(sampleQ.answer);
      expect(poisoned.explanationVi).not.toBe(sampleQ.explanationVi);
      expect(poisoned.explanationVi?.length).toBeGreaterThan(10);
      // Question prompt and options must remain identical so structure is plausible
      expect(poisoned.question).toBe(sampleQ.question);
      expect(poisoned.options).toEqual(sampleQ.options);
    });
  });

  await runner.describe('Tier 1: Feature 5 — Anti-Duplication Algorithms & Practice Progress', async () => {
    runner.beforeEach(() => {
      setupMockBrowserEnvironment();
      resetAllVstepProgress();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    // F5.1
    await runner.it('F5.1: getVstepHistory returns empty store when uninitialized in localStorage', () => {
      const history = getVstepHistory();
      expect(history).toEqual({});
      expect(Object.keys(history).length).toBe(0);
    });

    // F5.2
    await runner.it('F5.2: recordVstepQuestionAnswer and batchRecordVstepAnswers store attempt records', () => {
      recordVstepQuestionAnswer({
        questionId: 'L1Q1',
        skill: 'listening',
        part: 'part1',
        isCorrect: true,
        selectedOption: 0,
      });

      const history = getVstepHistory();
      expect(history['L1Q1']).toBeDefined();
      expect(history['L1Q1'].isCorrect).toBe(true);
      expect(history['L1Q1'].attemptCount).toBe(1);
      expect(history['L1Q1'].selectedOption).toBe(0);

      // Repeat attempt increments attemptCount
      recordVstepQuestionAnswer({
        questionId: 'L1Q1',
        skill: 'listening',
        part: 'part1',
        isCorrect: false,
        selectedOption: 2,
      });

      const updated = getVstepHistory();
      expect(updated['L1Q1'].attemptCount).toBe(2);
      expect(updated['L1Q1'].isCorrect).toBe(false);
      expect(updated['L1Q1'].selectedOption).toBe(2);
    });

    // F5.3
    await runner.it('F5.3: getAnsweredVstepQuestionIds isolates question IDs strictly by skill and part', () => {
      resetAllVstepProgress();
      batchRecordVstepAnswers([
        { questionId: 'L1', skill: 'listening', part: 'part1', isCorrect: true },
        { questionId: 'L2', skill: 'listening', part: 'part2', isCorrect: false },
        { questionId: 'R1', skill: 'reading', part: 'passage1', isCorrect: true },
      ]);

      const allIds = getAnsweredVstepQuestionIds();
      expect(allIds.size).toBe(3);

      const listeningIds = getAnsweredVstepQuestionIds('listening');
      expect(listeningIds.size).toBe(2);
      expect(listeningIds.has('L1')).toBe(true);
      expect(listeningIds.has('L2')).toBe(true);
      expect(listeningIds.has('R1')).toBe(false);

      const part1Ids = getAnsweredVstepQuestionIds('listening', 'part1');
      expect(part1Ids.size).toBe(1);
      expect(part1Ids.has('L1')).toBe(true);
    });

    // F5.4
    await runner.it('F5.4: getIncorrectVstepQuestionIds filters strictly to latest incorrect attempts', () => {
      batchRecordVstepAnswers([
        { questionId: 'Q_CORRECT', skill: 'reading', part: 'p1', isCorrect: true },
        { questionId: 'Q_MISTAKE', skill: 'reading', part: 'p1', isCorrect: false },
      ]);

      const mistakes = getIncorrectVstepQuestionIds('reading');
      expect(mistakes.size).toBe(1);
      expect(mistakes.has('Q_MISTAKE')).toBe(true);
      expect(mistakes.has('Q_CORRECT')).toBe(false);

      // Remedying mistake clears it from mistake set
      recordVstepQuestionAnswer({
        questionId: 'Q_MISTAKE',
        skill: 'reading',
        part: 'p1',
        isCorrect: true,
      });

      const clearedMistakes = getIncorrectVstepQuestionIds('reading');
      expect(clearedMistakes.has('Q_MISTAKE')).toBe(false);
    });

    // F5.5
    await runner.it('F5.5: loadVstepSkillPractice with unseen filter mode excludes 100% of answered question IDs', () => {
      const practice = loadVstepSkillPractice('reading', 'unseen', ['R1Q1', 'R1Q2', 'R1Q3', 'R1Q4', 'R1Q5']);
      expect(practice).not.toBeNull();
      const allQs: VstepQuestion[] = [];
      practice?.sections.forEach((sec) => {
        sec.tasks.forEach((t) => {
          if (t.questions) allQs.push(...t.questions);
        });
      });

      for (const q of allQs) {
        expect(['R1Q1', 'R1Q2', 'R1Q3', 'R1Q4', 'R1Q5'].includes(q.id)).toBe(false);
      }
    });

    // F5.6
    await runner.it('F5.6: resetVstepSkillProgress clears only target skill records while preserving others', () => {
      batchRecordVstepAnswers([
        { questionId: 'L1', skill: 'listening', part: 'p1', isCorrect: true },
        { questionId: 'R1', skill: 'reading', part: 'p1', isCorrect: true },
      ]);

      resetVstepSkillProgress('listening');
      const history = getVstepHistory();
      expect(history['L1']).toBeUndefined();
      expect(history['R1']).toBeDefined();
    });
  });
}

// Standalone execution support
if (require.main === module) {
  const runner = new TestRunner();
  runTier1Tests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n🏁 Tier 1 Finished: ${stats.passed}/${stats.total} passed (${stats.failed} failed)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
